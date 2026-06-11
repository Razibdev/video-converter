import { MAX_VIDEO_BYTES } from "@/lib/upload-config";

export async function fetchUrlAsVideoFile(
  url: string,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not download video (${res.status})`);
  }

  const total = Number(res.headers.get("content-length") ?? 0);
  const body = res.body;

  let blob: Blob;

  if (body && total > 0) {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    onProgress?.(0);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress?.(Math.min(99, Math.round((received / total) * 100)));
    }

    blob = new Blob(chunks as BlobPart[]);
    onProgress?.(100);
  } else {
    // No Content-Length — read body once via blob()
    onProgress?.(0);
    blob = await res.blob();
    onProgress?.(100);
  }

  if (blob.size > MAX_VIDEO_BYTES) {
    throw new Error(
      `Video is too large (${(blob.size / (1024 * 1024)).toFixed(1)} MB). Max ${MAX_VIDEO_BYTES / (1024 * 1024)} MB.`
    );
  }

  const type = blob.type || guessMimeFromName(fileName);
  return new File([blob], fileName, { type });
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return "video/mp4";
}
