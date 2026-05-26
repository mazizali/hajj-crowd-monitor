"""
Frame grabber for live streams.

YouTube live  → periodic thumbnail download (img.youtube.com, updated ~30s)
Other sources → yt-dlp + ffmpeg pipe (best-effort)
"""

import re
import subprocess
import sys
import threading
import time
import urllib.request
from typing import Callable, Optional, Tuple

import cv2
import numpy as np
import static_ffmpeg

static_ffmpeg.add_paths()

WIDTH, HEIGHT = 640, 360
FRAME_BYTES = WIDTH * HEIGHT * 3
PYTHON = sys.executable

_YT_ID_RE = re.compile(r'(?:v=|/live/|youtu\.be/)([a-zA-Z0-9_-]{11})')


def _youtube_video_id(url: str) -> Optional[str]:
    m = _YT_ID_RE.search(url)
    return m.group(1) if m else None


def _fetch_youtube_thumbnail(video_id: str) -> Optional[np.ndarray]:
    """
    Download the live thumbnail for a YouTube stream.
    Uses the _live variant (updates every ~10-30s during broadcast)
    with a cache-busting timestamp to avoid CDN staleness.
    """
    ts = int(time.time())
    candidates = [
        # Live-specific endpoints (freshest during broadcast)
        f'https://i.ytimg.com/vi/{video_id}/maxresdefault_live.jpg?_={ts}',
        f'https://i.ytimg.com/vi/{video_id}/hqdefault_live.jpg?_={ts}',
        f'https://i.ytimg.com/vi/{video_id}/sddefault_live.jpg?_={ts}',
        # Standard fallbacks
        f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg?_={ts}',
        f'https://img.youtube.com/vi/{video_id}/hqdefault.jpg?_={ts}',
    ]
    for url in candidates:
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                              'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            })
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = resp.read()
            arr = np.frombuffer(data, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            # Skip YouTube placeholder (small grey image, < 100px)
            if frame is not None and min(frame.shape[:2]) > 100:
                return cv2.resize(frame, (WIDTH, HEIGHT))
        except Exception:
            continue
    return None


class StreamGrabber:
    def __init__(self, stream_id: str, source_url: str, interval_secs: float = 30.0):
        self.stream_id = stream_id
        self.source_url = source_url
        self._running = False
        self._thread: Optional[threading.Thread] = None

        # Detect YouTube stream (must happen before interval_secs clamp)
        self._yt_id = _youtube_video_id(source_url)
        self.interval_secs = max(10.0 if self._yt_id else 5.0, interval_secs)
        if self._yt_id:
            print(f'[{stream_id}] YouTube mode — live thumbnail polling every {self.interval_secs}s (id={self._yt_id})')
        else:
            print(f'[{stream_id}] Generic mode — yt-dlp+ffmpeg pipe')

    # ── YouTube thumbnail loop ───────────────────────────────────────────────

    def _run_youtube(self, callback: Callable):
        consecutive_failures = 0
        while self._running:
            frame = _fetch_youtube_thumbnail(self._yt_id)
            if frame is not None:
                consecutive_failures = 0
                try:
                    callback(self.stream_id, frame)
                except Exception as e:
                    print(f'[{self.stream_id}] Callback error: {e}')
            else:
                consecutive_failures += 1
                print(f'[{self.stream_id}] Thumbnail fetch failed ({consecutive_failures})')

            # Back-off: wait longer after failures
            wait = self.interval_secs * min(consecutive_failures + 1, 4)
            time.sleep(wait)

    # ── Generic yt-dlp + ffmpeg pipe loop ───────────────────────────────────

    def _open_pipe(self) -> Tuple[Optional[subprocess.Popen], Optional[subprocess.Popen]]:
        fps = f'1/{max(1, int(self.interval_secs))}'
        dl_cmd = [
            PYTHON, '-m', 'yt_dlp',
            '-f', 'best[height<=480]/best',
            '-o', '-', '--quiet', '--no-warnings',
            self.source_url,
        ]
        ff_cmd = [
            'ffmpeg', '-y', '-i', 'pipe:0',
            '-vf', f'scale={WIDTH}:{HEIGHT},fps={fps}',
            '-f', 'rawvideo', '-pix_fmt', 'bgr24', 'pipe:1',
        ]
        try:
            dl_proc = subprocess.Popen(dl_cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
            ff_proc = subprocess.Popen(
                ff_cmd, stdin=dl_proc.stdout,
                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            )
            dl_proc.stdout.close()
            return ff_proc, dl_proc
        except Exception as e:
            print(f'[{self.stream_id}] Pipe open failed: {e}')
            return None, None

    def _run_generic(self, callback: Callable):
        failures = 0
        while self._running:
            ff_proc, dl_proc = self._open_pipe()
            if not ff_proc:
                failures += 1
                wait = min(300, 15 * (2 ** min(failures - 1, 4)))
                print(f'[{self.stream_id}] Pipe open failed, retry in {wait}s (#{failures})')
                time.sleep(wait)
                continue

            print(f'[{self.stream_id}] yt-dlp→ffmpeg pipeline running')
            frames_this_session = 0
            try:
                while self._running:
                    raw = ff_proc.stdout.read(FRAME_BYTES)
                    if len(raw) < FRAME_BYTES:
                        break
                    frames_this_session += 1
                    frame = np.frombuffer(raw, dtype=np.uint8).reshape(HEIGHT, WIDTH, 3)
                    try:
                        callback(self.stream_id, frame)
                    except Exception as e:
                        print(f'[{self.stream_id}] Callback error: {e}')
            finally:
                for proc in (ff_proc, dl_proc):
                    try:
                        proc.terminate(); proc.wait(timeout=5)
                    except Exception:
                        pass

            if frames_this_session == 0:
                # Pipeline connected but delivered no frames (e.g. Cloudflare block)
                failures += 1
                wait = min(300, 15 * (2 ** min(failures - 1, 4)))
                print(f'[{self.stream_id}] No frames received, retry in {wait}s (#{failures})')
                time.sleep(wait)
            else:
                failures = 0
                print(f'[{self.stream_id}] Session ended ({frames_this_session} frames), reconnecting...')
                time.sleep(3)

    # ── Public API ───────────────────────────────────────────────────────────

    def start(self, callback: Callable):
        self._running = True
        target = self._run_youtube if self._yt_id else self._run_generic
        self._thread = threading.Thread(
            target=target, args=(callback,),
            daemon=True, name=f'grabber-{self.stream_id}',
        )
        self._thread.start()

    def stop(self):
        self._running = False
