import State from "../../../lib/State.js";
import GhostStateName from "../../enums/GhostStateName.js";
import { context } from "../../globals.js";

export default class GhostMaterializingState extends State {
    static MATERIALIZING_DURATION = 0.5; // Time to materialize (0.5 seconds)

    constructor(ghost) {
        super();
        this.ghost = ghost;
        this.elapsed = 0;
    }

    enter() {
        // Ghost becomes visible and starts materializing
        this.ghost.isVisible = true;
        this.ghost.opacity = 0; // Start fully transparent
        this.elapsed = 0;
    }

    exit() {
        this.elapsed = 0;
    }

    update(dt) {
        this.elapsed += dt;

        // Gradually fade in the ghost during materialization
        const fadeProgress =
            this.elapsed / GhostMaterializingState.MATERIALIZING_DURATION;
        this.ghost.opacity = Math.min(1, fadeProgress); // Clamp to max 1.0

        // After materializing duration, transition to attacking
        if (this.elapsed >= GhostMaterializingState.MATERIALIZING_DURATION) {
            this.ghost.changeState(GhostStateName.Attacking);
        }
    }

    render() {
        // Render ghost during materialization with fade-in effect
        if (this.ghost.isVisible) {
            const renderX = Math.floor(this.ghost.mapPosition.x);
            const renderY = Math.floor(this.ghost.mapPosition.y);

            // Apply opacity for fade-in effect
            context.save();
            context.globalAlpha = this.ghost.opacity;
            this.ghost.sprite.render(renderX, renderY);
            context.restore();
        }
    }
}
