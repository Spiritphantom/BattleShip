import type { PageData } from "../../lib/Page";

export function overlayData(winner: string): PageData {
  const message = winner === "You" ? "You win!" : `${winner} wins!`;
  return {
    tag: "div",
    id: "overlayText",
    content: [
      { tag: "p", content: message },
      {
        tag: "button",
        class: "btn-primary",
        id: "newMatch",
        content: "New Match",
      },
    ],
  };
}
