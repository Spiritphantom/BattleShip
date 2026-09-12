import { getBattleData } from "../model/battle";
import { getModeSelectData } from "../model/modeSelect";
import { getPassDeviceData } from "../model/passDevice";
import { getSetupData } from "../model/setup";
import { game } from "./gameDriver";
import Page, { type PageData } from "./Page";

//file containing functions that extends the use of the render engine
export const mainContainer = document.getElementById("app");

//map that contains all app view state
export const viewMap = {
  modeSelect: getModeSelectData,
  setup: () => getSetupData(game.setupBoard),
  passDevice: getPassDeviceData,
  battle: () => getBattleData(game.setupBoard),
} as const;
let currentView: keyof typeof viewMap | null = null;

// builds page instance and render the page based on view map and its data
export function renderView(
  view: keyof typeof viewMap,
  afterRender?: () => void,
) {
  if (!mainContainer) return;
  currentView = view;
  const fromRenderView = true;
  renderElement(mainContainer, viewMap[view](), fromRenderView, afterRender);
}

// re-renders whichever view is currently active -- used after actions that
// change game state without navigating anywhere (a placement, an attack)
export function rerenderCurrentView() {
  if (!currentView) return;
  renderView(currentView);
}

// a utility function that render processed data in the supplied host
export function renderElement(
  host: HTMLElement,
  data: PageData,
  skipDiff?: boolean,
  afterRender?: () => void,
) {
  //check if host is available
  if (!host) return;
  const render = () => {
    if (skipDiff) {
      const fragment = Page.build(data);
      Page.pureRender(host, fragment);
    } else {
      Page.snapshotRender(host, data);
    }
  };

  if (document.startViewTransition) {
    const transition = document.startViewTransition(render);
    if (afterRender) {
      transition.finished.then(() => {
        afterRender();
      });
    }
  } else {
    render();
  }
}
