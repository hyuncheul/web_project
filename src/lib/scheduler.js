import { getSeasonRange, refreshAll } from "./refresh.js";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

async function runAll() {
  try {
    const { failures } = await refreshAll(getSeasonRange());
    if (failures.length > 0) {
      console.warn(
        `[scheduler] ${failures.length} league(s) failed: ${failures
          .map((f) => `${f.league}(${f.error})`)
          .join("; ")}`,
      );
    }
  } catch (error) {
    console.error("[scheduler] refresh failed:", error?.message ?? error);
  }
}

function startScheduler() {
  const handles = [];
  // 백그라운드 스케줄러는 토큰/DB가 없으면 바로 실패하므로, 기본은 비활성.
  // 활성화하려면 ENABLE_REFRESH_SCHEDULER=true 를 .env에 추가한다.
  if (process.env.ENABLE_REFRESH_SCHEDULER !== "true") {
    return handles;
  }
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
