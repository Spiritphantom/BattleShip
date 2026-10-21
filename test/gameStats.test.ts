import { describe, test, expect } from "vitest";
import {
  getStats,
  recordResult,
  resetStats,
  STORAGE_KEY,
  type StatsStorage,
} from "../src/lib/gameStats";

function fakeStorage(initial: Record<string, string> = {}): StatsStorage {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => (store.has(key) ? (store.get(key) ?? null) : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

describe("gameStats", () => {
  test("getStats returns zeroed defaults when nothing stored", () => {
    const storage = fakeStorage();
    expect(getStats(storage)).toEqual({ wins: 0, losses: 0, gamesPlayed: 0 });
  });

  test("recordResult(true) increments wins and gamesPlayed", () => {
    const storage = fakeStorage();
    const result = recordResult(true, storage);
    expect(result).toEqual({ wins: 1, losses: 0, gamesPlayed: 1 });
  });

  test("recordResult(false) increments losses and gamesPlayed", () => {
    const storage = fakeStorage();
    const result = recordResult(false, storage);
    expect(result).toEqual({ wins: 0, losses: 1, gamesPlayed: 1 });
  });

  test("recordResult persists and accumulates across calls", () => {
    const storage = fakeStorage();
    recordResult(true, storage);
    recordResult(true, storage);
    recordResult(false, storage);
    expect(getStats(storage)).toEqual({ wins: 2, losses: 1, gamesPlayed: 3 });
  });

  test("resetStats zeroes everything and persists the reset", () => {
    const storage = fakeStorage();
    recordResult(true, storage);
    const result = resetStats(storage);
    expect(result).toEqual({ wins: 0, losses: 0, gamesPlayed: 0 });
    expect(getStats(storage)).toEqual({ wins: 0, losses: 0, gamesPlayed: 0 });
  });

  test("falls back to defaults when stored value is corrupted JSON", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: "{not valid json" });
    expect(getStats(storage)).toEqual({ wins: 0, losses: 0, gamesPlayed: 0 });
  });

  test("falls back to defaults when stored value has the wrong shape", () => {
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ foo: "bar" }) });
    expect(getStats(storage)).toEqual({ wins: 0, losses: 0, gamesPlayed: 0 });
  });
});
