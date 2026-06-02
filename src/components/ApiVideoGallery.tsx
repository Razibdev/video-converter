"use client";

import { useCallback, useEffect, useState } from "react";
import { VideoPlayer } from "./VideoPlayer";

interface ApiVideo {
  id: number | string;
  src: string;
  thumbnail?: string;
  user?: string;
  pageUrl?: string;
}

interface ApiVideoGalleryProps {
  provider: "pexels" | "pixabay";
  defaultQuery?: string;
}

export function ApiVideoGallery({
  provider,
  defaultQuery = "nature",
}: ApiVideoGalleryProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/${provider}?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setVideos([]);
        setError(data.error ?? "Failed to load videos");
        return;
      }
      setVideos(data.videos ?? []);
      if ((data.videos ?? []).length === 0) {
        setError("No videos found for this search.");
      }
    } catch {
      setError("Network error while fetching videos.");
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    void fetchVideos(query);
  }, [fetchVideos, query]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("q") as HTMLInputElement;
    setQuery(input.value.trim() || defaultQuery);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={`Search ${provider} videos…`}
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Search
        </button>
      </form>

      {loading && (
        <p className="text-sm text-zinc-500">Loading copyright-free videos…</p>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {error}
          {error.includes("API key") && (
            <p className="mt-2">
              Copy <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.example</code> to{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">.env.local</code> and add your
              free key.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {videos.map((video) => (
          <VideoPlayer
            key={video.id}
            src={video.src}
            poster={video.thumbnail}
            title={`${provider} video ${video.id}`}
            attribution={
              video.user
                ? `${provider} — ${video.user}`
                : `${provider} stock video`
            }
            attributionUrl={video.pageUrl}
          />
        ))}
      </div>
    </div>
  );
}
