import asyncio
import base64
import json
import time
from typing import Set

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from analyzer import analyze_frame, compute_zones
from grabber import StreamGrabber

STREAMS_CONFIG = {
    'haram': {
        'url': 'https://www.youtube.com/live/fZvuHkHYaXk',
        'maxCapacity': 2_000_000,
        'name': 'الحرم المكي',
    },
    'arafat': {
        'url': 'https://www.youtube.com/live/hOPiS2SeO8U',
        'maxCapacity': 2_500_000,
        'name': 'صعيد عرفات',
    },
}

app = FastAPI(title='Hajj Crowd Monitor API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

clients: Set[WebSocket] = set()
_loop: asyncio.AbstractEventLoop | None = None
_grabbers: dict[str, StreamGrabber] = {}
_last_frames: dict[str, str] = {}  # streamId → base64 JPEG string


async def _broadcast(payload: dict):
    if not clients:
        return
    text = json.dumps(payload)
    dead: Set[WebSocket] = set()
    for ws in list(clients):
        try:
            await ws.send_text(text)
        except Exception:
            dead.add(ws)
    clients.difference_update(dead)


def _on_frame(stream_id: str, frame: np.ndarray):
    print(f'[{stream_id}] Frame received {frame.shape}, broadcasting to {len(clients)} clients')
    config = STREAMS_CONFIG[stream_id]
    result = analyze_frame(frame)
    zones = compute_zones(result['grid'])

    pct = result['avgDensity'] * 100
    count = int(result['avgDensity'] * config['maxCapacity'])
    congestion = 'high' if pct > 80 else 'medium' if pct > 60 else 'low'

    _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
    frame_b64 = base64.b64encode(buf).decode()
    _last_frames[stream_id] = frame_b64   # cache for HTTP polling

    payload = {
        'type': 'analysis',
        'streamId': stream_id,
        'timestamp': int(time.time() * 1000),
        'percentage': round(pct, 2),
        'estimatedCount': count,
        'congestionLevel': congestion,
        'densityZones': zones,
        'confidence': 0.90,
        'events': ['تكدس عالي'] if pct > 85 else [],
        'grid': result['grid'],
        'frame': frame_b64,
    }

    if _loop:
        asyncio.run_coroutine_threadsafe(_broadcast(payload), _loop)


@app.on_event('startup')
async def _startup():
    global _loop
    _loop = asyncio.get_running_loop()
    for sid, cfg in STREAMS_CONFIG.items():
        # YouTube thumbnail updates every ~15s; generic sources use faster polling
        interval = 15.0 if ('youtube.com' in cfg['url'] or 'youtu.be' in cfg['url']) else 5.0
        grabber = StreamGrabber(sid, cfg['url'], interval_secs=interval)
        grabber.start(_on_frame)
        _grabbers[sid] = grabber
        print(f'[startup] Grabber launched for {sid} → {cfg["url"]}')


@app.on_event('shutdown')
async def _shutdown():
    for g in _grabbers.values():
        g.stop()


@app.websocket('/ws')
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    print(f'[ws] Client connected ({len(clients)} total)')
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        clients.discard(ws)
        print(f'[ws] Client disconnected ({len(clients)} total)')


@app.get('/api/frame')
async def api_frame(stream: str = 'haram'):
    """HTTP polling endpoint — mirrors the Vercel serverless function for local dev."""
    from fastapi import Query
    from fastapi.responses import JSONResponse
    frame_b64 = _last_frames.get(stream)
    return JSONResponse({
        'streamId': stream,
        'timestamp': int(time.time() * 1000),
        'frame': frame_b64,
    })


@app.get('/health')
async def health():
    return {'status': 'ok', 'clients': len(clients), 'grabbers': list(_grabbers.keys())}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=False)
