import { Logo } from "./Logo";

/**
 * Shared hero header for every page — logo centered above everything,
 * "בס"ד" pinned to the physical right underneath it (same size/color as the
 * optional title line below). See CLAUDE.md for the sizing rules.
 */
export function PageHeader({ title }: { title?: string }) {
  return (
    <div className="flex flex-col gap-2 pt-4 pb-2">
      <div className="flex justify-center">
        <Logo height={160} padding={16} />
      </div>
      <p className="text-neon-ice text-right font-medium">בס&quot;ד</p>
      {title && <p className="text-neon-ice text-center font-medium">{title}</p>}
    </div>
  );
}
