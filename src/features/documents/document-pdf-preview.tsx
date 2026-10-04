"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function DocumentPdfPreview({ src, title }: { src: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const renderTasks: Array<{ cancel: () => void }> = [];
    const container = containerRef.current;

    async function renderPdf() {
      if (!container) return;

      try {
        setLoading(true);
        setError("");
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const loadingTask = pdfjs.getDocument({ url: src });
        const pdf = await loadingTask.promise;
        if (cancelled) {
          await loadingTask.destroy();
          return;
        }

        container.replaceChildren();
        const availableWidth = Math.max(container.clientWidth - 32, 320);

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          if (cancelled) break;

          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.min(1.6, availableWidth / baseViewport.width);
          const viewport = page.getViewport({ scale });
          const outputScale = window.devicePixelRatio || 1;
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas indisponibil");

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          canvas.style.maxWidth = "100%";
          canvas.className = "mx-auto block rounded-sm bg-white shadow-sm";
          canvas.setAttribute("aria-label", `${title}, pagina ${pageNumber}`);
          container.appendChild(canvas);

          const task = page.render({
            canvas,
            canvasContext: context,
            viewport,
            transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
          });
          renderTasks.push(task);
          await task.promise;
        }

        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError("Previzualizarea documentului nu a putut fi generată.");
        }
      }
    }

    void renderPdf();

    return () => {
      cancelled = true;
      renderTasks.forEach((task) => task.cancel());
      container?.replaceChildren();
    };
  }, [src, title]);

  return (
    <div className="relative min-h-[620px] bg-[#e8edf3]">
      {loading && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[#eef2f6] text-center">
          <div><LoaderCircle className="mx-auto h-7 w-7 animate-spin text-[#0a91b8]" /><p className="mt-3 text-[10px] font-bold text-slate-500">Se încarcă documentul original...</p></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[#f8fafc] p-8 text-center">
          <div><AlertTriangle className="mx-auto h-7 w-7 text-amber-500" /><p className="mt-3 text-[11px] font-bold text-slate-600">{error}</p><a href={src} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[10px] font-extrabold text-[#0787ad] hover:underline">Deschide fișierul separat</a></div>
        </div>
      )}
      <div ref={containerRef} className="space-y-4 overflow-auto p-4" />
    </div>
  );
}
