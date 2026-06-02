export type VideoSourceMethod =
  | "mixkit-cdn"
  | "self-hosted"
  | "pexels-api"
  | "pixabay-api"
  | "wikimedia"
  | "internet-archive";

export interface VideoSourceInfo {
  id: VideoSourceMethod;
  title: string;
  license: string;
  description: string;
  docsUrl: string;
  requiresApiKey: boolean;
}

export const VIDEO_SOURCE_METHODS: VideoSourceInfo[] = [
  {
    id: "mixkit-cdn",
    title: "1. Free CDN (Mixkit)",
    license: "Mixkit License — free for commercial & personal use",
    description:
      "Link directly to Mixkit-hosted MP4 files. No API key. Download from mixkit.co or use their CDN URLs in a <video> tag.",
    docsUrl: "https://mixkit.co/license/",
    requiresApiKey: false,
  },
  {
    id: "self-hosted",
    title: "2. Self-hosted (public folder)",
    license: "You control the license (use CC0, Pexels, Mixkit downloads, etc.)",
    description:
      "Download copyright-free clips and place them in public/videos/. Best for offline control, caching, and no third-party downtime.",
    docsUrl: "https://nextjs.org/docs/app/building-your-application/optimizing/static-assets",
    requiresApiKey: false,
  },
  {
    id: "pexels-api",
    title: "3. Pexels Video API",
    license: "Pexels License — free, no attribution required (appreciated)",
    description:
      "Search thousands of free stock videos via API. Keys stay on the server in Next.js Route Handlers.",
    docsUrl: "https://www.pexels.com/api/documentation/",
    requiresApiKey: true,
  },
  {
    id: "pixabay-api",
    title: "4. Pixabay Video API",
    license: "Pixabay License — free for commercial use, no attribution required",
    description:
      "Similar to Pexels: search and stream videos. Use Route Handlers so your API key is never exposed to the browser.",
    docsUrl: "https://pixabay.com/api/docs/",
    requiresApiKey: true,
  },
  {
    id: "wikimedia",
    title: "5. Wikimedia Commons",
    license: "Varies per file (often CC BY-SA or Public Domain) — check each file page",
    description:
      "Use direct file URLs from upload.wikimedia.org for openly licensed educational and documentary clips.",
    docsUrl: "https://commons.wikimedia.org/wiki/Commons:Licensing",
    requiresApiKey: false,
  },
  {
    id: "internet-archive",
    title: "6. Internet Archive",
    license: "Public domain & various open licenses — verify per item",
    description:
      "Stream historical and public-domain media. Use direct MP4 links or their embed player for archival content.",
    docsUrl: "https://archive.org/about/terms.php",
    requiresApiKey: false,
  },
];

/** Mixkit — free license, hotlink-friendly CDN */
export const MIXKIT_SAMPLE = {
  src: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4",
  poster:
    "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-thumb.jpg",
  attribution: "Mixkit / mixkit.co",
  attributionUrl: "https://mixkit.co/free-stock-video/waves-in-the-water-1164/",
};

/** Self-hosted path — add your own file to public/videos/sample.mp4 */
export const SELF_HOSTED_SAMPLE = {
  src: "/videos/sample.mp4",
  poster: "/videos/sample-poster.jpg",
  attribution: "Your downloaded CC0 / Pexels / Mixkit file",
};

/** Wikimedia Commons — Big Buck Bunny (CC BY 3.0) */
export const WIKIMEDIA_SAMPLE = {
  src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f1/Big_Buck_Bunny_Trailer_1080p.ogv/Big_Buck_Bunny_Trailer_1080p.ogv.480p.vp9.webm",
  attribution: "Big Buck Bunny — Blender Foundation (CC BY 3.0)",
  attributionUrl:
    "https://commons.wikimedia.org/wiki/File:Big_Buck_Bunny_Trailer_1080p.ogv",
};

/** Internet Archive — public domain sample */
export const ARCHIVE_SAMPLE = {
  src: "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4",
  attribution: "Big Buck Bunny — Internet Archive",
  attributionUrl: "https://archive.org/details/BigBuckBunny_124",
};
