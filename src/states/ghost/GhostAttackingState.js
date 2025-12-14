import State from "../../../lib/State.js";
import { context, sounds } from "../../globals.js";
import SoundName from "../../enums/SoundName.js";

export default class GhostAttackingState extends State {
    static FLOAT_SPEED = 2.0; // Speed of up/down movement
    static FLOAT_DISTANCE = 8; // How many pixels to move up/down

    constructor(ghost) {
        super();
        this.ghost = ghost;
        this.floatTimer = 0;
        this.baseY = 0; // Store the original Y position
    }

    enter() {
        // Ghost is fully visible and attacking
        this.ghost.isVisible = true;
        this.ghost.opacity = 1; // Ensure fully opaque after materialization

        // Store the base Y position when entering this state
        this.baseY = this.ghost.mapPosition.y;
        this.floatTimer = 0;

        // Play horror laugh sound in loop
        sounds.play(SoundName.HorrorLaugh);
    }

    exit() {
        // Stop horror laugh sound when leaving attacking state
        sounds.stop(SoundName.HorrorLaugh);
    }

    update(dt) {
        // Update float timer
        this.floatTimer += dt * GhostAttackingState.FLOAT_SPEED;

        // Calculate floating offset using sine wave for smooth up/down motion
        const floatOffset =
            Math.sin(this.floatTimer) * GhostAttackingState.FLOAT_DISTANCE;

        // Apply floating offset to Y position
        this.ghost.mapPosition.y = this.baseY + floatOffset;
    }

    render() {
        // Render ghost during attack (fully visible, floating)
        if (this.ghost.isVisible) {
            const renderX = Math.floor(this.ghost.mapPosition.x);
            const renderY = Math.floor(this.ghost.mapPosition.y);

            // Apply opacity (should be 1.0 after materialization)
            context.save();
            context.globalAlpha = this.ghost.opacity;
            this.ghost.sprite.render(renderX, renderY);
            context.restore();
        }
    }
}
