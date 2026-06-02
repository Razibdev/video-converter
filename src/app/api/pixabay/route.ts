import { NextRequest, NextResponse } from "next/server";

const PIXABAY_API = "https://pixabay.com/api/videos/";

interface PixabayHit {
  id: number;
  pageURL: string;
  user: string;
  videos: {
    large?: { url: string; width: number; height: number };
    medium?: { url: string };
    small?: { url: string };
    tiny?: { url: string };
  };
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "PIXABAY_API_KEY is not set. Get a free key at https://pixabay.com/api/docs/",
        videos: [],
      },
      { status: 503 }
    );
  }

  const q = request.nextUrl.searchParams.get("q") ?? "ocean";
  const perPage = request.nextUrl.searchParams.get("per_page") ?? "4";

  const url = new URL(PIXABAY_API);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", q);
  url.searchParams.set("per_page", perPage);
  url.searchParams.set("video_type", "film");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Pixabay API error: ${res.status}`, videos: [] },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { hits?: PixabayHit[] };

  const videos = (data.hits ?? []).map((hit) => {
    const file =
      hit.videos.medium ?? hit.videos.small ?? hit.videos.large ?? hit.videos.tiny;

    return {
      id: hit.id,
      src: file?.url ?? "",
      user: hit.user,
      pageUrl: hit.pageURL,
    };
  }).filter((v) => v.src);

  return NextResponse.json({ videos });
}
