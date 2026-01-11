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

  if (!process.stdout.isTTY) {
    const dummy = {
      width: 80,
      height: 24,
      put: () => {},
      fill: () => {},
      draw: () => {},
      moveTo: () => {},
      color: () => {},
      colorRgb: () => {},
      bgColor: () => {},
      styleReset: () => {},
      hideCursor: () => {},
    };

    return {
      width: 80,
      height: 22,
      buffer: dummy,
      term: dummy,
    };
  }

  term.fullscreen(true);
  term.hideCursor();

  const buffer = new ScreenBuffer({
    dst: term,
    width: term.width,
    height: term.height - 2,
    y: 1,
    noFill: false,
  });

  return {
    width: term.width,
    height: term.height - 2,
    buffer,
    term,
  };
}

function get_actor_symbol(actor: Actor): { char: string; color: string } {
  return {
    wall:   { char: "▓", color: "white" },
    bullet: { char: "•", color: "#FFD700" },
    enemy:  { char: "▽", color: "#FF0000" },
    player: { char: "▲", color: "#00BFFF" },
  }[actor.name] || { char: "?", color: "white" };
}

// function draw_health_bar(renderer: Renderer, health: number): void {
//   const barWidth = 30;
//   renderer.term.color("white")(`${Math.max(0, health)} / 100     `); // ← ajouter des espaces à la fin



//   renderer.term.moveTo(2, renderer.height + 1);
//   renderer.term("Health: [");
//   renderer.term.colorRgb(0, 255, 0)("█".repeat(filled));
//   renderer.term.colorRgb(60, 60, 60)(" ".repeat(barWidth - filled));
//   renderer.term("] ");
//   renderer.term.color("white")(`${Math.max(0, health)} / 100`);
// }

function draw_health_bar(renderer: Renderer, health: number): void {
  const barWidth = 30;
  const filled = Math.round((health / 100) * barWidth);

  // Effacer l’ancienne ligne
  renderer.term.moveTo(2, renderer.height + 1);
  renderer.term.eraseLine();

  // Afficher la barre
  renderer.term.moveTo(2, renderer.height + 1);
  renderer.term("Health: [");
  renderer.term.colorRgb(0, 255, 0)("█".repeat(filled));
  renderer.term.colorRgb(60, 60, 60)(" ".repeat(barWidth - filled));
  renderer.term("] ");

  // Affichage propre du texte avec padding
  const healthStr = `${Math.max(0, health)}`.padStart(3, ' ');
  renderer.term.color("white")(`${healthStr} / 100`);
}


function draw_game_over(renderer: Renderer): void {
  const text = " GAME OVER ";
  const x = Math.floor((renderer.width - text.length) / 2);
  const y = Math.floor(renderer.height / 2);

  renderer.term.moveTo(x, y);
  renderer.term.red.bold(text);
}

export function render(
  renderer: Renderer,
  actors: Actor[],
  difficulty: number,   // ← nouveau
  score: number,        // ← nouveau
  snapshot_index?: number,
  total_snapshots?: number,
  paused: boolean = false
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
  buffer.put({ x: 0, y: 0 }, "╔");
  buffer.put({ x: renderer.width - 1, y: 0 }, "╗");
  buffer.put({ x: 0, y: renderer.height - 1 }, "╚");
  buffer.put({ x: renderer.width - 1, y: renderer.height - 1 }, "╝");

  const player = actors.find((a) => a.name === "player");

  for (const actor of actors) {
    const { x, y } = actor.location;
    const { char, color } = get_actor_symbol(actor);

    if (x > 0 && y > 0 && x < renderer.width - 1 && y < renderer.height - 1) {
      buffer.put({ x, y, attr: { color, bgColor: "black" } }, char);
    }
  }

  buffer.draw({ delta: true });

  if (player) {
    draw_health_bar(renderer, player.health);
  } else {
    draw_game_over(renderer);
  }
  
  if (snapshot_index !== undefined && total_snapshots !== undefined) {
    draw_snapshot_bar(renderer, snapshot_index, total_snapshots);
    if (paused) {
      renderer.term.moveTo(2, renderer.height + 2);
      renderer.term.yellow("⏸️  Mode pause – utilisez ← et → pour naviguer dans le temps");
    }
  }

  draw_footer(renderer, difficulty, score);

}

export function snapshot_ascii(actors: Actor[], width: number, height: number): string {
  const grid: string[][] = Array.from({ length: height }, () => Array(width).fill(" "));

  for (const actor of actors) {
    const { x, y } = actor.location;
    if (x >= 0 && y >= 0 && x < width && y < height) {
      const { char } = get_actor_symbol(actor);
      grid[y][x] = char;
    }
  }

  return grid.map(row => row.join(""))
              .join("\n");
}

export function draw_snapshot_bar(renderer: Renderer, current: number, total: number): void {
  renderer.term.moveTo(Math.floor(renderer.width / 2 - 10), 0);
  renderer.term.bold.white("Restore Snapshot:");
  renderer.term.moveTo(2, 1);
  renderer.term("Snapshots: ");

  const MAX = 20;
  const start = Math.max(0, current - Math.floor(MAX / 2));
  const end = Math.min(total, start + MAX);

  for (let i = start; i < end; i++) {
    if (i === current) {
      renderer.term.white.bgBlue(` ${i} `);
    } else {
      renderer.term.white(` ${i} `);
    }
  }
  renderer.term.styleReset();
}

export function draw_footer(renderer: Renderer, difficulty: number, score: number): void {
  const y = renderer.height + 1;

  // Ligne complète effacée
  renderer.term.moveTo(1, y);
  renderer.term.eraseLine();

  /*─── Niveau (centre) ───*/
  const levelStr = `Niveau: ${difficulty}`;
  const xLevel   = Math.floor((renderer.width - levelStr.length) / 2);
  renderer.term.moveTo(xLevel, y);
  renderer.term.white(levelStr);

  /*─── Score (droite) ───*/
  const scoreStr = `Score: ${score}`;
  const xScore   = renderer.width - scoreStr.length - 1;
  renderer.term.moveTo(xScore, y);
  renderer.term.white(scoreStr);
}
