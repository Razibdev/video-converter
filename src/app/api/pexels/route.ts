import { NextRequest, NextResponse } from "next/server";

const PEXELS_API = "https://api.pexels.com/videos/search";

interface PexelsVideoFile {
  link: string;
  quality?: string;
  width?: number;
}

interface PexelsVideo {
  id: number;
  url: string;
  image: string;
  video_files: PexelsVideoFile[];
  user?: { name: string };
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "PEXELS_API_KEY is not set. Get a free key at https://www.pexels.com/api/",
        videos: [],
      },
      { status: 503 }
    );
  }

  const q = request.nextUrl.searchParams.get("q") ?? "nature";
  const perPage = request.nextUrl.searchParams.get("per_page") ?? "4";

  const url = `${PEXELS_API}?query=${encodeURIComponent(q)}&per_page=${perPage}`;

  const res = await fetch(url, {
    headers: { Authorization: apiKey },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Pexels API error: ${res.status}`, videos: [] },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { videos?: PexelsVideo[] };

  const videos = (data.videos ?? []).map((video) => {
    const hd =
      video.video_files.find((f) => f.quality === "hd") ??
      video.video_files.find((f) => (f.width ?? 0) >= 1280) ??
      video.video_files[0];

    return {
      id: video.id,
      src: hd?.link ?? "",
      thumbnail: video.image,
      user: video.user?.name,
      pageUrl: video.url,
    };
  }).filter((v) => v.src);

  return NextResponse.json({ videos });
}
