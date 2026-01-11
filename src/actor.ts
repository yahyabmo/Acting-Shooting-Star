import { Position, position_add } from "./position.js";

export type Message = {
  key: string;
  params: any;
};

export type Difficulty = 1 | 2 | 3;           // ← ajout rapide

export type Actor = {
  location: Position;
  send: (message: Message) => void;
  actions: {
    [key: string]: (a: Actor, ...rest: any) => Actor;
  };
  update: () => Actor;
  mailbox: Message[];
  outbox: Message[];
  health: number;
  name: string;
};

export function base_actor(
  position: Position,
  health = 100,
  name = "",
  extraActions: { [key: string]: (a: Actor, ...rest: any[]) => Actor } = {}
): Actor {
  const actor: Actor = {
    location: position,
    mailbox: [],
    outbox: [],
    health,
    name,
    actions: {},

    send(message: Message) {
      actor.mailbox.push(message);
    },

    update() {
      let updated = actor;
      for (const msg of actor.mailbox) {
        const action = updated.actions[msg.key];
        if (action) {
          updated = action(updated, msg.params);
        }
      }
      updated.mailbox = [];
      return updated;
    },
  };

  
  actor.actions["move"] = (a: Actor, delta: Position): Actor => {
    return base_actor(position_add(a.location, delta), a.health, a.name, actor.actions);
  };

  // actor.actions["collide"] = (a: Actor, damage: number): Actor => {
  //   return base_actor(a.location, a.health - damage, a.name, actor.actions);
    // };
    actor.actions["collide"] = (a: Actor, damage: number): Actor => {
       const newHealth = a.health - damage;
       return base_actor(a.location, newHealth <= 0 ? -1 : newHealth, a.name, actor.actions);
    };


  
  for (const key in extraActions) {
    actor.actions[key] = extraActions[key]!;
  }

  return actor;
}


function clone_actor(a: Actor, new_position: Position): Actor {
  const clone = base_actor(new_position, a.health, a.name, a.actions);
  clone.outbox = [...a.outbox];
  return clone;
}

export function make_actor_player(position: Position): Actor {
  return base_actor(position, 100, "player", {
    tick: (a: Actor) => a 
  });
}


// export function make_actor_enemy(position: Position): Actor {
//   return base_actor(position, 1, "enemy", {
//     tick: (a: Actor): Actor => {
//       // Trouver le joueur dans le monde (à travers les messages)
//       const playerMsg = a.mailbox.find(m => m.key === "player_position");

//       if (playerMsg) {
//         const playerPos = playerMsg.params as Position;
//         const dx = playerPos.x - a.location.x;
//         const dy = playerPos.y - a.location.y;

//         // Tir s'il est aligné
//         if (dx === 0 || dy === 0) {
//           const dir = dx !== 0
//             ? { x: dx > 0 ? 1 : -1, y: 0 }
//             : { x: 0, y: dy > 0 ? 1 : -1 };

//           const bullet = make_actor_bullet(position_add(a.location, dir), dir);
//           const clone = base_actor(a.location, a.health, a.name, a.actions);
//           clone.outbox.push({ key: "spawn", params: bullet });
//           return clone;
//         }
//       }

//       // Sinon, descente normale
//       const new_pos = position_add(a.location, { x: 0, y: 1 });
//       return base_actor(new_pos, a.health, a.name, a.actions);
//     }
//   });
// }


// Modifiez la fabrique pour accepter la difficulté
export function make_actor_enemy(position: Position, difficulty: Difficulty): Actor {
  return base_actor(position, 1, "enemy", {
    tick: (a: Actor): Actor => {
      // --- Phase de tir uniquement si niveau >= 2 ---
      if (difficulty >= 2) {
        const playerMsg = a.mailbox.find(m => m.key === "player_position");
        if (playerMsg) {
          const playerPos = playerMsg.params as Position;
          const dx = playerPos.x - a.location.x;
          const dy = playerPos.y - a.location.y;


          if (dx === 0 || dy === 0) {
            if (Math.random() < 0.5) { 
                const dir = dx !== 0 ? { x: dx > 0 ? 1 : -1, y: 0 } : { x: 0, y: dy > 0 ? 1 : -1 };
                const bullet = make_actor_bullet(position_add(a.location, dir), dir);
                const clone = base_actor(a.location, a.health, a.name, a.actions);
                clone.outbox.push({ key: "spawn", params: bullet });
                return clone;
            }
    }
        }
      }

      // Descendre d’une case quoi qu’il arrive
      const new_pos = position_add(a.location, { x: 0, y: 1 });
      return base_actor(new_pos, a.health, a.name, a.actions);
    }
  });
}


export function make_actor_bullet(position: Position, direction: Position): Actor {
    return base_actor(position, 1, "bullet", {
      tick: (a: Actor): Actor => {
        const new_position = position_add(a.location, direction);
        return base_actor(new_position, a.health, a.name, a.actions);
      }
    });
}




export function make_actor_wall(position: Position): Actor {
  return base_actor(position, Infinity, "wall", {
    tick: (a: Actor) => {
      // Déplacement vers le bas (+1 en Y)
      const newPosition = { x: a.location.x, y: a.location.y + 1 };
      return base_actor(newPosition, a.health, a.name, a.actions);
    }
  });
}
export function createWallLine(y: number, gapX: number, gapWidth: number, WIDTH: number): Actor[] {
  const wallActors: Actor[] = [];
  for (let x = 0; x < WIDTH; x++) {
    // Crée un mur sauf dans l'intervalle du gap
    if (x < gapX || x >= gapX + gapWidth) {
      wallActors.push(make_actor_wall({ x, y}));
    }
  }
  return wallActors;
}
