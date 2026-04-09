import { LEAGUES } from "@/data/leagues";
import { readDb, writeDbAtomic } from "./db";

const BASE_URL = "https://api.football-data.org/v4";
const MATCH_STATUS = "SCHEDULED,TIMED,IN_PLAY,PAUSED,FINISHED";

function formatDateInput(value) {
  if (!value) return null;
  return value.slice(0, 10);
}

export function getSeasonRange() {
  const now = new Date();
  const utcMonth = now.getUTCMonth();
  const utcYear = now.getUTCFullYear();
  const seasonYear = utcMonth >= 6 ? utcYear : utcYear - 1;
  const fromDate = new Date(Date.UTC(seasonYear, 6, 1));
  const toDate = new Date(Date.UTC(seasonYear + 1, 5, 30));
  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
  };
}

function normalizeRange(from, to) {
  const seasonRange = getSeasonRange();
  return {
    from: formatDateInput(from) ?? seasonRange.from,
    to: formatDateInput(to) ?? seasonRange.to,
  };
}

export async function refreshLeague({ league, from, to }) {
  if (!league) {
    throw new Error("league parameter is required");
  }
  const token = process.env.FD_TOKEN;
  if (!token) {
    throw new Error("FD_TOKEN environment variable is missing");
  }

  const range = normalizeRange(from, to);
  const db = await readDb();

  const mappedMatches = await fetchMatches(league, range, token);
  const { upcomingMatches, finishedMatches } = splitMatches(mappedMatches);


  const standingsSnapshot = await fetchStandings(league, token);
  const scorersSnapshot = await fetchScorers(league, token);

  const nowIso = new Date().toISOString();

  const updatedDb = {
    ...db,
    meta: {
      ...(db.meta ?? {}),
      updatedAt: nowIso,
      leagues: Array.from(new Set([...(db.meta?.leagues ?? []), league]))
    },
    matchesUpcoming: mergeLeagueData(
      db.matchesUpcoming,
      upcomingMatches,
      league,
      (a, b) => new Date(a.utcDate) - new Date(b.utcDate),
    ),
    matchesFinished: mergeLeagueData(
      db.matchesFinished,
      finishedMatches,
      league,
      (a, b) => new Date(b.utcDate) - new Date(a.utcDate),
    ),
    standings: mergeLeagueData(
      db.standings,
      standingsSnapshot,
      league,
      (a, b) => a.position - b.position,
    ),
    scorers: mergeLeagueData(
      db.scorers,
      scorersSnapshot,
      league,
      (a, b) => a.rank - b.rank,
    ),
  };

  await writeDbAtomic(updatedDb);

  return {
    league,
    upcoming: upcomingMatches.length,
    finished: finishedMatches.length,
    standingsUpdated: standingsSnapshot.length,
    scorersUpdated: scorersSnapshot.length
  };
}

export async function refreshAll(range = getSeasonRange()) {
  const results = [];
  for (const league of LEAGUES) {
    const result = await refreshLeague({
      league: league.code,
      from: range.from,
      to: range.to,
    });
    results.push(result);
  }
  return results;
}

async function fetchMatches(league, range, token) {
  const qs = new URLSearchParams({
    status: MATCH_STATUS,
    dateFrom: range.from,
    dateTo: range.to,
  });
  const url = `${BASE_URL}/competitions/${league}/matches?${qs.toString()}`;
  const data = await requestFd(url, token);
  if (!Array.isArray(data.matches)) return [];
  return data.matches
    .map((match) => mapMatch(match, league))
    .filter(Boolean);
}

async function fetchStandings(league, token) {
  const url = `${BASE_URL}/competitions/${league}/standings`;
  const data = await requestFd(url, token);
  const seasonLabel =
    data.season?.startDate?.slice(0, 4) ??
    data.season?.endDate?.slice(0, 4) ??
    new Date().getUTCFullYear().toString();
  const total = Array.isArray(data.standings)
    ? data.standings.find((entry) => entry.type === "TOTAL")
    : null;
  if (!total || !Array.isArray(total.table)) {
    return [];
  }
  return total.table
    .map((row) => {
      if (!row.team?.id) return null;
      return {
        leagueCode: league,
        season: seasonLabel,
        position: row.position,
        teamId: row.team.id,
        teamName: row.team.name,
        crest: row.team.crest ?? "",
        played: row.playedGames ?? 0,
        won: row.won ?? 0,
        draw: row.draw ?? 0,
        lost: row.lost ?? 0,
        gf: row.goalsFor ?? 0,
        ga: row.goalsAgainst ?? 0,
        gd: row.goalDifference ?? 0,
        points: row.points ?? 0,
      };
    })
    .filter(Boolean);
}

async function fetchScorers(league, token) {
  const url = `${BASE_URL}/competitions/${league}/scorers?limit=50`;
  const data = await requestFd(url, token);
  const seasonLabel =
    data.season?.startDate?.slice(0, 4) ??
    new Date().getUTCFullYear().toString();
  if (!Array.isArray(data.scorers)) {
    return [];
  }
  return data.scorers
    .map((entry, index) => {
      if (!entry.player?.id) return null;
      return {
        leagueCode: league,
        season: seasonLabel,
        rank: entry.rank ?? index + 1,
        playerId: entry.player.id,
        playerName: entry.player.name,
        teamId: entry.team?.id ?? null,
        teamName: entry.team?.name ?? "",
        goals: entry.goals ?? 0,
        points: entry.goals ?? 0,
      };
    })
    .filter(Boolean);
}

function splitMatches(matches) {
  const upcoming = [];
  const finished = [];
  matches.forEach((match) => {
    if (match.status === "FINISHED") {
      finished.push(match);
    } else {
      upcoming.push(match);
    }
  });
  return { upcomingMatches: upcoming, finishedMatches: finished };
}

function mergeLeagueData(source = [], next = [], league, sorter) {
  const filtered = (source ?? []).filter(
    (item) => item.leagueCode !== league,
  );
  const combined = [...filtered, ...next];
  return typeof sorter === "function" ? combined.sort(sorter) : combined;
}

function resolveLatestFinished(existingDate, finishedMatches) {
  let latest = existingDate ? new Date(existingDate).getTime() : null;
  finishedMatches.forEach((match) => {
    if (!match?.utcDate) return;
    const time = new Date(match.utcDate).getTime();
    if (Number.isNaN(time)) return;
    if (latest === null || time > latest) {
      latest = time;
    }
  });
  return latest !== null ? new Date(latest).toISOString() : existingDate ?? null;
}

async function requestFd(url, token) {
  const res = await fetch(url, {
    headers: {
      "X-Auth-Token": token,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`FD error ${res.status}: ${detail}`);
  }
  return res.json();
}

function mapMatch(match, leagueCode) {
  if (!match?.id) return null;
  const home = match.homeTeam;
  const away = match.awayTeam;
  if (!home?.id || !away?.id) return null;
  if (!home?.name || !away?.name) return null;
  if (!match.utcDate || !match.status) return null;

  const fullTime = match.score?.fullTime ?? {};

  return {
    id: match.id,
    leagueCode,
    utcDate: match.utcDate,
    status: match.status,
    matchday: match.matchday ?? 0,
    home: {
      id: home.id,
      name: home.name,
      crest: home.crest ?? "",
    },
    away: {
      id: away.id,
      name: away.name,
      crest: away.crest ?? "",
    },
    score: {
      ftH:
        fullTime.home === null || fullTime.home === undefined
          ? null
          : fullTime.home,
      ftA:
        fullTime.away === null || fullTime.away === undefined
          ? null
          : fullTime.away,
    },
  };
}
