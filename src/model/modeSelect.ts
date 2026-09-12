import type { PageData } from "../lib/Page";

export function getModeSelectData(): PageData {
  return {
    tag: "main",
    id: "main",
    content: [
      { tag: "h1", content: "⚓ Battleship" },
      { tag: "p", class: "subtitle", content: "Choose how you want to play" },
      {
        tag: "div",
        class: "modeGrid",
        content: [
          {
            tag: "button",
            class: "btn-primary modeCard",
            id: "mode-vs-computer",
            content: [
              { tag: "span", class: "modeIcon", content: "🤖" },
              { tag: "span", class: "modeTitle", content: "Vs Computer" },
              {
                tag: "span",
                class: "modeDesc",
                content: "Battle an AI opponent solo",
              },
            ],
          },
          {
            tag: "button",
            class: "btn-primary modeCard",
            id: "mode-vs-human",
            content: [
              { tag: "span", class: "modeIcon", content: "🧑‍🤝‍🧑" },
              { tag: "span", class: "modeTitle", content: "Pass and Play" },
              {
                tag: "span",
                class: "modeDesc",
                content: "Two players, one device",
              },
            ],
          },
        ],
      },
    ],
  };
}
