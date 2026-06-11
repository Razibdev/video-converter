export type VariantCategory =
  | "resolution"
  | "aspect"
  | "zoom"
  | "fade"
  | "speed"
  | "flip"
  | "color";

export interface VariantRecipe {
  id: string;
  category: VariantCategory;
  label: string;
  description: string;
  /** Build -vf filter chain; duration in seconds for fade-out timing */
  buildVideoFilter: (durationSec: number) => string;
  outputSuffix: string;
}

function scalePad(w: number, h: number): string {
  return `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`;
}

function zoomCrop(targetW: number, targetH: number, factor: number): string {
  const sw = Math.round(targetW * factor);
  const sh = Math.round(targetH * factor);
  return `scale=${sw}:${sh},crop=${targetW}:${targetH}`;
}

export const VARIANT_RECIPES: VariantRecipe[] = [
  // --- Resolution ---
  {
    id: "res-4k",
    category: "resolution",
    label: "4K — 3840×2160",
    description: "Ultra HD for YouTube",
    buildVideoFilter: () => scalePad(3840, 2160),
    outputSuffix: "4k",
  },
  {
    id: "res-1080p",
    category: "resolution",
    label: "1080p — 1920×1080",
    description: "Standard Full HD",
    buildVideoFilter: () => scalePad(1920, 1080),
    outputSuffix: "1080p",
  },
  {
    id: "res-720p",
    category: "resolution",
    label: "720p — 1280×720",
    description: "HD, smaller file",
    buildVideoFilter: () => scalePad(1280, 720),
    outputSuffix: "720p",
  },
  {
    id: "res-480p",
    category: "resolution",
    label: "480p — 854×480",
    description: "Fast loading / preview",
    buildVideoFilter: () => scalePad(854, 480),
    outputSuffix: "480p",
  },
  {
    id: "res-360p",
    category: "resolution",
    label: "360p — 640×360",
    description: "Very small file size",
    buildVideoFilter: () => scalePad(640, 360),
    outputSuffix: "360p",
  },

  // --- Aspect (social) ---
  {
    id: "aspect-reels",
    category: "aspect",
    label: "9:16 Reels / TikTok — 1080×1920",
    description: "Vertical mobile",
    buildVideoFilter: () => scalePad(1080, 1920),
    outputSuffix: "9x16-reels",
  },
  {
    id: "aspect-square",
    category: "aspect",
    label: "1:1 Square — 1080×1080",
    description: "Instagram feed square",
    buildVideoFilter: () => scalePad(1080, 1080),
    outputSuffix: "1x1-square",
  },
  {
    id: "aspect-instagram",
    category: "aspect",
    label: "4:5 Instagram — 1080×1350",
    description: "Portrait feed",
    buildVideoFilter: () => scalePad(1080, 1350),
    outputSuffix: "4x5-ig",
  },
  {
    id: "aspect-youtube",
    category: "aspect",
    label: "16:9 YouTube — 1920×1080",
    description: "Landscape standard",
    buildVideoFilter: () => scalePad(1920, 1080),
    outputSuffix: "16x9-yt",
  },

  // --- Zoom ---
  {
    id: "zoom-in-10",
    category: "zoom",
    label: "Zoom in 10%",
    description: "Slight punch-in, center crop",
    buildVideoFilter: () =>
      `${zoomCrop(1920, 1080, 1.1)}`,
    outputSuffix: "zoom-in-10",
  },
  {
    id: "zoom-in-25",
    category: "zoom",
    label: "Zoom in 25%",
    description: "Stronger center crop",
    buildVideoFilter: () => zoomCrop(1920, 1080, 1.25),
    outputSuffix: "zoom-in-25",
  },
  {
    id: "zoom-in-50",
    category: "zoom",
    label: "Zoom in 50%",
    description: "Close-up crop on center",
    buildVideoFilter: () => zoomCrop(1920, 1080, 1.5),
    outputSuffix: "zoom-in-50",
  },
  {
    id: "zoom-out-10",
    category: "zoom",
    label: "Zoom out 10%",
    description: "More scene visible with padding",
    buildVideoFilter: () =>
      `scale=1728:972:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black`,
    outputSuffix: "zoom-out-10",
  },
  {
    id: "zoom-ken-burns",
    category: "zoom",
    label: "Slow zoom (Ken Burns)",
    description: "Gradual zoom over full clip",
    buildVideoFilter: (d) =>
      `scale=1920:1080,zoompan=z='min(zoom+0.0008,1.25)':d=${Math.max(1, Math.ceil(d * 25))}:s=1920x1080:fps=25`,
    outputSuffix: "ken-burns",
  },

  // --- Fade ---
  {
    id: "fade-in-1",
    category: "fade",
    label: "Fade in — 1 second",
    description: "Black to video",
    buildVideoFilter: (d) =>
      `${scalePad(1920, 1080)},fade=t=in:st=0:d=1`,
    outputSuffix: "fade-in-1s",
  },
  {
    id: "fade-in-2",
    category: "fade",
    label: "Fade in — 2 seconds",
    description: "Slow fade in",
    buildVideoFilter: () => `${scalePad(1920, 1080)},fade=t=in:st=0:d=2`,
    outputSuffix: "fade-in-2s",
  },
  {
    id: "fade-out-1",
    category: "fade",
    label: "Fade out — 1 second",
    description: "Video to black at end",
    buildVideoFilter: (d) =>
      `${scalePad(1920, 1080)},fade=t=out:st=${Math.max(0, d - 1)}:d=1`,
    outputSuffix: "fade-out-1s",
  },
  {
    id: "fade-out-2",
    category: "fade",
    label: "Fade out — 2 seconds",
    description: "Slow fade out",
    buildVideoFilter: (d) =>
      `${scalePad(1920, 1080)},fade=t=out:st=${Math.max(0, d - 2)}:d=2`,
    outputSuffix: "fade-out-2s",
  },
  {
    id: "fade-both-1",
    category: "fade",
    label: "Fade in + out — 1s each",
    description: "Professional open/close",
    buildVideoFilter: (d) =>
      `${scalePad(1920, 1080)},fade=t=in:st=0:d=1,fade=t=out:st=${Math.max(0, d - 1)}:d=1`,
    outputSuffix: "fade-in-out",
  },
  {
    id: "fade-dip",
    category: "fade",
    label: "Dip to black (middle)",
    description: "Brief fade at center of clip",
    buildVideoFilter: (d) => {
      const mid = Math.max(0, d / 2 - 0.5);
      return `${scalePad(1920, 1080)},fade=t=out:st=${mid}:d=0.5,fade=t=in:st=${mid + 0.5}:d=0.5`;
    },
    outputSuffix: "fade-dip",
  },

  // --- Speed ---
  {
    id: "speed-0.5",
    category: "speed",
    label: "Slow motion 0.5×",
    description: "Half speed",
    buildVideoFilter: () =>
      `${scalePad(1920, 1080)},setpts=2*PTS`,
    outputSuffix: "slow-0.5x",
  },
  {
    id: "speed-0.75",
    category: "speed",
    label: "Slow 0.75×",
    description: "Slightly slower",
    buildVideoFilter: () =>
      `${scalePad(1920, 1080)},setpts=1.333*PTS`,
    outputSuffix: "slow-0.75x",
  },
  {
    id: "speed-1.25",
    category: "speed",
    label: "Fast 1.25×",
    description: "Slightly faster",
    buildVideoFilter: () =>
      `${scalePad(1920, 1080)},setpts=0.8*PTS`,
    outputSuffix: "fast-1.25x",
  },
  {
    id: "speed-1.5",
    category: "speed",
    label: "Fast 1.5×",
    description: "Timelapse feel",
    buildVideoFilter: () =>
      `${scalePad(1920, 1080)},setpts=0.667*PTS`,
    outputSuffix: "fast-1.5x",
  },
  {
    id: "speed-2",
    category: "speed",
    label: "Fast 2×",
    description: "Double speed",
    buildVideoFilter: () =>
      `${scalePad(1920, 1080)},setpts=0.5*PTS`,
    outputSuffix: "fast-2x",
  },

  // --- Flip ---
  {
    id: "flip-h",
    category: "flip",
    label: "Mirror (horizontal flip)",
    description: "Selfie-style mirror",
    buildVideoFilter: () => `${scalePad(1920, 1080)},hflip`,
    outputSuffix: "mirror",
  },
  {
    id: "flip-v",
    category: "flip",
    label: "Flip vertical",
    description: "Upside down correction",
    buildVideoFilter: () => `${scalePad(1920, 1080)},vflip`,
    outputSuffix: "flip-v",
  },

  // --- Color ---
  {
    id: "color-bright",
    category: "color",
    label: "Brighter +15%",
    description: "Lift shadows slightly",
    buildVideoFilter: () => `${scalePad(1920, 1080)},eq=brightness=0.08`,
    outputSuffix: "brighter",
  },
  {
    id: "color-dark",
    category: "color",
    label: "Darker cinematic",
    description: "Moody look",
    buildVideoFilter: () => `${scalePad(1920, 1080)},eq=brightness=-0.06:contrast=1.1`,
    outputSuffix: "darker",
  },
  {
    id: "color-saturate",
    category: "color",
    label: "More saturated",
    description: "Vivid colors for social",
    buildVideoFilter: () => `${scalePad(1920, 1080)},eq=saturation=1.4`,
    outputSuffix: "saturated",
  },
  {
    id: "color-bw",
    category: "color",
    label: "Black & white",
    description: "Monochrome",
    buildVideoFilter: () => `${scalePad(1920, 1080)},hue=s=0`,
    outputSuffix: "bw",
  },
  {
    id: "color-warm",
    category: "color",
    label: "Warm tone",
    description: "Golden hour feel",
    buildVideoFilter: () =>
      `${scalePad(1920, 1080)},eq=r=0.05:g=0.02:b=-0.03`,
    outputSuffix: "warm",
  },
];

const SPEED_AUDIO_TEMPO: Record<string, string> = {
  "speed-0.5": "atempo=0.5",
  "speed-0.75": "atempo=0.75",
  "speed-1.25": "atempo=1.25",
  "speed-1.5": "atempo=1.5",
  "speed-2": "atempo=2.0",
};

export function getAudioFilterForRecipe(recipeId: string): string | null {
  return SPEED_AUDIO_TEMPO[recipeId] ?? null;
}

export const VARIANT_CATEGORIES: { id: VariantCategory; label: string }[] = [
  { id: "resolution", label: "Resolution (4K, 1080p…)" },
  { id: "aspect", label: "Aspect ratio (Reels, Square…)" },
  { id: "zoom", label: "Zoom in / out" },
  { id: "fade", label: "Fade in / out" },
  { id: "speed", label: "Speed" },
  { id: "flip", label: "Flip / mirror" },
  { id: "color", label: "Color & mood" },
];

export const QUICK_PACKS: { id: string; label: string; recipeIds: string[] }[] = [
  {
    id: "social",
    label: "Social media pack (6)",
    recipeIds: [
      "aspect-reels",
      "aspect-square",
      "aspect-instagram",
      "aspect-youtube",
      "res-1080p",
      "fade-both-1",
    ],
  },
  {
    id: "quality",
    label: "Quality pack — 4K to 360p (5)",
    recipeIds: ["res-4k", "res-1080p", "res-720p", "res-480p", "res-360p"],
  },
  {
    id: "effects",
    label: "Effects pack — zoom & fade (8)",
    recipeIds: [
      "zoom-in-10",
      "zoom-in-25",
      "zoom-out-10",
      "zoom-ken-burns",
      "fade-in-2",
      "fade-out-2",
      "fade-both-1",
      "fade-dip",
    ],
  },
  {
    id: "all-popular",
    label: "Popular all-in-one (12)",
    recipeIds: [
      "res-4k",
      "res-1080p",
      "aspect-reels",
      "aspect-square",
      "zoom-in-25",
      "fade-both-1",
      "speed-1.25",
      "flip-h",
      "color-saturate",
      "res-720p",
      "fade-in-1",
      "zoom-in-10",
    ],
  },
];

export function getRecipesByCategory(category: VariantCategory): VariantRecipe[] {
  return VARIANT_RECIPES.filter((r) => r.category === category);
}

const OUTPUT_DIMENSIONS: Record<string, { w: number; h: number }> = {
  "res-4k": { w: 3840, h: 2160 },
  "res-1080p": { w: 1920, h: 1080 },
  "res-720p": { w: 1280, h: 720 },
  "res-480p": { w: 854, h: 480 },
  "res-360p": { w: 640, h: 360 },
  "aspect-reels": { w: 1080, h: 1920 },
  "aspect-square": { w: 1080, h: 1080 },
  "aspect-instagram": { w: 1080, h: 1350 },
  "aspect-youtube": { w: 1920, h: 1080 },
};

const SCALE_PAD_RE =
  /^scale=\d+:\d+:force_original_aspect_ratio=decrease,pad=\d+:\d+:\(ow-iw\)\/2:\(oh-ih\)\/2:black,?/;

function stripEmbeddedScalePad(filter: string): string {
  return filter.replace(SCALE_PAD_RE, "").replace(/^,/, "");
}

function pickLast<T>(items: T[]): T | undefined {
  return items.length > 0 ? items[items.length - 1] : undefined;
}

function zoomFilterForSize(recipeId: string, w: number, h: number): string {
  switch (recipeId) {
    case "zoom-in-10":
      return zoomCrop(w, h, 1.1);
    case "zoom-in-25":
      return zoomCrop(w, h, 1.25);
    case "zoom-in-50":
      return zoomCrop(w, h, 1.5);
    case "zoom-out-10":
      return `scale=${Math.round(w * 0.9)}:${Math.round(h * 0.9)}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`;
    default:
      return "";
  }
}

function extractFadeFilters(recipe: VariantRecipe, durationSec: number): string[] {
  const raw = stripEmbeddedScalePad(recipe.buildVideoFilter(durationSec));
  return raw.split(",").filter((part) => part.startsWith("fade="));
}

function buildCombinedSuffix(recipes: VariantRecipe[]): string {
  const tags = recipes.map((r) => r.outputSuffix).slice(0, 4);
  const suffix = tags.join("-");
  return suffix.length > 48 ? `${suffix.slice(0, 48)}-combo` : `${suffix}-combo`;
}

/** Merge all selected options into one FFmpeg video filter chain. */
export function buildCombinedVideoFilter(
  selectedIds: Iterable<string>,
  durationSec: number
): { vf: string; audioFilter: string | null; suffix: string; labels: string[] } {
  const ids = Array.from(selectedIds);
  const recipes = VARIANT_RECIPES.filter((r) => ids.includes(r.id));

  if (recipes.length === 0) {
    return {
      vf: scalePad(1920, 1080),
      audioFilter: null,
      suffix: "combined",
      labels: [],
    };
  }

  const aspects = recipes.filter((r) => r.category === "aspect");
  const resolutions = recipes.filter((r) => r.category === "resolution");
  const dimRecipe = pickLast(aspects) ?? pickLast(resolutions);
  const { w, h } = dimRecipe
    ? (OUTPUT_DIMENSIONS[dimRecipe.id] ?? { w: 1920, h: 1080 })
    : { w: 1920, h: 1080 };

  const parts: string[] = [];

  const speedRecipe = pickLast(recipes.filter((r) => r.category === "speed"));
  if (speedRecipe) {
    parts.push(stripEmbeddedScalePad(speedRecipe.buildVideoFilter(durationSec)));
  }

  for (const flip of recipes.filter((r) => r.category === "flip")) {
    parts.push(stripEmbeddedScalePad(flip.buildVideoFilter(durationSec)));
  }

  for (const color of recipes.filter((r) => r.category === "color")) {
    parts.push(stripEmbeddedScalePad(color.buildVideoFilter(durationSec)));
  }

  const kenBurns = recipes.find((r) => r.id === "zoom-ken-burns");
  const zoomRecipe = pickLast(
    recipes.filter((r) => r.category === "zoom" && r.id !== "zoom-ken-burns")
  );

  if (kenBurns) {
    parts.push(kenBurns.buildVideoFilter(durationSec));
  } else {
    if (zoomRecipe) {
      const zoomPart = zoomFilterForSize(zoomRecipe.id, w, h);
      if (zoomPart) parts.push(zoomPart);
    }
    parts.push(scalePad(w, h));
  }

  for (const fade of recipes.filter((r) => r.category === "fade")) {
    parts.push(...extractFadeFilters(fade, durationSec));
  }

  const vf = parts.filter(Boolean).join(",");
  const audioFilter = speedRecipe ? getAudioFilterForRecipe(speedRecipe.id) : null;

  return {
    vf,
    audioFilter,
    suffix: buildCombinedSuffix(recipes),
    labels: recipes.map((r) => r.label),
  };
}
