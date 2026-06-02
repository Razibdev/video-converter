"use client";

import { useEffect, useState } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { SELF_HOSTED_SAMPLE } from "@/lib/video-sources";

export function SelfHostedVideo() {
  const [status, setStatus] = useState<"checking" | "ready" | "missing">(
    "checking"
  );

  useEffect(() => {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = SELF_HOSTED_SAMPLE.src;

    const onReady = () => setStatus("ready");
    const onFail = () => setStatus("missing");

    probe.addEventListener("loadedmetadata", onReady);
    probe.addEventListener("error", onFail);

    return () => {
      probe.removeEventListener("loadedmetadata", onReady);
      probe.removeEventListener("error", onFail);
    };
  }, []);

  if (status === "checking") {
    return (
      <p className="text-sm text-zinc-500">Checking for public/videos/sample.mp4…</p>
    );
  }

  if (status === "missing") {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          Add a video file to enable this demo
        </p>
        <ol className="mt-3 list-inside list-decimal space-y-2">
          <li>
            Download a free clip from{" "}
            <a
              href="https://mixkit.co/free-stock-video/"
              className="text-emerald-700 underline dark:text-emerald-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mixkit
            </a>
            ,{" "}
            <a
              href="https://www.pexels.com/videos/"
              className="text-emerald-700 underline dark:text-emerald-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pexels
            </a>
            , or{" "}
            <a
              href="https://pixabay.com/videos/"
              className="text-emerald-700 underline dark:text-emerald-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pixabay
            </a>
          </li>
          <li>
            Save as{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              public/videos/sample.mp4
            </code>
          </li>
          <li>Refresh this page</li>
        </ol>
      </div>
    );
  }

  return (
    <VideoPlayer
      src={SELF_HOSTED_SAMPLE.src}
      poster={SELF_HOSTED_SAMPLE.poster}
      title="Self-hosted sample"
      attribution={SELF_HOSTED_SAMPLE.attribution}
    />
  );
}
