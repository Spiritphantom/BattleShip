import { eventBus } from "./EventBus";
import { GameBoard } from "./GameBoard";
import { Computer, Player } from "./Player";

export type GameMode = "vs-computer" | "vs-human";
export type PlayerInd = "player1" | "player2";
export type SetupPhase = "player1" | "player2" | "done";

export interface Driver {
  mode: GameMode;
  player1Board: GameBoard;
  player2Board: GameBoard;
  player1: Player;
  player2: Player | Computer;
  currentPlayer: PlayerInd;
  setupPhase: SetupPhase;
}

// board for the player whose turn it currently is (their own fleet)
export function ownBoard(state: Driver): GameBoard {
  return state.currentPlayer === "player1"
    ? state.player1Board
    : state.player2Board;
}

// board the current player is attacking (the opponent's fleet)
export function targetBoard(state: Driver): GameBoard {
  return state.currentPlayer === "player1"
    ? state.player2Board
    : state.player1Board;
}

export function attacker(state: Driver): Player {
  return state.currentPlayer === "player1" ? state.player1 : state.player2;
}

export function opponentInd(ind: PlayerInd): PlayerInd {
  return ind === "player1" ? "player2" : "player1";
}

// Which boards to render as "yours" vs "theirs". This is deliberately
// separate from ownBoard/targetBoard above: those track whose turn it
// actually is for attack resolution (must flip to the computer's
// perspective while it's playing). But there's only one physical viewer
// in vs-computer mode -- the human -- so the screen itself should never
// flip sides just because the computer is taking its turn. vs-human still
// flips every turn, since that's the whole point of the pass-device flow.
export function displayBoards(state: Driver): {
  own: GameBoard;
  target: GameBoard;
} {
  if (state.mode === "vs-computer") {
    return { own: state.player1Board, target: state.player2Board };
  }
  return { own: ownBoard(state), target: targetBoard(state) };
}

export function driver(mode: GameMode = "vs-computer"): Driver {
  const player1Board = new GameBoard("Player1", eventBus);
  const player2Board = new GameBoard("Player2", eventBus);
  const player1 = new Player(player2Board, player1Board);
  const player2: Player | Computer =
    mode === "vs-computer"
      ? new Computer(player1Board, player2Board)
      : new Player(player1Board, player2Board);

  // vs-computer keeps the AI's fleet placed instantly and at random; only a
  // human ever arranges a fleet by hand. vs-human leaves both boards empty
  // so each player places their own fleet in turn
  if (mode === "vs-computer") {
    player2Board.placeShip();
  }

  return {
    mode,
    player1Board,
    player2Board,
    player1,
    player2,
    currentPlayer: "player1",
    setupPhase: "player1",
  };
}

export const game = { setupBoard: driver() };
