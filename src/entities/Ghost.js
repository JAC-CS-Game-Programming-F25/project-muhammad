import { images } from "../globals.js";
import ImageName from "../enums/ImageName.js";
import Sprite from "../../lib/Sprite.js";
import Vector from "../../lib/Vector.js";
import StateMachine from "../../lib/StateMachine.js";
import GhostStateName from "../enums/GhostStateName.js";
import GhostHiddenState from "../states/ghost/GhostHiddenState.js";
import GhostMaterializingState from "../states/ghost/GhostMaterializingState.js";
import GhostAttackingState from "../states/ghost/GhostAttackingState.js";
import GameEntity from "./GameEntity.js";
import Direction from "../enums/Direction.js";

export default class Ghost extends GameEntity {
    static WIDTH = 32;
    static HEIGHT = 32;

    /**
     * A ghost entity that appears when player fails.
     * Uses a state machine: Hidden -> Materializing -> Attacking -> Hidden
     * Extends GameEntity to leverage inheritance and polymorphism.
     *
     * @param {Vector} mapPosition - Position in map coordinates (pixels)
     */
    constructor(mapPosition) {
        // Call parent constructor with entity definition
        super({
            position: new Vector(
                Math.floor(mapPosition.x / 32),
                Math.floor(mapPosition.y / 32)
            ),
            dimensions: new Vector(Ghost.WIDTH, Ghost.HEIGHT),
            direction: Direction.Down,
        });

        this.mapPosition = mapPosition;
        this.isVisible = false;
        this.opacity = 0; // Start invisible, will fade in during materialization

        // Initialize sprite
        const ghostSprite = this.initializeSprite();

        // Keep BOTH for backward compatibility with states
        this.sprite = ghostSprite; // For ghost states (GhostMaterializingState, etc.)
        this.sprites = [ghostSprite]; // For GameEntity compatibility
        this.currentFrame = 0;

        // Initialize state machine (GameEntity expects this)
        this.stateMachine = this.initializeStateMachine();
    }

    /**
     * Initialize the ghost sprite from the ghost.png image
     */
    initializeSprite() {
        const ghostImage = images.get(ImageName.Ghost);
        // Create a single sprite from the 32x32 image
        return new Sprite(ghostImage, 0, 0, Ghost.WIDTH, Ghost.HEIGHT);
    }

    /**
     * Initialize the ghost state machine
     */
    initializeStateMachine() {
        const stateMachine = new StateMachine();

        // Add all states first
        stateMachine.add(GhostStateName.Hidden, new GhostHiddenState(this));
        stateMachine.add(
            GhostStateName.Materializing,
            new GhostMaterializingState(this)
        );
        stateMachine.add(
            GhostStateName.Attacking,
            new GhostAttackingState(this)
        );

        // Start in hidden state
        stateMachine.change(GhostStateName.Hidden);

        return stateMachine;
    }

    /**
     * Trigger ghost to materialize (called from PlayState when player fails)
     */
    materialize() {
        this.changeState(GhostStateName.Materializing);
    }

    /**
     * Override render to use custom rendering for ghost
     * GameEntity.render() uses sprites array, but ghosts use state-based rendering
     */
    render() {
        // Delegate to current state for custom ghost rendering
        if (this.stateMachine && this.stateMachine.currentState) {
            this.stateMachine.currentState.render();
        }
    }
}
