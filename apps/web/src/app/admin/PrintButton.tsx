"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded bg-black px-4 py-2 text-white print:hidden"
    >
      הדפסה / שמירה כ-PDF
    </button>
  );
}
