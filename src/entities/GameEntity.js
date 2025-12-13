import Direction from "../enums/Direction.js";
import Tile from "../services/Tile.js";
import Vector from "../../lib/Vector.js";

export default class GameEntity {
    static WIDTH = 32;
    static HEIGHT = 64;

    constructor(entityDefinition = {}) {
        this.position = entityDefinition.position ?? new Vector();
        this.canvasPosition = new Vector(
            Math.floor(this.position.x * Tile.SIZE),
            Math.floor(this.position.y * Tile.SIZE)
        );
        this.dimensions = entityDefinition.dimensions ?? new Vector();
        this.direction = entityDefinition.direction ?? Direction.Down;
        this.stateMachine = null;
        this.currentFrame = 0;
        this.sprites = [];
    }

    update(dt) {
        this.stateMachine?.update(dt);
    }

    render(x, y) {
        this.stateMachine?.render();
        this.sprites[this.currentFrame].render(x, y);
    }

    changeState(state, params) {
        this.stateMachine?.change(state, params);
    }
}