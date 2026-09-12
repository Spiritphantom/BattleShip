import { describe, test, expect } from "vitest";
import { Computer, Player } from "../src/lib/Player";
import {
  attacker,
  displayBoards,
  driver,
  opponentInd,
  ownBoard,
  targetBoard,
} from "../src/lib/gameDriver";

describe("gameDriver", () => {
  describe("vs-computer mode", () => {
    test("places the computer's fleet immediately, leaves player1 empty", () => {
      const state = driver("vs-computer");
      expect(state.player2Board.isFullyPlaced()).toBe(true);
      expect(state.player1Board.isFullyPlaced()).toBe(false);
    });

    test("player2 is a Computer instance", () => {
      const state = driver("vs-computer");
      expect(state.player2).toBeInstanceOf(Computer);
    });

    test("starts on player1's setup phase", () => {
      const state = driver("vs-computer");
      expect(state.setupPhase).toBe("player1");
      expect(state.currentPlayer).toBe("player1");
    });
  });

  describe("vs-human mode", () => {
    test("leaves both fleets empty for manual placement", () => {
      const state = driver("vs-human");
      expect(state.player1Board.isFullyPlaced()).toBe(false);
      expect(state.player2Board.isFullyPlaced()).toBe(false);
    });

    test("player2 is a plain Player, not a Computer", () => {
      const state = driver("vs-human");
      expect(state.player2).toBeInstanceOf(Player);
      expect(state.player2).not.toBeInstanceOf(Computer);
    });
  });

  describe("perspective helpers", () => {
    test("ownBoard/targetBoard/attacker resolve to the correct side for player1", () => {
      const state = driver("vs-computer");
      expect(ownBoard(state)).toBe(state.player1Board);
      expect(targetBoard(state)).toBe(state.player2Board);
      expect(attacker(state)).toBe(state.player1);
    });

    test("ownBoard/targetBoard/attacker resolve to the correct side for player2", () => {
      const state = driver("vs-computer");
      state.currentPlayer = "player2";
      expect(ownBoard(state)).toBe(state.player2Board);
      expect(targetBoard(state)).toBe(state.player1Board);
      expect(attacker(state)).toBe(state.player2);
    });
  });

  describe("displayBoards", () => {
    test("vs-computer never flips even when it's the computer's turn", () => {
      const state = driver("vs-computer");
      const before = displayBoards(state);
      expect(before.own).toBe(state.player1Board);
      expect(before.target).toBe(state.player2Board);

      state.currentPlayer = "player2";
      const during = displayBoards(state);
      expect(during.own).toBe(state.player1Board);
      expect(during.target).toBe(state.player2Board);
    });

    test("vs-human flips perspective with currentPlayer, matching ownBoard/targetBoard", () => {
      const state = driver("vs-human");
      state.currentPlayer = "player2";
      const result = displayBoards(state);
      expect(result.own).toBe(ownBoard(state));
      expect(result.target).toBe(targetBoard(state));
      expect(result.own).toBe(state.player2Board);
    });
  });

  describe("opponentInd", () => {
    test("flips between player1 and player2", () => {
      expect(opponentInd("player1")).toBe("player2");
      expect(opponentInd("player2")).toBe("player1");
    });
  });
});
