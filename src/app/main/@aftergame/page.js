import { LEAGUES } from "@/data/leagues";
import { readDb } from "@/lib/db";
import UpcomingPanel from "@/components/panels/upcoming-panel";
import { groupByLeague } from "@/lib/group-by-league";

export const dynamic = "force-dynamic";

export default async function AftergameSlot() {
  const db = await readDb();
  const grouped = groupByLeague(
    db.matchesUpcoming ?? [],
    (a, b) => new Date(a.utcDate) - new Date(b.utcDate),
  );
  return <UpcomingPanel leagues={LEAGUES} data={grouped} />;
}
