import type { PageData } from "../lib/Page";
import { ui } from "../lib/uiState";

// A privacy interstitial shown between local players so the next person to
// hold the device doesn't see the previous player's fleet or board while
// it's still on screen. Nothing about board state renders here at all.
export function getPassDeviceData(): PageData {
  return {
    tag: "main",
    id: "main",
    content: [
      {
        tag: "div",
        id: "passDevice",
        content: [
          { tag: "span", class: "passIcon", content: "🔄" },
          { tag: "h2", content: ui.passMessage },
          {
            tag: "p",
            content: "Make sure the other player can't see the screen.",
          },
          {
            tag: "button",
            class: "btn-primary",
            id: "passContinue",
            content: "I'm ready",
          },
        ],
      },
    ],
  };
}
