import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

function hexToRgb(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return rgb(0, 0, 0);
  return rgb(
    parseInt(m[1], 16) / 255,
    parseInt(m[2], 16) / 255,
    parseInt(m[3], 16) / 255
  );
}

export async function exportWithAnnotations(originalBytes, ann) {
  try {
    // 🔒 Always clone to a safe copy
    let bytes;
    if (originalBytes instanceof ArrayBuffer) {
      bytes = new Uint8Array(originalBytes.slice(0));
    } else if (originalBytes instanceof Uint8Array) {
      bytes = new Uint8Array(originalBytes); // full clone
    } else {
      throw new Error("Invalid PDF input: expected ArrayBuffer or Uint8Array");
    }

    // ✅ Load from safe copy
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageCount = pdfDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      const items = ann[i] || [];

      items.forEach(item => {
        if (item.type === 'pen') {
          const color = hexToRgb(item.color);
          const pts = item.points;
          if (pts.length < 2) return;
          for (let k = 1; k < pts.length; k++) {
            const a = pts[k - 1], b = pts[k];
            page.drawLine({
              start: { x: a.x, y: height - a.y },
              end: { x: b.x, y: height - b.y },
              thickness: item.stroke,
              color
            });
          }
        }

        if (item.type === 'eraser') {
          const size = item.size || 20; // eraser thickness
          const pts = item.points;
          if (pts.length === 0) return;
          pts.forEach(p => {
            page.drawCircle({
              x: p.x,
              y: height - p.y,
              size: size / 2,        // radius
              color: rgb(1, 1, 1),   // white fill
            });
          });
        }




        if (item.type === 'rect' || item.type === 'highlight') {
          const color = hexToRgb(item.color);
          const x = Math.min(item.start.x, item.end.x);
          const y = Math.min(item.start.y, item.end.y);
          const w = Math.abs(item.end.x - item.start.x);
          const h = Math.abs(item.end.y - item.start.y);
          page.drawRectangle({
            x,
            y: height - y - h,
            width: w,
            height: h,
            borderColor: color,
            borderWidth: item.type === 'rect' ? item.stroke : 0,
            color: color,
            opacity: item.type === 'highlight' ? item.opacity ?? 0.25 : 0.15
          });
        }

        if (item.type === 'text') {
          const color = hexToRgb(item.color);
          const size = item.size || 14;
          page.drawText(item.value || '', {
            x: item.position.x,
            y: height - item.position.y,
            size,
            font,
            color,
            rotate: degrees(0)
          });
        }
      });
    }

    // 🔒 Save to new ArrayBuffer
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });

    // ✅ Always return fresh Blob
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (err) {
    console.error("❌ PDF Export failed:", err);
    throw err;
  }
}