import React, { useEffect, useMemo, useRef, useState } from 'react';
import CanvasOverlay from './CanvasOverlay';
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";


pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;



export default function PdfViewer({ state }) {
  const { pdfBytes, pageIndex, setPageCount, scale, pageAnn, tool, color, stroke, opacity, push } = state;
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const wrapRef = useRef(null);
  const [pageRef, setPageRef] = useState(null);

  const file = useMemo(() => {
    if (!pdfBytes) return null;
    return { data: pdfBytes };
  }, [pdfBytes]);

  useEffect(() => {
    wrapRef.current?.scrollTo?.({ top: 0 });
  }, [pageIndex]);

  return (
    <div className="viewer" ref={wrapRef}>
      {file ? (
        <div className="pageWrap" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
          <Document file={file} onLoadSuccess={({ numPages }) => setPageCount(numPages)}>
            <Page
              pageNumber={pageIndex + 1}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              onRenderSuccess={(p) =>
                setPageSize({ width: p.originalWidth, height: p.originalHeight })
              }
              onLoadSuccess={(page) => {
                console.log("PDF.js Page loaded ✅", page);
                setPageRef(page); // 🔥 store page object in state
              }}
            />

          </Document>
          {pageSize.width > 0 && (
            <CanvasOverlay
              width={pageSize.width}
              height={pageSize.height}
              scale={scale}
              tool={tool}
              color={color}
              stroke={stroke}
              opacity={opacity}
              items={pageAnn}
              onAdd={push}
              pageRef={pageRef}
            />
          )}
        </div>
      ) : (
        <p style={{ color: '#9aa4b2' }}>Open a PDF to start editing…</p>
      )}
    </div>
  );
}
