/* Jest tests for worlds.ts – sans describe wrapper */
import { make_world, add_actor, tick_world } from "../src/worlds";
import { make_actor_player, make_actor_bullet, make_actor_enemy } from "../src/actor";
import { create_position } from "../src/position";

// ---------- simple tests ----------

test("make_world starts with 0 actors", () => {
  expect(make_world().actors).toHaveLength(0);
});

test("add_actor appends", () => {
  const w0 = make_world();
  const p = make_actor_player(create_position(0, 0));
  const w1 = add_actor(w0, p);
  expect(w1.actors).toContain(p);
});

test("tick_world moves bullet 1 step", () => {
  let w = make_world();
  const b = make_actor_bullet(create_position(1, 1), { x: 1, y: 0 });
  w = add_actor(w, b);
  w = tick_world(w, 50);
  const moved = w.actors.find(a => a.name === "bullet");
  expect(moved!.location).toEqual({ x: 2, y: 1 });
});

// Collision bullet vs enemy must remove enemy the same tick

test("bullet hitting enemy removes enemy", () => {
  let w = make_world();
  const enemy = make_actor_enemy(create_position(5, 5), 1);
  const bullet = make_actor_bullet(create_position(5, 5), { x: 0, y: 1 }); // bullet downward, same start
  w = add_actor(add_actor(w, enemy), bullet);

  w = tick_world(w, 100);

  const stillEnemy = w.actors.find(a => a.name === "enemy");
  expect(stillEnemy).toBeUndefined();
});
