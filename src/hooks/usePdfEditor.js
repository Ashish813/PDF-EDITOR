import { useCallback,useEffect,useRef, useState } from 'react';

export const Tool = {
  SELECT: 'select',
  PEN: 'pen',
  RECT: 'rect',
  ERASER: 'eraser',
  TEXT: 'text',
  HIGHLIGHT: 'highlight'
};

export default function usePdfEditor() {
  const [fileName, setFileName] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null); // Uint8Array
  const [numPages, setNumPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [color, setColor] = useState('#ff5252');
  const [stroke, setStroke] = useState(2);
  const [opacity, setOpacity] = useState(0.25);
  const [tool, setTool] = useState(Tool.PEN);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });


  const [ann, setAnn] = useState({});
  const undoStacks = useRef({});
  const redoStacks = useRef({});

  const pageAnn = ann[pageIndex] || [];



    useEffect(() => {
    if (pdfBytes) {
      console.log("✅ pdfBytes length:", pdfBytes.length);
    } else {
      console.log("⚠️ pdfBytes is null");
    }
  }, [pdfBytes]);

  const push = useCallback((a) => {
    setAnn((prev) => {
      const list = (prev[pageIndex] || []).slice();
      list.push(a);
      const next = { ...prev, [pageIndex]: list };
      undoStacks.current[pageIndex] = [...(undoStacks.current[pageIndex] || []), a];
      redoStacks.current[pageIndex] = [];
      return next;
    });
  }, [pageIndex]);

  const undo = useCallback(() => {
    const list = ann[pageIndex] || [];
    if (!list.length) return;
    const last = list[list.length - 1];
    undoStacks.current[pageIndex] = list.slice(0, -1);
    redoStacks.current[pageIndex] = [...(redoStacks.current[pageIndex] || []), last];
    setAnn((prev) => ({ ...prev, [pageIndex]: prev[pageIndex].slice(0, -1) }));
  }, [ann, pageIndex]);

  const redo = useCallback(() => {
    const stack = redoStacks.current[pageIndex] || [];
    if (!stack.length) return;
    const item = stack[stack.length - 1];
    redoStacks.current[pageIndex] = stack.slice(0, -1);
    setAnn((prev) => ({ ...prev, [pageIndex]: [...(prev[pageIndex] || []), item] }));
  }, [pageIndex]);

  const clearPage = useCallback(() => {
    setAnn((prev) => ({ ...prev, [pageIndex]: [] }));
    undoStacks.current[pageIndex] = [];
    redoStacks.current[pageIndex] = [];
  }, [pageIndex]);


//   const loadFile = useCallback(async (file) => {
//   let bytes;

//   if (file instanceof File || file instanceof Blob) {
//     // Case: user selected from <input type="file">
//     bytes = new Uint8Array(await file.arrayBuffer());
//     setFileName(file.name.replace(/\.pdf$/i, '') || 'document');
//   } else if (file instanceof ArrayBuffer) {
//     // Case: already ArrayBuffer
//     bytes = new Uint8Array(file);
//     setFileName('document');
//   } else if (file instanceof Uint8Array) {
//     // Case: already Uint8Array
//     bytes = file;
//     setFileName('document');
//   } else {
//     console.error("❌ loadFile got unsupported type:", file);
//     return;
//   }

//   setPdfBytes(bytes);
//   setPageIndex(0);
//   setAnn({});
//   undoStacks.current = {};
//   redoStacks.current = {};
// }, []);




const loadFile = useCallback(async (file) => {
  let bytes;

  if (file instanceof File || file instanceof Blob) {
    bytes = new Uint8Array(await file.arrayBuffer());
    setFileName(file.name.replace(/\.pdf$/i, '') || 'document');
  } else if (file instanceof ArrayBuffer) {
    bytes = new Uint8Array(file);
    setFileName('document');
  } else if (file instanceof Uint8Array) {
    bytes = file;
    setFileName('document');
  } else {
    console.error("❌ loadFile got unsupported type:", file);
    return null;
  }

  setPdfBytes(bytes);
  setPageIndex(0);
  setAnn({});
  undoStacks.current = {};
  redoStacks.current = {};

  return bytes;   // ✅ return bytes for immediate usage
}, []);

  const zoomIn = () => setScale(s => Math.min(3, +(s + 0.1).toFixed(2)));
  const zoomOut = () => setScale(s => Math.max(0.5, +(s - 0.1).toFixed(2)));
  const setPageCount = useCallback((n) => setNumPages(n), []);

  return {
    fileName, pdfBytes, numPages, pageIndex, scale, color, stroke, opacity, tool, pageAnn, ann,
    setPageIndex, setScale, setColor, setStroke, setTool, setOpacity, setPageCount,
    push, undo, redo, clearPage, loadFile, zoomIn, zoomOut,
  };
}
