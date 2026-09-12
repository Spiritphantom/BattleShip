import { displayBoards, type Driver } from "../lib/gameDriver";
import type { PageData } from "../lib/Page";
import { renderBoards } from "./components/boards";

export function getBattleData(state: Driver): PageData {
  const { own, target } = displayBoards(state);

  return {
    tag: "main",
    id: "main",
    content: [
      { tag: "div", id: "turnIndicator", content: turnText(state) },
      { tag: "div", id: "boards", content: renderBoards(own, target) },
      {
        tag: "div",
        class: "btnContainer",
        content: [
          { tag: "button", class: "btn", id: "retreat", content: "Retreat" },
        ],
      },
    ],
  };
}

function turnText(state: Driver): string {
  if (state.mode === "vs-computer") {
    return state.currentPlayer === "player1"
      ? "🎯 Your turn -- fire!"
      : "🤖 Computer is playing...";
  }
  return state.currentPlayer === "player1"
    ? "🎯 Player 1's turn -- fire!"
    : "🎯 Player 2's turn -- fire!";
}
