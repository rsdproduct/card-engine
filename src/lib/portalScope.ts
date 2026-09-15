import type {
  PortalId,
  PortalPreset,
  PortalScopeItem,
} from "@/types/cardEngine";
import { portalThemes } from "@/data/portalThemes";

export const ALL_PORTAL_IDS: PortalId[] = [
  "mpr",
  "rna",
  "zeti",
  "monster",
  "boldpro",
];

export const PORTAL_PRESETS: PortalPreset[] = [
  "ALL",
  "CAREER_DOCS",
  "JOB_PORTALS",
  "BOLD_PRO",
];

export const PRESET_LABELS: Record<PortalPreset, string> = {
  ALL: "All Portals",
  CAREER_DOCS: "All Career Doc Sites",
  JOB_PORTALS: "Job Portals",
  BOLD_PRO: "Bold.pro",
};

/** Preset → concrete portal IDs */
export const PRESET_PORTALS: Record<PortalPreset, PortalId[]> = {
  ALL: [...ALL_PORTAL_IDS],
  CAREER_DOCS: ["mpr", "rna", "zeti"],
  JOB_PORTALS: ["monster"],
  BOLD_PRO: ["boldpro"],
};

export function isPortalPreset(item: PortalScopeItem): item is PortalPreset {
  return (
    item === "ALL" ||
    item === "CAREER_DOCS" ||
    item === "JOB_PORTALS" ||
    item === "BOLD_PRO"
  );
}

export function isPortalId(item: PortalScopeItem): item is PortalId {
  return ALL_PORTAL_IDS.includes(item as PortalId);
}

/** Expand scope entries into the set of concrete portal IDs they cover. */
export function expandPortalScope(scope: PortalScopeItem[]): Set<PortalId> {
  const out = new Set<PortalId>();
  for (const item of scope) {
    if (isPortalPreset(item)) {
      for (const id of PRESET_PORTALS[item]) out.add(id);
    } else if (isPortalId(item)) {
      out.add(item);
    }
  }
  return out;
}

/** True when the active portal is covered by the card's portalScope. */
export function portalScopeMatches(
  scope: PortalScopeItem[] | undefined,
  activePortal: PortalId,
): boolean {
  if (!scope || scope.length === 0) return true;
  if (scope.includes("ALL")) return true;
  if (scope.includes(activePortal)) return true;
  for (const item of scope) {
    if (isPortalPreset(item) && PRESET_PORTALS[item].includes(activePortal)) {
      return true;
    }
  }
  return false;
}

export function resolveTargetPortalIds(scope: PortalScopeItem[]): PortalId[] {
  return ALL_PORTAL_IDS.filter((id) => expandPortalScope(scope).has(id));
}

export function formatPortalScopeSummary(scope: PortalScopeItem[]): string {
  if (!scope.length || scope.includes("ALL")) {
    return `Targeting ${ALL_PORTAL_IDS.length} of ${ALL_PORTAL_IDS.length} Portals: All`;
  }
  const ids = resolveTargetPortalIds(scope);
  const names = ids.map((id) => portalThemes[id]?.shortName ?? id).join(", ");
  return `Targeting ${ids.length} of ${ALL_PORTAL_IDS.length} Portals: ${names}`;
}

/** Normalize legacy `all` / lowercase tokens into PortalScopeItem[]. */
export function normalizePortalScope(
  raw: Array<string | PortalScopeItem> | undefined,
): PortalScopeItem[] {
  if (!raw || raw.length === 0) return ["ALL"];
  const out: PortalScopeItem[] = [];
  for (const item of raw) {
    if (item === "all" || item === "ALL") {
      out.push("ALL");
      continue;
    }
    if (
      item === "CAREER_DOCS" ||
      item === "JOB_PORTALS" ||
      item === "BOLD_PRO"
    ) {
      out.push(item);
      continue;
    }
    if (ALL_PORTAL_IDS.includes(item as PortalId)) {
      out.push(item as PortalId);
    }
  }
  return out.length ? out : ["ALL"];
}
