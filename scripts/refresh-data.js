#!/usr/bin/env node
// npm run refresh:data 진입점.
// Football-data.org → 가공 → PostgreSQL upsert 파이프라인을 한 번 실행한다.

import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);

// .env 자동 로드 (dotenv가 설치돼 있으면 사용, 없으면 무시 — Node 20+는 --env-file 옵션도 가능)
try {
  const dotenv = require("dotenv");
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
} catch {
  // dotenv 없어도 동작하도록 무시 (CI 등에서는 환경변수가 직접 주입됨)
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "[refresh] DATABASE_URL 환경변수가 설정되어 있지 않습니다. .env를 확인하세요.",
    );
    process.exit(1);
  }
  if (!process.env.FOOTBALL_DATA_API_TOKEN && !process.env.FD_TOKEN) {
    console.error(
      "[refresh] FOOTBALL_DATA_API_TOKEN 환경변수가 설정되어 있지 않습니다. .env를 확인하세요.",
    );
    process.exit(1);
  }

  const { refreshAll, getSeasonRange } = await import("../src/lib/refresh.js");
  const { prisma } = await import("../src/lib/prisma.js");

  const range = getSeasonRange();
  console.log(
    `[refresh] start season range ${range.from} ~ ${range.to}`,
  );

  const start = Date.now();
  const { results, failures } = await refreshAll(range);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  for (const result of results) {
    console.log(
      `[refresh] ${result.league} (season ${result.season}) — upcoming ${result.upcoming}, finished ${result.finished}, standings ${result.standingsUpdated}, scorers ${result.scorersUpdated}`,
    );
  }
  if (failures.length > 0) {
    console.error(
      `[refresh] ${failures.length} league(s) failed: ${failures
        .map((f) => f.league)
        .join(", ")}`,
    );
  }
  console.log(`[refresh] done in ${elapsed}s`);

  await prisma.$disconnect();

  if (failures.length > 0 && results.length === 0) {
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error("[refresh] fatal error:", error?.message ?? error);
  try {
    const { prisma } = await import("../src/lib/prisma.js");
    await prisma.$disconnect();
  } catch {
    // prisma 로드 실패 시 무시
  }
  process.exit(1);
});
