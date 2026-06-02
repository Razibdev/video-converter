import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  getAudioFilterForRecipe,
  type VariantRecipe,
} from "@/lib/video-variants";

const CORE_VERSION = "0.12.6";
const CORE_BASE = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let ffmpegSingleton: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export async function loadFfmpeg(
  onProgress?: (ratio: number) => void
): Promise<FFmpeg> {
  if (ffmpegSingleton?.loaded) return ffmpegSingleton;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress }) => {
      if (progress >= 0 && progress <= 1) onProgress?.(progress);
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${CORE_BASE}/ffmpeg-core.js`,
        "text/javascript"
      ),
      wasmURL: await toBlobURL(
        `${CORE_BASE}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    ffmpegSingleton = ffmpeg;
    return ffmpeg;
  })();

  return loadPromise;
}

export async function renderVideoVariant(
  ffmpeg: FFmpeg,
  file: File,
  recipe: VariantRecipe,
  durationSec: number,
  baseName: string
): Promise<{ blob: Blob; fileName: string }> {
  const inputName = "input.mp4";
  const outputName = `out-${recipe.id}.mp4`;
  const stem = baseName.replace(/\.[^.]+$/, "");
  const fileName = `${stem}-${recipe.outputSuffix}.mp4`;

  await ffmpeg.writeFile(inputName, await fetchFile(file));

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

  await ffmpeg.exec(args);

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(inputName);
  await ffmpeg.deleteFile(outputName);

  const bytes =
    data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));

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
