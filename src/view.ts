//@ts-ignore
import { default as T } from "terminal-kit";
const ScreenBuffer = T.ScreenBuffer;
import { Actor } from "./actor.js";

export type Renderer = {
  width: number;
  height: number;
  buffer: any;
  term: any;
};

export function createRenderer(termOverride?: any): Renderer {
  const term = termOverride || T.terminal;
  term.fullscreen(true);
  term.hideCursor();

  const buffer = new ScreenBuffer({
    dst: term,
    width: term.width,
    height: term.height - 5,
    y: 1,
    noFill: false,
  });

  return { width: term.width, height: term.height - 5, buffer, term };
}

export function draw_menu(renderer: Renderer, callback: (choice: number) => void): void {
  const term = renderer.term;
  term.clear();

  // Titre Stylisé
  const title = [
    "  _____ _                 _   _              _____ _              ",
    " / ____| |               | | (_)            / ____| |             ",
    "| (___ | |__   ___   ___ | |_ _ _ __   __ _| (___ | |_ __ _ _ __ ",
    " \\___ \\| '_ \\ / _ \\ / _ \\| __| | '_ \\ / _` |\\___ \\| __/ _` | '__|",
    " ____) | | | | (_) | (_) | |_| | | | | (_| |____) | || (_| | |   ",
    "|_____/|_| |_|\\___/ \\___/ \\__|_|_| |_|\\__, |_____/ \\__\\__,_|_|   ",
    "                                       __/ |                      ",
    "                                      |___/                       "
  ];

  const startY = 4;
  title.forEach((line, i) => {
    term.moveTo(Math.floor((term.width - line.length) / 2), startY + i).brightCyan(line);
  });

  term.moveTo(Math.floor(term.width / 2) - 15, startY + 10).white("--- TS PROJECT ---");

  // Menu interactif centré
  const options = [" [ COMMENCER LA MISSION ] ", " [ QUITTER ] "];
  
  term.singleColumnMenu(options, {
    y: startY + 13,
    leftPadding: Math.floor(term.width / 2) - 13,
    style: term.cyan,
    selectedStyle: term.brightWhite.bgCyan.bold,
  }, (error: any, response: any) => {
    if (response) callback(response.selectedIndex);
  });
}

function get_actor_symbol(actor: Actor): { char: string; color: string } {
  return {
    wall:   { char: "█", color: "#333333" },
    bullet: { char: "🔥", color: "#FFFF00" },
    enemy:  { char: "👾", color: "#FF0055" },
    player: { char: "🚀", color: "#00FFFF" },
  }[actor.name] || { char: "?", color: "white" };
}

function draw_health_bar(renderer: Renderer, health: number): void {
  const barWidth = 30;
  const filled = Math.round((health / 100) * barWidth);
  renderer.term.moveTo(2, renderer.height + 1).eraseLine();
  renderer.term.moveTo(2, renderer.height + 1)("Health: [");
  renderer.term.colorRgb(0, 255, 0)("█".repeat(Math.max(0, filled)));
  renderer.term.colorRgb(60, 60, 60)(" ".repeat(Math.max(0, barWidth - filled)));
  renderer.term("] ");
  const healthStr = `${Math.max(0, health)}`.padStart(3, ' ');
  renderer.term.color("white")(`${healthStr} / 100`);
}

function draw_keyboard(renderer: Renderer, pressedKey: string | null): void {
  const y = renderer.height + 3;
  const keys = [
    { k: "z", label: " Z " }, { k: "q", label: " Q " },
    { k: "s", label: " S " }, { k: "d", label: " D " },
    { k: "p", label: " P " }
  ];

  renderer.term.moveTo(2, y).styleReset().white("Touches: ");
  let currentX = 11;

  keys.forEach(item => {
    renderer.term.moveTo(currentX, y);
    if (pressedKey === item.k) {
      renderer.term.bgWhite.black(item.label);
    } else {
      renderer.term.styleReset().white.dim(item.label);
    }
    currentX += 5;
  });
}

export function draw_footer(renderer: Renderer, difficulty: number, score: number): void {
  const y = renderer.height + 1;
  const levelStr = `Niveau: ${difficulty}`;
  const xLevel = Math.floor((renderer.width - levelStr.length) / 2);
  renderer.term.moveTo(xLevel, y).white(levelStr);

  const scoreStr = `Score: ${score}`;
  const xScore = renderer.width - scoreStr.length - 1;
  renderer.term.moveTo(xScore, y).white(scoreStr);
}

export function render(
  renderer: Renderer,
  actors: Actor[],
  difficulty: number,
  score: number,
  snapshot_index?: number,
  total_snapshots?: number,
  paused: boolean = false,
  pressedKey: string | null = null
): void {
  const { buffer } = renderer;
  buffer.fill({ attr: { color: "white", bgColor: "black" }, char: " " });

  for (let x = 0; x < renderer.width; x++) {
    buffer.put({ x, y: 0 }, "═");
    buffer.put({ x, y: renderer.height - 1 }, "═");
  }
  for (let y = 0; y < renderer.height; y++) {
    buffer.put({ x: 0, y }, "║");
    buffer.put({ x: renderer.width - 1, y }, "║");
  }

  for (const actor of actors) {
    const { x, y } = actor.location;
    const { char, color } = get_actor_symbol(actor);
    if (x > 0 && y > 0 && x < renderer.width - 1 && y < renderer.height - 1) {
      buffer.put({ x, y, attr: { color, bgColor: "black" } }, char);
    }
  }

  buffer.draw({ delta: true });

  const player = actors.find((a) => a.name === "player");
  if (player) draw_health_bar(renderer, player.health);
  
  draw_footer(renderer, difficulty, score);
  draw_keyboard(renderer, pressedKey);

  if (paused) {
    renderer.term.moveTo(2, renderer.height + 2).yellow("⏸️  Pause");
  }
}

export function snapshot_ascii(actors: Actor[], width: number, height: number): string {
  return ""; 
}