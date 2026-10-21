export interface StatsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface GameStats {
  wins: number;
  losses: number;
  gamesPlayed: number;
}

export const STORAGE_KEY = "battleship-vs-computer-stats";

const DEFAULT_STATS: GameStats = { wins: 0, losses: 0, gamesPlayed: 0 };

function isGameStats(value: unknown): value is GameStats {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["wins"] === "number" &&
    typeof candidate["losses"] === "number" &&
    typeof candidate["gamesPlayed"] === "number"
  );
}

function defaultStorage(): StatsStorage {
  return window.localStorage;
}

// Reads the persisted vs-computer win/loss record, falling back to zeroed
// defaults for a first run, corrupted JSON, or a value of the wrong shape
// (e.g. written by an incompatible future/past version of this module).
export function getStats(storage: StatsStorage = defaultStorage()): GameStats {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_STATS;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isGameStats(parsed) ? parsed : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

export function recordResult(
  won: boolean,
  storage: StatsStorage = defaultStorage(),
): GameStats {
  const current = getStats(storage);
  const updated: GameStats = {
    wins: current.wins + (won ? 1 : 0),
    losses: current.losses + (won ? 0 : 1),
    gamesPlayed: current.gamesPlayed + 1,
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function resetStats(storage: StatsStorage = defaultStorage()): GameStats {
  storage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATS));
  return DEFAULT_STATS;
}
