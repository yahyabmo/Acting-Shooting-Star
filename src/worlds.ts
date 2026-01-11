import { Actor, Message } from "./actor.js";

export type World = {
  actors: Actor[];
};

export function make_world(): World {
  return {
    actors: []
  };
}

export function add_actor(world: World, actor: Actor): World {
  return {
    actors: [...world.actors, actor]
  };
}

export function tick_world(world: World, maxHeight: number): World {
  const tick_msg: Message = { key: "tick", params: [] };
  const new_actors: Actor[] = [];

  // Repérer le joueur
  const player = world.actors.find(a => a.name === "player");

  if (player) {
    for (const actor of world.actors) {
      if (actor.name === "enemy") {
        actor.send({ key: "player_position", params: player.location });
      }
    }
  }

  // Phase 1: envoyer "tick"
  world.actors.forEach(actor => actor.send(tick_msg));

  // Phase 2: mise à jour
  const updated_actors = world.actors.map(actor => {
    const updated = actor.update();

    updated.outbox.forEach(msg => {
      if (msg.key === "spawn") {
        new_actors.push(msg.params);
      }
    });

    updated.outbox = [];
    return updated;
  });

  // Phase 3: collisions
  const pos_map: { [key: string]: Actor[] } = {};
  for (const actor of updated_actors) {
    const key = `${actor.location.x},${actor.location.y}`;
    if (!(key in pos_map)) pos_map[key] = [];
    pos_map[key].push(actor);
  }

  const collided_actors = updated_actors.map(actor => {
    const key = `${actor.location.x},${actor.location.y}`;
    const group = pos_map[key];

    if (group.length > 1) {
      const isWallCollision = group.some(other => other.name === "wall");
      const damage = isWallCollision ? 100 : 1;
      actor.send({ key: "collide", params: damage });
    }


    return actor.update();
  });

  // Phase 4: retirer les morts
  const living_actors = [...collided_actors, ...new_actors].filter(
    a => a.health > 0 && a.location.y < maxHeight
  );

  return { actors: living_actors };
}
