import type { World } from "./worlds.js";
import { snapshot_ascii, render, createRenderer } from "./view.js";
import { make_world, add_actor, tick_world } from "./worlds.js";
import {
  make_actor_player,
  make_actor_bullet,
  make_actor_enemy,
  createWallLine,
  Actor,
  Message
} from "./actor.js";
import { create_position, position_add, Position as position } from "./position.js";
import { setup_keyboard } from "./keyboard.js";


function getRandomIntInclusive(min: number, max: number): number {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}


// src/game.ts  – tout en haut, juste après les imports
type Difficulty = 1 | 2 | 3;   // ← ajoute cette ligne

export type GameState = {
  renderer: ReturnType<typeof createRenderer>;
  width: number;
  height: number;
  world: World;
  player: Actor;
  snapshots: string[];
  history: World[];
  snapshot_index: number;
  is_paused: boolean;
  tick: number;
  lastLeftGap: number;
  lastRightGap: number;
  difficulty: Difficulty;
  currentGapWidth: number;
  score: number;
};

export function initial_state(): GameState {
  const renderer = createRenderer();
  const width = renderer.width;
  const height = renderer.height;
  const world0 = make_world();
  const player = make_actor_player(create_position(Math.floor(width / 2), Math.floor(height / 2)));
  const world1 = add_actor(world0, player);

  return {
    renderer,
    width,
    height,
    world: world1,
    player,
    snapshots: [snapshot_ascii(world1.actors, width, height)],
    history: [world1],
    snapshot_index: 0,
    is_paused: false,
    tick: 0,
    lastLeftGap: 2,
    lastRightGap: width - 2,
    difficulty: 1,
    currentGapWidth: 12,
    score: 0, 
  };
}

export function restore_snapshot(state: GameState, index: number): GameState {
  if (!state.history[index]) return state;
  const snap = state.history[index];
  const player = snap.actors.find(a => a.name === "player") || state.player;
  return { ...state, snapshot_index: index, world: snap, player };
}

// function handle_key(state: GameState, key: string): GameState {
//   if (key === "p") return { ...state, is_paused: !state.is_paused };

//   if (state.is_paused) {
//     if (key === "x" && state.snapshot_index > 0) return restore_snapshot(state, state.snapshot_index - 1);
//     if (key === "c" && state.snapshot_index < state.history.length - 1) return restore_snapshot(state, state.snapshot_index + 1);
//     return state;
//   }

//   const player = state.player;
//   let world = state.world;

//   if (key === "z") player.send({ key: "move", params: { x: 0, y: -1 } });
//   if (key === "s") player.send({ key: "move", params: { x: 0, y: 1 } });
//   if (key === "q") player.send({ key: "move", params: { x: -1, y: 0 } });
//   if (key === "d") player.send({ key: "move", params: { x: 1, y: 0 } });

//   if (key === "6") {
//     const dir = { x: 1, y: 0 };
//     const pos = position_add(player.location, dir);
//     world = add_actor(world, make_actor_bullet(pos, dir));
//   }
//   if (key === "4") {
//     const dir = { x: -1, y: 0 };
//     const pos = position_add(player.location, dir);
//     world = add_actor(world, make_actor_bullet(pos, dir));
//   }
//   if (key === "8") {
//     const dir = { x: 0, y: -1 };
//     const pos = position_add(player.location, dir);
//     world = add_actor(world, make_actor_bullet(pos, dir));
//   }
//   if (key === "5") {
//     const dir = { x: 0, y: 1 };
//     const pos = position_add(player.location, dir);
//     world = add_actor(world, make_actor_bullet(pos, dir));
//   }

//   return { ...state, player, world };
// }

// keyboard.ts ou là où se trouve handle_key
export function handle_key(state: GameState, key: string): GameState {
  /*───────────────────────────
    0. Changement de difficulté
  ───────────────────────────*/
  if (key === "1" || key === "2" || key === "3") {
    const newDifficulty = Number(key) as 1 | 2 | 3;

    // Si on passe au niveau 3 pour la 1ʳᵉ fois, on mémorise la largeur actuelle
    const keepGap =
      newDifficulty === 3
        ? state.lastRightGap - state.lastLeftGap   // largeur courante
        : state.currentGapWidth;                   // on garde la valeur existante

    return {
      ...state,
      difficulty: newDifficulty,
      currentGapWidth: keepGap,
    };
  }

  /*───────────────────────────
    1. Pause
  ───────────────────────────*/
  if (key === "p") return { ...state, is_paused: !state.is_paused };

  /*───────────────────────────
    2. Navigation temporelle (mode pause)
  ───────────────────────────*/
  if (state.is_paused) {
    if (key === "x" && state.snapshot_index > 0)
      return restore_snapshot(state, state.snapshot_index - 1);
    if (key === "c" && state.snapshot_index < state.history.length - 1)
      return restore_snapshot(state, state.snapshot_index + 1);
    return state;
  }

  /*───────────────────────────
    3. Commandes de jeu
  ───────────────────────────*/
  const player = state.player;
  let world = state.world;

  // Déplacements
  if (key === "z") player.send({ key: "move", params: { x: 0, y: -1 } });
  if (key === "s") player.send({ key: "move", params: { x: 0, y: 1 } });
  if (key === "q") player.send({ key: "move", params: { x: -1, y: 0 } });
  if (key === "d") player.send({ key: "move", params: { x: 1, y: 0 } });

  // Tirs (4 – 5 – 6 – 8 du pavé numérique)
  if (key === "6") {
    const dir = { x: 1, y: 0 };
    world = add_actor(world, make_actor_bullet(position_add(player.location, dir), dir));
  }
  if (key === "4") {
    const dir = { x: -1, y: 0 };
    world = add_actor(world, make_actor_bullet(position_add(player.location, dir), dir));
  }
  if (key === "8") {
    const dir = { x: 0, y: -1 };
    world = add_actor(world, make_actor_bullet(position_add(player.location, dir), dir));
  }
  if (key === "5") {
    const dir = { x: 0, y: 1 };
    world = add_actor(world, make_actor_bullet(position_add(player.location, dir), dir));
  }

  return { ...state, player, world };
}

// function game_tick(state: GameState): GameState {
//   const { renderer, width, height } = state;

//   if (state.is_paused) {
//     render(renderer, state.history[state.snapshot_index].actors, state.snapshot_index, state.history.length, true);
//     return state;
//   }

//   let world = state.world;
//   const tick = state.tick + 1;

//   // if (Math.random() < 0.1) {
//   //   const random_x = Math.floor(Math.random() * width);
//   //   const new_enemy = make_actor_enemy(create_position(random_x, 0));
//   //   world = add_actor(world, new_enemy);
//     // }
//     if (Math.random() < 0.1) {
//   const random_x = Math.floor(Math.random() * width);
//   world = add_actor(world, make_actor_enemy(create_position(random_x, 0), state.difficulty));
// }


//   world = tick_world(world, height);
//   const maybe_player = world.actors.find(a => a.name === "player") || state.player;

//   const newLeftGap = Math.min(15, Math.max(2, Math.min(state.lastLeftGap + getRandomIntInclusive(-1, 1), width - 8)));
//   const newRightGap = Math.max(width - 15, Math.max(newLeftGap + 5, Math.min(state.lastRightGap + getRandomIntInclusive(-1, 1), width - 2)));
//   const gapWidth = newRightGap - newLeftGap;

//   const walls = createWallLine(0, newLeftGap, gapWidth, width);
//   walls.forEach(wall => {
//     world = add_actor(world, wall);
//   });

//   const history = [...state.history];
//   const snapshots = [...state.snapshots];
//   let snapshot_index = state.snapshot_index;

//   if (tick % 10 === 0) {
//     history.push(world);
//     snapshot_index = history.length - 1;
//     const snapshot = snapshot_ascii(world.actors, width, height);
//     snapshots.push(snapshot);
//   }

//   render(renderer, world.actors, snapshot_index, history.length);

//   return {
//     ...state,
//     world,
//     player: maybe_player,
//     tick,
//     history,
//     snapshots,
//     snapshot_index,
//     lastLeftGap: newLeftGap,
//     lastRightGap: newRightGap,
//   };
// }

export function game_tick(state: GameState): GameState {
  const { renderer, width, height, difficulty } = state;

  /*───────────────────────────
    1. Pause / Replay
  ───────────────────────────*/
  if (state.is_paused) {
    render(
      renderer,
      state.history[state.snapshot_index].actors,
      state.difficulty,
      state.score,
      state.snapshot_index,
      state.history.length,
      true
    );
    return state;
  }

  /*───────────────────────────
    2. Tick & Spawns
  ───────────────────────────*/
  let world = state.world;
  const tick = state.tick + 1;

  // Apparition aléatoire d’un ennemi
  if (Math.random() < 0.10) {
    const x = Math.floor(Math.random() * width);
    world = add_actor(world, make_actor_enemy(create_position(x, 0), difficulty));
  }

  /*───────────────────────────
    3. Score : comptage des ennemis avant la mise à jour
  ───────────────────────────*/
  const enemiesBefore = world.actors.filter(a => a.name === "enemy").length;

  /*───────────────────────────
    4. Mise à jour du monde (collisions, déplacements…)
  ───────────────────────────*/
  world = tick_world(world, height);
  const maybe_player = world.actors.find(a => a.name === "player") || state.player;

  /*──────── score ───────*/
  const enemiesAfter = world.actors.filter(a => a.name === "enemy").length;
  const scoreGain    = Math.max(0, enemiesBefore - enemiesAfter) * 10;
  const newScore     = state.score + scoreGain;

 /*───────────────────────────
  5. Génération / rétrécissement du couloir
───────────────────────────*/

// largeur courante du trou
let gapWidth =
  difficulty === 3
    ? state.currentGapWidth               // on suit la largeur qui rétrécit
    : state.lastRightGap - state.lastLeftGap;  // sinon on garde la largeur d’avant

// — rétrécir au niveau 3 —
const MIN_GAP       = 5;     // largeur mini
const SHRINK_EVERY  = 5;     // tous les N ticks
if (difficulty === 3 && tick % SHRINK_EVERY === 0 && gapWidth > MIN_GAP) {
  gapWidth -= 1;             // on retire une colonne des DEUX côtés
}

// — déplacer le centre du couloir —
const MAX_SHIFT = 1;         // d’au plus 1 case par tick
const prevCenter = (state.lastLeftGap + state.lastRightGap) / 2;
const newCenter  = Math.max(
  2 + gapWidth / 2,
  Math.min(
    prevCenter + getRandomIntInclusive(-MAX_SHIFT, MAX_SHIFT),
    width - 2 - gapWidth / 2
  )
);

// bornes gauche / droite arrondies
const newLeftGap  = Math.floor(newCenter - gapWidth / 2);
const newRightGap = Math.ceil (newCenter + gapWidth / 2);

// mur de la ligne 0
createWallLine(0, newLeftGap, gapWidth, width).forEach(wall => {
  world = add_actor(world, wall);
});


  /*───────────────────────────
    6. Snapshots (rewind)
  ───────────────────────────*/
  const history   = [...state.history];
  const snapshots = [...state.snapshots];
  let snapshotIdx = state.snapshot_index;

  if (tick % 10 === 0) {
    history.push(world);
    snapshotIdx = history.length - 1;
    snapshots.push(snapshot_ascii(world.actors, width, height));
  }

  /*───────────────────────────
    7. Rendu & retour d’état
  ───────────────────────────*/
  render(
    renderer,
    world.actors,
    difficulty,
    newScore,
    snapshotIdx,
    history.length
  );

  return {
    ...state,
    world,
    player: maybe_player,
    tick,
    history,
    snapshots,
    snapshot_index: snapshotIdx,
    lastLeftGap: newLeftGap,
    lastRightGap: newRightGap,
    currentGapWidth: gapWidth,
    score: newScore,
  };
}


function run(): void {
  let state = initial_state();

  setup_keyboard((key: string) => {
    state = handle_key(state, key);
  });

  const interval = setInterval(() => {
    state = game_tick(state);

    const player = state.world.actors.find(a => a.name === "player");
    if (!player || state.tick > 5000) {
      clearInterval(interval);
      const term = state.renderer.term;
      term.moveTo(2, state.height + 3);
      term[state.tick > 500 ? "green" : "red"](state.tick > 5000 ? "Fin de la simulation." : "Game Over. Appuyez sur une touche pour quitter...");
      term.grabInput(true);
      term.on("key", () => {
        term.hideCursor(false);
        term.clear();
        process.exit();
      });
    }
  }, 50);
}

run();
