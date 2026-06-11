interface ProgressBarProps {
  percent: number;
  label?: string;
  sublabel?: string;
  large?: boolean;
}

export function ProgressBar({
  percent,
  label,
  sublabel,
  large,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          {label && (
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {label}
            </p>
          )}
          {sublabel && (
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              {sublabel}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 font-bold tabular-nums text-emerald-700 dark:text-emerald-300 ${
            large ? "text-3xl" : "text-xl"
          }`}
        >
          {clamped}%
        </span>
      </div>
      <div
        className={`overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ${
          large ? "h-3" : "h-2"
        }`}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
