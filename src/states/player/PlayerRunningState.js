import PlayerMovingState from "./PlayerMovingState.js";
import PlayerStateName from "../../enums/PlayerStateName.js";
import SoundName from "../../enums/SoundName.js";
import Input from "../../../lib/Input.js";
import { input, sounds } from "../../globals.js";

export default class PlayerRunningState extends PlayerMovingState {
    static RUN_ANIMATION_TIME = 0.05; // Faster animation when running
    static DUST_INTERVAL = 0.15; // Spawn dust every 0.15 seconds

    constructor(player) {
        // Use runSpeed instead of normal speed
        super(player, player.runSpeed, PlayerRunningState.RUN_ANIMATION_TIME);

        // Dust particle timer
        this.dustTimer = 0;
    }

    enter() {
        super.enter();
        // Play running breathing sound
        sounds.play(SoundName.RunningBreathing);

        // Reset dust timer
        this.dustTimer = 0;
    }

    exit() {
        // Stop running breathing sound
        sounds.stop(SoundName.RunningBreathing);
    }

    update(dt) {
        // Drain stamina while running
        this.player.drainStamina(dt);

        // JUICE: Running dust particles
        this.dustTimer += dt;
        if (this.dustTimer >= PlayerRunningState.DUST_INTERVAL) {
            this.dustTimer = 0;

            // Spawn dust particles at player's feet (centered horizontally)
            if (this.player.map && this.player.map.juiceEffects) {
                this.player.map.juiceEffects.createRunDust(
                    this.player.mapPosition.x + this.player.dimensions.x / 2, // Center horizontally
                    this.player.mapPosition.y + this.player.dimensions.y - 30 // At player's feet
                );
            }
        }

        // Call parent update for movement handling
        super.update(dt);
    }

    /**
     * Check if we should transition to a different state
     */
    shouldChangeState() {
        // Check for signing (Enter key) - only if player can sign (once per round)
        if (input.isKeyPressed(Input.KEYS.ENTER)) {
            if (
                this.player.roundManager &&
                this.player.roundManager.canSign()
            ) {
                this.player.roundManager.markSigned();
                this.player.changeState(PlayerStateName.Signing);
                return true;
            }
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
