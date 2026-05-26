"""
Vercel serverless function — fetches a YouTube live thumbnail and returns it
as a base64-encoded JPEG string. Uses only Python stdlib (no pip deps needed).

GET /api/frame?stream=haram   →  { streamId, timestamp, frame: "<base64>" }
GET /api/frame?stream=arafat  →  { streamId, timestamp, frame: "<base64>" }
"""

import base64
import json
import time
import urllib.request
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

STREAM_VIDEO_IDS = {
    'haram':  'fZvuHkHYaXk',
    'arafat': 'hOPiS2SeO8U',
}

_HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    ),
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
}


def _fetch_thumbnail(video_id: str):
    """Return raw JPEG bytes for the live YouTube thumbnail, or None."""
    ts = int(time.time())
    candidates = [
        f'https://i.ytimg.com/vi/{video_id}/maxresdefault_live.jpg?_={ts}',
        f'https://i.ytimg.com/vi/{video_id}/hqdefault_live.jpg?_={ts}',
        f'https://i.ytimg.com/vi/{video_id}/sddefault_live.jpg?_={ts}',
        f'https://img.youtube.com/vi/{video_id}/maxresdefault.jpg?_={ts}',
        f'https://img.youtube.com/vi/{video_id}/hqdefault.jpg?_={ts}',
    ]
    for url in candidates:
        try:
            req = urllib.request.Request(url, headers=_HEADERS)
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = resp.read()
            # Skip YouTube's tiny grey placeholder images (< ~8 KB)
            if len(data) > 8_000:
                return data
        except Exception:
            continue
    return None


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        stream_id = params.get('stream', ['haram'])[0]

        video_id = STREAM_VIDEO_IDS.get(stream_id)
        if not video_id:
            self._respond(400, {'error': f'unknown stream: {stream_id}'})
            return

        raw = _fetch_thumbnail(video_id)
        self._respond(200, {
            'streamId':  stream_id,
            'timestamp': int(time.time() * 1000),
            'frame':     base64.b64encode(raw).decode() if raw else None,
        })

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _respond(self, status: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, *args):
        pass  # silence default stdout logging
