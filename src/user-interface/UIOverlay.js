import Panel from "./elements/Panel.js";
import { context } from "../globals.js";
import Colour from "../enums/Colour.js";
import FontName from "../enums/FontName.js";

/**
 * Clean Minimalist UI Overlay
 * Bigger size, no background border
 */
export default class UIOverlay extends Panel {
    constructor(playState) {
        super(0.5, 0.5, 12, 6, {
            borderColour: "rgba(0, 0, 0, 0)", // No border on panel
            panelColour: "rgba(20, 20, 20, 0.4)", // Light black, almost transparent
            padding: 18,
        });

        this.playState = playState;
        this.timeElapsed = 0;

        // BIGGER SIZE
        this.position.x = 20;
        this.position.y = 20;
        this.dimensions.x = 320; // Much wider (was 240)
        this.dimensions.y = 110; // Taller (was 85)
    }

    update(dt) {
        this.timeElapsed += dt;
    }

    render() {
        if (!this.playState || !this.playState.roundManager) return;

        const roundManager = this.playState.roundManager;
        const gameTimer = roundManager.gameTimer;
        const scoreManager = roundManager.scoreManager;
        const player = this.playState.player;

        context.save();

        // Simple panel background (no border)
        this.renderPanel();

        // Translate to content area
        context.translate(
            this.position.x + this.padding,
            this.position.y + this.padding
        );

        // Timer bar
        this.renderBar(
            "TIMER",
            0,
            gameTimer ? gameTimer.getTimeRemaining() : 0,
            gameTimer ? gameTimer.getBaseTime() : 1,
            gameTimer && gameTimer.getTimeRemaining() < 10
        );

        // Stamina bar
        if (player) {
            this.renderBar(
                "STAMINA",
                36, // More spacing
                player.stamina,
                player.maxStamina,
                false
            );
        }

        // Round and Score on same line
        this.renderInfoText(72, roundManager, scoreManager);

        context.restore();
    }

    renderPanel() {
        const x = this.position.x;
        const y = this.position.y;
        const w = this.dimensions.x;
        const h = this.dimensions.y;

        context.save();

        // Light black, almost transparent fill - NO BORDER
        context.fillStyle = "rgba(20, 20, 20, 0.4)";
        context.fillRect(x, y, w, h);

        // NO BORDER AT ALL

        context.restore();
    }

    renderBar(label, yOffset, current, max, isWarning) {
        const barWidth = this.dimensions.x - this.padding * 2;
        const barHeight = 16; // Bigger bars
        const labelY = yOffset;
        const barY = yOffset + 16; // More spacing

        // Pulsing warning effect
        const pulse = isWarning
            ? Math.sin(this.timeElapsed * 4) * 0.3 + 0.7
            : 1;

        // Label
        context.save();
        context.font = `11px ${FontName.CourierNew}`; // Bigger font
        context.fillStyle = isWarning
            ? `rgba(220, 100, 100, ${pulse})`
            : "#ccc";
        context.textBaseline = "top";
        context.textAlign = "left";
        context.fillText(label, 0, labelY);
        context.restore();

        // Bar background
        context.save();
        context.fillStyle = "#1a1a1a";
        context.fillRect(0, barY, barWidth, barHeight);
        context.restore();

        // Bar fill
        const percent = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
        const fillWidth = barWidth * percent;

        if (fillWidth > 0) {
            context.save();

            if (isWarning) {
                // Pulsing red for warning
                context.fillStyle = `rgba(${200 * pulse}, 60, 60, 1)`;
            } else if (label === "STAMINA") {
                // Grey
                context.fillStyle = "#888";
            } else {
                // Beige
                context.fillStyle = "#bbb";
            }

            context.fillRect(0, barY, fillWidth, barHeight);
            context.restore();
        }
    }

    renderInfoText(yOffset, roundManager, scoreManager) {
        const barWidth = this.dimensions.x - this.padding * 2;

        context.save();
        context.font = `11px ${FontName.CourierNew}`; // Bigger font
        context.fillStyle = "#aaa";
        context.textBaseline = "top";

        // Round on LEFT
        context.textAlign = "left";
        const roundText = `R: ${roundManager.getCurrentRound()}/5`;
        context.fillText(roundText, 0, yOffset);

        // Score on RIGHT
        context.textAlign = "right";
        const scoreText = `SCORE: ${scoreManager.getCurrentScore()}`;
        context.fillText(scoreText, barWidth, yOffset);

        context.restore();
    }

    destroy() {
        // Nothing to clean up
    }
}
