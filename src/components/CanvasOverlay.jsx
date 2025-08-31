import React, { useEffect, useRef, useState } from 'react';
import { Tool } from '../hooks/usePdfEditor';

export default function CanvasOverlay({ width, height, scale, tool, color, stroke, opacity, items, onAdd, eraserSize = 20 }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(null);

  useEffect(() => {
    const c = canvasRef.current;
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

    const drawItem = (it) => {
      if (it.type === 'pen') {
        ctx.lineWidth = it.stroke;
        ctx.strokeStyle = it.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        it.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }

      if (it.type === 'eraser') {
  ctx.fillStyle = '#ffffff'; // white
  const size = it.size || 20;
  it.points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}



      if (it.type === 'rect' || it.type === 'highlight') {
        const x = Math.min(it.start.x, it.end.x);
        const y = Math.min(it.start.y, it.end.y);
        const w = Math.abs(it.end.x - it.start.x);
        const h = Math.abs(it.end.y - it.start.y);
        ctx.lineWidth = it.stroke;
        ctx.strokeStyle = it.color;
        ctx.fillStyle = it.color;
        ctx.globalAlpha = it.type === 'highlight' ? (it.opacity ?? 0.25) : 0.15;
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 1;
        if (it.type === 'rect') ctx.strokeRect(x, y, w, h);
      }

      if (it.type === 'text') {
        ctx.fillStyle = it.color;
        ctx.font = `${it.size || 14}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(it.value || '', it.position.x, it.position.y);
      }
    };

    items.forEach(drawItem);
    if (drawing) drawItem(drawing);
  }, [items, drawing, width, height]);

  const toPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const onDown = (e) => {
    const p = toPoint(e);
    if (tool === Tool.PEN) {
      setDrawing({ type: 'pen', color, stroke, points: [p] });
    } else if (tool === Tool.RECT || tool === Tool.HIGHLIGHT) {
      setDrawing({ type: tool === Tool.RECT ? 'rect' : 'highlight', color, stroke, opacity, start: p, end: p });
    } else if (tool === Tool.ERASER) {
      setDrawing({ type: 'eraser', points: [p], size: eraserSize });
    } else if (tool === Tool.TEXT) {
      const value = prompt('Enter text:');
      if (value) onAdd({ type: 'text', color, size: 16, value, position: p });
    }
  };

  const onMove = (e) => {
    if (!drawing) return;
    const p = toPoint(e);
    if (drawing.type === 'pen' || drawing.type === 'eraser') {
      setDrawing(d => ({ ...d, points: [...d.points, p] }));
    } else if (drawing.type === 'rect' || drawing.type === 'highlight') {
      setDrawing(d => ({ ...d, end: p }));
    }
  };

  const onUp = () => {
    if (drawing) { onAdd(drawing); setDrawing(null); }
  };

  return (
    <canvas
      ref={canvasRef}
      className="canvas"
      style={{ width, height}}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    />
  );
}
