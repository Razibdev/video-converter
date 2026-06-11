import { VideoVariantStudio } from "@/components/VideoVariantStudio";

export const metadata = {
  title: "Video Variant Studio — 4K, Zoom, Fade & More",
  description:
    "Export the same video in many ways: 4K, 1080p, Reels 9:16, zoom, fade in/out, speed, and color styles.",
};

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Video Variant Studio
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Pick copyright-free footage, select all the options you want (4K,
            Reels, zoom, fade, speed, mirror, color…), and generate{" "}
            <strong>one combined video</strong> with a live progress bar.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <VideoVariantStudio />
      </main>
    </div>
  );
}
