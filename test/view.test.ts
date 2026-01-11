import { draw_footer, snapshot_ascii } from "../src/view.js";
import { Actor } from "../src/actor.js";
import { create_position } from "../src/position.js";

function makeMockRenderer(width = 40, height = 20) {
  return {
    width,
    height,
    buffer: {
      fill: () => {},
      put: () => {},
      draw: () => {},
    },
    term: {
      moveTo: () => {},
      eraseLine: () => {},
      white: () => {},
      styleReset: () => {},
    },
  };
}

describe("view.ts", () => {
  test("snapshot_ascii includes player symbol", () => {
    const actor: Actor = {
      location: create_position(2, 2),
      name: "player",
      health: 100,
      mailbox: [],
      outbox: [],
      actions: {},
      send: () => {},
      update: () => actor,
    };

    const ascii = snapshot_ascii([actor], 5, 5);
    expect(ascii.split("\n")[2][2]).toBe("▲");
  });

  test("draw_footer renders without crashing", () => {
    const renderer = makeMockRenderer();
    expect(() => draw_footer(renderer, 2, 100)).not.toThrow();
  });
});
