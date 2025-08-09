import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import "./editor.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const Size = Quill.import("formats/size");
Size.whitelist = [
  "10px",
  "12px",
  "14px",
  "16px",
  "18px",
  "24px",
  "32px",
  "48px",
  "64px",
  "72px",
  "96px",
  "128px",
];

const Header = Quill.import("formats/header");
Header.whitelist = [1, 2, 3, 4, 5, 6];
Quill.register(Header, true);
Quill.register(Size, true);

const Font = Quill.import("formats/font");
Font.whitelist = [
  "arial",
  "comic-sans-ms",
  "courier-new",
  "georgia",
  "helvetica",
  "lucida",
  "times-new-roman",
  "trebuchet-ms",
  "verdana",
];
Quill.register(Font, true);

const TOOLBAR_OPTIONS = [
  [{ font: Font.whitelist }],
  [{ size: Size.whitelist }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ["blockquote", "code-block"],
  [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  [{ align: [] }],
  ["link", "image", "video"],
  ["clean"],
];

const SAVE_INTERVAL_MS = 2000;

export default function Editor({ documentId }) {
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);
  const wrapperRef = useRef(null);
  const quillRef = useRef(null);

  const handlePDFUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please select a valid PDF file");
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async function () {
      const typedarray = new Uint8Array(this.result);

      try {
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let fullText = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          let lastY = null;
          let pageLines = [];
          let line = "";

          textContent.items.forEach((item, index) => {
            const currentY = item.transform[5];
            if (lastY !== null && Math.abs(currentY - lastY) > 5) {
              pageLines.push(line.trim());
              line = "";
            }
            line += item.str + " ";
            lastY = currentY;
            if (index === textContent.items.length - 1) {
              pageLines.push(line.trim());
            }
          });

          const pageText = pageLines.join("\n");
          const safeText = pageText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          fullText += safeText + `\n\n--- Page ${pageNum} ---\n\n`;
        }

        quillRef.current.setText(fullText);
      } catch (error) {
        console.error("Error extracting PDF text:", error);
        alert("Failed to extract PDF text");
      }
    };

    fileReader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;

    wrapperRef.current.innerHTML = "";
    const editorDiv = document.createElement("div");
    editorDiv.style.height = "500px";
    editorDiv.style.paddingTop = "10px";
    wrapperRef.current.appendChild(editorDiv);

    const q = new Quill(editorDiv, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
        history: {
          delay: 2000,
          maxStack: 500,
          userOnly: true,
        },
      },
      placeholder: "Start writing your document...",
    });

    quillRef.current = q;
    setQuill(q);

    const toolbarContainer = q.getModule("toolbar").container;

    // === PDF Upload Button ===
    const existingPdfButtons = toolbarContainer.querySelectorAll("button.ql-pdf-upload");
    if (existingPdfButtons.length === 0) {
      const pdfInput = document.createElement("input");
      pdfInput.type = "file";
      pdfInput.accept = "application/pdf";
      pdfInput.style.display = "none";

      const pdfButton = document.createElement("button");
      pdfButton.type = "button";
      pdfButton.className = "ql-pdf-upload";
      pdfButton.title = "Upload PDF";
      pdfButton.innerHTML = "📄 ";
      pdfButton.style.marginLeft = "8px";

      pdfButton.onclick = () => pdfInput.click();
      toolbarContainer.appendChild(pdfButton);
      toolbarContainer.appendChild(pdfInput);
      pdfInput.addEventListener("change", handlePDFUpload);
    }

    // === Save Button ===
    const existingSaveButtons = toolbarContainer.querySelectorAll("button.ql-save");
    if (existingSaveButtons.length === 0) {
      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = "ql-save";
      saveButton.title = "Save Document";
      saveButton.innerHTML = "💾";
      saveButton.style.marginLeft = "8px";

      saveButton.onclick = () => {
        const currentQuill = quillRef.current;
        if (!currentQuill) {
          alert("Editor is not ready yet.");
          return;
        }

        const text = currentQuill.getText();
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "document.txt";
        a.click();

        URL.revokeObjectURL(url);
      };

      toolbarContainer.appendChild(saveButton);

      // === Export as PDF Button === (insert right after Save button)
      if (!toolbarContainer.querySelector("button.ql-export-pdf")) {
        const exportPdfButton = document.createElement("button");
        exportPdfButton.type = "button";
        exportPdfButton.className = "ql-export-pdf";
        exportPdfButton.title = "Export as PDF";
        exportPdfButton.innerHTML = "📥";
        exportPdfButton.style.marginLeft = "8px";

        exportPdfButton.onclick = () => {
          const currentQuill = quillRef.current;
          if (!currentQuill) {
            alert("Editor is not ready yet.");
            return;
          }

          const text = currentQuill.getText();

          import("jspdf")
            .then(({ jsPDF }) => {
              const doc = new jsPDF();
              const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
              const margin = 10;
              const maxLineWidth = doc.internal.pageSize.width - margin * 2;
              const lineHeight = 10;

              let y = margin;

              const splitText = doc.splitTextToSize(text, maxLineWidth);

              splitText.forEach((line) => {
                if (y + lineHeight > pageHeight - margin) {
                  doc.addPage();
                  y = margin;
                }
                doc.text(line, margin, y);
                y += lineHeight;
              });

              doc.save("document.pdf");
            })
            .catch((err) => {
              console.error("Failed to load jsPDF library", err);
              alert("Export as PDF failed");
            });
        };

        saveButton.insertAdjacentElement("afterend", exportPdfButton);
      }
    }

    // Clean duplicate PDF buttons
    const pdfButtons = toolbarContainer.querySelectorAll("button.ql-pdf-upload");
    if (pdfButtons.length > 1) {
      pdfButtons.forEach((btn, index) => {
        if (index !== 0) btn.remove();
      });
    }
  }, []);

  useEffect(() => {
    if (!socket || !quill) return;

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit("get-document", documentId);

    const textChangeHandler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", textChangeHandler);
    socket.on("receive-changes", (delta) => {
      quill.updateContents(delta);
    });

    return () => {
      quill.off("text-change", textChangeHandler);
      socket.off("receive-changes");
    };
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (!socket || !quill) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [socket, quill]);

  return (
    <div
      ref={wrapperRef}
      style={{
        border: "1px solid #ccc",
        borderRadius: 4,
        marginTop: 10,
        backgroundColor: "white",
        padding: 10,
        height: "600px",
        overflowY: "auto",
      }}
    />
  );
}
