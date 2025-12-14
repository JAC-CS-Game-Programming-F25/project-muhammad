import State from "../../../lib/State.js";
import PlayerStateName from "../../enums/PlayerStateName.js";
import Direction from "../../enums/Direction.js";
import SoundName from "../../enums/SoundName.js";
import Timer from "../../../lib/Timer.js";
import Sign from "../../entities/Sign.js";
import { sounds } from "../../globals.js";

export default class PlayerSigningState extends State {
    static FRAME_INTERVAL = 0.3; // Time per frame
    static FRAMES_PER_DIRECTION = 3; // Show 3 frames per direction
    static SIGNING_DURATION = 4; // 4 seconds total

    constructor(player) {
        super();
        this.player = player;
        this.signingTimer = 0;
        this.sign = null;

        // Frame sequence for signing animation
        this.frameSequence = [];
        this.currentSequenceIndex = 0;
        this.frameTimer = new Timer();
    }

    /**
     * Build the animation sequence for signing
     * Rotates clockwise through all 4 directions, playing 3 middle frames per direction
     * Sprite sheet order: Right (0-11), Up (12-23), Left (24-35), Down (36-47)
     */
    buildAnimationSequence(startDirection) {
        const sequence = [];

        // Map Direction enum values to sprite sheet base frames
        const directionToBaseFrame = {
            [Direction.Right]: 0, // frames 0-11
            [Direction.Up]: 12, // frames 12-23
            [Direction.Left]: 24, // frames 24-35
            [Direction.Down]: 36, // frames 36-47
        };

        // Clockwise order: Right → Down → Left → Up
        const clockwiseOrder = [
            Direction.Right,
            Direction.Down,
            Direction.Left,
            Direction.Up,
        ];

        // Find starting direction index in clockwise order
        let startIndex = clockwiseOrder.indexOf(startDirection);
        if (startIndex === -1) startIndex = 0;

        // Process all 4 directions starting from player's current direction, going clockwise
        for (let dirOffset = 0; dirOffset < 4; dirOffset++) {
            const dirIndex = (startIndex + dirOffset) % 4;
            const direction = clockwiseOrder[dirIndex];
            const baseFrame = directionToBaseFrame[direction];

            // Use middle 3 frames from each direction (frames 4, 5, 6 out of 0-11)
            // This gives the most "action" from the signing animation
            for (let i = 4; i < 7; i++) {
                sequence.push(baseFrame + i);
            }
        }

        return sequence;
    }

    enter() {
        // Play sign sound
        sounds.play(SoundName.SignSound);

        // Stop player movement
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;

        // Use sign sprites
        this.player.sprites = this.player.signSprites;

        // IMPORTANT: Create a dummy animation that does nothing
        // This prevents Player.update() from overwriting our manual frame changes
        this.player.currentAnimation = {
            update: () => {},
            getCurrentFrame: () => this.player.currentFrame,
            refresh: () => {},
        };

        // Build animation sequence starting from player's current direction, going clockwise
        this.frameSequence = this.buildAnimationSequence(this.player.direction);
        this.currentSequenceIndex = 0;
        this.player.currentFrame = this.frameSequence[0];

        // Initialize signing timer
        this.signingTimer = PlayerSigningState.SIGNING_DURATION;

        // Create sign at player's current position with 0 opacity (invisible)
        this.sign = new Sign(this.player.mapPosition);
        this.sign.opacity = 0; // Start invisible
        this.player.sign = this.sign;

        // Clear any existing timer tasks and start frame timer
        this.frameTimer.clear();
        this.frameTimer.addTask(() => {
            this.currentSequenceIndex++;

            // Loop the animation continuously during the signing duration
            if (this.currentSequenceIndex >= this.frameSequence.length) {
                this.currentSequenceIndex = 0; // Loop back to start
            }

            this.player.currentFrame =
                this.frameSequence[this.currentSequenceIndex];
        }, PlayerSigningState.FRAME_INTERVAL);
    }

    update(dt) {
        // Update frame timer
        this.frameTimer.update(dt);

        // Count down signing duration
        this.signingTimer -= dt;

        // Gradually fade in the sign during the signing animation
        // Fade in over the full duration
        const fadeProgress =
            1 - this.signingTimer / PlayerSigningState.SIGNING_DURATION;
        if (this.sign) {
            this.sign.opacity = Math.min(1, fadeProgress); // Clamp to max 1.0
        }

        if (this.signingTimer <= 0) {
            // Signing complete - ensure sign is fully visible
            if (this.sign) {
                this.sign.opacity = 1;
            }
            // Check room and transition back to idle
            // The room checking will be handled by PlayState
            this.player.changeState(PlayerStateName.Idling);
        }
    }

    exit() {
        // Stop sign sound
        sounds.stop(SoundName.SignSound);
        
        // Clear timer tasks
        this.frameTimer.clear();
        // Sign persists after signing, so we don't remove it here
        // It will remain at the location where it was placed
    }
}
