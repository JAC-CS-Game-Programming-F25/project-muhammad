import GameEntity from "./GameEntity.js";
import { images } from "../globals.js";
import StateMachine from "../../lib/StateMachine.js";
import PlayerWalkingState from "../states/player/PlayerWalkingState.js";
import PlayerIdlingState from "../states/player/PlayerIdlingState.js";
import PlayerRunningState from "../states/player/PlayerRunningState.js";
import PlayerStateName from "../enums/PlayerStateName.js";
import Sprite from "../../lib/Sprite.js";
import Vector from "../../lib/Vector.js";
import Character from "../enums/Character.js";
import Tile from "../services/Tile.js";

export default class Player extends GameEntity {
    constructor(entityDefinition = {}, map) {
        super(entityDefinition);

        this.map = map;
        this.dimensions = new Vector(GameEntity.WIDTH, GameEntity.HEIGHT);

        this.velocity = new Vector(0, 0);
        this.speed = 50;
        this.runSpeed = 130;

        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaDrainRate = 30;
        this.staminaRegenRate = 20;

        this.stateMachine = this.initializeStateMachine();

        this.idleSprites = this.initializeSprites(Character.CharacterIdle);
        this.walkSprites = this.initializeSprites(Character.CharacterWalk);

        this.sprites = this.idleSprites;
        this.currentAnimation =
            this.stateMachine.currentState.animation[this.direction];
    }

    update(dt) {
        super.update(dt);


        this.canvasPosition.x += this.velocity.x * dt;
        this.canvasPosition.y += this.velocity.y * dt;

        this.position.x = Math.floor(this.canvasPosition.x / Tile.SIZE);
        this.position.y = Math.floor(this.canvasPosition.y / Tile.SIZE);

        if (
            this.stateMachine.currentState.constructor.name !==
            "PlayerRunningState"
        ) {
            this.stamina = Math.min(
                this.maxStamina,
                this.stamina + this.staminaRegenRate * dt
            );
        }

        this.currentAnimation.update(dt);
        this.currentFrame = this.currentAnimation.getCurrentFrame();
    }

    render() {
        const x = Math.floor(this.canvasPosition.x);
        const y = Math.floor(this.canvasPosition.y - this.dimensions.y / 2);

        super.render(x, y);
    }

    initializeStateMachine() {
        const stateMachine = new StateMachine();

        stateMachine.add(PlayerStateName.Walking, new PlayerWalkingState(this));
        stateMachine.add(PlayerStateName.Idling, new PlayerIdlingState(this));
        stateMachine.add(PlayerStateName.Running, new PlayerRunningState(this));

        stateMachine.change(PlayerStateName.Idling);

        return stateMachine;
    }

    initializeSprites(character) {
        return Sprite.generateSpritesFromSpriteSheet(
            images.get(character),
            GameEntity.WIDTH,
            GameEntity.HEIGHT
        );
    }

    canRun() {
        return this.stamina > 0;
    }

    drainStamina(dt) {
        this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * dt);
    }
}
