"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildExportMetadata,
  downloadJsonFile,
  downloadTextFile,
  LICENSE_OPTIONS,
  SOCIAL_CHECKLIST_ITEMS,
  type ChecklistId,
  type LicenseSource,
  type SocialExportMetadata,
} from "@/lib/social-media-licenses";
import {
  formatFileSize,
  isAcceptedVideoFile,
  MAX_FILES_PER_BATCH,
  MAX_VIDEO_BYTES,
} from "@/lib/upload-config";

interface ImportedVideo {
  id: string;
  file: File;
  previewUrl: string;
  licenseSource: LicenseSource;
  creatorName: string;
  sourceUrl: string;
  checklist: Record<ChecklistId, boolean>;
  savedUrl?: string;
  uploading: boolean;
  uploadError?: string;
}

function emptyChecklist(): Record<ChecklistId, boolean> {
  return SOCIAL_CHECKLIST_ITEMS.reduce(
    (acc, item) => {
      acc[item.id] = false;
      return acc;
    },
    {} as Record<ChecklistId, boolean>
  );
}

function createImport(file: File): ImportedVideo {
  return {
    id: `${file.name}-${file.size}-${Date.now()}`,
    file,
    previewUrl: URL.createObjectURL(file),
    licenseSource: "original",
    creatorName: "",
    sourceUrl: "",
    checklist: emptyChecklist(),
    uploading: false,
  };
}

export function DesktopVideoImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState<ImportedVideo[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    setGlobalError(null);
    const incoming = Array.from(fileList);
    const valid = incoming.filter(isAcceptedVideoFile);
    const invalid = incoming.length - valid.length;

    if (valid.length === 0) {
      setGlobalError("Please choose MP4, WebM, MOV, or M4V video files.");
      return;
    }

    const tooBig = valid.filter((f) => f.size > MAX_VIDEO_BYTES);
    const ok = valid.filter((f) => f.size <= MAX_VIDEO_BYTES);

    if (tooBig.length > 0) {
      setGlobalError(
        `${tooBig.length} file(s) skipped — max ${MAX_VIDEO_BYTES / (1024 * 1024)} MB each.`
      );
    }

    setVideos((prev) => {
      const room = MAX_FILES_PER_BATCH - prev.length;
      const toAdd = ok.slice(0, Math.max(0, room)).map(createImport);
      if (ok.length > room) {
        setGlobalError(`Maximum ${MAX_FILES_PER_BATCH} videos at once.`);
      }
      return [...prev, ...toAdd];
    });

    if (invalid > 0 && valid.length > 0) {
      setGlobalError(`${invalid} non-video file(s) ignored.`);
    }
  }, []);

  useEffect(() => {
    return () => {
      videos.forEach((v) => URL.revokeObjectURL(v.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
  }, []);

  function removeVideo(id: string) {
    setVideos((prev) => {
      const target = prev.find((v) => v.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((v) => v.id !== id);
    });
  }

  function updateVideo(id: string, patch: Partial<ImportedVideo>) {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...patch } : v))
    );
  }

  function toggleCheck(videoId: string, checkId: ChecklistId) {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? {
              ...v,
              checklist: {
                ...v.checklist,
                [checkId]: !v.checklist[checkId],
              },
            }
          : v
      )
    );
  }

  function getMetadata(video: ImportedVideo): SocialExportMetadata {
    return buildExportMetadata({
      fileName: video.file.name,
      fileSizeBytes: video.file.size,
      licenseSource: video.licenseSource,
      creatorName: video.creatorName,
      sourceUrl: video.sourceUrl,
      checklistDone: video.checklist,
    });
  }

  function exportSocialKit(video: ImportedVideo) {
    const meta = getMetadata(video);
    const base = video.file.name.replace(/\.[^.]+$/, "");
    downloadJsonFile(`${base}-license-metadata.json`, meta);
    downloadTextFile(`${base}-youtube-description.txt`, meta.suggestedYouTubeDescription);
    downloadTextFile(`${base}-facebook-caption.txt`, meta.suggestedFacebookCaption);
    downloadTextFile(
      `${base}-attribution.txt`,
      meta.attributionText || "No attribution required for this license."
    );
  }

  async function saveToServer(video: ImportedVideo) {
    const meta = getMetadata(video);
    if (!meta.readyForYouTube || !meta.readyForFacebook) {
      updateVideo(video.id, {
        uploadError: "Complete the copyright checklist before saving.",
      });
      return;
    }

    updateVideo(video.id, { uploading: true, uploadError: undefined });

    const formData = new FormData();
    formData.append("video", video.file);
    formData.append("metadata", JSON.stringify(meta, null, 2));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        updateVideo(video.id, {
          uploading: false,
          uploadError: data.error ?? "Upload failed",
        });
        return;
      }
      updateVideo(video.id, {
        uploading: false,
        savedUrl: data.url as string,
        uploadError: undefined,
      });
    } catch {
      updateVideo(video.id, {
        uploading: false,
        uploadError: "Network error during upload.",
      });
    }
  }

  function downloadForManualUpload(video: ImportedVideo) {
    const url = video.savedUrl
      ? `${window.location.origin}${video.savedUrl}`
      : video.previewUrl;
    const a = document.createElement("a");
    a.href = url;
    a.download = video.file.name;
    if (!video.savedUrl) a.target = "_blank";
    a.click();
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-8">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
            : "border-zinc-300 bg-white hover:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-950"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Drop videos from your desktop here
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          or click to browse — MP4, WebM, MOV (max{" "}
          {MAX_VIDEO_BYTES / (1024 * 1024)} MB each, up to {MAX_FILES_PER_BATCH}{" "}
          files)
        </p>
      </div>

      {globalError && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {globalError}
        </p>
      )}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
        <strong>Important:</strong> This tool helps you organize{" "}
        <em>already copyright-free</em> videos for Facebook & YouTube. It does
        not remove copyright from stolen content. Only upload videos you filmed
        yourself or downloaded from free-stock sites (Pexels, Mixkit, etc.).
      </div>

      {videos.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            Recommended workflow for social media
          </p>
          <ol className="mt-3 list-inside list-decimal space-y-2">
            <li>Download copyright-free clips from the home page sources (Pexels, Mixkit…)</li>
            <li>Import those files here from your desktop</li>
            <li>Select the correct license and complete the checklist</li>
            <li>Export description text → paste on YouTube & Facebook when uploading</li>
            <li>Upload the same video file manually to each platform</li>
          </ol>
        </div>
      )}

      <div className="space-y-6">
        {videos.map((video) => {
          const meta = getMetadata(video);
          const licenseInfo = LICENSE_OPTIONS.find(
            (o) => o.id === video.licenseSource
          );

          return (
            <article
              key={video.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {video.file.name}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {formatFileSize(video.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeVideo(video.id)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <video
                  src={video.previewUrl}
                  controls
                  playsInline
                  className="aspect-video w-full rounded-lg bg-black"
                />

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Where did this video come from?
                    </label>
                    <select
                      value={video.licenseSource}
                      onChange={(e) =>
                        updateVideo(video.id, {
                          licenseSource: e.target.value as LicenseSource,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {LICENSE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {licenseInfo && (
                      <p className="mt-1 text-xs text-zinc-500">{licenseInfo.notes}</p>
                    )}
                  </div>

                  {(video.licenseSource === "pexels" ||
                    video.licenseSource === "pixabay" ||
                    video.licenseSource === "other-free") && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Creator / author name (optional)
                        </label>
                        <input
                          type="text"
                          value={video.creatorName}
                          onChange={(e) =>
                            updateVideo(video.id, { creatorName: e.target.value })
                          }
                          placeholder="e.g. John Doe"
                          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Source page URL
                        </label>
                        <input
                          type="url"
                          value={video.sourceUrl}
                          onChange={(e) =>
                            updateVideo(video.id, { sourceUrl: e.target.value })
                          }
                          placeholder="https://www.pexels.com/video/..."
                          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Copyright-free checklist (required for YouTube & Facebook)
                </p>
                <ul className="mt-2 space-y-2">
                  {SOCIAL_CHECKLIST_ITEMS.map((item) => (
                    <li key={item.id}>
                      <label className="flex cursor-pointer gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={video.checklist[item.id]}
                          onChange={() => toggleCheck(video.id, item.id)}
                          className="mt-0.5 rounded border-zinc-400"
                        />
                        {item.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {meta.readyForYouTube && meta.readyForFacebook ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    Ready for YouTube & Facebook
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Complete checklist to mark ready
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => exportSocialKit(video)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Export social media kit (TXT + JSON)
                </button>
                <button
                  type="button"
                  onClick={() => downloadForManualUpload(video)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Download video file
                </button>
                <button
                  type="button"
                  disabled={video.uploading}
                  onClick={() => saveToServer(video)}
                  className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                >
                  {video.uploading ? "Saving…" : "Save copy on server"}
                </button>
              </div>

              {video.uploadError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {video.uploadError}
                </p>
              )}

              {video.savedUrl && (
                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                  Saved:{" "}
                  <a
                    href={video.savedUrl}
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {video.savedUrl}
                  </a>{" "}
                  — use this link or download, then upload at YouTube Studio or
                  Facebook.
                </p>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Platform upload instructions
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                    <p className="font-medium">YouTube</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-400">
                      {meta.platformNotes.youtube.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                    <a
                      href="https://studio.youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-emerald-700 underline dark:text-emerald-400"
                    >
                      Open YouTube Studio →
                    </a>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                    <p className="font-medium">Facebook / Reels</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-600 dark:text-zinc-400">
                      {meta.platformNotes.facebook.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                    <a
                      href="https://business.facebook.com/creatorstudio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-emerald-700 underline dark:text-emerald-400"
                    >
                      Open Meta Creator Studio →
                    </a>
                  </div>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
}
