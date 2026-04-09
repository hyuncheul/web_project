import { LEAGUES } from "@/data/leagues";

export function groupByLeague(items, sorter) {
  const grouped = {};
  for (const league of LEAGUES) {
    grouped[league.code] = [];
  }
  for (const item of items) {
    if (!item?.leagueCode) continue;
    if (!grouped[item.leagueCode]) {
      grouped[item.leagueCode] = [];
    }
    grouped[item.leagueCode].push(item);
  }
  if (typeof sorter === "function") {
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort(sorter);
    });
  }
  return grouped;
}
