/**
 * "בס"ד" — קבוע בראש כל מסך לקוח, נשאר גלוי גם בגלילה (2026-07-24).
 * `-mx-6 -mt-6` שובר את ה-`p-6` של ה-`<main>` כדי להיצמד לרוחב וגובה מלאים.
 */
export function BsdBar() {
  return (
    <div className="bg-cream/95 border-barber-teal/15 text-barber-teal sticky top-0 z-20 -mx-6 -mt-6 border-b py-1.5 text-center text-xs font-medium backdrop-blur-sm">
      בס&quot;ד
    </div>
  );
}
