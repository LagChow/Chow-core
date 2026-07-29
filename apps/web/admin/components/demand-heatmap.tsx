"use client";

import React, { useEffect, useRef, useState } from 'react';

export function DemandHeatmap({ ordersData }: { ordersData: { lat: number; lng: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2; // retina
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const W = rect.width;
    const H = rect.height;

    // Map bounds (UNILAG area)
    const bounds = {
      minLat: 6.505,
      maxLat: 6.530,
      minLng: 3.380,
      maxLng: 3.410,
    };

    // Convert lat/lng to pixel coordinates
    const toPixel = (lat: number, lng: number) => {
      const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * W;
      const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * H;
      return { x, y };
    };

    // Draw dark background
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, W, H);

    // Draw grid lines for visual reference
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo((W / 20) * i, 0);
      ctx.lineTo((W / 20) * i, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (H / 20) * i);
      ctx.lineTo(W, (H / 20) * i);
      ctx.stroke();
    }

    // Draw heatmap using radial gradients
    // First pass: accumulate heat on an offscreen canvas
    const heatCanvas = document.createElement('canvas');
    heatCanvas.width = canvas.width;
    heatCanvas.height = canvas.height;
    const heatCtx = heatCanvas.getContext('2d')!;
    heatCtx.scale(2, 2);

    ordersData.forEach((point) => {
      const { x, y } = toPixel(point.lat, point.lng);
      const radius = 25;

      const gradient = heatCtx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255, 100, 50, 0.15)');
      gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');

      heatCtx.fillStyle = gradient;
      heatCtx.beginPath();
      heatCtx.arc(x, y, radius, 0, Math.PI * 2);
      heatCtx.fill();
    });

    // Colorize the heat
    const imageData = heatCtx.getImageData(0, 0, heatCanvas.width, heatCanvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha > 0) {
        const intensity = alpha / 255;
        
        if (intensity > 0.6) {
          // Hot: bright red/white
          pixels[i] = 255;
          pixels[i + 1] = Math.floor(80 * (1 - intensity));
          pixels[i + 2] = Math.floor(30 * (1 - intensity));
          pixels[i + 3] = Math.min(255, Math.floor(alpha * 3));
        } else if (intensity > 0.3) {
          // Warm: orange/yellow
          pixels[i] = 255;
          pixels[i + 1] = Math.floor(140 + 80 * intensity);
          pixels[i + 2] = 40;
          pixels[i + 3] = Math.min(255, Math.floor(alpha * 2.5));
        } else if (intensity > 0.1) {
          // Cool: blue/cyan
          pixels[i] = Math.floor(50 + 150 * intensity);
          pixels[i + 1] = Math.floor(120 + 100 * intensity);
          pixels[i + 2] = 220;
          pixels[i + 3] = Math.min(255, Math.floor(alpha * 2));
        }
      }
    }

    heatCtx.putImageData(imageData, 0, 0);

    // Draw the heat onto main canvas
    ctx.drawImage(heatCanvas, 0, 0, W, H);

    // Draw road-like lines for context
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    // Horizontal road
    ctx.beginPath();
    ctx.moveTo(0, H * 0.45);
    ctx.lineTo(W, H * 0.45);
    ctx.stroke();
    // Vertical road
    ctx.beginPath();
    ctx.moveTo(W * 0.55, 0);
    ctx.lineTo(W * 0.55, H);
    ctx.stroke();
    // Diagonal road
    ctx.beginPath();
    ctx.moveTo(0, H * 0.7);
    ctx.lineTo(W * 0.8, 0);
    ctx.stroke();

    // Label the hotspots
    const labels = [
      { name: 'Moremi Hall', lat: 6.5140, lng: 3.3900 },
      { name: 'Main Library', lat: 6.5170, lng: 3.3980 },
      { name: 'Staff Quarters', lat: 6.5200, lng: 3.3920 },
    ];

    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label) => {
      const { x, y } = toPixel(label.lat, label.lng);
      
      // Background pill
      const textWidth = ctx.measureText(label.name).width;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.roundRect(x - textWidth / 2 - 8, y - 22, textWidth + 16, 20, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(label.name, x, y - 9);

      // Dot
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8888';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    setLoaded(true);
  }, [ordersData]);

  return (
    <div style={{ width: '100%', height: '500px', position: 'relative', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}>
          Loading Heatmap...
        </div>
      )}
    </div>
  );
}
