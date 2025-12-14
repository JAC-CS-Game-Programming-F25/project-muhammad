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
} from "../globals.js";

export default class TitleScreenState extends State {
    constructor() {
        super();
        this.timeElapsed = 0;
        this.grainOffset = 0;
    }

    enter() {
        // Play horror ambient music on loop
        sounds.play(SoundName.HorrorAmbient);
    }

    exit() {
        // Stop the music when leaving title screen
        sounds.stop(SoundName.HorrorAmbient);
    }

    update(dt) {
        timer.update(dt);
        this.timeElapsed += dt;
        this.grainOffset += dt * 60; // Grain animation speed

        if (input.isKeyPressed(Input.KEYS.ENTER)) {
            stateMachine.change(GameStateName.Play);
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

        // 4. Title text with glow
        this.drawTitle();

        // 5. Prompt text with breathing effect
        this.drawPrompt();

        // 6. Film grain overlay
        this.drawGrain();

        // 7. Scanlines (CRT effect)
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
            fogGradient.addColorStop(0.5, `rgba(${Colour.TitleFogMidRgb}, ${alpha})`);
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

    drawTitle() {
        // Slow pulsing glow
        const glowPulse = Math.sin(this.timeElapsed * 0.5) * 0.3 + 0.7;

        context.save();

        // Multiple text shadows for glow effect
        context.shadowColor = `rgba(${Colour.TitleShadowLightRgb}, ${glowPulse * 0.3})`;
        context.shadowBlur = 30;

        // Main title
        context.font = `80px ${FontName.HelpMe}`;
        context.fillStyle = Colour.TitleText;
        context.textBaseline = "middle";
        context.textAlign = "center";

        // Add slight distortion
        const distort = Math.sin(this.timeElapsed * 2) * 0.5;
        context.fillText(
            "JAC GUESSR",
            CANVAS_WIDTH / 2 + distort,
            CANVAS_HEIGHT / 2 - 80
        );

        // Secondary glow layer
        context.shadowBlur = 50;
        context.shadowColor = `rgba(${Colour.TitleShadowDarkRgb}, ${glowPulse * 0.2})`;
        context.fillText(
            "JAC GUESSR",
            CANVAS_WIDTH / 2 + distort,
            CANVAS_HEIGHT / 2 - 80
        );

        context.restore();
    }

    drawPrompt() {
        // Breathing fade effect
        const breathe = Math.sin(this.timeElapsed * 1.5) * 0.4 + 0.6;

        context.save();
        context.font = `28px ${FontName.CourierNew}`;
        context.fillStyle = `rgba(${Colour.PromptTextRgb}, ${breathe})`;
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.shadowColor = `rgba(${Colour.PromptShadowRgb}, ${breathe * 0.5})`;
        context.shadowBlur = 15;

        context.fillText(
            "PRESS ENTER TO BEGIN",
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT / 2 + 80
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
        context.fillStyle = `rgba(${Colour.StaticOverlayRgb}, ${Math.random() * 0.02})`;
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
