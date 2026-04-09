import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src", "data");
export const DB_PATH = path.join(DATA_DIR, "db.json");
const TEMP_PATH = `${DB_PATH}.tmp`;

export const defaultDb = {
  meta: {
    updatedAt: null,
    leagues: ["PL", "PD", "SA", "BL1", "FL1", "CL"]
  },
  matchesUpcoming: [],
  matchesFinished: [],
  standings: [],
  scorers: [],
};

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readDb() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return JSON.parse(JSON.stringify(defaultDb));
    }
    throw error;
  }
}

export async function writeDbAtomic(data) {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await ensureDataDir();
  await fs.writeFile(TEMP_PATH, serialized, "utf8");
  await fs.rename(TEMP_PATH, DB_PATH);
}

export const leagueSet = new Set(defaultDb.meta.leagues);
