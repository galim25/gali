/**
 * Top brand banner for the light customer theme (2026-07-26) — replaces the
 * old bottom BrandFooter (cream→teal gradient, boxed logo built from the old
 * `Logo`/`logo.svg` asset). Same treatment as /admin's AdminBrandHero: moved
 * to the top of the page, gradient flipped (teal at the outer/top edge
 * fading down into cream, blending into the page's own cream background
 * where the rest of the content begins), no bordered/boxed backing behind
 * the logo, and — per explicit request — now uses the exact same new
 * `/logo-cropped.svg` asset as /admin instead of the old customer-only
 * `logo.svg` (which, along with the now-unused `Logo.tsx` component, was
 * deleted). Rendered right after `<BsdBar/>`, before the page's own
 * heading/content. `-mx-6` full-bleeds it edge to edge; no `-mt-6` needed
 * since BsdBar already owns the top edge.
 */
export function BrandHero() {
  return (
    <div className="from-barber-teal/50 -mx-6 flex flex-col items-center bg-gradient-to-b to-cream px-6 pt-10 pb-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-cropped.svg" alt="Yossi Barber" height={90} style={{ height: 90, width: "auto" }} />
    </div>
  );
}
