import { images } from "../globals.js";
import ImageName from "../enums/ImageName.js";
import Sprite from "../../lib/Sprite.js";
import Vector from "../../lib/Vector.js";
import StateMachine from "../../lib/StateMachine.js";
import GhostStateName from "../enums/GhostStateName.js";
import GhostHiddenState from "../states/ghost/GhostHiddenState.js";
import GhostMaterializingState from "../states/ghost/GhostMaterializingState.js";
import GhostAttackingState from "../states/ghost/GhostAttackingState.js";

export default class Ghost {
    static WIDTH = 32;
    static HEIGHT = 32;

    /**
     * A ghost entity that appears when player fails.
     * Uses a state machine: Hidden -> Materializing -> Attacking -> Hidden
     * 
     * @param {Vector} mapPosition - Position in map coordinates (pixels)
     */
    constructor(mapPosition) {
        this.mapPosition = mapPosition;
        this.sprite = this.initializeSprite();
        this.isVisible = false;
        this.opacity = 0; // Start invisible, will fade in during materialization
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
        stateMachine.add(GhostStateName.Materializing, new GhostMaterializingState(this));
        stateMachine.add(GhostStateName.Attacking, new GhostAttackingState(this));
        
        // Start in hidden state (currentState is set by add(), so change() will work)
        stateMachine.change(GhostStateName.Hidden);
        
        return stateMachine;
    }

    /**
     * Update ghost state machine
     */
    update(dt) {
        this.stateMachine.update(dt);
    }

    /**
     * Change ghost state
     */
    changeState(stateName) {
        this.stateMachine.change(stateName);
    }

    /**
     * Trigger ghost to materialize (called from PlayState when player fails)
     */
    materialize() {
        this.changeState(GhostStateName.Materializing);
    }

    /**
     * Render the ghost at its position (delegates to current state)
     */
    render() {
        // StateMachine.render() expects a context parameter, but ghost states use global context
        // So we just call the current state's render directly
        if (this.stateMachine && this.stateMachine.currentState) {
            this.stateMachine.currentState.render();
        }
    }
}

