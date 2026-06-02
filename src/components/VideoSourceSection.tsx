import type { ReactNode } from "react";
import type { VideoSourceInfo } from "@/lib/video-sources";

interface VideoSourceSectionProps {
  source: VideoSourceInfo;
  children: ReactNode;
  footer?: ReactNode;
}

export function VideoSourceSection({
  source,
  children,
  footer,
}: VideoSourceSectionProps) {
  return (
    <section
      id={source.id}
      className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {source.title}
          </h2>
          <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {source.license}
          </p>
        </div>
        {source.requiresApiKey && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            API key in .env.local
          </span>
        )}
      </div>
      <p className="mb-5 text-zinc-600 dark:text-zinc-400">{source.description}</p>
      {children}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <a
          href={source.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          Official docs & license →
        </a>
        {footer}
      </div>
    </section>
  );
}
