// Transient, presentation-only state -- never persisted, never touched by
// game logic. Kept separate from `Driver` (lib/gameDriver.ts) so the actual
// game model stays free of view concerns.

export type Orientation = "horizontal" | "vertical";

export type UiState = {
  orientation: Orientation;
  // what the pass-device interstitial should say, and which view to render
  // once the next player confirms they're holding the device
  passMessage: string;
  passNextView: "setup" | "battle";
  // the ship currently being dragged, tracked outside dataTransfer because
  // dragover cannot reliably read dataTransfer payloads in most browsers
  dragging: { key: string; length: number } | null;
};

export const ui: UiState = {
  orientation: "horizontal",
  passMessage: "",
  passNextView: "setup",
  dragging: null,
};
