import { refreshAll, getSeasonRange } from "./refresh";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

async function runAll() {
  try {
    await refreshAll(getSeasonRange());
  } catch (error) {
    console.error("[scheduler] refresh failed:", error.message);
  }
}

function startScheduler() {
  const handles = [];
  runAll();
  const interval = setInterval(runAll, FIFTEEN_MINUTES);
  interval.unref?.();
  handles.push(interval);
  return handles;
}

let schedulerRef = null;

if (typeof window === "undefined") {
  if (!globalThis.__fdRefreshScheduler) {
    globalThis.__fdRefreshScheduler = startScheduler();
  }
  schedulerRef = globalThis.__fdRefreshScheduler;
}

export const scheduler = schedulerRef;
