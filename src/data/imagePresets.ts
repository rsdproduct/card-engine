import type { FeedCard, ImagePreset } from "@/types/cardEngine";

export const HEADER_IMAGE_PRESETS: ImagePreset[] = [
  {
    id: "desk-resume",
    label: "Desk · Resume review",
    url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "interview",
    label: "Interview · Handshake",
    url: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "laptop-city",
    label: "Laptop · City career",
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "team-collab",
    label: "Team · Collaboration",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "skyline",
    label: "Skyline · Ambition",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "gradient-teal",
    label: "Gradient · Teal (no photo)",
    url: "",
  },
];

export function resolveHeaderImage(url?: string): string | null {
  if (!url) return null;
  return url;
}

export const GRADIENT_FALLBACK =
  "linear-gradient(135deg, #0F2537 0%, #00A88F 55%, #5EEAD4 100%)";
