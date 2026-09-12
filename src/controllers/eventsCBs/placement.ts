import type { Coord, ShipKey } from "../../lib/GameBoard";
import { game } from "../../lib/gameDriver";
import { renderView } from "../../lib/renderUtilities";
import { ui } from "../../lib/uiState";

function activeSetupBoard() {
  const state = game.setupBoard;
  return state.setupPhase === "player1"
    ? state.player1Board
    : state.player2Board;
}

function previewCells(startX: number, startY: number, length: number): Coord[] {
  const cells: Coord[] = [];
  for (let i = 0; i < length; i++) {
    cells.push(
      ui.orientation === "horizontal"
        ? [startX + i, startY]
        : [startX, startY + i],
    );
  }
  return cells;
}

function clearPreview(root: ParentNode) {
  root.querySelectorAll(".preview-valid, .preview-invalid").forEach((el) => {
    el.classList.remove("preview-valid", "preview-invalid");
  });
}

export function handleDragStart(e: DragEvent) {
  const target = e.target as HTMLElement;
  const piece = target.closest<HTMLElement>(".ship-piece");
  if (!piece) return;

  const key = piece.dataset["ship"];
  const length = Number(piece.dataset["length"]);
  if (!key || !length) return;

  ui.dragging = { key, length };
  e.dataTransfer?.setData("text/plain", key);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}

export function handleBoardDragOver(e: DragEvent) {
  const target = e.target as HTMLElement;
  const board = target.closest<HTMLElement>("#ownBoard");
  const cell = target.closest<HTMLElement>("[data-cord]");
  if (!board || !cell || !ui.dragging) return;

  e.preventDefault();
  const cordStr = cell.dataset["cord"];
  if (!cordStr) return;
  const [x, y] = cordStr.split(",").map(Number) as [number, number];
  const coords = previewCells(x, y, ui.dragging.length);

  clearPreview(board);
  const valid = activeSetupBoard().isValidPlacement(coords);
  coords.forEach(([cx, cy]) => {
    board
      .querySelector(`[data-cord="${cx},${cy}"]`)
      ?.classList.add(valid ? "preview-valid" : "preview-invalid");
  });
}

export function handleBoardDrop(e: DragEvent) {
  const target = e.target as HTMLElement;
  const board = target.closest<HTMLElement>("#ownBoard");
  const cell = target.closest<HTMLElement>("[data-cord]");
  if (!board || !cell || !ui.dragging) return;
  e.preventDefault();

  const cordStr = cell.dataset["cord"];
  if (!cordStr) return;
  const [x, y] = cordStr.split(",").map(Number) as [number, number];
  const coords = previewCells(x, y, ui.dragging.length);

  activeSetupBoard().placeShipManually(ui.dragging.key as ShipKey, coords);

  ui.dragging = null;
  renderView("setup");
}

export function handleDragEnd(_e: DragEvent) {
  ui.dragging = null;
  document
    .querySelectorAll(".preview-valid, .preview-invalid")
    .forEach((el) => {
      el.classList.remove("preview-valid", "preview-invalid");
    });
}
