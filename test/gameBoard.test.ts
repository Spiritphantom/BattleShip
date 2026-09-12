import { describe, test, expect, beforeEach } from "vitest";
import { GameBoard } from "../src/lib/GameBoard";
import { Ship } from "../src/lib/Ship";
type Coord = [number, number];

describe("GameBoard", () => {
  let newGame: GameBoard;
  let testArr: Coord[] = [
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
  ];
  beforeEach(() => {
    newGame = new GameBoard();
    newGame.placeShip();
  });

  describe("placeShip side-effects", () => {
    test("should check if occupied coordinate have 10 entries", () => {
      expect(newGame.occupied.length === 10).toBe(true);
    });

    test("should check if no coordinate exist more than once", () => {
      let flatOccupiedCoord = newGame.occupied
        .flat()
        .map((val) => `${val[0]},${val[1]}`);
      let setOfOccupiedCoord = new Set(flatOccupiedCoord);
      expect(flatOccupiedCoord.length === setOfOccupiedCoord.size).toBe(true);
    });
  });

  describe("modifyCoord side-effects", () => {
    test("should check if occupied was updated", () => {
      let coord = newGame.occupied.flat();
      let successState = newGame.modifyCoord(coord[0]!, testArr);
      if (successState) {
        expect(newGame.occupied).toContainEqual(testArr);
      } else {
        expect(successState).toBe(false);
      }
    });
  });

  describe("receiveAttack side-effects", () => {
    test("should check if missed attack is being recorded", () => {
      let quickRandomNum = () => Math.floor(Math.random() * 10);
      let attack: Coord[] = Array.from({ length: 17 }).map(() => [
        quickRandomNum(),
        quickRandomNum(),
      ]);
      attack.forEach(([x, y]) => newGame.receiveAttack(x, y));

      expect(newGame.missedAttack.size > 0).toBe(true);
    });

    test("should check if all ship have been sunk", () => {
      let coord = newGame.occupied.flat();
      coord.forEach(([x, y]) => newGame.receiveAttack(x, y));

      expect(newGame.allSunk()).toBe(true);
    });

    test("should check if same coord is attack twice", () => {
      newGame.receiveAttack(1, 2);
      let canBeAttack = newGame.receiveAttack(1, 2);

      expect(canBeAttack).toBe(false);
    });

    test("should auto-reveal the cells surrounding a sunk ship as misses", () => {
      const game = new GameBoard();
      game.clearPlacements();
      game.placeShipManually("PatrolBoat1", [[5, 5]]);

      game.receiveAttack(5, 5);
      expect(game.vehicles.PatrolBoat1.isSunk).toBe(true);

      const neighbours: Coord[] = [
        [4, 4],
        [4, 5],
        [4, 6],
        [5, 4],
        [5, 6],
        [6, 4],
        [6, 5],
        [6, 6],
      ];
      neighbours.forEach(([x, y]) => {
        expect(game.missedAttack.has(`${x},${y}`)).toBe(true);
        expect(game.receivedAttacks.has(`${x},${y}`)).toBe(true);
      });

      // an out-of-bounds neighbour of an edge ship must not blow up
      const edgeGame = new GameBoard();
      edgeGame.clearPlacements();
      expect(() => {
        edgeGame.placeShipManually("PatrolBoat1", [[0, 0]]);
        edgeGame.receiveAttack(0, 0);
      }).not.toThrow();
    });
  });

  describe("manual placement", () => {
    let game: GameBoard;
    beforeEach(() => {
      game = new GameBoard();
      game.vehicles = {
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
    });

    test("places a ship when the coordinates are valid", () => {
      const success = game.placeShipManually("Destroyer1", [
        [0, 0],
        [1, 0],
      ]);
      expect(success).toBe(true);
      expect(game.getShipCoord(game.vehicles.Destroyer1)).toEqual(
        new Set(["0,0", "1,0"]),
      );
    });

    test("rejects a placement with the wrong number of coordinates", () => {
      const success = game.placeShipManually("Destroyer1", [[0, 0]]);
      expect(success).toBe(false);
    });

    test("rejects a placement that overlaps another ship", () => {
      game.placeShipManually("Destroyer1", [
        [0, 0],
        [1, 0],
      ]);
      const success = game.placeShipManually("PatrolBoat1", [[1, 0]]);
      expect(success).toBe(false);
    });

    test("rejects a placement adjacent to another ship", () => {
      game.placeShipManually("Destroyer1", [
        [0, 0],
        [1, 0],
      ]);
      const success = game.placeShipManually("PatrolBoat1", [[1, 1]]);
      expect(success).toBe(false);
    });

    test("allows repositioning a ship without it blocking itself", () => {
      game.placeShipManually("Destroyer1", [
        [0, 0],
        [1, 0],
      ]);
      const success = game.placeShipManually("Destroyer1", [
        [0, 0],
        [0, 1],
      ]);
      expect(success).toBe(true);
      expect(game.getShipCoord(game.vehicles.Destroyer1)).toEqual(
        new Set(["0,0", "0,1"]),
      );
    });

    test("rejects an out-of-bounds placement", () => {
      const success = game.placeShipManually("Destroyer1", [
        [9, 9],
        [10, 9],
      ]);
      expect(success).toBe(false);
    });

    test("removeShipPlacement clears only the targeted ship", () => {
      game.placeShipManually("Destroyer1", [
        [0, 0],
        [1, 0],
      ]);
      game.placeShipManually("PatrolBoat1", [[5, 5]]);
      game.removeShipPlacement("Destroyer1");
      expect(game.getShipCoord(game.vehicles.Destroyer1)).toBeUndefined();
      expect(game.getShipCoord(game.vehicles.PatrolBoat1)).toEqual(
        new Set(["5,5"]),
      );
    });

    test("unplacedShipKeys and isFullyPlaced reflect placement progress", () => {
      expect(game.isFullyPlaced()).toBe(false);
      expect(game.unplacedShipKeys().length).toBe(10);

      // each ship's coordinates are spaced across separate rows so nothing collides
      const positions: [keyof typeof game.vehicles, [number, number][]][] = [
        [
          "Battleship",
          [
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
          ],
        ],
        [
          "Cruiser",
          [
            [0, 2],
            [1, 2],
            [2, 2],
          ],
        ],
        [
          "Submarine",
          [
            [0, 4],
            [1, 4],
            [2, 4],
          ],
        ],
        [
          "Destroyer1",
          [
            [0, 6],
            [1, 6],
          ],
        ],
        [
          "Destroyer2",
          [
            [0, 8],
            [1, 8],
          ],
        ],
        [
          "Destroyer3",
          [
            [3, 8],
            [4, 8],
          ],
        ],
        ["PatrolBoat1", [[6, 0]]],
        ["PatrolBoat2", [[6, 2]]],
        ["PatrolBoat3", [[6, 4]]],
        ["PatrolBoat4", [[6, 6]]],
      ];
      positions.forEach(([key, coords]) => {
        expect(game.placeShipManually(key, coords)).toBe(true);
      });

      expect(game.isFullyPlaced()).toBe(true);
      expect(game.unplacedShipKeys().length).toBe(0);
    });

    test("clearPlacements removes every ship from the board", () => {
      game.placeShipManually("Destroyer1", [
        [0, 0],
        [1, 0],
      ]);
      game.clearPlacements();
      expect(game.occupied.length).toBe(0);
      expect(game.isFullyPlaced()).toBe(false);
    });
  });

  describe("one point shift", () => {
    test("should allow shifting a ship by 1 step", () => {
      const game = new GameBoard();

      // 1. CLEAR ALL RANDOM STATE
      game.vehicles = {
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

      game["coordMap"] = new Map();

      // 2. PLACE ONLY ONE SHIP MANUALLY (safe space)
      const ship = game.vehicles.Battleship;

      const original = [
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [6, 2],
      ] as [number, number][];

      original.forEach((value) => {
        game["coordMap"].set(game["coordKey"](value), ship);
      });

      // 3. SHIFT IT (deterministic)
      const shifted = original.map(([x, y]) => [x, y + 1] as [number, number]);
      const shiftedAsStr = shifted.map((val) => val.toString());

      const success = game.modifyCoord(original[0]!, shifted);

      // 4. ASSERT
      expect(success).toBe(true);
      expect(game.getShipCoord(ship)).toEqual(new Set(shiftedAsStr));

      // 5. VERIFY MAP IS CONSISTENT
      for (const [x, y] of shifted) {
        expect(game["coordMap"].get(`${x},${y}`)).toBe(ship);
      }
    });
  });
});
