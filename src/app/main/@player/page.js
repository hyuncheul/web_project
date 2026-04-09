import { LEAGUES } from "@/data/leagues";
import { readDb } from "@/lib/db";
import ScorersPanel from "@/components/panels/scorers-panel";
import { groupByLeague } from "@/lib/group-by-league";

export const dynamic = "force-dynamic";

export default async function PlayerSlot() {
  const db = await readDb();
  const grouped = groupByLeague(
    db.scorers ?? [],
    (a, b) => a.rank - b.rank,
  );
  return <ScorersPanel leagues={LEAGUES} data={grouped} />;
}
