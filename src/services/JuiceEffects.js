import ParticleEmitter from "../../lib/ParticleEmitter.js";
import { context } from "../globals.js";
import Colour from "../enums/Colour.js";

export default class JuiceEffects {
    constructor() {
        this.screenShake = null;
        this.floatingText = null;
        this.particleEmitter = new ParticleEmitter();
    }

    /**
     * Start screen shake effect
     */
    startScreenShake(intensity = 8, duration = 0.5) {
        this.screenShake = {
            intensity: intensity,
            duration: duration,
            timer: duration,
        };
    }

    /**
     * Create a floating warning text
     */
    createFloatingWarning(text, x, y, color = Colour.WarningRed) {
        this.floatingText = {
            text: text,
            x: x,
            y: y,
            yOffset: 0,
            opacity: 1.0,
            timer: 2.0,
            color: color,
        };
    }

    /**
     * Create running dust particles at player's feet
     */
    createRunDust(x, y) {
        this.particleEmitter.emitRunDust(x, y);
    }

    /**
     * Update all juice effects
     */
    update(dt) {
        // Update screen shake
        if (this.screenShake && this.screenShake.timer > 0) {
            this.screenShake.timer -= dt;
            if (this.screenShake.timer <= 0) {
                this.screenShake = null;
            }
        }

        // Update floating text
        if (this.floatingText) {
            this.floatingText.timer -= dt;
            this.floatingText.yOffset -= 30 * dt; // Float upward
            this.floatingText.opacity = this.floatingText.timer / 2.0; // Fade out

            if (this.floatingText.timer <= 0) {
                this.floatingText = null;
            }
        }

        // Update particles
        this.particleEmitter.update(dt);
    }

    /**
     * Apply screen shake transform (call before rendering)
     */
    applyScreenShake() {
        if (this.screenShake && this.screenShake.timer > 0) {
            const progress = this.screenShake.timer / this.screenShake.duration;
            const shake = this.screenShake.intensity * progress;
            context.save();
            context.translate(
                (Math.random() - 0.5) * shake,
                (Math.random() - 0.5) * shake
            );
            return true; // Shake applied
        }
        return false; // No shake
    }

    /**
     * Restore after screen shake
     */
    restoreScreenShake(shakeApplied) {
        if (shakeApplied) {
            context.restore();
        }
    }

    /**
     * Render floating warning text
     */
    renderFloatingText() {
        if (!this.floatingText) return;

        context.save();
        context.globalAlpha = this.floatingText.opacity;
        context.font = "bold 64px Anton";
        context.fillStyle = this.floatingText.color;
        context.textAlign = "center";
        context.textBaseline = "middle";

        // Add shadow for emphasis
        context.shadowColor = Colour.ShadowBlack;
        context.shadowBlur = 8;
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;

        context.fillText(
            this.floatingText.text,
            this.floatingText.x,
            this.floatingText.y + this.floatingText.yOffset
        );
        context.restore();
    }

    /**
     * Render particles
     */
    renderParticles() {
        this.particleEmitter.render(context);
    }

    /**
     * Reset all effects
     */
    reset() {
        this.screenShake = null;
        this.floatingText = null;
        this.particleEmitter.clear();
    }
}
