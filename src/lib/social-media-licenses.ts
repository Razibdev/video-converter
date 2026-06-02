export type LicenseSource =
  | "original"
  | "pexels"
  | "pixabay"
  | "mixkit"
  | "coverr"
  | "cc0"
  | "other-free";

export interface LicenseOption {
  id: LicenseSource;
  label: string;
  commercialUse: boolean;
  attributionRequired: boolean;
  attributionTemplate: string;
  notes: string;
}

export const LICENSE_OPTIONS: LicenseOption[] = [
  {
    id: "original",
    label: "I filmed / created this myself",
    commercialUse: true,
    attributionRequired: false,
    attributionTemplate: "",
    notes: "You own the copyright. Safe for Facebook & YouTube if no unlicensed music or third-party clips inside.",
  },
  {
    id: "pexels",
    label: "Downloaded from Pexels",
    commercialUse: true,
    attributionRequired: false,
    attributionTemplate: "Video from Pexels — {creator}",
    notes: "Pexels License allows free commercial use. Attribution appreciated but not required.",
  },
  {
    id: "pixabay",
    label: "Downloaded from Pixabay",
    commercialUse: true,
    attributionRequired: false,
    attributionTemplate: "Video from Pixabay — {creator}",
    notes: "Pixabay License allows commercial use without attribution.",
  },
  {
    id: "mixkit",
    label: "Downloaded from Mixkit",
    commercialUse: true,
    attributionRequired: false,
    attributionTemplate: "Video from Mixkit (mixkit.co)",
    notes: "Mixkit License — free for personal and commercial projects.",
  },
  {
    id: "coverr",
    label: "Downloaded from Coverr",
    commercialUse: true,
    attributionRequired: false,
    attributionTemplate: "Video from Coverr (coverr.co)",
    notes: "Coverr free license for websites and social media.",
  },
  {
    id: "cc0",
    label: "Public domain / CC0",
    commercialUse: true,
    attributionRequired: false,
    attributionTemplate: "Public domain / CC0 media",
    notes: "Verify the exact license on the source page before monetizing.",
  },
  {
    id: "other-free",
    label: "Other royalty-free source",
    commercialUse: true,
    attributionRequired: true,
    attributionTemplate: "Source: {source} — License: {license}",
    notes: "Keep a link or screenshot of the license page for your records.",
  },
];

export const SOCIAL_CHECKLIST_ITEMS = [
  {
    id: "rights",
    label: "I have the right to upload this video (filmed by me or from a license that allows social media & commercial use).",
  },
  {
    id: "music",
    label: "Music and sound effects are original, licensed, or from a royalty-free library (no popular songs without permission).",
  },
  {
    id: "brands",
    label: "No unlicensed logos, movie clips, TV footage, or other copyrighted material inside the video.",
  },
  {
    id: "attribution",
    label: "If the license requires attribution, I will paste it in the YouTube description and Facebook post.",
  },
  {
    id: "youtube-policy",
    label: "I understand YouTube may still flag content via Content ID — I will dispute only if I have proof of license.",
  },
  {
    id: "facebook-policy",
    label: "I will follow Meta’s policies on music and repeated content when posting to Facebook / Reels.",
  },
] as const;

export type ChecklistId = (typeof SOCIAL_CHECKLIST_ITEMS)[number]["id"];

export interface SocialExportMetadata {
  exportedAt: string;
  fileName: string;
  fileSizeBytes: number;
  licenseSource: LicenseSource;
  licenseLabel: string;
  commercialUse: boolean;
  attributionRequired: boolean;
  attributionText: string;
  creatorName: string;
  sourceUrl: string;
  checklistCompleted: boolean;
  readyForYouTube: boolean;
  readyForFacebook: boolean;
  suggestedYouTubeDescription: string;
  suggestedFacebookCaption: string;
  platformNotes: {
    youtube: string[];
    facebook: string[];
  };
}

export function buildExportMetadata(params: {
  fileName: string;
  fileSizeBytes: number;
  licenseSource: LicenseSource;
  creatorName: string;
  sourceUrl: string;
  checklistDone: Record<ChecklistId, boolean>;
}): SocialExportMetadata {
  const license =
    LICENSE_OPTIONS.find((o) => o.id === params.licenseSource) ??
    LICENSE_OPTIONS[0];

  const allChecked = SOCIAL_CHECKLIST_ITEMS.every(
    (item) => params.checklistDone[item.id]
  );

  const attributionText = license.attributionTemplate
    .replace("{creator}", params.creatorName || "creator")
    .replace("{source}", params.sourceUrl || "source")
    .replace("{license}", license.label);

  const baseDescription = [
    params.fileName.replace(/\.[^.]+$/, ""),
    "",
    license.attributionRequired || license.attributionTemplate
      ? attributionText
      : "",
    params.sourceUrl ? `Source: ${params.sourceUrl}` : "",
    "",
    "#copyrightfree #stockvideo",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    exportedAt: new Date().toISOString(),
    fileName: params.fileName,
    fileSizeBytes: params.fileSizeBytes,
    licenseSource: params.licenseSource,
    licenseLabel: license.label,
    commercialUse: license.commercialUse,
    attributionRequired: license.attributionRequired,
    attributionText,
    creatorName: params.creatorName,
    sourceUrl: params.sourceUrl,
    checklistCompleted: allChecked,
    readyForYouTube: allChecked,
    readyForFacebook: allChecked,
    suggestedYouTubeDescription: [
      baseDescription,
      "",
      "--- YouTube upload tips ---",
      "• Set visibility after review",
      "• In YouTube Studio → Details, paste attribution above if needed",
      "• If monetizing, confirm music is cleared in Audio Library or licensed",
    ].join("\n"),
    suggestedFacebookCaption: [
      baseDescription.split("\n").slice(0, 4).join("\n"),
      "",
      "--- Facebook / Reels tips ---",
      "• Use Meta Business Suite or Creator Studio for scheduling",
      "• Avoid copyrighted music from Meta’s restricted list",
      "• Keep a copy of your license screenshot in case of takedown appeal",
    ].join("\n"),
    platformNotes: {
      youtube: [
        "Upload at studio.youtube.com → Create → Upload videos",
        "License: Standard (you own it) or Creative Commons if you chose CC",
        "Add attribution in Description when using stock sources",
        "Check Copyright tab in Studio after upload for claims",
      ],
      facebook: [
        "Upload via facebook.com/reel or Meta Business Suite",
        "Use royalty-free or licensed audio; Meta scans music automatically",
        "For Pages, use Rights Manager if you publish original content often",
        "Appeal with your license export JSON if a video is muted or blocked",
      ],
    },
  };
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
