import type { GameBoard, ShipKey } from "../../lib/GameBoard";
import type { PageData } from "../../lib/Page";
import type { Orientation } from "../../lib/uiState";
import { shipPieceSvg } from "./shipArt";

// Renders the tray of not-yet-placed ships as draggable pieces. Each piece
// is shaped to its ship's actual length and current orientation so the
// player can see what they are about to drop before they drop it.
export function shipTrayView(
  board: GameBoard,
  orientation: Orientation,
): PageData {
  const unplaced = board.unplacedShipKeys();

  return {
    tag: "div",
    id: "shipTray",
    content: [
      { tag: "h4", class: "shipTrayTitle", content: "Fleet to deploy" },
      {
        tag: "div",
        class: "shipTrayList",
        content:
          unplaced.length > 0
            ? unplaced.map((key) =>
                shipPiece(key, board.vehicles[key].length, orientation),
              )
            : [{ tag: "p", class: "trayEmpty", content: "⚓ Fleet fully placed" }],
      },
    ],
  };
}

function shipPiece(
  key: ShipKey,
  length: number,
  orientation: Orientation,
): PageData {
  const shortOrientation = orientation === "horizontal" ? "h" : "v";
  return {
    tag: "div",
    class: `ship-piece ${orientation} len-${length}`,
    draggable: true,
    "data-ship": key,
    "data-length": length,
    content: [shipPieceSvg(key, length, shortOrientation)],
  };
}
