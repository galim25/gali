/**
 * Brand rules (CLAUDE.md): never distort proportions, no shadows, minimum
 * surrounding space is half the logo's own height, minimum rendered height
 * is 24px. `height` controls size; width is intentionally never set so the
 * image's natural aspect ratio decides it.
 */
export function Logo({
  height = 64,
  padding,
  className = "",
}: {
  height?: number;
  /** Overrides the default minimum spacing (half the height) — still exploratory, see CLAUDE.md before relying on a smaller value elsewhere. */
  padding?: number;
  className?: string;
}) {
  const size = Math.max(height, 24);
  return (
    <span className={`inline-block ${className}`} style={{ padding: padding ?? size / 2 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="BarberBook" height={size} style={{ height: size, width: "auto" }} />
    </span>
  );
}
