import React, { useCallback,useState,useRef } from 'react';
import usePdfEditor from './hooks/usePdfEditor';
import Toolbar from './components/Toolbar';
import PdfViewer from './components/PdfViewer';
import { exportWithAnnotations } from './utils/exportPdf';
import './App.css';

function App() {
  const state = usePdfEditor();
  const {ann, loadFile } = state;

    const pdfBytesRef = useRef(null);

  // const [fileName, setFileName] = useState(null);

const handleOpen = useCallback(async (file) => {
  if (!file) return;
  const bytes = await loadFile(file);
    // pdfBytesRef.current = bytes;  // ✅ store globally in ref

     pdfBytesRef.current = new Uint8Array(bytes);
    console.log("Opened PDF length:", pdfBytesRef.current?.length);
}, [loadFile]);


  const handleSave = useCallback(async () => {
  if (!pdfBytesRef.current) return;

  // Clone the buffer to avoid "detached ArrayBuffer" errors
  const bytesCopy = pdfBytesRef.current;

  const blob = await exportWithAnnotations(bytesCopy, ann);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.fileName || 'annotated'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}, [ann, state.fileName]);


  return (
    <div className="app">
      <Toolbar state={state} onOpen={handleOpen} onSave={handleSave} />
      <PdfViewer state={state} />
    </div>
  );
}

export default App;
