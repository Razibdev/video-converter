import { DesktopVideoImport } from "@/components/DesktopVideoImport";

export const metadata = {
  title: "Import Desktop Videos | Social Media Ready",
  description:
    "Import videos from your computer, declare copyright-free license, and export descriptions for YouTube and Facebook uploads.",
};

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Import videos from your desktop
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Add one or more video files from your PC, confirm they are
            copyright-free for commercial social use, then export ready-made
            captions for YouTube and Facebook uploads.
          </p>
          <a
            href="/studio"
            className="mt-4 inline-block text-sm font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Need 4K, zoom, fade, Reels size? → Video Variant Studio
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <DesktopVideoImport />
      </main>
    </div>
  );
}
