import { GameBoard } from "./GameBoard";
import type { Ship } from "./Ship";

export class Player {
  protected opBoard: GameBoard;
  public ownBoard: GameBoard;
  constructor(op: GameBoard, own: GameBoard = new GameBoard()) {
    this.opBoard = op;
    this.ownBoard = own;
  }

  attack(x: number, y: number): string | boolean {
    return this.opBoard.receiveAttack(x, y);
  }
}

export class Computer extends Player {
  private cellTracker: Map<string, number> = new Map();

  constructor(op: GameBoard, own: GameBoard = new GameBoard()) {
    super(op, own);
  }

  override attack(): string | boolean {
    const result = this.findBestMove();
    if (result) {
      const [x, y] = result[0].split(",").map(Number);
      if (x !== undefined && y !== undefined) {
        super.attack(x, y);
        return `${x},${y}`;
      }
    }
    return false;
  }

  private findBestMove(): [string, number] | undefined {
    const unsunkShipLengths: number[] = [];
    const sunkenShips: Ship[] = [];
    const neigbohrCells = new Set<string>();
    const sunkCells = new Set<string>();
    // create a map of every coordinate
    const cells = Array.from({ length: 100 }).map(
      (_val, index): [string, number] => [this.coordStr(index), 0],
    );
    this.cellTracker = new Map(cells);

    //register all opponets ships length
    for (const [_vehicle, ship] of Object.entries(this.opBoard.vehicles)) {
      if (ship.isSunk) {
        sunkenShips.push(ship);
      } else {
        unsunkShipLengths.push(ship.length);
      }
    }

    for (const ship of sunkenShips) {
      const currShipCoord = this.opBoard.getShipCoord(ship);
      if (currShipCoord) {
        const currShipArr = Array.from(currShipCoord).map((val) =>
          val.split(",").map(Number),
        );

        currShipArr.forEach(([x, y]) => {
          sunkCells.add(`${x},${y}`);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (dx === 0 && dy === 0) continue;
              if (x !== undefined && y !== undefined) {
                if (x + dx > 9 || y + dy > 9 || x + dx < 0 || y + dy < 0)
                  continue;
                neigbohrCells.add(`${x + dx},${y + dy}`);
              }
            }
          }
        });
      }
    }
    //fill horixontal
    for (const size of unsunkShipLengths) {
      this.probabilityLogic(true, size, sunkCells);
      this.probabilityLogic(false, size, sunkCells);
    }
    neigbohrCells.forEach((val) => {
      this.cellTracker.set(val, 0);
    });
    const unAttackedCells = [...this.cellTracker.entries()].filter(
      ([cell]) => !this.opBoard.receivedAttacks.has(cell),
    );
    if (unAttackedCells.length === 0) return;
    const highestEntry = unAttackedCells.reduce((max, current) =>
      current[1] > max[1] ? current : max,
    );
    const maxCellsArr = unAttackedCells.filter(([_cell, value]) => {
      return value === highestEntry[1];
    });
    const randomNumber = Math.floor(Math.random() * maxCellsArr.length);
    return maxCellsArr[randomNumber];
  }

  private probabilityLogic(
    isHorizontal: boolean,
    size: number,
    sunkCells: Set<string>,
  ) {
    const activeHits = [...this.opBoard.successfulAttack].filter(
      (cell) => !sunkCells.has(cell),
    );
    for (let outer = 0; outer <= 9; outer++) {
      for (let inner = 0; inner <= 10 - size; inner++) {
        //generat coordinates
        const cells = Array.from({ length: size }).map((_val, index) =>
          isHorizontal
            ? `${inner + index},${outer}`
            : `${outer},${inner + index}`,
        );

        const notValid = cells.some(
          (cell) => this.opBoard.missedAttack.has(cell) || sunkCells.has(cell),
        );
        if (notValid) continue;
        if (
          activeHits.length > 0 &&
          !activeHits.every((hit) => cells.includes(hit))
        )
          continue;

        let hitCount = 0;
        for (const cell of cells) {
          if (this.opBoard.successfulAttack.has(cell)) {
            hitCount++;
          }
        }

        cells.forEach((cell) => {
          const cellVal = this.cellTracker.get(cell);
          if (cellVal !== undefined) {
            const weightBonus = hitCount > 0 ? 1 + hitCount * 20 : 1;
            this.cellTracker.set(cell, cellVal + weightBonus);
          }
        });
      }
    }
  }

  coordStr(index: number) {
    return `${index % 10},${Math.floor(index / 10)}`;
  }
}
