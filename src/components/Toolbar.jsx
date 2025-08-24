import React, { useRef } from 'react';
import { Tool } from '../hooks/usePdfEditor';

export default function Toolbar({ state, onOpen, onSave }) {
  const fileRef = useRef();
  const {
    tool, setTool,
    color, setColor,
    stroke, setStroke,
    opacity, setOpacity,
    zoomIn, zoomOut,
    undo, redo, clearPage,
    pageIndex, numPages, setPageIndex,
    pdfBytes
  } = state;

  return (
    <div className="sidebar">
      <div className="row">
        <button className="btn" onClick={() => fileRef.current.click()}>Open PDF</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) onOpen(f);
            e.target.value = '';
          }}
        />
        <button className="btn" disabled={!pdfBytes} onClick={onSave}>Export PDF</button>
      </div>

      <div className="toolbar">
        <button className={"btn" + (tool === Tool.PEN ? ' active' : '')} onClick={() => setTool(Tool.PEN)}>✏️ Pen</button>
        <button className={"btn" + (tool === Tool.RECT ? ' active' : '')} onClick={() => setTool(Tool.RECT)}>▭ Rect</button>
        <button className={"btn" + (tool === Tool.ERASER ? ' active' : '')} onClick={() => setTool(Tool.ERASER)}>🧽 Eraser</button>
        <button className={"btn" + (tool === Tool.HIGHLIGHT ? ' active' : '')} onClick={() => setTool(Tool.HIGHLIGHT)}>🖍 Highlight</button>
        <button className={"btn" + (tool === Tool.TEXT ? ' active' : '')} onClick={() => setTool(Tool.TEXT)}>🔤 Text</button>
        <button className={"btn" + (tool === Tool.SELECT ? ' active' : '')} onClick={() => setTool(Tool.SELECT)}>🖱 Select</button>

        <div className="row">
          <label>Color</label>
          <input className="color" type="color" value={color} onChange={e => setColor(e.target.value)} />
          <label>Stroke</label>
          <input className="slider" type="range" min="1" max="12" value={stroke} onChange={e => setStroke(+e.target.value)} />
        </div>

        <div className="row">
          <label>Highlight Opacity</label>
          <input className="slider" type="range" step="0.05" min="0.05" max="0.9" value={opacity} onChange={e => setOpacity(+e.target.value)} />
        </div>

        <div className="row">
          <button className="btn" onClick={undo}>↶ Undo</button>
          <button className="btn" onClick={redo}>↷ Redo</button>
          <button className="btn" onClick={clearPage}>🗑 Clear Page</button>
        </div>

        <hr />

        <div className="row scaleRow">
          <button className="btn" onClick={zoomOut}>−</button>
          <span>Zoom</span>
          <button className="btn" onClick={zoomIn}>+</button>
        </div>

        <div className="row">
          <label>Page</label>
          <input className="input" type="range" min="1" max={Math.max(1, numPages)} value={pageIndex + 1} onChange={e => setPageIndex(+e.target.value - 1)} />
          <span className="pageInfo">{numPages ? pageIndex + 1 : 0}/{numPages}</span>
        </div>
      </div>
    </div>
  );
}
