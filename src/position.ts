

export type Position = {
    x: number;
    y: number; 
};

export function create_position(x: number, y: number): Position {
    return {x, y};
}

export function position_add(CurrentPosition: Position, Shift: Position): Position {
    return {x: CurrentPosition.x + Shift.x, y: CurrentPosition.y + Shift.y};
}

export function position_equals(pos1: Position, pos2: Position): boolean {
    return ((pos1.x === pos2.x) && (pos1.y === pos2.y));
}
