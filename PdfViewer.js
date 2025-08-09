// src/PdfViewer.js
import React, { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Set the worker source path for pdfjs to enable PDF parsing in a separate thread
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

export default function PdfViewer({ file }) {
  // Reference to the canvas element where PDF page will be rendered
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!file) return; // If no file provided, do nothing

    // Async function to load and render the PDF page
    const renderPdf = async () => {
      // Convert the file Blob to an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Load the PDF document from the ArrayBuffer data
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Get the first page of the PDF
      const page = await pdf.getPage(1);

      // Define viewport with scale for rendering (1.5 means 150% zoom)
      const viewport = page.getViewport({ scale: 1.5 });

      // Get the canvas and its drawing context
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Set canvas dimensions to match the viewport size
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Prepare rendering context with canvas and viewport
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      // Render the PDF page into the canvas
      await page.render(renderContext).promise;
    };

    renderPdf();
  }, [file]); // Re-run effect whenever the `file` prop changes

  // Render the canvas inside a bordered container with some spacing
  return (
    <div style={{ border: "1px solid #ccc", marginTop: 20, padding: 10 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
