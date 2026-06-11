const MAX_CREEP_ESTIMATE_MS = 90_000;
const CREEP_TICK_MS = 600;

/** Keeps the bar moving — always +1 at each tick until cap (never appears frozen). */
export function startProgressCreep(
  onValue: (value: number) => void,
  start: number,
  cap: number,
  estimateMs: number
): () => void {
  const cappedEstimate = Math.min(
    Math.max(estimateMs, 20_000),
    MAX_CREEP_ESTIMATE_MS
  );
  let best = start;
  let lastEmitted = Math.round(start);
  const t0 = Date.now();

  onValue(lastEmitted);

  const id = setInterval(() => {
    const elapsed = Date.now() - t0;
    const timeBased =
      start + (cap - start) * Math.min(1, elapsed / cappedEstimate);
    best = Math.max(best, timeBased);

    let emit = Math.round(best);
    if (emit <= lastEmitted && lastEmitted < cap) {
      emit = lastEmitted + 1;
    }
    emit = Math.min(cap, emit);

    if (emit > lastEmitted) {
      lastEmitted = emit;
      onValue(emit);
    }
  }, CREEP_TICK_MS);

  return () => clearInterval(id);
}

export function bumpProgress(
  current: number,
  next: number,
  onValue: (value: number) => void
): number {
  const value = Math.max(current, next);
  onValue(value);
  return value;
}
