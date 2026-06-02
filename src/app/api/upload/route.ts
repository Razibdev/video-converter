import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_BYTES,
} from "@/lib/upload-config";

export const runtime = "nodejs";

function isVideoMime(type: string): boolean {
  return (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(type);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("video");
    const metadataRaw = formData.get("metadata");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No video file provided." }, { status: 400 });
    }

    if (!isVideoMime(file.type) && !file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      return NextResponse.json(
        { error: "Only MP4, WebM, MOV, or M4V videos are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_VIDEO_BYTES / (1024 * 1024)} MB.` },
        { status: 400 }
      );
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const ext = path.extname(file.name) || ".mp4";
    const uploadDir = path.join(process.cwd(), "public", "uploads", id);
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const videoName = `video${ext}`;
    await writeFile(path.join(uploadDir, videoName), buffer);

    if (typeof metadataRaw === "string") {
      await writeFile(
        path.join(uploadDir, "license-metadata.json"),
        metadataRaw,
        "utf-8"
      );
    }

    const publicUrl = `/uploads/${id}/${videoName}`;

    return NextResponse.json({
      ok: true,
      id,
      url: publicUrl,
      message: "Video saved on server. Use this URL in your app or download for manual upload to YouTube/Facebook.",
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed. Try a smaller file or check server permissions." },
      { status: 500 }
    );
  }
}
