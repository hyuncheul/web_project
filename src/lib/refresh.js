import { LEAGUES } from "../data/leagues.js";
import { prisma } from "./prisma.js";
import {
  mapMatch,
  mapScorer,
  mapStandingRow,
  resolveSeasonLabel,
  splitMatches,
} from "./transform.js";

const BASE_URL = "https://api.football-data.org/v4";
const MATCH_STATUS = "SCHEDULED,TIMED,IN_PLAY,PAUSED,FINISHED";

function readToken() {
  // 새 이름(FOOTBALL_DATA_API_TOKEN) 우선, 기존 FD_TOKEN도 호환
  return (
    process.env.FOOTBALL_DATA_API_TOKEN || process.env.FD_TOKEN || null
  );
}

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
  const meta = LEAGUES.find((entry) => entry.code === league);
  if (!meta) {
    throw new Error(`unknown league: ${league}`);
  }
  const token = readToken();
  if (!token) {
    throw new Error(
      "FOOTBALL_DATA_API_TOKEN environment variable is missing",
    );
  }

  const range = normalizeRange(from, to);

  const { matches: matchPayload, season: matchSeason } = await fetchMatches(
    league,
    range,
    token,
  );
  const standingsPayload = await fetchStandings(league, token);
  const scorersPayload = await fetchScorers(league, token);

  const seasonLabel =
    resolveSeasonLabel(matchPayload) ||
    resolveSeasonLabel(standingsPayload) ||
    resolveSeasonLabel(scorersPayload) ||
    matchSeason;

  await upsertLeague({
    code: league,
    name: meta.name,
    season: seasonLabel,
  });

  const matchRows = (matchPayload.matches ?? [])
    .map((match) => mapMatch(match, league, seasonLabel))
    .filter(Boolean);

  const total = Array.isArray(standingsPayload.standings)
    ? standingsPayload.standings.find((entry) => entry.type === "TOTAL")
    : null;
  const standingRows = total?.table
    ? total.table
        .map((row) => mapStandingRow(row, league, seasonLabel))
        .filter(Boolean)
    : [];

  const scorerRows = Array.isArray(scorersPayload.scorers)
    ? scorersPayload.scorers
        .map((entry, index) => mapScorer(entry, index, league, seasonLabel))
        .filter(Boolean)
    : [];

  await upsertMatches(matchRows);
  await upsertStandings(standingRows);
  await upsertScorers(scorerRows);

  const { upcomingMatches, finishedMatches } = splitMatches(matchRows);

  return {
    league,
    season: seasonLabel,
    upcoming: upcomingMatches.length,
    finished: finishedMatches.length,
    standingsUpdated: standingRows.length,
    scorersUpdated: scorerRows.length,
  };
}

export async function refreshAll(range = getSeasonRange()) {
  const results = [];
  const failures = [];
  for (const league of LEAGUES) {
    try {
      const result = await refreshLeague({
        league: league.code,
        from: range.from,
        to: range.to,
      });
      results.push(result);
    } catch (error) {
      const message = error?.message ?? String(error);
      console.error(`[refresh] ${league.code} failed: ${message}`);
      failures.push({ league: league.code, error: message });
    }
  }
  return { results, failures };
}

async function fetchMatches(league, range, token) {
  const qs = new URLSearchParams({
    status: MATCH_STATUS,
    dateFrom: range.from,
    dateTo: range.to,
  });
  const url = `${BASE_URL}/competitions/${league}/matches?${qs.toString()}`;
  const data = await requestFd(url, token, league);
  const fallbackSeason = range.from.slice(0, 4);
  return { matches: data, season: fallbackSeason };
}

async function fetchStandings(league, token) {
  const url = `${BASE_URL}/competitions/${league}/standings`;
  return requestFd(url, token, league);
}

async function fetchScorers(league, token) {
  const url = `${BASE_URL}/competitions/${league}/scorers?limit=50`;
  return requestFd(url, token, league);
}

async function requestFd(url, token, league) {
  let res;
  try {
    res = await fetch(url, {
      headers: {
        "X-Auth-Token": token,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(
      `[FD ${league}] request failed for ${truncateUrl(url)}: ${error?.message ?? error}`,
    );
  }
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `[FD ${league}] ${res.status} ${res.statusText} for ${truncateUrl(url)}: ${detail.slice(0, 200)}`,
    );
  }
  return res.json();
}

function truncateUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

async function upsertLeague({ code, name, season }) {
  await prisma.league.upsert({
    where: { code_season: { code, season } },
    create: { code, name, season },
    update: { name },
  });
}

async function upsertMatches(rows) {
  for (const row of rows) {
    await prisma.match.upsert({
      where: { apiMatchId: row.apiMatchId },
      create: row,
      update: row,
    });
  }
}

async function upsertStandings(rows) {
  for (const row of rows) {
    await prisma.standing.upsert({
      where: {
        leagueCode_season_teamId: {
          leagueCode: row.leagueCode,
          season: row.season,
          teamId: row.teamId,
        },
      },
      create: row,
      update: row,
    });
  }
}

async function upsertScorers(rows) {
  for (const row of rows) {
    await prisma.scorer.upsert({
      where: {
        leagueCode_season_playerId: {
          leagueCode: row.leagueCode,
          season: row.season,
          playerId: row.playerId,
        },
      },
      create: row,
      update: row,
    });
  }
}
