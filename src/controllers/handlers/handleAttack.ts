import { attacker, game, opponentInd, targetBoard } from "../../lib/gameDriver";
import { renderView } from "../../lib/renderUtilities";
import { ui } from "../../lib/uiState";
import { Computer } from "../../lib/Player";
import { gameOver } from "../helpers/gameOver";

export function handleAttackClick(match: Element | null, _e: PointerEvent) {
  if (!match) return;
  const cell = match as HTMLElement;
  const coordStr = cell.dataset["cord"];
  if (!coordStr) return;
  const [x, y] = coordStr.split(",").map(Number) as [number, number];

  const state = game.setupBoard;
  const board = targetBoard(state);
  if (board.receivedAttacks.has(`${x},${y}`)) return;

  const player = attacker(state);
  const attacked = player.attack(x, y);
  if (!attacked) return;

  resolveAfterAttack(x, y);
}

function resolveAfterAttack(x: number, y: number) {
  const state = game.setupBoard;
  const board = targetBoard(state);
  const key = `${x},${y}`;
  const hit = board.successfulAttack.has(key);

  if (board.allSunk()) {
    const winnerIsPlayer1 = state.currentPlayer === "player1";
    const winnerName =
      state.mode === "vs-computer"
        ? winnerIsPlayer1
          ? "You"
          : "Computer"
        : winnerIsPlayer1
          ? "Player 1"
          : "Player 2";
    gameOver(winnerName);
    return;
  }

  if (hit) {
    // a hit earns another turn -- perspective doesn't change
    renderView("battle");
    if (state.mode === "vs-computer" && state.currentPlayer === "player2") {
      setTimeout(computerTurn, 500);
    }
    return;
  }

  // a miss passes the turn to the other side
  state.currentPlayer = opponentInd(state.currentPlayer);

  if (state.mode === "vs-computer") {
    renderView("battle");
    if (state.currentPlayer === "player2") {
      setTimeout(computerTurn, 500);
    }
    return;
  }

  // vs-human: hide the board behind a privacy interstitial before the
  // other player's turn reveals their own fleet
  ui.passMessage = `Pass the device to ${state.currentPlayer === "player1" ? "Player 1" : "Player 2"}`;
  ui.passNextView = "battle";
  renderView("passDevice");
}

function computerTurn() {
  const state = game.setupBoard;
  if (state.mode !== "vs-computer" || state.currentPlayer !== "player2") return;
  if (!(state.player2 instanceof Computer)) return;

  const result = state.player2.attack();
  if (!result || typeof result !== "string") return;

  const [x, y] = result.split(",").map(Number) as [number, number];
  resolveAfterAttack(x, y);
}
