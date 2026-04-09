import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MainPage() {
  const db = await readDb();
  const summary = {
    updatedAt: db.meta?.updatedAt ?? null,
    leagues: db.meta?.leagues?.length ?? 0,
    upcoming: db.matchesUpcoming?.length ?? 0,
    finished: db.matchesFinished?.length ?? 0,
    standings: db.standings?.length ?? 0,
    scorers: db.scorers?.length ?? 0,
  };
  console.log("[dashboard:data]", JSON.stringify(summary));
  return null;
}
