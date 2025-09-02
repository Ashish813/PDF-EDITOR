import React, { useEffect, useRef, useState } from 'react';
import { Tool } from '../hooks/usePdfEditor';

import { pdfjs } from "react-pdf";  // ya direct pdfjs-dist
// pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

// const pdf = await pdfjs.getDocument("file.pdf").promise;
// const page = await pdf.getPage(1); // page 1

export default function CanvasOverlay({ width, height, scale, tool, color, stroke, opacity, items, onAdd,pageRef,eraserSize = 20 }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(null);
  const [selection, setSelection] = useState(null);


// const checkSelection = (sel) => {
//   const x1 = Math.min(sel.start.x, sel.end.x);
//   const y1 = Math.min(sel.start.y, sel.end.y);
//   const x2 = Math.max(sel.start.x, sel.end.x);
//   const y2 = Math.max(sel.start.y, sel.end.y);

//   const ctx = canvasRef.current.getContext("2d");

//   const selectedTexts = items.filter((it) => {
//     if (it.type !== "text") return false;
//     ctx.font = `${it.size || 14}px sans-serif`;
//     const textWidth = ctx.measureText(it.value).width;
//     const textHeight = it.size || 14;

//     const tx1 = it.position.x;
//     const ty1 = it.position.y;
//     const tx2 = tx1 + textWidth;
//     const ty2 = ty1 + textHeight;

//     // ✅ check overlap instead of strict containment
//     const overlap =
//       x1 < tx2 &&
//       x2 > tx1 &&
//       y1 < ty2 &&
//       y2 > ty1;

//     return overlap;
//   });

//   if (selectedTexts.length > 0) {
//     alert("Selected texts: " + selectedTexts.map((t) => t.value).join(", "));
//   } else {
//     alert("No text selected");
//   }
// };




const checkPdfTextSelection = async (sel) => {
  const x1 = Math.min(sel.start.x, sel.end.x);
  const y1 = Math.min(sel.start.y, sel.end.y);
  const x2 = Math.max(sel.start.x, sel.end.x);
  const y2 = Math.max(sel.start.y, sel.end.y);

  const viewport = pageRef.getViewport({ scale: 1 }); 
  const pageHeight = viewport.height;

  const textContent = await pageRef.getTextContent(); // PDF.js API
  const selected = [];

  textContent.items.forEach((item) => {
    const tx1 = item.transform[4];
    const ty1 = item.transform[5];
    let ry1=pageHeight - y1; 
    let ry2=pageHeight - y2; 
    const textWidth = item.width;
    const textHeight = item.height || 12;

    const tx2 = tx1 + textWidth;
    const ty2 = ty1 - textHeight;

    const overlap =
      x1 < tx2 &&
      x2 > tx1 &&
      ry1 > ty1 &&
      ry2 < ty1;

    if (overlap) {
      selected.push(item.str);
    }
  });

  if (selected.length > 0) {
    alert("Selected PDF text: " + selected.join(" "));
  } else {
    alert("No PDF text found in selection");
  }
};




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

  // Draw all saved items
  items.forEach(drawItem);

  // Draw currently drawing item (pen / rect etc.)
  if (drawing) drawItem(drawing);

  // ✅ Draw selection rectangle if present
  if (selection) {
    const x = Math.min(selection.start.x, selection.end.x);
    const y = Math.min(selection.start.y, selection.end.y);
    const w = Math.abs(selection.end.x - selection.start.x);
    const h = Math.abs(selection.end.y - selection.start.y);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }
}, [items, drawing, width, height, selection]);


  const toPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const onDown = (e) => {
    const p = toPoint(e);
    if (tool === Tool.SELECT) {
      setSelection({ start: p, end: p });
    } else if (tool === Tool.PEN) {
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
  const p = toPoint(e);
  if (selection) {
    setSelection((sel) => ({ ...sel, end: p }));
  } else if (drawing) {
    if (drawing.type === "pen" || drawing.type === "eraser") {
      setDrawing((d) => ({ ...d, points: [...d.points, p] }));
    } else if (drawing.type === "rect" || drawing.type === "highlight") {
      setDrawing((d) => ({ ...d, end: p }));
    }
  }
};
const onUp = () => {
  if (selection) {
    checkPdfTextSelection(selection);
    setSelection(null);
  }
  if (drawing) {
    onAdd(drawing);
    setDrawing(null);
  }
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
