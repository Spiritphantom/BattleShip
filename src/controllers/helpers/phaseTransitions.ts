import { game } from "../../lib/gameDriver";
import { renderView } from "../../lib/renderUtilities";
import { ui } from "../../lib/uiState";

// called when the active player confirms their fleet placement is done
export function goToNextSetupPhase() {
  const state = game.setupBoard;

  if (state.setupPhase === "player1") {
    if (state.mode === "vs-computer") {
      // the computer's board was already placed when the driver was built
      state.setupPhase = "done";
      renderView("battle");
      return;
    }

    state.setupPhase = "player2";
    ui.orientation = "horizontal";
    ui.passMessage = "Pass the device to Player 2";
    ui.passNextView = "setup";
    renderView("passDevice");
    return;
  }

  // player2 just finished placing (vs-human only -- vs-computer never
  // reaches this branch, it returns above)
  state.setupPhase = "done";
  ui.passMessage = "Pass the device back to Player 1 to begin the battle";
  ui.passNextView = "battle";
  renderView("passDevice");
}

// called when the pass-device screen's "I'm ready" button is pressed
export function goToBattle() {
  renderView(ui.passNextView);
}
