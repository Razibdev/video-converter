interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  attribution?: string;
  attributionUrl?: string;
}

export function VideoPlayer({
  src,
  poster,
  title,
  attribution,
  attributionUrl,
}: VideoPlayerProps) {
  return (
    <figure className="overflow-hidden rounded-xl border border-zinc-200 bg-black shadow-sm dark:border-zinc-800">
      <video
        className="aspect-video w-full"
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        aria-label={title}
      >
        <track kind="captions" />
        Your browser does not support HTML5 video.
      </video>
      {attribution && (
        <figcaption className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Source:{" "}
          {attributionUrl ? (
            <a
              href={attributionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
            >
              {attribution}
            </a>
          ) : (
            attribution
          )}
        </figcaption>
      )}
    </figure>
  );
}
