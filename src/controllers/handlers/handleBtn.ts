import type { GameMode } from "../../lib/gameDriver";
import { driver, game } from "../../lib/gameDriver";
import { renderView } from "../../lib/renderUtilities";
import { ui } from "../../lib/uiState";
import { gameOver } from "../helpers/gameOver";
import { goToBattle, goToNextSetupPhase } from "../helpers/phaseTransitions";

export function handleModeSelect(match: Element | null, _e: PointerEvent) {
  if (!match) return;
  const mode: GameMode =
    match.id === "mode-vs-human" ? "vs-human" : "vs-computer";
  game.setupBoard = driver(mode);
  ui.orientation = "horizontal";
  renderView("setup");
}

export function handleRotate(_match: Element | null, _e: PointerEvent) {
  ui.orientation = ui.orientation === "horizontal" ? "vertical" : "horizontal";
  renderView("setup");
}

export function handleAutoPlace(_match: Element | null, _e: PointerEvent) {
  const state = game.setupBoard;
  const board =
    state.setupPhase === "player1" ? state.player1Board : state.player2Board;
  board.placeShip();
  renderView("setup");
}

export function handleClearPlacement(_match: Element | null, _e: PointerEvent) {
  const state = game.setupBoard;
  const board =
    state.setupPhase === "player1" ? state.player1Board : state.player2Board;
  board.clearPlacements();
  renderView("setup");
}

export function handleConfirmPlacement(
  _match: Element | null,
  _e: PointerEvent,
) {
  const state = game.setupBoard;
  const board =
    state.setupPhase === "player1" ? state.player1Board : state.player2Board;
  if (!board.isFullyPlaced()) return;
  goToNextSetupPhase();
}

export function handlePassContinue(_match: Element | null, _e: PointerEvent) {
  goToBattle();
}

export function handleRetreat(_match: Element | null, _e: PointerEvent) {
  const state = game.setupBoard;
  const winnerName =
    state.mode === "vs-computer" ? "Computer" : "The other player";
  gameOver(winnerName);
}

export function handleNewMatch(_match: Element | null, _e: PointerEvent) {
  renderView("modeSelect");
}
