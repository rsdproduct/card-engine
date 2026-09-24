"use client";

import { portalThemes } from "@/data/portalThemes";
import type { PortalId } from "@/types/cardEngine";
import { cn } from "@/lib/utils";

export function PortalBadge({ portalId }: { portalId: PortalId }) {
  const theme = portalThemes[portalId];
  if (!theme) return null;
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white"
      style={{ background: theme.accent }}
      title={theme.name}
    >
      {theme.shortName}
    </span>
  );
}

export function PortalBadgeRow({
  portals,
  className,
}: {
  portals: PortalId[];
  className?: string;
}) {
  if (!portals.length) {
    return <span className="text-xs text-slate-400">None</span>;
  }
  return (
    <span className={cn("inline-flex flex-wrap gap-1", className)}>
      {portals.map((id) => (
        <PortalBadge key={id} portalId={id} />
      ))}
    </span>
  );
}
