import PlayerMovingState from "./PlayerMovingState.js";
import PlayerStateName from "../../enums/PlayerStateName.js";
import SoundName from "../../enums/SoundName.js";
import Input from "../../../lib/Input.js";
import { input, sounds } from "../../globals.js";

export default class PlayerRunningState extends PlayerMovingState {
    static RUN_ANIMATION_TIME = 0.05;  // Faster animation when running

    constructor(player) {
        // Use runSpeed instead of normal speed
        super(player, player.runSpeed, PlayerRunningState.RUN_ANIMATION_TIME);
    }

    enter() {
        super.enter();
        // Play running breathing sound
        sounds.play(SoundName.RunningBreathing);
    }

    exit() {
        // Stop running breathing sound
        sounds.stop(SoundName.RunningBreathing);
    }

    update(dt) {
        // Drain stamina while running
        this.player.drainStamina(dt);

        // Call parent update for movement handling
        super.update(dt);
    }

    /**
     * Check if we should transition to a different state
     */
    shouldChangeState() {
        // Check for signing (Enter key)
        if (input.isKeyPressed(Input.KEYS.ENTER)) {
            this.player.changeState(PlayerStateName.Signing);
            return true;
        }

        // If stamina is depleted, drop to walking
        if (this.player.stamina <= 0) {
            this.player.changeState(PlayerStateName.Walking);
            return true;
        }

        // If shift is released, go back to walking or idling
        if (!input.isKeyHeld(Input.KEYS.SHIFT)) {
            // Check if still moving
            if (
                input.isKeyHeld(Input.KEYS.W) ||
                input.isKeyHeld(Input.KEYS.A) ||
                input.isKeyHeld(Input.KEYS.S) ||
                input.isKeyHeld(Input.KEYS.D)
            ) {
                this.player.changeState(PlayerStateName.Walking);
            } else {
                this.player.changeState(PlayerStateName.Idling);
            }
            return true;
        }

        return false;
    }

    /**
     * When no movement keys are pressed while running, go to idle
     */
    onNoInput() {
        this.player.changeState(PlayerStateName.Idling);
    }
}