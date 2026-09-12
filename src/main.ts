import "./style.css";
import { mainContainer, renderView } from "./lib/renderUtilities";
import "./lib/gameDriver";
import "./controllers/eventDelegations";

// initial app load render
window.addEventListener("load", () => {
  if (!mainContainer) return;
  renderView("modeSelect");
});

window.addEventListener("load", () => {
  document.body.style.opacity = "1";
});
