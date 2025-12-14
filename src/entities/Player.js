import GameEntity from "./GameEntity.js";
import { images } from "../globals.js";
import StateMachine from "../../lib/StateMachine.js";
import PlayerWalkingState from "../states/player/PlayerWalkingState.js";
import PlayerIdlingState from "../states/player/PlayerIdlingState.js";
import PlayerRunningState from "../states/player/PlayerRunningState.js";
import PlayerSigningState from "../states/player/PlayerSigningState.js";
import PlayerStateName from "../enums/PlayerStateName.js";
import Sprite from "../../lib/Sprite.js";
import Vector from "../../lib/Vector.js";
import Character from "../enums/Character.js";
import Tile from "../services/Tile.js";

export default class Player extends GameEntity {
    /**
     * The character that the player controls in the map.
     *
     * @param {object} entityDefinition
     * @param {Map} map - Reference to the game map
     */
    constructor(entityDefinition = {}, map) {
        super(entityDefinition);

        this.map = map;
        this.dimensions = new Vector(GameEntity.WIDTH, GameEntity.HEIGHT);

        this.velocity = new Vector(0, 0);
        this.speed = 50;  // Walking speed
        this.runSpeed = 80;  // Running speed - 60% faster but safe for collision
        
        // Stamina system
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaDrainRate = 30;  // Stamina per second when running
        this.staminaRegenRate = 20;  // Stamina per second when not running

        // Map position (where player is in the map world)
        // Convert tile position to pixel position
        const tileX = entityDefinition.position ? entityDefinition.position.x : (entityDefinition.x || 0);
        const tileY = entityDefinition.position ? entityDefinition.position.y : (entityDefinition.y || 0);
        
        this.mapPosition = new Vector(
            tileX * Tile.SIZE,
            tileY * Tile.SIZE
        );

        this.stateMachine = this.initializeStateMachine();

        this.idleSprites = this.initializeSprites(Character.CharacterIdle);
        this.walkSprites = this.initializeSprites(Character.CharacterWalk);
        this.signSprites = this.initializeSprites(Character.CharacterSign);

        this.sprites = this.idleSprites;
        this.currentAnimation =
            this.stateMachine.currentState.animation[this.direction];
        
        // Sign that persists after placement
        this.sign = null;
    }

    update(dt) {
        // Update state machine (handles input, collision, and position updates)
        this.stateMachine.update(dt);

        // Position is now updated directly in PlayerMovingState to prevent tunneling

        // Update tile position for reference
        this.position.x = Math.floor(this.mapPosition.x / Tile.SIZE);
        this.position.y = Math.floor(this.mapPosition.y / Tile.SIZE);

        // Regenerate stamina when not running (idle or walking)
        if (this.stateMachine.currentState.constructor.name !== 'PlayerRunningState') {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * dt);
        }

        // Update animation
        this.currentAnimation.update(dt);
        this.currentFrame = this.currentAnimation.getCurrentFrame();
    }

    render() {
        // Player is always rendered at a fixed screen position (center of screen)
        const screenX = Math.floor(this.canvasPosition.x);
        const screenY = Math.floor(this.canvasPosition.y - this.dimensions.y / 2);

        super.render(screenX, screenY);
    }

    initializeStateMachine() {
        const stateMachine = new StateMachine();

        stateMachine.add(PlayerStateName.Walking, new PlayerWalkingState(this));
        stateMachine.add(PlayerStateName.Idling, new PlayerIdlingState(this));
        stateMachine.add(PlayerStateName.Running, new PlayerRunningState(this));
        stateMachine.add(PlayerStateName.Signing, new PlayerSigningState(this));

        stateMachine.change(PlayerStateName.Idling);

        return stateMachine;
    }

    /**
     * Generate sprites from the character sprite sheets
     */
    initializeSprites(character) {
        return Sprite.generateSpritesFromSpriteSheet(
            images.get(character),
            GameEntity.WIDTH,
            GameEntity.HEIGHT
        );
    }

    /**
     * Check if player has enough stamina to run
     */
    canRun() {
        return this.stamina > 0;
    }

    /**
     * Drain stamina while running
     */
    drainStamina(dt) {
        this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * dt);
    }
}