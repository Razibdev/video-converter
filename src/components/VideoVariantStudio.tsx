"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  downloadBlob,
  loadFfmpeg,
  renderVideoVariant,
} from "@/lib/ffmpeg-processor";
import {
  formatFileSize,
  isAcceptedVideoFile,
  MAX_VIDEO_BYTES,
} from "@/lib/upload-config";
import {
  QUICK_PACKS,
  VARIANT_CATEGORIES,
  VARIANT_RECIPES,
  getRecipesByCategory,
  type VariantRecipe,
} from "@/lib/video-variants";

type JobStatus = "pending" | "processing" | "done" | "error";

interface VariantJob {
  recipe: VariantRecipe;
  status: JobStatus;
  progress: number;
  fileName?: string;
  blob?: Blob;
  error?: string;
}

export function VideoVariantStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<VariantJob[]>([]);
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "resolution"
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadSource = useCallback((file: File) => {
    if (!isAcceptedVideoFile(file)) {
      setGlobalError("Use MP4, WebM, or MOV.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setGlobalError(`Max file size ${MAX_VIDEO_BYTES / (1024 * 1024)} MB.`);
      return;
    }
    setGlobalError(null);
    setSourceFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setJobs([]);
    setSelectedIds(new Set());
  }, []);

  function toggleRecipe(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectPack(packId: string) {
    const pack = QUICK_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pack.recipeIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function selectAllInCategory(category: string) {
    const ids = getRecipesByCategory(
      category as (typeof VARIANT_CATEGORIES)[number]["id"]
    ).map((r) => r.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  async function ensureFfmpeg() {
    if (ffmpegReady) return true;
    setFfmpegLoading(true);
    try {
      await loadFfmpeg();
      setFfmpegReady(true);
      return true;
    } catch {
      setGlobalError(
        "Could not load video engine. Check internet (FFmpeg WASM loads from CDN)."
      );
      return false;
    } finally {
      setFfmpegLoading(false);
    }
  }

  async function generateVariants() {
    if (!sourceFile) {
      setGlobalError("Upload a video first.");
      return;
    }
    if (selectedIds.size === 0) {
      setGlobalError("Select at least one variant option.");
      return;
    }

    const ready = await ensureFfmpeg();
    if (!ready) return;

    const recipes = VARIANT_RECIPES.filter((r) => selectedIds.has(r.id));
    const dur =
      duration > 0
        ? duration
        : videoRef.current?.duration && Number.isFinite(videoRef.current.duration)
          ? videoRef.current.duration
          : 10;

    setProcessing(true);
    setGlobalError(null);

    const initialJobs: VariantJob[] = recipes.map((recipe) => ({
      recipe,
      status: "pending",
      progress: 0,
    }));
    setJobs(initialJobs);

    const ffmpeg = await loadFfmpeg();

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      setJobs((prev) =>
        prev.map((j) =>
          j.recipe.id === recipe.id
            ? { ...j, status: "processing", progress: 0 }
            : j
        )
      );

      try {
        const result = await renderVideoVariant(
          ffmpeg,
          sourceFile,
          recipe,
          dur,
          sourceFile.name
        );
        setJobs((prev) =>
          prev.map((j) =>
            j.recipe.id === recipe.id
              ? {
                  ...j,
                  status: "done",
                  progress: 100,
                  blob: result.blob,
                  fileName: result.fileName,
                }
              : j
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Export failed";
        setJobs((prev) =>
          prev.map((j) =>
            j.recipe.id === recipe.id
              ? { ...j, status: "error", error: msg }
              : j
          )
        );
      }
    }

    setProcessing(false);
  }

  function downloadAllDone() {
    jobs
      .filter((j) => j.status === "done" && j.blob && j.fileName)
      .forEach((j) => downloadBlob(j.blob!, j.fileName!));
  }

  const doneCount = jobs.filter((j) => j.status === "done").length;

  return (
    <div className="space-y-8">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter") inputRef.current?.click();
        }}
        className="cursor-pointer rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-8 text-center hover:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadSource(f);
            e.target.value = "";
          }}
        />
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {sourceFile ? sourceFile.name : "Choose one video from your desktop"}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Same video → many versions (4K, zoom, fade, Reels size…)
        </p>
        {sourceFile && (
          <p className="mt-1 text-xs text-zinc-400">
            {formatFileSize(sourceFile.size)}
            {duration > 0 && ` · ${duration.toFixed(1)}s`}
          </p>
        )}
      </div>

      {globalError && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {globalError}
        </p>
      )}

      {previewUrl && (
        <video
          ref={videoRef}
          src={previewUrl}
          controls
          className="aspect-video w-full max-h-[360px] rounded-xl bg-black"
          onLoadedMetadata={() => {
            if (videoRef.current?.duration) {
              setDuration(videoRef.current.duration);
            }
          }}
        />
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          Quick packs — select many at once
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => selectPack(pack.id)}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
            >
              + {pack.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              setSelectedIds(new Set(VARIANT_RECIPES.map((r) => r.id)))
            }
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Select all {VARIANT_RECIPES.length}
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Clear
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {selectedIds.size} variant{selectedIds.size !== 1 ? "s" : ""} selected
        </p>
      </div>

      <div className="space-y-3">
        {VARIANT_CATEGORIES.map((cat) => {
          const recipes = getRecipesByCategory(cat.id);
          const open = expandedCategory === cat.id;
          return (
            <div
              key={cat.id}
              className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedCategory(open ? null : cat.id)
                }
                className="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 text-left font-medium dark:bg-zinc-900"
              >
                {cat.label}
                <span className="text-sm text-zinc-500">
                  {recipes.length} options {open ? "▲" : "▼"}
                </span>
              </button>
              {open && (
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => selectAllInCategory(cat.id)}
                    className="col-span-full text-left text-xs text-emerald-700 underline dark:text-emerald-400"
                  >
                    Select all in {cat.label}
                  </button>
                  {recipes.map((recipe) => (
                    <label
                      key={recipe.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                        selectedIds.has(recipe.id)
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(recipe.id)}
                        onChange={() => toggleRecipe(recipe.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {recipe.label}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {recipe.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={processing || !sourceFile || selectedIds.size === 0}
          onClick={() => void generateVariants()}
          className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {processing
            ? `Generating… (${doneCount}/${selectedIds.size})`
            : ffmpegLoading
              ? "Loading video engine…"
              : `Generate ${selectedIds.size} version(s)`}
        </button>
        {doneCount > 0 && (
          <button
            type="button"
            onClick={downloadAllDone}
            className="rounded-lg border border-zinc-300 px-6 py-3 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Download all done ({doneCount})
          </button>
        )}
      </div>

      {!ffmpegReady && !ffmpegLoading && (
        <p className="text-xs text-zinc-500">
          First export downloads FFmpeg (~25 MB) once. Processing runs in your
          browser — nothing is uploaded to a server.
        </p>
      )}

      {jobs.length > 0 && (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li
              key={job.recipe.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <div>
                <p className="text-sm font-medium">{job.recipe.label}</p>
                <p className="text-xs text-zinc-500">
                  {job.status === "pending" && "Waiting…"}
                  {job.status === "processing" && "Processing…"}
                  {job.status === "error" && job.error}
                  {job.status === "done" && job.fileName}
                </p>
              </div>
              {job.status === "done" && job.blob && job.fileName && (
                <button
                  type="button"
                  onClick={() => downloadBlob(job.blob!, job.fileName!)}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Download MP4
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
