import { LEAGUES } from "@/data/leagues";
import { readDb } from "@/lib/db";
import FinishedPanel from "@/components/panels/finished-panel";
import { groupByLeague } from "@/lib/group-by-league";

export const dynamic = "force-dynamic";

export default async function LastgameSlot() {
  const db = await readDb();
  const grouped = groupByLeague(
    db.matchesFinished ?? [],
    (a, b) => new Date(b.utcDate) - new Date(a.utcDate),
  );
  return <FinishedPanel leagues={LEAGUES} data={grouped} />;
}
