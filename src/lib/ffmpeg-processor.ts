import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import {
  buildCombinedVideoFilter,
  getAudioFilterForRecipe,
  type VariantRecipe,
} from "@/lib/video-variants";
import { bumpProgress, startProgressCreep } from "@/lib/progress-creep";

const CORE_VERSION = "0.12.6";
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let ffmpegSingleton: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

/** Download once — never call arrayBuffer() after reading the body stream. */
async function downloadToBlobUrl(
  url: string,
  mimeType: string,
  onRatio?: (ratio: number) => void
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} (${res.status})`);
  }

  const total = Number(res.headers.get("content-length") ?? 0);
  const body = res.body;

  if (!body) {
    onRatio?.(1);
    const buf = await res.arrayBuffer();
    return URL.createObjectURL(new Blob([buf], { type: mimeType }));
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  onRatio?.(0);
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total > 0) {
      onRatio?.(received / total);
    }
  }

  onRatio?.(1);
  return URL.createObjectURL(
    new Blob(chunks as BlobPart[], { type: mimeType })
  );
}

function attachEncodeProgress(
  ffmpeg: FFmpeg,
  durationSec: number,
  onRatio: (ratio: number) => void
): () => void {
  let lastRatio = 0;

  const report = (ratio: number) => {
    const clamped = Math.min(0.99, Math.max(0, ratio));
    if (clamped > lastRatio) {
      lastRatio = clamped;
      onRatio(clamped);
    }
  };

  const progressHandler = ({
    progress,
    time,
  }: {
    progress: number;
    time: number;
  }) => {
    if (durationSec > 0 && time > 0) {
      report(time / (durationSec * 1_000_000));
    }
    if (Number.isFinite(progress) && progress > 0) {
      report(progress);
    }
  };

  const logHandler = ({ message }: { message: string }) => {
    const timeUs = message.match(/out_time_us=(\d+)/);
    if (timeUs && durationSec > 0) {
      report(Number(timeUs[1]) / (durationSec * 1_000_000));
      return;
    }

    const timeMs = message.match(/out_time_ms=(\d+)/);
    if (timeMs && durationSec > 0) {
      report(Number(timeMs[1]) / (durationSec * 1_000_000));
      return;
    }

    const stamp = message.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (stamp && durationSec > 0) {
      const secs =
        Number(stamp[1]) * 3600 +
        Number(stamp[2]) * 60 +
        Number(stamp[3]);
      report(secs / durationSec);
    }
  };

  ffmpeg.on("progress", progressHandler);
  ffmpeg.on("log", logHandler);

  return () => {
    ffmpeg.off("progress", progressHandler);
    ffmpeg.off("log", logHandler);
  };
}

function estimateEncodeMs(durationSec: number, fileBytes: number): number {
  const sizeMb = fileBytes / (1024 * 1024);
  return Math.min(
    120_000,
    Math.max(30_000, durationSec * 4_000 + sizeMb * 3_000)
  );
}

export async function loadFfmpeg(
  onLoadProgress?: (percent: number) => void
): Promise<FFmpeg> {
  if (ffmpegSingleton?.loaded) {
    onLoadProgress?.(100);
    return ffmpegSingleton;
  }
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const ffmpeg = new FFmpeg();
      let pct = 0;
      const report = (next: number) => {
        pct = bumpProgress(pct, next, (v) => onLoadProgress?.(v));
      };

      report(0);
      const coreURL = await downloadToBlobUrl(
        `${CORE_BASE}/ffmpeg-core.js`,
        "text/javascript",
        (r) => report(Math.round(r * 35))
      );
      report(35);

      const wasmURL = await downloadToBlobUrl(
        `${CORE_BASE}/ffmpeg-core.wasm`,
        "application/wasm",
        (r) => report(35 + Math.round(r * 40))
      );
      report(75);

      const stopCreep = startProgressCreep(report, 76, 98, 60_000);
      try {
        await ffmpeg.load({ coreURL, wasmURL });
      } finally {
        stopCreep();
      }

      report(100);
      ffmpegSingleton = ffmpeg;
      return ffmpeg;
    } catch (err) {
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

export async function renderCombinedVideo(
  ffmpeg: FFmpeg,
  file: File,
  selectedIds: Iterable<string>,
  durationSec: number,
  baseName: string,
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob; fileName: string; labels: string[] }> {
  let pct = 0;
  const report = (next: number) => {
    pct = bumpProgress(pct, next, (v) => onProgress?.(v));
  };

  const { vf, audioFilter, suffix, labels } = buildCombinedVideoFilter(
    selectedIds,
    durationSec
  );
  const inputName = "input.mp4";
  const outputName = "out-combined.mp4";
  const stem = baseName.replace(/\.[^.]+$/, "");
  const fileName = `${stem}-${suffix}.mp4`;

  report(2);
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  report(8);

  const args = [
    "-i",
    inputName,
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-movflags",
    "+faststart",
  ];

  if (audioFilter) {
    args.push("-filter:a", audioFilter);
    args.push("-c:a", "aac", "-b:a", "128k");
  } else {
    args.push("-c:a", "aac", "-b:a", "128k");
  }

  args.push("-y", outputName);

  const encodeEstimate = estimateEncodeMs(durationSec, file.size);
  const stopCreep = startProgressCreep(
    (v) => report(v),
    9,
    97,
    encodeEstimate
  );

  const detach = attachEncodeProgress(ffmpeg, durationSec, (ratio) => {
    report(8 + Math.round(ratio * 88));
  });

  try {
    await ffmpeg.exec(args);
  } finally {
    detach();
    stopCreep();
  }

  report(98);
  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const bytes =
    data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));

  report(100);

  return {
    blob: new Blob([bytes as BlobPart], { type: "video/mp4" }),
    fileName,
    labels,
  };
}

export async function renderVideoVariant(
  ffmpeg: FFmpeg,
  file: File,
  recipe: VariantRecipe,
  durationSec: number,
  baseName: string,
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob; fileName: string }> {
  let pct = 0;
  const report = (next: number) => {
    pct = bumpProgress(pct, next, (v) => onProgress?.(v));
  };

  const inputName = "input.mp4";
  const outputName = `out-${recipe.id}.mp4`;
  const stem = baseName.replace(/\.[^.]+$/, "");
  const fileName = `${stem}-${recipe.outputSuffix}.mp4`;

  report(2);
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  report(8);

  const vf = recipe.buildVideoFilter(durationSec);
  const audioFilter = getAudioFilterForRecipe(recipe.id);

  const args = [
    "-i",
    inputName,
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-movflags",
    "+faststart",
  ];

  if (audioFilter) {
    args.push("-filter:a", audioFilter);
    args.push("-c:a", "aac", "-b:a", "128k");
  } else {
    args.push("-c:a", "aac", "-b:a", "128k");
  }

  args.push("-y", outputName);

  const stopCreep = startProgressCreep(
    (v) => report(v),
    9,
    94,
    estimateEncodeMs(durationSec, file.size)
  );

  const detach = attachEncodeProgress(ffmpeg, durationSec, (ratio) => {
    report(8 + Math.round(ratio * 86));
  });

  try {
    await ffmpeg.exec(args);
  } finally {
    detach();
    stopCreep();
  }

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const bytes =
    data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));

  report(100);

  return {
    blob: new Blob([bytes as BlobPart], { type: "video/mp4" }),
    fileName,
  };
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadBlobsAsZip(
  files: { blob: Blob; fileName: string }[],
  zipName: string
) {
  const { zipSync } = await import("fflate");

  const entries: Record<string, Uint8Array> = {};
  for (const { blob, fileName } of files) {
    entries[fileName] = new Uint8Array(await blob.arrayBuffer());
  }

  const zipped = zipSync(entries);
  downloadBlob(
    new Blob([zipped as BlobPart], { type: "application/zip" }),
    zipName
  );
}
