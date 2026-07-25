import { BsdBar } from "./BsdBar";

/**
 * Shared header for every /admin page — reuses the same BsdBar the customer
 * pages use. Renders as a fragment (not a wrapping div) so BsdBar's
 * `-mx-6 -mt-6` full-bleed trick still works when PageHeader is the first
 * child of the page's <main>. The logo lives in a top banner (`AdminBrandHero`,
 * 2026-07-26) passed in via the optional `topBanner` slot, rendered between
 * BsdBar and the title — every /admin page passes one now.
 */
export function PageHeader({ title, topBanner }: { title?: string; topBanner?: React.ReactNode }) {
  return (
    <>
      <BsdBar />
      {topBanner}
      {title && <h1 className="text-barber-teal mt-6 mb-4 text-center text-3xl font-bold">{title}</h1>}
    </>
  );
}
