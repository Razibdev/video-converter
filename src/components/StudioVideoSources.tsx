"use client";

import { useCallback, useEffect, useState } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { STUDIO_STOCK_SAMPLES } from "@/lib/video-sources";
import { fetchUrlAsVideoFile } from "@/lib/video-fetch";

interface ApiVideo {
  id: number | string;
  src: string;
  thumbnail?: string;
  user?: string;
  pageUrl?: string;
}

export interface ConvertProgress {
  percent: number;
  doneCount: number;
  total: number;
  currentLabel?: string;
}

interface StudioVideoSourcesProps {
  onVideoReady: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  convertProgress?: ConvertProgress | null;
}

type SourceTab = "upload" | "stock" | "pexels" | "pixabay";

export function StudioVideoSources({
  onVideoReady,
  onError,
  disabled,
  convertProgress,
}: StudioVideoSourcesProps) {
  const [tab, setTab] = useState<SourceTab>("upload");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [downloadLabel, setDownloadLabel] = useState<string | null>(null);
  const [selfHostedReady, setSelfHostedReady] = useState<boolean | null>(null);

  const [query, setQuery] = useState("nature");
  const [searchVideos, setSearchVideos] = useState<ApiVideo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = "/videos/sample.mp4";
    const onReady = () => setSelfHostedReady(true);
    const onFail = () => setSelfHostedReady(false);
    probe.addEventListener("loadedmetadata", onReady);
    probe.addEventListener("error", onFail);
    return () => {
      probe.removeEventListener("loadedmetadata", onReady);
      probe.removeEventListener("error", onFail);
    };
  }, []);

  const loadFromUrl = useCallback(
    async (id: string, url: string, fileName: string, label: string) => {
      setLoadingId(id);
      setDownloadLabel(label);
      setDownloadPercent(0);
      onError("");
      try {
        const file = await fetchUrlAsVideoFile(url, fileName, (pct) => {
          setDownloadPercent(pct);
        });
        onVideoReady(file);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not load this video";
        onError(msg);
      } finally {
        setLoadingId(null);
        setDownloadLabel(null);
        setDownloadPercent(0);
      }
    },
    [onError, onVideoReady]
  );

  const fetchSearch = useCallback(
    async (provider: "pexels" | "pixabay", searchQuery: string) => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const res = await fetch(
          `/api/${provider}?q=${encodeURIComponent(searchQuery)}&per_page=6`
        );
        const data = await res.json();
        if (!res.ok) {
          setSearchVideos([]);
          setSearchError(data.error ?? "Failed to load videos");
          return;
        }
        setSearchVideos(data.videos ?? []);
        if ((data.videos ?? []).length === 0) {
          setSearchError("No videos found. Try another search.");
        }
      } catch {
        setSearchError("Network error while fetching videos.");
        setSearchVideos([]);
      } finally {
        setSearchLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (tab === "pexels" || tab === "pixabay") {
      void fetchSearch(tab, query);
    }
  }, [tab, query, fetchSearch]);

  const tabs: { id: SourceTab; label: string }[] = [
    { id: "upload", label: "Your computer" },
    { id: "stock", label: "Free stock clips" },
    { id: "pexels", label: "Search Pexels" },
    { id: "pixabay", label: "Search Pixabay" },
  ];

  const showDownloadProgress = loadingId !== null && downloadLabel !== null;
  const showConvertProgress =
    convertProgress != null && convertProgress.total > 0;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={disabled}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-emerald-600 text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showDownloadProgress && (
        <ProgressBar
          percent={downloadPercent}
          label={`Downloading: ${downloadLabel}`}
          sublabel={`${downloadPercent}%`}
        />
      )}

      {showConvertProgress && (
        <ProgressBar
          percent={convertProgress.percent}
          label="Converting video variants"
          sublabel={`${convertProgress.percent}% · ${convertProgress.doneCount}/${convertProgress.total} done${
            convertProgress.currentLabel
              ? ` · ${convertProgress.currentLabel}`
              : ""
          }`}
        />
      )}

      <p className="text-xs text-zinc-500">
        Use your own footage, or pick copyright-free clips from Mixkit, Pexels,
        Pixabay, Wikimedia, and Internet Archive — then generate many versions.
      </p>

      {tab === "upload" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Click the upload area below to choose MP4, WebM, or MOV from your
          desktop.
        </p>
      )}

      {tab === "stock" && (
        <div className="grid gap-3 sm:grid-cols-2">
          {STUDIO_STOCK_SAMPLES.map((sample) => {
            if (sample.id === "self-hosted" && selfHostedReady === false) {
              return null;
            }
            const busy = loadingId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                disabled={disabled || loadingId !== null}
                onClick={() =>
                  void loadFromUrl(
                    sample.id,
                    sample.src,
                    sample.fileName,
                    sample.label
                  )
                }
                className="flex gap-3 rounded-xl border border-zinc-200 p-3 text-left hover:border-emerald-400 disabled:opacity-50 dark:border-zinc-700"
              >
                {"poster" in sample && sample.poster && (
                  <img
                    src={sample.poster}
                    alt=""
                    className="h-16 w-28 shrink-0 rounded-lg object-cover"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {busy ? `Downloading… ${downloadPercent}%` : sample.label}
                  </span>
                  <span className="text-xs text-zinc-500">{sample.license}</span>
                  {busy && (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                        style={{ width: `${downloadPercent}%` }}
                      />
                    </div>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {(tab === "pexels" || tab === "pixabay") && (
        <div className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem(
                "q"
              ) as HTMLInputElement;
              setQuery(input.value.trim() || "nature");
            }}
            className="flex flex-wrap gap-2"
          >
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder={`Search ${tab}…`}
              className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Search
            </button>
          </form>

          {searchLoading && (
            <p className="text-sm text-zinc-500">Loading videos…</p>
          )}

          {searchError && !searchLoading && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {searchError}
              {searchError.includes("API key") && (
                <p className="mt-2">
                  Add your free key in{" "}
                  <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                    .env.local
                  </code>{" "}
                  (see .env.example).
                </p>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {searchVideos.map((video) => {
              const id = `${tab}-${video.id}`;
              const busy = loadingId === id;
              return (
                <div
                  key={id}
                  className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
                >
                  {video.thumbnail && (
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-zinc-500">
                        {video.user ?? `${tab} stock`}
                      </p>
                      <button
                        type="button"
                        disabled={disabled || loadingId !== null}
                        onClick={() =>
                          void loadFromUrl(
                            id,
                            video.src,
                            `${tab}-${video.id}.mp4`,
                            `${tab} video ${video.id}`
                          )
                        }
                        className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busy ? `${downloadPercent}%` : "Use in Studio"}
                      </button>
                    </div>
                    {busy && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                          style={{ width: `${downloadPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
