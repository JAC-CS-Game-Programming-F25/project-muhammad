import Input from "../../lib/Input.js";
import State from "../../lib/State.js";
import Colour from "../enums/Colour.js";
import FontName from "../enums/FontName.js";
import GameStateName from "../enums/GameStateName.js";
import SoundName from "../enums/SoundName.js";
import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    context,
    input,
    stateMachine,
    timer,
    sounds,
    canvas,
} from "../globals.js";

export default class RoundEndState extends State {
    constructor() {
        super();
        this.timeElapsed = 0;
        this.grainOffset = 0;
        this.roundManager = null;
        this.roomLoader = null;
        this.map = null;
        this.player = null;
    }

    enter(parameters = {}) {
        this.roundManager = parameters.roundManager;
        this.roomLoader = parameters.roomLoader;
        this.map = parameters.map;
        this.player = parameters.player;
        this.timeElapsed = 0;
        this.grainOffset = 0;

        // Ensure canvas is properly reset
        const canvas = document.querySelector("canvas");
        if (canvas) {
            // Reset to base dimensions
            canvas.width = CANVAS_WIDTH;
            canvas.height = CANVAS_HEIGHT;

            // Clear any inline styles from PlayState
            canvas.style.removeProperty("width");
            canvas.style.removeProperty("height");
            canvas.style.removeProperty("position");
            canvas.style.removeProperty("left");
            canvas.style.removeProperty("top");
            canvas.style.removeProperty("transform");
            canvas.style.backgroundColor = "#0a0a0a";

            // Trigger the global resize handler to apply proper scaling
            window.dispatchEvent(new Event("resize"));
        }

        // Focus canvas for keyboard input
        if (canvas) {
            canvas.focus();
        }
    }

    exit() {
        // Nothing to clean up
    }

    update(dt) {
        timer.update(dt);
        this.timeElapsed += dt;
        this.grainOffset += dt * 60; // Grain animation speed

        if (input.isKeyPressed(Input.KEYS.ENTER)) {
            // Continue to next round or game over
            if (this.roundManager && this.roundManager.getCurrentRound() < 5) {
                // Go to next round
                this.roundManager.nextRound();
                this.roundManager.startRound();
                // Pass existing objects to continue the game
                stateMachine.change(GameStateName.Play, {
                    roundManager: this.roundManager,
                    roomLoader: this.roomLoader,
                    map: this.map,
                    player: this.player,
                });
            } else {
                // Game over after 5 rounds
                stateMachine.change(GameStateName.GameOver, {
                    roundManager: this.roundManager,
                });
            }
        }

        if (input.isKeyPressed(Input.KEYS.ESCAPE)) {
            // Exit to game over screen
            stateMachine.change(GameStateName.GameOver, {
                roundManager: this.roundManager,
            });
        }
    }

    render() {
        // 1. Dark foggy background
        const fogDrift = Math.sin(this.timeElapsed * 0.3) * 20;
        const gradient = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, Colour.TitleDarkBg1);
        gradient.addColorStop(0.5, Colour.TitleDarkBg2);
        gradient.addColorStop(1, Colour.TitleDarkBg1);
        context.fillStyle = gradient;
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 2. Fog layers (multiple drifting bands)
        this.drawFogLayers();

        // 3. Vignette (dark edges)
        this.drawVignette();

        // 4. Round end text with glow
        this.drawRoundEndText();

        // 5. Round number and points
        this.drawRoundInfo();

        // 6. Prompt text with breathing effect
        this.drawPrompt();

        // 7. Film grain overlay
        this.drawGrain();

        // 8. Scanlines (CRT effect)
        this.drawScanlines();
    }

    drawFogLayers() {
        const layers = 5;
        for (let i = 0; i < layers; i++) {
            const speed = 0.1 + i * 0.05;
            const offset = Math.sin(this.timeElapsed * speed) * 100;
            const yPos = (CANVAS_HEIGHT / layers) * i;
            const alpha = 0.02 + i * 0.01;

            const fogGradient = context.createLinearGradient(
                offset,
                yPos,
                CANVAS_WIDTH + offset,
                yPos + CANVAS_HEIGHT / layers
            );
            fogGradient.addColorStop(0, Colour.TitleFogDark);
            fogGradient.addColorStop(
                0.5,
                `rgba(${Colour.TitleFogMidRgb}, ${alpha})`
            );
            fogGradient.addColorStop(1, Colour.TitleFogDark);

            context.fillStyle = fogGradient;
            context.fillRect(0, yPos, CANVAS_WIDTH, CANVAS_HEIGHT / layers);
        }
    }

    drawVignette() {
        const vignetteGradient = context.createRadialGradient(
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2,
            CANVAS_HEIGHT * 0.3,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2,
            CANVAS_HEIGHT * 0.8
        );
        vignetteGradient.addColorStop(0, Colour.TitleVignetteTransparent);
        vignetteGradient.addColorStop(1, Colour.TitleVignetteDark);
        context.fillStyle = vignetteGradient;
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    drawRoundEndText() {
        // Slow pulsing glow
        const glowPulse = Math.sin(this.timeElapsed * 0.5) * 0.3 + 0.7;

        context.save();

        // Multiple text shadows for glow effect
        context.shadowColor = `rgba(${Colour.TitleShadowLightRgb}, ${
            glowPulse * 0.3
        })`;
        context.shadowBlur = 30;

        // Main title
        context.font = `80px ${FontName.HelpMe}`;
        context.fillStyle = Colour.TitleText;
        context.textBaseline = "middle";
        context.textAlign = "center";

        // Add slight distortion
        const distort = Math.sin(this.timeElapsed * 2) * 0.5;
        context.fillText(
            "ROUND END",
            CANVAS_WIDTH / 2 + distort,
            CANVAS_HEIGHT / 2 - 120
        );

        // Secondary glow layer
        context.shadowBlur = 50;
        context.shadowColor = `rgba(${Colour.TitleShadowDarkRgb}, ${
            glowPulse * 0.2
        })`;
        context.fillText(
            "ROUND END",
            CANVAS_WIDTH / 2 + distort,
            CANVAS_HEIGHT / 2 - 120
        );

        context.restore();
    }

    drawRoundInfo() {
        context.save();

        context.font = `40px ${FontName.CourierNew}`;
        context.fillStyle = Colour.TitleText;
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.shadowColor = `rgba(${Colour.PromptShadowRgb}, 0.5)`;
        context.shadowBlur = 15;

        // Round number
        const roundNumber = this.roundManager
            ? this.roundManager.getCurrentRound()
            : 1;
        context.fillText(
            `Round: ${roundNumber}`,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 - 20
        );

        // Points
        const points = this.roundManager?.scoreManager
            ? this.roundManager.scoreManager.getCurrentScore()
            : 0;
        context.fillText(
            `Points: ${points}`,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 30
        );

        context.restore();
    }

    drawPrompt() {
        // Breathing fade effect
        const breathe = Math.sin(this.timeElapsed * 1.5) * 0.4 + 0.6;

        context.save();
        context.font = `24px ${FontName.CourierNew}`;
        context.fillStyle = `rgba(${Colour.PromptTextRgb}, ${breathe})`;
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.shadowColor = `rgba(${Colour.PromptShadowRgb}, ${
            breathe * 0.5
        })`;
        context.shadowBlur = 15;

        const roundNumber = this.roundManager
            ? this.roundManager.getCurrentRound()
            : 1;

        if (roundNumber < 5) {
            context.fillText(
                "PRESS ENTER TO CONTINUE",
                CANVAS_WIDTH / 2,
                CANVAS_HEIGHT / 2 + 100
            );
        } else {
            context.fillText(
                "PRESS ENTER FOR FINAL SCORE",
                CANVAS_WIDTH / 2,
                CANVAS_HEIGHT / 2 + 100
            );
        }

        context.font = `20px ${FontName.CourierNew}`;
        context.fillText(
            "PRESS ESC TO EXIT",
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 140
        );

        context.restore();
    }

    drawGrain() {
        // Film grain effect
        const imageData = context.getImageData(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT
        );
        const pixels = imageData.data;

        // Add noise to every pixel
        for (let i = 0; i < pixels.length; i += 4) {
            // Random grain intensity
            const noise = (Math.random() - 0.5) * 40;
            pixels[i] += noise; // R
            pixels[i + 1] += noise; // G
            pixels[i + 2] += noise; // B
        }

        context.putImageData(imageData, 0, 0);

        // Add static overlay
        context.fillStyle = `rgba(${Colour.StaticOverlayRgb}, ${
            Math.random() * 0.02
        })`;
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    drawScanlines() {
        // CRT scanlines
        context.save();
        context.globalAlpha = 0.1;
        context.strokeStyle = Colour.ScanlineBlack;
        context.lineWidth = 1;

        for (let y = 0; y < CANVAS_HEIGHT; y += 3) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(CANVAS_WIDTH, y);
            context.stroke();
        }

        // Occasional screen flicker
        if (Math.random() > 0.97) {
            context.globalAlpha = Math.random() * 0.1;
            context.fillStyle = Colour.ScanlineWhite;
            context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        context.restore();
    }
}

