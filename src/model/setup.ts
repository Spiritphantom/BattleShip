import type { Driver } from "../lib/gameDriver";
import type { PageData } from "../lib/Page";
import { ui } from "../lib/uiState";
import { buildPlacementCells } from "./components/boards";
import { shipTrayView } from "./components/shipTray";

export function getSetupData(state: Driver): PageData {
  const isPlayer1 = state.setupPhase === "player1";
  const activeBoard = isPlayer1 ? state.player1Board : state.player2Board;
  const label =
    state.mode === "vs-computer"
      ? "Place your fleet"
      : isPlayer1
        ? "Player 1: place your fleet"
        : "Player 2: place your fleet";

  return {
    tag: "main",
    id: "main",
    content: [
      { tag: "h2", id: "setupTitle", content: label },
      {
        tag: "div",
        id: "setupLayout",
        content: [
          ...buildPlacementCells(activeBoard),
          shipTrayView(activeBoard, ui.orientation),
        ],
      },
      {
        tag: "div",
        class: "btnContainer",
        content: [
          {
            tag: "button",
            class: "btn",
            id: "rotate",
            content: `Rotate (${ui.orientation === "horizontal" ? "↔" : "↕"})`,
          },
          {
            tag: "button",
            class: "btn",
            id: "autoPlace",
            content: "Auto-place remaining",
          },
          {
            tag: "button",
            class: "btn",
            id: "clearPlacement",
            content: "Clear fleet",
          },
          {
            tag: "button",
            class: "btn-primary",
            id: "confirmPlacement",
            content: "Ready",
            ...(!activeBoard.isFullyPlaced() && { disabled: true }),
          },
        ],
      },
    ],
  };
}
