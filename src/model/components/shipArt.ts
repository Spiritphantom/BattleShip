import type { ShipKey } from "../../lib/GameBoard";
import type { PageData } from "../../lib/Page";

// Local unit for one board cell's worth of ship artwork. All hull/deck
// shapes below are authored in a canonical "horizontal" coordinate space
// (along the ship's long axis, 0..length*CELL) and transposed to vertical
// on demand -- so every family only needs to be drawn once.
const CELL = 40;

type Orientation = "h" | "v";
type Pt = [number, number];
type Seg = Pt | { q: [Pt, Pt] };

function xy([along, across]: Pt, orientation: Orientation): Pt {
  return orientation === "h" ? [along, across] : [across, along];
}

function pathD(points: Seg[], orientation: Orientation): string {
  let d = "";
  points.forEach((p, i) => {
    if (Array.isArray(p)) {
      const [x, y] = xy(p, orientation);
      d += `${i === 0 ? "M" : "L"}${x},${y} `;
    } else {
      const [cx, cy] = xy(p.q[0], orientation);
      const [ex, ey] = xy(p.q[1], orientation);
      d += `Q${cx},${cy} ${ex},${ey} `;
    }
  });
  return `${d}Z`;
}

function hull(length: number, orientation: Orientation): string {
  const end = length * CELL;
  const taper = CELL * 0.55;
  return pathD(
    [
      [0, CELL / 2],
      [taper, 6],
      [end - 6, 6],
      { q: [[end, 6], [end, 14]] },
      [end, 26],
      { q: [[end, 34], [end - 6, 34]] },
      [taper, 34],
    ],
    orientation,
  );
}

function deck(
  alongStart: number,
  width: number,
  orientation: Orientation,
  inset = 9,
): string {
  return pathD(
    [
      [alongStart, inset],
      [alongStart + width, inset],
      [alongStart + width, CELL - inset],
      [alongStart, CELL - inset],
    ],
    orientation,
  );
}

type Family = "Battleship" | "Cruiser" | "Submarine" | "Destroyer" | "PatrolBoat";

const FAMILY_STYLE: Record<
  Family,
  { hullFill: string; deckFill: string; decks: [number, number][] }
> = {
  Battleship: {
    hullFill: "#33607a",
    deckFill: "#1f4155",
    decks: [
      [22, 16],
      [70, 32],
      [124, 16],
    ],
  },
  Cruiser: {
    hullFill: "#2e86ab",
    deckFill: "#1c5673",
    decks: [[42, 34]],
  },
  Submarine: {
    hullFill: "#3c4a52",
    deckFill: "#22292e",
    decks: [[46, 22]],
  },
  Destroyer: {
    hullFill: "#3d7ea6",
    deckFill: "#255066",
    decks: [[24, 18]],
  },
  PatrolBoat: {
    hullFill: "#3d7ea6",
    deckFill: "#255066",
    decks: [[12, 14]],
  },
};

export function shipFamily(shipKey: ShipKey): Family {
  return shipKey.replace(/\d+$/, "") as Family;
}

function shipLayers(family: Family, length: number, orientation: Orientation) {
  const style = FAMILY_STYLE[family];
  return [
    { d: hull(length, orientation), fill: style.hullFill },
    ...style.decks.map(([along, width]) => ({
      d: deck(along, width, orientation),
      fill: style.deckFill,
    })),
  ];
}

// One board cell's window into the full ship image -- `index` is this
// cell's position along the ship counted from the bow. Rendering every
// occupied cell's svg with the same full-ship path data, windowed to a
// different viewBox slice, is what makes the hull line up continuously
// across the ship's cells without any cross-cell positioning.
export function shipCellSvg(
  shipKey: ShipKey,
  length: number,
  orientation: Orientation,
  index: number,
): PageData {
  const layers = shipLayers(shipFamily(shipKey), length, orientation);
  const viewBox =
    orientation === "h"
      ? `${index * CELL} 0 ${CELL} ${CELL}`
      : `0 ${index * CELL} ${CELL} ${CELL}`;

  return {
    tag: "svg",
    class: "shipArt",
    viewBox,
    content: layers.map((layer) => ({
      tag: "path",
      d: layer.d,
      fill: layer.fill,
    })),
  };
}

// A single, un-windowed ship icon for the ship tray.
export function shipPieceSvg(
  shipKey: ShipKey,
  length: number,
  orientation: Orientation,
): PageData {
  const layers = shipLayers(shipFamily(shipKey), length, orientation);
  const viewBox =
    orientation === "h"
      ? `0 0 ${length * CELL} ${CELL}`
      : `0 0 ${CELL} ${length * CELL}`;

  return {
    tag: "svg",
    class: "shipArt",
    viewBox,
    content: layers.map((layer) => ({
      tag: "path",
      d: layer.d,
      fill: layer.fill,
    })),
  };
}
