import State from "../../../lib/State.js";
import { context, sounds, timer } from "../../globals.js";
import SoundName from "../../enums/SoundName.js";
import Easing from "../../../lib/Easing.js";

export default class GhostAttackingState extends State {
    static FLOAT_DISTANCE = 8; // How many pixels to move up/down
    static FLOAT_DURATION = 1.5; // Duration of one complete up-down cycle (seconds)

    constructor(ghost) {
        super();
        this.ghost = ghost;
        this.baseY = 0; // Store the original Y position
        this.isMovingUp = true; // Track direction
    }

    enter() {
        // Ghost is fully visible and attacking
        this.ghost.isVisible = true;
        this.ghost.opacity = 1; // Ensure fully opaque after materialization

        // Store the base Y position when entering this state
        this.baseY = this.ghost.mapPosition.y;

        // Play horror laugh sound in loop
        sounds.play(SoundName.HorrorLaugh);

        // Start the floating animation
        this.startFloatingAnimation();
    }

    exit() {
        // Stop horror laugh sound when leaving attacking state
        sounds.stop(SoundName.HorrorLaugh);
        
        // Clear any remaining tween tasks for this ghost
        // (timer tasks will naturally finish or can be cleared if needed)
    }

    /**
     * Start continuous floating animation using tween
     */
    startFloatingAnimation() {
        // Move UP first
        this.floatUp();
    }

    /**
     * Tween ghost upward
     */
    floatUp() {
        const targetY = this.baseY - GhostAttackingState.FLOAT_DISTANCE;
        
        timer.tween(
            this.ghost.mapPosition,
            { y: targetY },
            GhostAttackingState.FLOAT_DURATION / 2, // Half the duration for up
            Easing.easeInOutQuad, // Smooth easing
            () => {
                // When finished moving up, start moving down
                this.floatDown();
            }
        );
    }

    /**
     * Tween ghost downward
     */
    floatDown() {
        const targetY = this.baseY + GhostAttackingState.FLOAT_DISTANCE;
        
        timer.tween(
            this.ghost.mapPosition,
            { y: targetY },
            GhostAttackingState.FLOAT_DURATION / 2, // Half the duration for down
            Easing.easeInOutQuad, // Smooth easing
            () => {
                // When finished moving down, start moving up again (loop)
                this.floatUp();
            }
        );
    }

    update(dt) {
        // Tween handles the animation, so update() can be empty
        // or used for other logic like checking player collision, etc.
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
