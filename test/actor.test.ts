// import { make_actor_player, make_actor_enemy, make_actor_bullet } from "../src/actor";
// import { create_position } from "../src/position";

// test("Player moves correctly", () => {
//   const pos = create_position(5, 5);
//   const player = make_actor_player(pos);
//   player.send({ key: "move", params: { x: 1, y: 0 } });
//   const updated = player.update();
//   expect(updated.location).toEqual({ x: 6, y: 5 });
// });

// test("Enemy spawns with correct position", () => {
//   const pos = create_position(3, 0);
//   const enemy = make_actor_enemy(pos);
//   expect(enemy.location).toEqual(pos);
//   expect(enemy.name).toBe("enemy");
// });

// test("Bullet moves in given direction", () => {
//   const pos = create_position(1, 1);
//   const dir = { x: 0, y: -1 };
//   const bullet = make_actor_bullet(pos, dir);
//   bullet.send({ key: "tick", params: [] });
//   const moved = bullet.update();
//   expect(moved.location).toEqual({ x: 1, y: 0 });
// });
import {
  make_actor_player,
  make_actor_enemy,
  make_actor_bullet,
  Actor,
} from "../src/actor";
import { create_position } from "../src/position";

test("Player moves correctly", () => {
  const pos = create_position(5, 5);
  const player = make_actor_player(pos);

  player.send({ key: "move", params: { x: 1, y: 0 } });
  const updated = player.update();

  expect(updated.location).toEqual({ x: 6, y: 5 });
});

test("Enemy spawns with correct position (difficulty 1)", () => {
  const pos = create_position(3, 0);
  const enemy = make_actor_enemy(pos, 1); // ← on passe la difficulté
  expect(enemy.location).toEqual(pos);
  expect(enemy.name).toBe("enemy");
});

test("Enemy fires only at difficulty ≥ 2", () => {
  const pos = create_position(3, 0);
  // ennemi niveau 2 : doit créer un bullet si aligné
  const enemy = make_actor_enemy(pos, 2);

  // on lui envoie la position du joueur aligné sur x
  enemy.send({ key: "player_position", params: create_position(3, 5) });
  enemy.send({ key: "tick", params: [] });
  const updated = enemy.update();

  // un message spawn doit apparaître dans son outbox
  const hasSpawn = updated.outbox.some((m) => m.key === "spawn");
  expect(hasSpawn).toBe(true);
});

test("Bullet moves in given direction on tick", () => {
  const pos = create_position(1, 1);
  const dir = { x: 0, y: -1 };
  const bullet = make_actor_bullet(pos, dir);

  bullet.send({ key: "tick", params: [] });
  const moved = bullet.update();

  expect(moved.location).toEqual({ x: 1, y: 0 });
});
