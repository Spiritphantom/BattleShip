import { mainContainer, renderElement } from "../../lib/renderUtilities";
import { overlayData } from "../../model/components/overlay";

export function gameOver(winner: string) {
  if (!mainContainer) return;
  const overlayMsg = mainContainer.querySelector(
    "#overlay",
  ) as HTMLElement | null;
  if (!overlayMsg) return;

  renderElement(overlayMsg, overlayData(winner));
  overlayMsg.style.display = "flex";
}
