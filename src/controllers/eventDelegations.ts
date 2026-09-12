import { mainContainer } from "../lib/renderUtilities";
import { handleAttackClick } from "./handlers/handleAttack";
import {
  handleAutoPlace,
  handleClearPlacement,
  handleConfirmPlacement,
  handleModeSelect,
  handleNewMatch,
  handlePassContinue,
  handleRetreat,
  handleRotate,
} from "./handlers/handleBtn";
import {
  handleBoardDragOver,
  handleBoardDrop,
  handleDragEnd,
  handleDragStart,
} from "./eventsCBs/placement";

const clickHandlers = [
  { selector: "#mode-vs-computer, #mode-vs-human", handler: handleModeSelect },
  { selector: "#rotate", handler: handleRotate },
  { selector: "#autoPlace", handler: handleAutoPlace },
  { selector: "#clearPlacement", handler: handleClearPlacement },
  { selector: "#confirmPlacement", handler: handleConfirmPlacement },
  { selector: "#passContinue", handler: handlePassContinue },
  { selector: "#retreat", handler: handleRetreat },
  { selector: "#newMatch", handler: handleNewMatch },
  { selector: "#targetBoard [data-cord]", handler: handleAttackClick },
];

mainContainer?.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  for (const { selector, handler } of clickHandlers) {
    const match = target.closest(selector);
    if (match) {
      handler(match, e as PointerEvent);
      break;
    }
  }
});

mainContainer?.addEventListener("dragstart", handleDragStart);
mainContainer?.addEventListener("dragover", handleBoardDragOver);
mainContainer?.addEventListener("drop", handleBoardDrop);
mainContainer?.addEventListener("dragend", handleDragEnd);
