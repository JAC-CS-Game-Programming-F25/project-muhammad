import { images, sounds, context } from "../globals.js";
import ImageName from "../enums/ImageName.js";
import SoundName from "../enums/SoundName.js";
import Sprite from "../../lib/Sprite.js";
import Vector from "../../lib/Vector.js";
import GameObject from "./GameObject.js";

/**
 * Speech bubble that appears above player's head
 * Plays a sound and disappears when sound finishes
 */
export default class SpeechBubble extends GameObject {
    static WIDTH = 32;
    static HEIGHT = 32;
    static OFFSET_X = 20; // Offset to the right of player
    static OFFSET_Y = -50; // Offset above player's head

    constructor(player) {
        super({
            position: new Vector(0, 0), // Will be updated based on player
            dimensions: new Vector(SpeechBubble.WIDTH, SpeechBubble.HEIGHT),
            opacity: 1.0,
            isVisible: true,
        });

        this.player = player;
        this.sprite = this.initializeSprite();
        this.isActive = true;
        this.audioElement = null;

        // Play sound and track it
        this.playSound();
    }

    /**
     * Initialize the bubble sprite
     */
    initializeSprite() {
        const bubbleImage = images.get(ImageName.Bubble);
        return new Sprite(
            bubbleImage,
            0,
            0,
            SpeechBubble.WIDTH,
            SpeechBubble.HEIGHT
        );
    }

    /**
     * Play the speech sound and get the audio element
     */
    playSound() {
        // Play the sound
        sounds.play(SoundName.HereWeGoAgain);

        // Get the actual audio element that's playing
        const soundPool = sounds.get(SoundName.HereWeGoAgain);

        // The sound that just started playing is at (currentSound - 1)
        // because play() increments currentSound after playing
        const playingIndex =
            (soundPool.currentSound - 1 + soundPool.pool.length) %
            soundPool.pool.length;
        this.audioElement = soundPool.pool[playingIndex];

        // Listen for when the audio ends
        if (this.audioElement) {
            this.audioElement.addEventListener(
                "ended",
                () => {
                    this.isActive = false;
                    this.isVisible = false;
                },
                { once: true }
            );
        }
    }

    /**
     * Update bubble position and check audio status
     */
    update(dt) {
        if (!this.isActive) return;

        // Check if audio has ended (backup check in case event didn't fire)
        if (this.audioElement && this.audioElement.ended) {
            this.isActive = false;
            this.isVisible = false;
            return;
        }

        // Update position to follow player
        if (this.player) {
            this.position.x = this.player.mapPosition.x + SpeechBubble.OFFSET_X;
            this.position.y = this.player.mapPosition.y + SpeechBubble.OFFSET_Y;
        }
    }

    /**
     * Render the bubble
     */
    render() {
        if (!this.isVisible || !this.isActive) return;

        const renderX = Math.floor(this.position.x);
        const renderY = Math.floor(this.position.y);

        context.save();
        context.globalAlpha = this.opacity;
        this.sprite.render(renderX, renderY);
        context.restore();
    }

    /**
     * Check if bubble should be removed
     */
    shouldRemove() {
        return !this.isActive;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.isActive = false;
        this.isVisible = false;
    }
}
