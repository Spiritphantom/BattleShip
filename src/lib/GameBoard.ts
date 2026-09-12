import { EventBus } from "./EventBus";
import { Ship } from "./Ship";

export type Coord = [number, number];

export type PayLoad = {
  coordinate: number[];
  missed: boolean;
  hit: boolean;
  allSunk: null | boolean;
};

export type ShipKey =
  | "Battleship"
  | "Cruiser"
  | "Submarine"
  | "Destroyer1"
  | "Destroyer2"
  | "Destroyer3"
  | "PatrolBoat1"
  | "PatrolBoat2"
  | "PatrolBoat3"
  | "PatrolBoat4";

export class GameBoard {
  public vehicles: Record<ShipKey, Ship> = {
    Battleship: new Ship(4),
    Cruiser: new Ship(3),
    Submarine: new Ship(3),
    Destroyer1: new Ship(2),
    Destroyer2: new Ship(2),
    Destroyer3: new Ship(2),
    PatrolBoat1: new Ship(1),
    PatrolBoat2: new Ship(1),
    PatrolBoat3: new Ship(1),
    PatrolBoat4: new Ship(1),
  };
  public missedAttack = new Set<string>();
  public successfulAttack = new Set<string>();
  private coordMap = new Map<string, Ship>();
  public receivedAttacks = new Set<string>();
  private eventBus: EventBus | undefined;
  private boardId: string = "";

  constructor(boardId?: string, eventBus?: EventBus) {
    if (eventBus) this.eventBus = eventBus;
    if (boardId) this.boardId = boardId;
  }

  private reset() {
    this.missedAttack = new Set<string>();
    this.successfulAttack = new Set<string>();
    this.coordMap = new Map<string, Ship>();
    this.receivedAttacks = new Set<string>();
    for (const [_vehicle, data] of Object.entries(this.vehicles)) {
      data.damage = 0;
    }
  }

  placeShip() {
    this.reset();
    for (const [_vehicle, data] of Object.entries(this.vehicles)) {
      let x = Math.floor(Math.random() * 10);
      let y = Math.floor(Math.random() * 10);
      let coordinate = this.coordGen(data.length, [x, y]);
      const filledCord = new Set(this.coordMap.keys());
      let valid: boolean = false;
      let attempts = 0;

      while (!valid && attempts < 100) {
        attempts++;
        const isInOccupied = coordinate.some((val) =>
          filledCord.has(this.coordKey(val)),
        );
        //closeness check
        let isClose = false;
        outerLoop: for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            if (
              coordinate.some((val) => {
                return filledCord.has(
                  this.coordKey([val[0] + dx, val[1] + dy]),
                );
              })
            ) {
              isClose = true;
              break outerLoop;
            }
          }
        }

        if (!isInOccupied && !isClose) {
          valid = true;
          break;
        }
        x = Math.floor(Math.random() * 10);
        y = Math.floor(Math.random() * 10);
        coordinate = this.coordGen(data.length, [x, y]);
      }

      if (!valid) {
        throw new Error(
          `Failed to place ${_vehicle} after 100 attempts. Board layout is too crowded.`,
        );
      }
      coordinate.forEach((value) => {
        this.coordMap.set(this.coordKey(value), data);
      });
    }

    if (this.eventBus) {
      this.eventBus.publish(`Refresh ${this.boardId} board`, this.occupied);
    }
  }

  private coordGen(len: number, start: [number, number]): [number, number][] {
    const [sx, sy] = start;
    const isHorizontal = Math.random() > 0.5;

    const coordinates: [number, number][] = [];

    if (isHorizontal) {
      const startX = Math.max(0, Math.min(sx, 10 - len));
      for (let i = 0; i < len; i++) {
        coordinates.push([startX + i, sy]);
      }
    } else {
      const startY = Math.max(0, Math.min(sy, 10 - len));
      for (let i = 0; i < len; i++) {
        coordinates.push([sx, startY + i]);
      }
    }
    return coordinates;
  }

  // checks whether the given coordinates are a legal placement: in bounds,
  // not overlapping another ship, and not touching (even diagonally)
  // another ship's cells. Pass ignoreShip when repositioning a ship that
  // already occupies part of the board, so it doesn't block itself
  isValidPlacement(coordinate: Coord[], ignoreShip?: Ship): boolean {
    for (const [x, y] of coordinate) {
      if (x < 0 || x > 9 || y < 0 || y > 9) return false;
    }

    for (const [x, y] of coordinate) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighbour = this.coordMap.get(this.coordKey([x + dx, y + dy]));
          if (neighbour && neighbour !== ignoreShip) return false;
        }
      }
    }

    return true;
  }

  // manually place a single ship (used by drag-and-drop setup). Returns
  // false without mutating anything if the coordinates are invalid or
  // don't match the ship's length
  placeShipManually(shipKey: ShipKey, coordinate: Coord[]): boolean {
    const ship = this.vehicles[shipKey];
    if (coordinate.length !== ship.length) return false;
    if (!this.isValidPlacement(coordinate, ship)) return false;

    this.removeShipPlacement(shipKey);
    coordinate.forEach((value) => {
      this.coordMap.set(this.coordKey(value), ship);
    });

    if (this.eventBus) {
      this.eventBus.publish(`Refresh ${this.boardId} board`, this.occupied);
    }
    return true;
  }

  // clears a single ship's coordinates, if it has any, without touching
  // any other ship or attack history
  removeShipPlacement(shipKey: ShipKey) {
    const ship = this.vehicles[shipKey];
    const existing = this.getShipCoord(ship);
    existing?.forEach((key) => this.coordMap.delete(key));
  }

  // ship keys that have not yet been placed on the board
  unplacedShipKeys(): ShipKey[] {
    return (Object.keys(this.vehicles) as ShipKey[]).filter(
      (key) => !this.getShipCoord(this.vehicles[key]),
    );
  }

  isFullyPlaced(): boolean {
    return this.unplacedShipKeys().length === 0;
  }

  // clears every ship's placement, leaving attack history untouched --
  // used while a player is still arranging their fleet during setup
  clearPlacements() {
    this.coordMap = new Map();
    if (this.eventBus) {
      this.eventBus.publish(`Refresh ${this.boardId} board`, this.occupied);
    }
  }

  modifyCoord([x, y]: Coord, coordArr: Coord[]) {
    //get currentShip
    const currentShip = this.coordMap.get(this.coordKey([x, y]));
    if (!currentShip) return false;
    ///
    const oldCoords = this.getShipCoord(currentShip);
    if (!oldCoords) return false;

    const coordValidity = coordArr.some((val) => {
      const key = this.coordKey(val);
      return this.coordMap.has(key) && !oldCoords.has(key);
    });
    if (coordValidity) return false;

    // remove old coords first
    oldCoords.forEach((val) => {
      this.coordMap.delete(val);
    });

    // add new coords
    coordArr.forEach((val) => {
      this.coordMap.set(this.coordKey(val), currentShip);
    });
    return true;
  }

  receiveAttack(x: number, y: number) {
    const payLoad: PayLoad = {
      coordinate: [x, y],
      missed: false,
      hit: false,
      allSunk: null,
    };
    if (x < 0 || x > 9 || y < 0 || y > 9) return false;
    const coordStr = this.coordKey([x, y]);
    if (this.receivedAttacks.has(coordStr)) return false;

    this.receivedAttacks.add(coordStr);
    const currentShip = this.coordMap.get(coordStr);
    if (typeof currentShip === "undefined") {
      this.missedAttack.add(coordStr);
      payLoad.missed = true;
    } else {
      currentShip.hit();
      this.successfulAttack.add(coordStr);
      payLoad.allSunk = this.allSunk();
      payLoad.hit = true;
      if (currentShip.isSunk) this.blockSurrounding(currentShip);
    }

    if (this.eventBus) {
      this.eventBus.publish(`${this.boardId}:attack`, payLoad);
    }
    return true;
  }

  allSunk() {
    return Object.values(this.vehicles).every((ship) => ship.isSunk);
  }

  // once a ship is fully sunk, every cell touching it (including
  // diagonally) is guaranteed empty -- no other ship can legally sit
  // there, per the same adjacency rule isValidPlacement enforces -- so
  // those cells are auto-revealed as misses and taken out of play rather
  // than left as free guesses.
  private blockSurrounding(ship: Ship) {
    const coords = this.getShipCoord(ship);
    if (!coords) return;

    coords.forEach((key) => {
      const [sx, sy] = key.split(",").map(Number) as Coord;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nx = sx + dx;
          const ny = sy + dy;
          if (nx < 0 || nx > 9 || ny < 0 || ny > 9) continue;

          const neighbourKey = this.coordKey([nx, ny]);
          if (this.receivedAttacks.has(neighbourKey)) continue;

          this.receivedAttacks.add(neighbourKey);
          this.missedAttack.add(neighbourKey);
        }
      }
    });
  }

  private coordKey([x, y]: Coord) {
    return `${x},${y}`;
  }

  get occupied(): Coord[][] {
    return [...this.shipLocal().values()];
  }

  private shipLocal() {
    const groups = new Map<Ship, Coord[]>();

    for (const [key, ship] of this.coordMap) {
      const [x, y] = key.split(",").map(Number);

      if (!groups.has(ship)) groups.set(ship, []);
      const shipRef = groups.get(ship);
      if (shipRef && x !== undefined && y !== undefined) shipRef.push([x, y]);
    }

    return groups;
  }

  getShipCoord(ship: Ship): Set<string> | undefined {
    const shipLocation = this.shipLocal().get(ship);
    if (!shipLocation) return undefined;
    const coords = new Set(shipLocation.map((val) => this.coordKey(val)));
    return coords;
  }

  hasShipSunk(x: number, y: number) {
    const ship = this.coordMap.get(this.coordKey([x, y]));
    if (!ship) return false;
    return ship.isSunk;
  }
}
