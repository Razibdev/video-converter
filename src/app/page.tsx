import { ApiVideoGallery } from "@/components/ApiVideoGallery";
import { SelfHostedVideo } from "@/components/SelfHostedVideo";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VideoSourceSection } from "@/components/VideoSourceSection";
import {
  ARCHIVE_SAMPLE,
  MIXKIT_SAMPLE,
  VIDEO_SOURCE_METHODS,
  WIKIMEDIA_SAMPLE,
} from "@/lib/video-sources";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Next.js demo
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Copyright-free video — 6 ways
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            This project shows multiple legal ways to add stock and open-license
            videos to a Next.js app: direct CDN links, self-hosting, Pexels &
            Pixabay APIs, Wikimedia Commons, and Internet Archive.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Import from desktop
            </a>
            <a
              href="/studio"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-600 px-5 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
            >
              Same video → many versions (4K, zoom, fade…)
            </a>
          </div>
          <nav className="mt-6 flex flex-wrap gap-2">
            {VIDEO_SOURCE_METHODS.map((m) => (
              <a
                key={m.id}
                href={`#${m.id}`}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950"
              >
                {m.title.replace(/^\d+\.\s/, "")}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {VIDEO_SOURCE_METHODS.map((source) => (
          <VideoSourceSection key={source.id} source={source}>
            {source.id === "mixkit-cdn" && (
              <VideoPlayer
                src={MIXKIT_SAMPLE.src}
                poster={MIXKIT_SAMPLE.poster}
                title="Mixkit waves"
                attribution={MIXKIT_SAMPLE.attribution}
                attributionUrl={MIXKIT_SAMPLE.attributionUrl}
              />
            )}

            {source.id === "self-hosted" && <SelfHostedVideo />}

            {source.id === "pexels-api" && (
              <ApiVideoGallery provider="pexels" defaultQuery="nature" />
            )}

            {source.id === "pixabay-api" && (
              <ApiVideoGallery provider="pixabay" defaultQuery="ocean" />
            )}

            {source.id === "wikimedia" && (
              <VideoPlayer
                src={WIKIMEDIA_SAMPLE.src}
                title="Wikimedia sample"
                attribution={WIKIMEDIA_SAMPLE.attribution}
                attributionUrl={WIKIMEDIA_SAMPLE.attributionUrl}
              />
            )}

            {source.id === "internet-archive" && (
              <VideoPlayer
                src={ARCHIVE_SAMPLE.src}
                title="Internet Archive sample"
                attribution={ARCHIVE_SAMPLE.attribution}
                attributionUrl={ARCHIVE_SAMPLE.attributionUrl}
              />
            )}
          </VideoSourceSection>
        ))}

        <section className="rounded-2xl border border-zinc-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Quick comparison
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-emerald-200 dark:border-emerald-900">
                  <th className="py-2 pr-4 font-medium">Method</th>
                  <th className="py-2 pr-4 font-medium">API key</th>
                  <th className="py-2 pr-4 font-medium">Best for</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300">
                <tr className="border-b border-emerald-100 dark:border-emerald-900/50">
                  <td className="py-2 pr-4">Mixkit CDN</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2">Fast prototypes, backgrounds</td>
                </tr>
                <tr className="border-b border-emerald-100 dark:border-emerald-900/50">
                  <td className="py-2 pr-4">Self-hosted</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2">Production control, offline</td>
                </tr>
                <tr className="border-b border-emerald-100 dark:border-emerald-900/50">
                  <td className="py-2 pr-4">Pexels / Pixabay API</td>
                  <td className="py-2 pr-4">Free key</td>
                  <td className="py-2">Searchable libraries in your app</td>
                </tr>
                <tr className="border-b border-emerald-100 dark:border-emerald-900/50">
                  <td className="py-2 pr-4">Wikimedia</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2">Educational / documentary</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Internet Archive</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2">Public domain & archival media</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
        Always verify license terms before shipping to production.
      </footer>
    </div>
  );
}
