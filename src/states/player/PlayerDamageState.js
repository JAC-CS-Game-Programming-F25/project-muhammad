import State from "../../../lib/State.js";
import Direction from "../../enums/Direction.js";
import Timer from "../../../lib/Timer.js";

export default class PlayerDamageState extends State {
    static FRAME_INTERVAL = 0.15; // Time per frame
    static FRAMES_PER_DIRECTION = 3; // 3 frames per direction
    static DAMAGE_DURATION = 2.0; // Loop for 2 seconds total

    constructor(player) {
        super();
        this.player = player;
        this.damageTimer = 0;
        this.frameTimer = new Timer();
        this.currentFrameIndex = 0;
        this.damageFrames = [];
    }

    /**
     * Get the 3 frames for the player's current direction
     * Sprite sheet layout: Right (0-2), Up (3-5), Left (6-8), Down (9-11)
     */
    getDirectionFrames(direction) {
        const directionToBaseFrame = {
            [Direction.Right]: 0, // frames 0-2
            [Direction.Up]: 3, // frames 3-5
            [Direction.Left]: 6, // frames 6-8
            [Direction.Down]: 9, // frames 9-11
        };

        const baseFrame = directionToBaseFrame[direction] || 0;
        const frames = [];

        // Get the 3 frames for this direction
        for (let i = 0; i < PlayerDamageState.FRAMES_PER_DIRECTION; i++) {
            frames.push(baseFrame + i);
        }

        return frames;
    }

    enter() {
        console.log("=== ENTERING DAMAGE STATE ===");
        console.log("Player direction:", this.player.direction);
        console.log(
            "Damage sprites loaded:",
            this.player.damageSprites
                ? this.player.damageSprites.length
                : "NOT LOADED"
        );

        // Safety check
        if (
            !this.player.damageSprites ||
            this.player.damageSprites.length === 0
        ) {
            console.error("ERROR: Damage sprites not loaded!");
            this.player.sprites = this.player.idleSprites;
            this.damageTimer = PlayerDamageState.DAMAGE_DURATION;
            return;
        }

        // Stop player movement
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;

        // Switch to damage sprites
        this.player.sprites = this.player.damageSprites;

        // Dummy animation
        this.player.currentAnimation = {
            update: () => {},
            getCurrentFrame: () => this.player.currentFrame,
            refresh: () => {},
        };

        // Get the 3 frames for current direction
        this.damageFrames = this.getDirectionFrames(this.player.direction);

        console.log("Damage frames for direction:", this.damageFrames);

        // Start with first frame
        this.currentFrameIndex = 0;
        this.player.currentFrame = this.damageFrames[0];

        // Initialize timer
        this.damageTimer = PlayerDamageState.DAMAGE_DURATION;

        // Loop through the 3 frames continuously
        this.frameTimer.clear();
        this.frameTimer.addTask(() => {
            this.currentFrameIndex++;

            // Loop back to start after frame 2
            if (this.currentFrameIndex >= this.damageFrames.length) {
                this.currentFrameIndex = 0; // Loop back to frame 0
            }

            this.player.currentFrame =
                this.damageFrames[this.currentFrameIndex];
        }, PlayerDamageState.FRAME_INTERVAL);
    }

    update(dt) {
        // Update frame timer
        if (this.frameTimer) {
            this.frameTimer.update(dt);
        }

        // Count down damage duration
        this.damageTimer -= dt;

        if (this.damageTimer <= 0) {
            // Keep looping animation until game transitions to GameOver
        }
    }

    exit() {
        if (this.frameTimer) {
            this.frameTimer.clear();
        }
    }
}
