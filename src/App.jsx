import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import {
  AlertTriangle, Activity, Users, TrendingUp, Camera, Pause, Play, Settings, Zap, MapPin, Clock,
  RotateCcw, Grid3x3, Eye, Layers, Sparkles, LayoutDashboard, ScanSearch, Aperture, ChevronRight, ExternalLink, Radio
} from 'lucide-react';

// ─── Procedurally generated crowd images (no CORS issues) ───────────────────
// Generates a canvas image simulating different crowd scenarios

function generateCrowdImage(scenario, seed = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');

  // seeded random
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  if (scenario === 'tawaf') {
    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 450);
    skyGrad.addColorStop(0, '#1a1410');
    skyGrad.addColorStop(0.4, '#2a1f15');
    skyGrad.addColorStop(1, '#3d2f1f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 800, 450);

    // Kaaba in center
    const cx = 400, cy = 240;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(cx - 35, cy - 40, 70, 80);
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 35, cy - 40, 70, 80);
    // gold band
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(cx - 35, cy - 15, 70, 4);

    // Concentric tawaf rings — dense in center, sparse at edges
    for (let ring = 1; ring < 16; ring++) {
      const radius = 45 + ring * 15;
      const density = Math.max(0, 1 - ring / 18);
      const count = Math.floor(40 + ring * 8);
      for (let i = 0; i < count; i++) {
        if (rand() > density * 1.2) continue;
        const angle = (i / count) * Math.PI * 2 + rand() * 0.3;
        const r = radius + (rand() - 0.5) * 12;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r * 0.55; // perspective squash
        const size = 1.8 + rand() * 1.5;
        const brightness = 200 + Math.floor(rand() * 55);
        ctx.fillStyle = `rgb(${brightness},${brightness-20},${brightness-50})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mataf floor highlight
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.15)';
    ctx.lineWidth = 1;
    for (let r = 60; r < 280; r += 30) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Outer architecture
    ctx.fillStyle = 'rgba(60, 45, 30, 0.7)';
    ctx.fillRect(0, 380, 800, 70);
    ctx.fillRect(0, 0, 800, 30);

  } else if (scenario === 'arafat') {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
    skyGrad.addColorStop(0, '#7a8b9d');
    skyGrad.addColorStop(1, '#c5b88f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 800, 200);

    // Distant mountain
    ctx.fillStyle = '#5a5040';
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(150, 130);
    ctx.lineTo(350, 90);
    ctx.lineTo(550, 110);
    ctx.lineTo(800, 150);
    ctx.lineTo(800, 200);
    ctx.closePath();
    ctx.fill();

    // Ground plain
    const groundGrad = ctx.createLinearGradient(0, 200, 0, 450);
    groundGrad.addColorStop(0, '#9a8f70');
    groundGrad.addColorStop(1, '#766850');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 200, 800, 250);

    // Crowd: dense in foreground, sparser far away
    for (let y = 210; y < 445; y += 1.5) {
      const depth = (y - 210) / 235;
      const density = 0.3 + depth * 0.7;
      const personSize = 0.5 + depth * 2.5;
      const lineY = y;
      const peoplePerLine = Math.floor(80 + depth * 150);

      for (let i = 0; i < peoplePerLine; i++) {
        if (rand() > density) continue;
        const x = rand() * 800;
        // varied white (ihram-ish) colors
        const tint = 200 + Math.floor(rand() * 55);
        ctx.fillStyle = rand() > 0.3
          ? `rgba(${tint},${tint-5},${tint-15},${0.7 + rand() * 0.3})`
          : `rgba(${100+Math.floor(rand()*80)},${90+Math.floor(rand()*60)},${70+Math.floor(rand()*50)},0.8)`;
        ctx.beginPath();
        ctx.arc(x, lineY, personSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Atmospheric haze at horizon
    const hazeGrad = ctx.createLinearGradient(0, 195, 0, 250);
    hazeGrad.addColorStop(0, 'rgba(197, 184, 143, 0.6)');
    hazeGrad.addColorStop(1, 'rgba(197, 184, 143, 0)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, 195, 800, 55);

  } else if (scenario === 'mina') {
    // Tents at Mina — white tents in grid pattern
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 130);
    skyGrad.addColorStop(0, '#3a4a5a');
    skyGrad.addColorStop(1, '#7a7060');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 800, 130);

    // Ground
    ctx.fillStyle = '#5d5040';
    ctx.fillRect(0, 130, 800, 320);

    // Mountains background
    ctx.fillStyle = 'rgba(45, 40, 35, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, 130);
    ctx.lineTo(200, 60);
    ctx.lineTo(450, 80);
    ctx.lineTo(700, 50);
    ctx.lineTo(800, 90);
    ctx.lineTo(800, 130);
    ctx.closePath();
    ctx.fill();

    // Grid of white tents
    for (let row = 0; row < 18; row++) {
      const y = 145 + row * 18;
      const depth = row / 18;
      const tentSize = 8 + depth * 8;
      const tentsInRow = Math.floor(20 + depth * 15);
      const startX = -tentSize;

      for (let i = 0; i < tentsInRow; i++) {
        if (rand() > 0.85) continue; // gaps
        const x = startX + i * (800 / tentsInRow) + (row % 2) * 12;
        // Tent shape: bright top with shadow
        ctx.fillStyle = `rgba(${230+Math.floor(rand()*25)},${225+Math.floor(rand()*20)},${210+Math.floor(rand()*15)},0.95)`;
        ctx.fillRect(x, y - tentSize/2, tentSize, tentSize);
        ctx.fillStyle = `rgba(160,150,130,0.7)`;
        ctx.fillRect(x, y + tentSize/2 - 2, tentSize, 2);

        // People between tents
        if (rand() > 0.6) {
          ctx.fillStyle = `rgba(${200+Math.floor(rand()*50)},${190+Math.floor(rand()*40)},${170+Math.floor(rand()*40)},0.8)`;
          ctx.beginPath();
          ctx.arc(x + tentSize/2 + (rand()-0.5) * tentSize, y + tentSize/2 + 3, 1.5 + depth * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

  } else if (scenario === 'jamarat') {
    // Jamarat bridge — concentrated crowd flow
    ctx.fillStyle = '#2a2520';
    ctx.fillRect(0, 0, 800, 450);

    // Bridge structure
    ctx.fillStyle = '#3a3530';
    ctx.fillRect(0, 100, 800, 250);
    ctx.fillStyle = '#5a5045';
    ctx.fillRect(0, 100, 800, 8);
    ctx.fillRect(0, 342, 800, 8);

    // Three pillars
    [200, 400, 600].forEach((px, i) => {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(px - 15, 130, 30, 90);
      ctx.fillStyle = '#888';
      ctx.fillRect(px - 12, 135, 24, 5);
    });

    // Dense crowd flowing
    for (let y = 110; y < 345; y += 1.2) {
      const intensity = Math.sin((y - 110) / 235 * Math.PI) * 0.9 + 0.3;
      const count = Math.floor(120 * intensity);
      for (let i = 0; i < count; i++) {
        if (rand() > intensity) continue;
        const x = rand() * 800;
        // skip pillar zones
        if ([200, 400, 600].some(px => Math.abs(x - px) < 20 && y > 130 && y < 220)) continue;
        const brightness = 180 + Math.floor(rand() * 70);
        ctx.fillStyle = `rgba(${brightness},${brightness-5},${brightness-20},${0.75 + rand() * 0.25})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + rand() * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

// ─── Stream/Sample Definitions ──────────────────────────────────────────────
const STREAMS = {
  haram: {
    id: 'haram', name: 'الحرم المكي', nameEn: 'Masjid al-Haram',
    location: 'مكة المكرمة', maxCapacity: 2000000, color: '#d4a574', scenario: 'tawaf',
    streamUrl: 'https://www.youtube.com/live/fZvuHkHYaXk?si=5U4bnnh5hqUXhR0d',
  },
  arafat: {
    id: 'arafat', name: 'صعيد عرفات', nameEn: 'Mount Arafat',
    location: 'عرفات', maxCapacity: 2500000, color: '#c5b088', scenario: 'arafat',
    streamUrl: 'https://www.youtube.com/live/hOPiS2SeO8U',
  },
};

const SAMPLE_DEFS = [
  { id: 'tawaf', name: 'الطواف حول الكعبة', nameEn: 'Tawaf — Kaaba', scenario: 'tawaf', capacity: 2000000 },
  { id: 'arafat', name: 'صعيد عرفات', nameEn: 'Mount Arafat', scenario: 'arafat', capacity: 2500000 },
  { id: 'mina', name: 'خيام منى', nameEn: 'Mina tents', scenario: 'mina', capacity: 3000000 },
  { id: 'jamarat', name: 'الجمرات', nameEn: 'Jamarat bridge', scenario: 'jamarat', capacity: 500000 },
];

const SAMPLING_INTERVAL_MS = 3000;
const MAX_HISTORY_POINTS = 40;
const GRID_SIZE = 16;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatNumber = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
};
const formatTime = (ts) => new Date(ts).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const simulateGeminiAnalysis = (streamId, prevPercentage) => {
  const drift = (Math.random() - 0.5) * 4;
  const surge = Math.random() < 0.05 ? Math.random() * 15 : 0;
  let next = (prevPercentage ?? 65) + drift + surge;
  next = Math.max(20, Math.min(98, next));

  const zoneNames = ['الشمالية', 'الجنوبية', 'الشرقية', 'الغربية'];
  const densityZones = zoneNames.map(zone => ({
    name: zone,
    density: Math.max(10, Math.min(100, next + (Math.random() - 0.5) * 25)),
  }));

  const events = [];
  if (next > 85) events.push('تكدس عالي');
  if (Math.random() < 0.1) events.push('حركة تدفق سريعة');
  if (Math.random() < 0.08) events.push('تجمع جديد');

  return {
    timestamp: Date.now(),
    percentage: next,
    estimatedCount: Math.round((next / 100) * (streamId === 'haram' ? 2000000 : 2500000)),
    congestionLevel: next > 80 ? 'high' : next > 60 ? 'medium' : 'low',
    densityZones, events,
    confidence: 0.85 + Math.random() * 0.1,
  };
};

// ─── Heatmap analysis ────────────────────────────────────────────────────────
function analyzeImage(imageElement, gridSize = GRID_SIZE) {
  const canvas = document.createElement('canvas');
  const w = canvas.width = imageElement.naturalWidth || imageElement.width;
  const h = canvas.height = imageElement.naturalHeight || imageElement.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  try { ctx.drawImage(imageElement, 0, 0, w, h); }
  catch (e) { return null; }

  const cellW = Math.floor(w / gridSize);
  const cellH = Math.floor(h / gridSize);
  const grid = [];
  let globalMin = Infinity, globalMax = -Infinity;

  try {
    for (let row = 0; row < gridSize; row++) {
      const rowData = [];
      for (let col = 0; col < gridSize; col++) {
        const data = ctx.getImageData(col * cellW, row * cellH, cellW, cellH).data;
        let sumL = 0, sumL2 = 0, edgeSum = 0;
        const pixels = data.length / 4;
        const luminances = new Float32Array(pixels);
        for (let i = 0; i < pixels; i++) {
          const L = 0.299 * data[i*4] + 0.587 * data[i*4+1] + 0.114 * data[i*4+2];
          luminances[i] = L;
          sumL += L; sumL2 += L * L;
        }
        const mean = sumL / pixels;
        const variance = (sumL2 / pixels) - (mean * mean);
        const stdDev = Math.sqrt(Math.max(0, variance));
        for (let i = 1; i < pixels; i++) edgeSum += Math.abs(luminances[i] - luminances[i-1]);
        const edgeDensity = edgeSum / pixels;
        const luminanceFactor = 1 - Math.abs(mean - 110) / 200;
        const score = (stdDev * 0.6 + edgeDensity * 0.4) * Math.max(0.3, luminanceFactor);
        if (score < globalMin) globalMin = score;
        if (score > globalMax) globalMax = score;
        rowData.push({ row, col, score, mean, stdDev, edgeDensity });
      }
      grid.push(rowData);
    }
  } catch (e) { return null; }

  const range = globalMax - globalMin || 1;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      grid[r][c].density = (grid[r][c].score - globalMin) / range;
    }
  }
  return { grid, width: w, height: h };
}

function heatColor(density, alpha = 0.55) {
  const stops = [
    [0.0, [30, 80, 180]], [0.25, [60, 180, 150]], [0.5, [230, 200, 70]],
    [0.75, [240, 130, 50]], [1.0, [220, 40, 50]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (density >= t0 && density <= t1) {
      const t = (density - t0) / (t1 - t0);
      const r = Math.round(c0[0] + (c1[0]-c0[0]) * t);
      const g = Math.round(c0[1] + (c1[1]-c0[1]) * t);
      const b = Math.round(c0[2] + (c1[2]-c0[2]) * t);
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }
  return `rgba(220,40,50,${alpha})`;
}

function renderHeatmapCanvas(grid, canvas, opacity = 0.55) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const gridSize = grid.length;
  const cellW = w / gridSize, cellH = h / gridSize;
  ctx.clearRect(0, 0, w, h);
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const d = grid[row][col].density;
      if (d < 0.05) continue;
      const cx = col * cellW + cellW/2;
      const cy = row * cellH + cellH/2;
      const radius = Math.max(cellW, cellH) * 1.1;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, heatColor(d, opacity));
      grad.addColorStop(1, heatColor(d, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(col*cellW - radius/2, row*cellH - radius/2, cellW + radius, cellH + radius);
    }
  }
}

function computeRegions(grid) {
  const gs = grid.length;
  const half = gs / 2, third = gs / 3;
  const regions = { 'الأعلى': [], 'الأسفل': [], 'اليمين': [], 'اليسار': [], 'المركز': [] };
  for (let r = 0; r < gs; r++) {
    for (let c = 0; c < gs; c++) {
      const d = grid[r][c].density;
      if (r < half) regions['الأعلى'].push(d); else regions['الأسفل'].push(d);
      if (c < half) regions['اليسار'].push(d); else regions['اليمين'].push(d);
      if (r >= third && r < 2*third && c >= third && c < 2*third) regions['المركز'].push(d);
    }
  }
  const result = {};
  for (const [name, arr] of Object.entries(regions)) {
    result[name] = arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  return result;
}

function computeZonesFromGrid(grid) {
  if (!grid || !grid.length) return [];
  const gs = grid.length;
  const half = Math.floor(gs / 2);
  const zoneDefs = [
    { name: 'الشمالية', r0: 0,    r1: half, c0: 0,    c1: gs   },
    { name: 'الجنوبية', r0: half, r1: gs,   c0: 0,    c1: gs   },
    { name: 'الشرقية',  r0: 0,    r1: gs,   c0: half, c1: gs   },
    { name: 'الغربية',  r0: 0,    r1: gs,   c0: 0,    c1: half },
  ];
  return zoneDefs.map(({ name, r0, r1, c0, c1 }) => {
    let sum = 0, count = 0;
    for (let r = r0; r < r1; r++)
      for (let c = c0; c < c1; c++) { sum += grid[r][c].density; count++; }
    return { name, density: parseFloat((sum / count * 100).toFixed(1)) };
  });
}

// ─── Components ─────────────────────────────────────────────────────────────

const DensityGauge = ({ percentage, label }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const status = percentage > 80 ? 'critical' : percentage > 60 ? 'warning' : 'normal';
  const colors = { critical: '#ef4444', warning: '#f59e0b', normal: '#10b981' };
  return (
    <div className="relative flex items-center justify-center">
      <svg width="150" height="150" className="transform -rotate-90">
        <circle cx="75" cy="75" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
        <circle cx="75" cy="75" r={radius} stroke={colors[status]} strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold font-display" style={{ color: colors[status] }}>{percentage.toFixed(1)}</div>
        <div className="text-[10px] text-stone-500 tracking-widest uppercase mt-1 font-mono">{label}</div>
      </div>
    </div>
  );
};

const StreamCard = ({ stream, data, history, isPaused, onTogglePause, onAnalyzeFrame, frameSrc, isLive }) => {
  const current = data || { percentage: 0, estimatedCount: 0, densityZones: [], events: [] };
  const trend = history.length >= 2 ? (history[history.length-1].percentage - history[history.length-2].percentage) : 0;

  return (
    <div className="rounded-2xl border border-stone-800 bg-gradient-to-b from-stone-950/80 to-black/80 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-100 font-arabic">{stream.name}</h3>
            <p className="text-[10px] text-stone-500 font-mono tracking-wider">{stream.nameEn} · {stream.location}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onAnalyzeFrame(stream.id)} className="p-2 rounded-lg border border-stone-700 hover:border-amber-700 hover:text-amber-400 transition-colors text-stone-400" title="Capture & analyze">
            <Aperture size={13} />
          </button>
          <button onClick={onTogglePause} className="p-2 rounded-lg border border-stone-700 hover:border-stone-500 transition-colors text-stone-400 hover:text-stone-200">
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>
        </div>
      </div>

      <div className="relative aspect-video bg-stone-900 overflow-hidden border-b border-stone-800">
        {frameSrc && (
          <img src={frameSrc} alt={stream.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px]">
          <Camera size={10} className={isLive ? 'text-emerald-400' : 'text-stone-300'} />
          <span className={`font-mono tracking-wider ${isLive ? 'text-emerald-300' : 'text-stone-400'}`}>
            {isLive ? 'LIVE · REAL' : 'LIVE · SIMULATED'}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/70 backdrop-blur text-[10px] text-stone-300 font-mono">
          {formatTime(current.timestamp || Date.now())}
        </div>
        {isPaused && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="px-3 py-1.5 rounded bg-amber-900/80 text-amber-100 text-xs font-mono">PAUSED</div>
          </div>
        )}
      </div>

      {stream.streamUrl && (
        <a href={stream.streamUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-2.5 border-b border-stone-800 bg-stone-900/40 hover:bg-amber-950/30 transition-colors group">
          <div className="flex items-center gap-2">
            <Radio size={12} className="text-red-500 animate-pulse" />
            <span className="text-xs text-stone-300 font-arabic group-hover:text-amber-200 transition-colors">
              مشاهدة البث المباشر
            </span>
            {stream.streamCount && (
              <span className="px-1.5 py-0.5 rounded bg-stone-800 text-[9px] text-stone-400 font-mono">
                {stream.streamCount} streams
              </span>
            )}
          </div>
          <ExternalLink size={11} className="text-stone-500 group-hover:text-amber-400 transition-colors" />
        </a>
      )}

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <DensityGauge percentage={current.percentage} label="Density" />
          <div className="flex-1 space-y-2">
            <div>
              <div className="text-[10px] text-stone-500 tracking-widest uppercase font-mono mb-1">العدد التقديري</div>
              <div className="text-2xl font-bold text-stone-100 font-display">{formatNumber(current.estimatedCount)}</div>
              <div className="text-[10px] text-stone-600 font-mono mt-0.5">من {formatNumber(stream.maxCapacity)}</div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <TrendingUp size={11} className={trend > 0 ? 'text-amber-400' : 'text-emerald-400'} />
              <span className={trend > 0 ? 'text-amber-400 font-mono' : 'text-emerald-400 font-mono'}>
                {trend > 0 ? '+' : ''}{trend.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id={`g-${stream.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stream.color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={stream.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="percentage" stroke={stream.color} strokeWidth={2} fill={`url(#g-${stream.id})`} isAnimationActive={false} />
              <YAxis hide domain={[0, 100]} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(current.densityZones || []).map((z, i) => {
            const heat = z.density;
            const borderColor = heat > 80 ? '#dc2626' : heat > 60 ? '#f59e0b' : '#10b981';
            return (
              <div key={i} className="p-2 rounded-lg border" style={{ borderColor: borderColor + '40', background: borderColor + '15' }}>
                <div className="text-[10px] text-stone-400 mb-0.5 font-arabic">{z.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold font-display" style={{ color: borderColor }}>{heat.toFixed(0)}</span>
                  <span className="text-[10px] text-stone-500 font-mono">%</span>
                </div>
              </div>
            );
          })}
        </div>

        {current.events && current.events.length > 0 && (
          <div className="space-y-1.5">
            {current.events.map((ev, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-950/30 border border-amber-900/50 text-xs text-amber-200">
                <Zap size={11} />
                <span className="font-arabic">{ev}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const HeatmapAnalyzer = ({ activeImage, setActiveImage, samples }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.65);
  const [showGrid, setShowGrid] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoverCell, setHoverCell] = useState(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => { setAnalysis(null); setImageLoaded(false); }, [activeImage.url]);

  const runAnalysis = useCallback(() => {
    if (!imageRef.current || !imageLoaded) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = analyzeImage(imageRef.current, GRID_SIZE);
      if (!result) { setIsAnalyzing(false); return; }
      const regions = computeRegions(result.grid);
      const allD = result.grid.flat().map(c => c.density);
      const avgDensity = allD.reduce((a, b) => a + b, 0) / allD.length;
      const maxDensity = Math.max(...allD);
      const hotspots = result.grid.flat().filter(c => c.density > 0.75).length;
      const congestionLevel = avgDensity > 0.55 ? 'high' : avgDensity > 0.35 ? 'medium' : 'low';
      const estimatedCount = Math.round(avgDensity * (activeImage.capacity || 1000000));
      setAnalysis({ grid: result.grid, avgDensity, maxDensity, hotspots, totalCells: GRID_SIZE*GRID_SIZE, regions, congestionLevel, estimatedCount });
      setIsAnalyzing(false);
    }, 400);
  }, [imageLoaded, activeImage]);

  useEffect(() => {
    if (!analysis || !canvasRef.current || !imageRef.current) return;
    const img = imageRef.current;
    const canvas = canvasRef.current;
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    renderHeatmapCanvas(analysis.grid, canvas, overlayOpacity);
  }, [analysis, overlayOpacity, showHeatmap]);

  useEffect(() => {
    const onResize = () => {
      if (analysis && canvasRef.current && imageRef.current) {
        const img = imageRef.current;
        const canvas = canvasRef.current;
        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;
        renderHeatmapCanvas(analysis.grid, canvas, overlayOpacity);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [analysis, overlayOpacity]);

  const handleMouseMove = (e) => {
    if (!analysis || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const col = Math.floor((x / rect.width) * GRID_SIZE);
    const row = Math.floor((y / rect.height) * GRID_SIZE);
    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
      setHoverCell({ row, col, density: analysis.grid[row][col].density, x, y });
    } else setHoverCell(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center flex-wrap gap-3">
        <div className="text-xs text-stone-500 font-mono tracking-[0.2em] uppercase">Select Source</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {samples.map(s => (
          <button key={s.id} onClick={() => setActiveImage(s)}
            className={`relative rounded-lg overflow-hidden border-2 transition aspect-video group ${
              activeImage.id === s.id ? 'border-amber-600' : 'border-stone-800 hover:border-stone-600'
            }`}>
            <img src={s.url} alt={s.name} className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-1.5 text-right">
              <div className="text-xs font-arabic text-stone-100">{s.name}</div>
              <div className="text-[9px] text-stone-300 font-mono">{s.nameEn}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="relative rounded-xl overflow-hidden border border-stone-800 bg-stone-900">
            <img ref={imageRef} src={activeImage.url} alt={activeImage.name}
              onLoad={() => setImageLoaded(true)}
              className="w-full h-auto block"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverCell(null)} />
            {showHeatmap && analysis && (
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen" style={{ opacity: 0.9 }} />
            )}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none grid"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-amber-400/15" />
                ))}
              </div>
            )}
            {hoverCell && analysis && (
              <div className="absolute pointer-events-none px-2 py-1 rounded bg-black/90 border border-amber-700/50 text-[10px] font-mono text-amber-200 whitespace-nowrap"
                style={{ left: hoverCell.x + 12, top: hoverCell.y + 12, transform: hoverCell.x > 400 ? 'translateX(-120%)' : 'none' }}>
                [{hoverCell.row},{hoverCell.col}] · {(hoverCell.density * 100).toFixed(1)}%
              </div>
            )}
            {!analysis && imageLoaded && !isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <button onClick={runAnalysis}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-amber-50 font-medium transition-all shadow-xl shadow-amber-950/50 text-sm">
                  <Play size={14} />
                  <span>تحليل الكثافة</span>
                </button>
              </div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 border-2 border-amber-700/30 rounded-full" />
                    <div className="absolute inset-0 border-2 border-amber-500 rounded-full border-t-transparent animate-spin" />
                  </div>
                  <div className="text-[10px] text-amber-200 font-mono tracking-widest">ANALYZING</div>
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-gradient-to-t from-black/90 to-transparent">
              <div className="text-[9px] text-stone-400 font-mono">
                {analysis ? `${GRID_SIZE}×${GRID_SIZE} grid analyzed` : 'awaiting analysis'}
              </div>
              {analysis && (
                <button onClick={() => setAnalysis(null)} className="flex items-center gap-1 px-2 py-1 rounded bg-stone-900/70 hover:bg-stone-800 text-[9px] text-stone-400 hover:text-stone-200 transition">
                  <RotateCcw size={9} />
                  <span>reset</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <button onClick={() => setShowHeatmap(!showHeatmap)} disabled={!analysis}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition text-xs ${
                showHeatmap && analysis ? 'border-amber-700 bg-amber-950/40 text-amber-200'
                : 'border-stone-800 bg-stone-900/40 text-stone-500 hover:text-stone-300'
              } disabled:opacity-40 disabled:cursor-not-allowed`}>
              <Layers size={11} />
              <span>Heatmap</span>
            </button>
            <button onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition text-xs ${
                showGrid ? 'border-stone-600 bg-stone-800/60 text-stone-200'
                : 'border-stone-800 bg-stone-900/40 text-stone-500 hover:text-stone-300'
              }`}>
              <Grid3x3 size={11} />
              <span>Grid</span>
            </button>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-stone-800 bg-stone-900/40 text-xs">
              <Eye size={11} className="text-stone-500" />
              <input type="range" min="0.1" max="1" step="0.05" value={overlayOpacity}
                onChange={e => setOverlayOpacity(parseFloat(e.target.value))} disabled={!analysis} className="flex-1 accent-amber-600" />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-[9px] text-stone-500 font-mono">
            <span>LOW</span>
            <div className="flex-1 h-1.5 rounded-full"
              style={{ background: 'linear-gradient(to right, rgb(30,80,180), rgb(60,180,150), rgb(230,200,70), rgb(240,130,50), rgb(220,40,50))' }} />
            <span>HIGH</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-stone-800 bg-gradient-to-br from-stone-900/60 to-stone-950/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <MapPin size={11} className="text-amber-500" />
              <span className="text-[9px] text-stone-500 font-mono tracking-widest uppercase">Source</span>
            </div>
            <div className="text-base font-arabic text-stone-100">{activeImage.name}</div>
            <div className="text-[10px] text-stone-500 font-mono">{activeImage.nameEn}</div>
          </div>

          {analysis ? (
            <>
              <div className="p-3.5 rounded-xl border border-stone-800 bg-gradient-to-br from-stone-900/60 to-stone-950/30">
                <div className="text-[9px] text-stone-500 font-mono tracking-widest uppercase mb-2">Aggregate Density</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold font-display" style={{
                    color: analysis.avgDensity > 0.55 ? '#ef4444' : analysis.avgDensity > 0.35 ? '#f59e0b' : '#10b981'
                  }}>{(analysis.avgDensity * 100).toFixed(1)}</span>
                  <span className="text-base text-stone-500">%</span>
                </div>
                <div className="h-1.5 bg-stone-900 rounded-full overflow-hidden mb-2">
                  <div className="h-full transition-all duration-1000 rounded-full"
                    style={{ width: `${analysis.avgDensity * 100}%`, background: 'linear-gradient(to right, rgb(16,185,129), rgb(245,158,11), rgb(239,68,68))' }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-stone-500 font-mono text-[9px]">PEAK</div>
                    <div className="text-stone-200 font-display text-lg">{(analysis.maxDensity * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-stone-500 font-mono text-[9px]">HOTSPOTS</div>
                    <div className="text-stone-200 font-display text-lg">{analysis.hotspots}/{analysis.totalCells}</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-800 bg-gradient-to-br from-stone-900/60 to-stone-950/30">
                <div className="text-[9px] text-stone-500 font-mono tracking-widest uppercase mb-1.5">Estimated Count</div>
                <div className="font-display text-2xl text-amber-100">{formatNumber(analysis.estimatedCount)}</div>
                <div className="text-[9px] text-stone-600 font-mono mt-0.5">of {formatNumber(activeImage.capacity)} max</div>
              </div>

              <div className="p-3.5 rounded-xl border border-stone-800 bg-gradient-to-br from-stone-900/60 to-stone-950/30">
                <div className="text-[9px] text-stone-500 font-mono tracking-widest uppercase mb-2">Region Density</div>
                <div className="space-y-1.5">
                  {Object.entries(analysis.regions).map(([name, d]) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="text-xs font-arabic text-stone-300 w-12 text-right">{name}</span>
                      <div className="flex-1 h-1 bg-stone-900 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-700 rounded-full"
                          style={{ width: `${d * 100}%`, background: heatColor(d, 1) }} />
                      </div>
                      <span className="text-[9px] text-stone-400 font-mono w-8 text-left">{(d * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-2.5 rounded-xl border ${
                analysis.congestionLevel === 'high' ? 'border-red-900/50 bg-red-950/30 text-red-200'
                : analysis.congestionLevel === 'medium' ? 'border-amber-900/50 bg-amber-950/30 text-amber-200'
                : 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200'}`}>
                <div className="text-[9px] font-mono tracking-widest uppercase opacity-70 mb-0.5">Status</div>
                <div className="text-xs font-arabic">
                  {analysis.congestionLevel === 'high' && 'تكدس مرتفع — يستلزم متابعة'}
                  {analysis.congestionLevel === 'medium' && 'كثافة متوسطة'}
                  {analysis.congestionLevel === 'low' && 'كثافة طبيعية'}
                </div>
              </div>
            </>
          ) : (
            <div className="p-5 rounded-xl border border-dashed border-stone-800 text-center text-stone-500 text-xs font-mono">
              اضغط "تحليل الكثافة" لعرض النتائج
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main App ────────────────────────────────────────────────────────────────
export default function UnifiedDashboard() {
  const [view, setView] = useState('live');
  const [streamData, setStreamData] = useState({});
  const [history, setHistory] = useState({ haram: [], arafat: [] });
  const [alerts, setAlerts] = useState([]);
  const [paused, setPaused] = useState({ haram: false, arafat: false });
  const [frameRefresh, setFrameRefresh] = useState(0);
  const [apiStatus, setApiStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [realFrames, setRealFrames] = useState({});
  const pausedRef = useRef({ haram: false, arafat: false });
  const everConnectedRef = useRef(false);

  // Generate frames for streams (regenerate on refresh tick)
  const streamFrames = useMemo(() => ({
    haram: generateCrowdImage('tawaf', Date.now() + 1),
    arafat: generateCrowdImage('arafat', Date.now() + 2),
  }), [frameRefresh]);

  // Generate samples for heatmap analyzer (stable)
  const samples = useMemo(() => SAMPLE_DEFS.map(def => ({
    ...def,
    url: generateCrowdImage(def.scenario, def.id.charCodeAt(0) * 1000),
  })), []);

  const [activeAnalyzerImage, setActiveAnalyzerImage] = useState(() => ({
    ...SAMPLE_DEFS[0],
    url: generateCrowdImage(SAMPLE_DEFS[0].scenario, SAMPLE_DEFS[0].id.charCodeAt(0) * 1000),
  }));

  const tickCounterRef = useRef(0);

  const tick = useCallback(() => {
    tickCounterRef.current += 1;
    // Refresh frames every 3 ticks (~9 seconds)
    if (tickCounterRef.current % 3 === 0) {
      setFrameRefresh(f => f + 1);
    }

    Object.values(STREAMS).forEach(stream => {
      if (paused[stream.id]) return;
      setStreamData(prev => {
        const prevPct = prev[stream.id]?.percentage;
        const analysis = simulateGeminiAnalysis(stream.id, prevPct);
        if (analysis.percentage > 85 && (prevPct ?? 0) <= 85) {
          setAlerts(a => [{
            id: Date.now() + stream.id,
            stream: stream.name,
            message: `تجاوز عتبة الازدحام (${analysis.percentage.toFixed(1)}%)`,
            severity: 'high', time: Date.now(),
          }, ...a].slice(0, 8));
        }
        setHistory(h => ({
          ...h,
          [stream.id]: [...h[stream.id], {
            time: formatTime(analysis.timestamp),
            percentage: analysis.percentage,
            count: analysis.estimatedCount,
          }].slice(-MAX_HISTORY_POINTS),
        }));
        return { ...prev, [stream.id]: analysis };
      });
    });
  }, [paused]);

  // Keep pausedRef in sync with paused state (avoids stale closure in polling callback)
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Simulation fallback — only runs when API is disconnected / not yet connected
  useEffect(() => {
    if (apiStatus === 'connected') return;
    tick();
    const interval = setInterval(tick, SAMPLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tick, apiStatus]);

  // HTTP polling — fetches live YouTube thumbnails from the Vercel serverless API
  // and runs client-side crowd density analysis on each frame.
  useEffect(() => {
    let cancelled = false;
    const timers = {};

    const analyzeAndUpdate = (streamId, imgSrc, timestamp) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled || pausedRef.current[streamId]) return;
        const result = analyzeImage(img);
        if (!result) return;

        const allD = result.grid.flat().map(c => c.density);
        const avgDensity = allD.reduce((a, b) => a + b, 0) / allD.length;
        const stream = STREAMS[streamId];
        const pct = parseFloat((avgDensity * 100).toFixed(2));

        const analysis = {
          timestamp,
          percentage: pct,
          estimatedCount: Math.round(avgDensity * stream.maxCapacity),
          congestionLevel: pct > 80 ? 'high' : pct > 60 ? 'medium' : 'low',
          densityZones: computeZonesFromGrid(result.grid),
          events: pct > 85 ? ['تكدس عالي'] : [],
          confidence: 0.90,
        };

        setStreamData(prev => ({ ...prev, [streamId]: analysis }));
        setHistory(prev => ({
          ...prev,
          [streamId]: [...(prev[streamId] || []), {
            time: formatTime(analysis.timestamp),
            percentage: analysis.percentage,
            count: analysis.estimatedCount,
          }].slice(-MAX_HISTORY_POINTS),
        }));
        if (analysis.percentage > 85) {
          setAlerts(a => [{
            id: Date.now() + streamId,
            stream: stream.name,
            message: `تجاوز عتبة الازدحام (${analysis.percentage.toFixed(1)}%)`,
            severity: 'high', time: Date.now(),
          }, ...a].slice(0, 8));
        }
      };
      img.src = imgSrc;
    };

    const pollStream = async (streamId) => {
      if (cancelled) return;
      try {
        const resp = await fetch(`/api/frame?stream=${streamId}&_=${Date.now()}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (!cancelled && data.frame) {
          everConnectedRef.current = true;
          setApiStatus('connected');
          const imgSrc = `data:image/jpeg;base64,${data.frame}`;
          setRealFrames(prev => ({ ...prev, [streamId]: imgSrc }));
          analyzeAndUpdate(streamId, imgSrc, data.timestamp);
        }
      } catch (_) {
        if (!cancelled && !everConnectedRef.current) setApiStatus('disconnected');
      }
      if (!cancelled) {
        timers[streamId] = setTimeout(() => pollStream(streamId), 15000);
      }
    };

    // Stagger the two polls so they don't fire simultaneously
    pollStream('haram');
    timers['arafat_init'] = setTimeout(() => pollStream('arafat'), 3000);

    return () => {
      cancelled = true;
      Object.values(timers).forEach(clearTimeout);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use real frames when available, fall back to simulated
  const displayFrames = useMemo(() => ({
    haram: realFrames.haram || streamFrames.haram,
    arafat: realFrames.arafat || streamFrames.arafat,
  }), [realFrames, streamFrames]);

  const handleAnalyzeFrame = (streamId) => {
    const stream = STREAMS[streamId];
    setActiveAnalyzerImage({
      id: `snapshot-${streamId}`,
      name: `لقطة من ${stream.name}`,
      nameEn: `Snapshot — ${stream.nameEn}`,
      url: displayFrames[streamId],
      capacity: stream.maxCapacity,
    });
    setView('heatmap');
  };

  const totalCount = Object.values(streamData).reduce((sum, d) => sum + (d?.estimatedCount || 0), 0);
  const avgDensity = Object.values(streamData).length > 0
    ? Object.values(streamData).reduce((sum, d) => sum + (d?.percentage || 0), 0) / Object.values(streamData).length
    : 0;

  const combinedHistory = (history.haram || []).map((point, i) => ({
    time: point.time,
    'الحرم': point.percentage,
    'عرفات': history.arafat[i]?.percentage,
  }));

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cormorant+Garamond:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-arabic { font-family: 'Amiri', serif; }
        .font-display { font-family: 'Cormorant Garamond', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        body { background: #0c0a09; }
      `}</style>

      <header className="border-b border-stone-800 bg-gradient-to-b from-stone-900/90 to-stone-950/40 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-amber-600 via-amber-800 to-amber-950 flex items-center justify-center shadow-lg shadow-amber-950/50">
              <Activity size={20} className="text-amber-100" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-stone-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-100 tracking-tight font-display">
                Hajj Crowd Monitor
              </h1>
              <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase font-mono">
                Vision AI · Live + Heatmap · POC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-lg border border-stone-800 bg-stone-900/40">
              <button onClick={() => setView('live')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition ${
                  view === 'live' ? 'bg-amber-700/30 text-amber-200 border border-amber-700/50' : 'text-stone-400 hover:text-stone-200'
                }`}>
                <LayoutDashboard size={12} />
                <span>Live</span>
              </button>
              <button onClick={() => setView('heatmap')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition ${
                  view === 'heatmap' ? 'bg-amber-700/30 text-amber-200 border border-amber-700/50' : 'text-stone-400 hover:text-stone-200'
                }`}>
                <ScanSearch size={12} />
                <span>Heatmap</span>
              </button>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-mono transition-colors ${
              apiStatus === 'connected'
                ? 'border-emerald-800 bg-emerald-950/30 text-emerald-300'
                : apiStatus === 'connecting'
                ? 'border-amber-800 bg-amber-950/20 text-amber-400'
                : 'border-stone-800 bg-stone-900/40 text-stone-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                apiStatus === 'connected' ? 'bg-emerald-400 animate-pulse'
                : apiStatus === 'connecting' ? 'bg-amber-400 animate-pulse'
                : 'bg-stone-600'
              }`} />
              {apiStatus === 'connected' ? 'AI LIVE' : apiStatus === 'connecting' ? 'CONNECTING' : 'SIMULATED'}
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-stone-800 bg-stone-900/40">
              <Sparkles size={11} className="text-amber-500" />
              <span className="text-[10px] text-stone-500 font-mono">made by</span>
              <a href="https://www.linkedin.com/in/mahmoudaziz/" target="_blank" rel="noopener noreferrer"
                className="text-amber-200 font-display text-base hover:text-amber-400 transition-colors underline-offset-2 hover:underline" style={{ letterSpacing: '0.02em' }}>
                Mahmoud AbdelAziz
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl border border-stone-800 bg-gradient-to-br from-stone-950 to-black">
            <div className="flex items-center justify-between mb-2">
              <Users size={14} className="text-amber-500" />
              <span className="text-[9px] text-stone-500 font-mono tracking-widest uppercase">Total</span>
            </div>
            <div className="text-2xl font-bold text-stone-100 font-display">{formatNumber(totalCount)}</div>
            <div className="text-[10px] text-stone-500 mt-0.5 font-mono">إجمالي تقديري</div>
          </div>
          <div className="p-3.5 rounded-xl border border-stone-800 bg-gradient-to-br from-stone-950 to-black">
            <div className="flex items-center justify-between mb-2">
              <Activity size={14} className="text-emerald-500" />
              <span className="text-[9px] text-stone-500 font-mono tracking-widest uppercase">Avg</span>
            </div>
            <div className="text-2xl font-bold text-stone-100 font-display">
              {avgDensity.toFixed(1)}<span className="text-base text-stone-500">%</span>
            </div>
            <div className="text-[10px] text-stone-500 mt-0.5 font-mono">متوسط الكثافة</div>
          </div>
          <div className="p-3.5 rounded-xl border border-stone-800 bg-gradient-to-br from-stone-950 to-black">
            <div className="flex items-center justify-between mb-2">
              <MapPin size={14} className="text-sky-500" />
              <span className="text-[9px] text-stone-500 font-mono tracking-widest uppercase">Streams</span>
            </div>
            <div className="text-2xl font-bold text-stone-100 font-display">{Object.keys(STREAMS).length}</div>
            <div className="text-[10px] text-stone-500 mt-0.5 font-mono">بثوث نشطة</div>
          </div>
          <div className="p-3.5 rounded-xl border border-stone-800 bg-gradient-to-br from-stone-950 to-black">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-[9px] text-stone-500 font-mono tracking-widest uppercase">Alerts</span>
            </div>
            <div className="text-2xl font-bold text-stone-100 font-display">{alerts.length}</div>
            <div className="text-[10px] text-stone-500 mt-0.5 font-mono">تنبيهات نشطة</div>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="rounded-xl border border-amber-900/50 bg-gradient-to-r from-amber-950/40 to-red-950/20 p-3 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={13} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-200 tracking-wider uppercase font-mono">
                Active Alerts · {alerts.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-stone-300 font-arabic">{alert.stream}</span>
                    <span className="text-stone-500">·</span>
                    <span className="text-stone-400 font-arabic">{alert.message}</span>
                  </div>
                  <span className="text-[10px] text-stone-600 font-mono">{formatTime(alert.time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'live' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {Object.values(STREAMS).map(stream => (
                <StreamCard
                  key={stream.id}
                  stream={stream}
                  data={streamData[stream.id]}
                  history={history[stream.id] || []}
                  isPaused={paused[stream.id]}
                  onTogglePause={() => setPaused(p => ({ ...p, [stream.id]: !p[stream.id] }))}
                  onAnalyzeFrame={handleAnalyzeFrame}
                  frameSrc={displayFrames[stream.id]}
                  isLive={apiStatus === 'connected' && !!realFrames[stream.id]}
                />
              ))}
            </div>

            <div className="rounded-xl border border-stone-800 bg-gradient-to-b from-stone-950/80 to-black/80 p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-100 font-display">Density Trends · مقارنة الكثافة</h3>
                  <p className="text-[10px] text-stone-500 mt-0.5 font-mono">آخر {combinedHistory.length} قراءات · فاصل {SAMPLING_INTERVAL_MS/1000} ثانية</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: STREAMS.haram.color }} />
                    <span className="text-stone-400 font-arabic">الحرم</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: STREAMS.arafat.color }} />
                    <span className="text-stone-400 font-arabic">عرفات</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedHistory} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#52525b" fontSize={9} />
                    <YAxis stroke="#52525b" fontSize={9} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '6px', fontSize: '11px' }} labelStyle={{ color: '#a8a29e' }} />
                    <Line type="monotone" dataKey="الحرم" stroke={STREAMS.haram.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="عرفات" stroke={STREAMS.arafat.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <button onClick={() => setView('heatmap')}
              className="w-full p-4 rounded-xl border border-dashed border-amber-800/40 hover:border-amber-600/70 bg-gradient-to-r from-amber-950/10 to-stone-950/20 hover:from-amber-950/20 hover:to-stone-950/30 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-900/30 border border-amber-800/40 group-hover:bg-amber-800/40 transition">
                    <ScanSearch size={16} className="text-amber-300" />
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-display text-stone-200">Deep Heatmap Analysis</div>
                    <div className="text-[10px] text-stone-500 font-mono">تحليل عميق للكثافة على لقطات محددة</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-stone-500 group-hover:text-amber-300 transition" />
              </div>
            </button>
          </div>
        ) : (
          <HeatmapAnalyzer activeImage={activeAnalyzerImage} setActiveImage={setActiveAnalyzerImage} samples={samples} />
        )}

        <footer className="mt-10 pt-5 border-t border-stone-900 flex items-center justify-between flex-wrap gap-3">
          <div className="text-[10px] text-stone-600 font-mono">
            Pipeline: <span className="text-stone-500">YouTube Live → Vercel Serverless → Client CV → Dashboard</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1 h-1 rounded-full bg-amber-500" />
            <span className="text-stone-500 font-mono">crafted by</span>
            <a href="https://www.linkedin.com/in/mahmoudaziz/" target="_blank" rel="noopener noreferrer"
              className="font-display text-lg text-amber-200 hover:text-amber-400 transition-colors underline-offset-2 hover:underline" style={{ letterSpacing: '0.03em' }}>
              Mahmoud AbdelAziz
            </a>
            <div className="w-1 h-1 rounded-full bg-amber-500" />
          </div>
        </footer>
      </main>
    </div>
  );
}
