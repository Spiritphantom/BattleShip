import type { Coord, GameBoard, ShipKey } from "../../lib/GameBoard";
import type { PageData } from "../../lib/Page";
import { shipCellSvg, shipPieceSvg } from "./shipArt";

const COL_LABELS = Array.from({ length: 10 }, (_v, i) => String(i + 1));
const ROW_LABELS = Array.from({ length: 10 }, (_v, i) =>
  String.fromCharCode(65 + i),
);

type FleetEntry = { shipKey: ShipKey; length: number; sunk: boolean };
type ShipCellInfo = {
  shipKey: ShipKey;
  length: number;
  orientation: "h" | "v";
  index: number;
};

function fleetEntries(board: GameBoard): FleetEntry[] {
  return (Object.keys(board.vehicles) as ShipKey[]).map((shipKey) => {
    const ship = board.vehicles[shipKey];
    return { shipKey, length: ship.length, sunk: ship.isSunk };
  });
}

function fleetPanel(title: string, entries: FleetEntry[]): PageData {
  return {
    tag: "div",
    class: "fleetPanel",
    content: [
      { tag: "h4", content: title },
      {
        tag: "div",
        class: "fleetRows",
        content: entries.map((entry) => ({
          tag: "div",
          class: `fleetRow${entry.sunk ? " sunk" : ""}`,
          content: [
            {
              tag: "div",
              class: `fleetIcon len-${entry.length}`,
              content: [shipPieceSvg(entry.shipKey, entry.length, "h")],
            },
            { tag: "span", class: "fleetName", content: entry.shipKey },
          ],
        })),
      },
    ],
  };
}

// Wraps a 10x10 `.board` grid (left exactly as-is, id and all -- event
// delegation and drag/drop selectors depend on it) with a titled card,
// row/column coordinate labels, and (in battle) a fleet list sitting
// directly beside that board rather than in a separate row underneath.
function boardCard(
  title: string,
  caption: string,
  id: string,
  cells: PageData[],
  fleet?: { title: string; entries: FleetEntry[] },
): PageData {
  const frame: PageData = {
    tag: "div",
    class: "boardFrame",
    content: [
      {
        tag: "div",
        class: "colLabels",
        content: [
          { tag: "span", class: "cornerSpacer" },
          ...COL_LABELS.map((label) => ({ tag: "span", content: label })),
        ],
      },
      {
        tag: "div",
        class: "boardBody",
        content: [
          {
            tag: "div",
            class: "rowLabels",
            content: ROW_LABELS.map((label) => ({
              tag: "span",
              content: label,
            })),
          },
          { tag: "div", class: "board", id, content: cells },
        ],
      },
    ],
  };

  return {
    tag: "div",
    class: "boardCard",
    content: [
      {
        tag: "div",
        class: "boardCardHeader",
        content: [
          { tag: "h3", content: title },
          { tag: "span", class: "boardCaption", content: caption },
        ],
      },
      {
        tag: "div",
        class: "boardMain",
        content: fleet ? [frame, fleetPanel(fleet.title, fleet.entries)] : [frame],
      },
    ],
  };
}

// Renders a pair of boards from the actual state of the two GameBoard
// instances currently in perspective. `own` is the acting player's own
// fleet (ships revealed); `target` is the board they are attacking (fog of
// war -- only hit/miss marks are shown, never ship positions). Rendering
// straight from state, rather than mutating individual cells imperatively,
// is what lets the same view work for vs-computer (perspective never
// changes) and vs-human (perspective flips every turn) without special
// casing either mode.
export function renderBoards(own: GameBoard, target: GameBoard): PageData[] {
  return [
    { tag: "div", id: "overlay" },
    boardCard("Your Fleet", "Ships revealed", "ownBoard", buildCells(own, true), {
      title: "Your ships",
      entries: fleetEntries(own),
    }),
    boardCard(
      "Enemy Waters",
      "Fire when ready",
      "targetBoard",
      buildCells(target, false),
      { title: "Enemy ships", entries: fleetEntries(target) },
    ),
  ];
}

// Own-board rendering during setup: ships are always shown (it's the
// player's own fleet, still being arranged) and there are never any
// attack marks yet.
export function buildPlacementCells(board: GameBoard): PageData[] {
  const shipMap = buildShipCellMap(board);

  const cells = Array.from({ length: 100 }).map((_val, index) => {
    const coord = coordStr(index);
    return cellData(coord, undefined, shipMap.get(coord));
  });

  return [
    boardCard("Your Fleet", "Drag ships onto the board", "ownBoard", cells),
  ];
}

function buildCells(board: GameBoard, revealShips: boolean): PageData[] {
  const shipMap = revealShips
    ? buildShipCellMap(board)
    : new Map<string, ShipCellInfo>();

  return Array.from({ length: 100 }).map((_val, index) => {
    const coord = coordStr(index);
    return cellData(coord, board, shipMap.get(coord));
  });
}

function cellData(
  coord: string,
  board: GameBoard | undefined,
  ship: ShipCellInfo | undefined,
): PageData {
  return {
    tag: "div",
    class: cellClass(board, coord),
    "data-cord": coord,
    ...(ship && { "data-occupied": true }),
    ...(ship && {
      content: [
        shipCellSvg(ship.shipKey, ship.length, ship.orientation, ship.index),
      ],
    }),
  };
}

function cellClass(board: GameBoard | undefined, coord: string): string {
  if (!board) return "cell";
  if (board.successfulAttack.has(coord)) return "cell success";
  if (board.missedAttack.has(coord)) return "cell missed";
  return "cell";
}

// Maps every occupied coordinate to the ship that sits there plus its
// index along that ship's length and orientation, so each cell can render
// the correct windowed slice of a single continuous ship image.
function buildShipCellMap(board: GameBoard): Map<string, ShipCellInfo> {
  const map = new Map<string, ShipCellInfo>();

  (Object.keys(board.vehicles) as ShipKey[]).forEach((shipKey) => {
    const ship = board.vehicles[shipKey];
    const coordSet = board.getShipCoord(ship);
    if (!coordSet || coordSet.size === 0) return;

    const coords: Coord[] = [...coordSet].map((key) => {
      const [x, y] = key.split(",").map(Number);
      return [x, y] as Coord;
    });
    const length = coords.length;
    const orientation: "h" | "v" =
      length > 1 && coords.every((c) => c[1] === coords[0]?.[1]) ? "h" : "v";
    const sorted = [...coords].sort((a, b) =>
      orientation === "h" ? a[0] - b[0] : a[1] - b[1],
    );

    sorted.forEach((c, index) => {
      map.set(`${c[0]},${c[1]}`, { shipKey, length, orientation, index });
    });
  });

  return map;
}

function coordStr(index: number) {
  return `${Math.floor(index / 10)},${index % 10}`;
}
