export default class GameTimer {
    /**
     * Manages the countdown timer for each round
     */
    constructor() {
        this.baseTime = 0;
        this.timeRemaining = 0;
        this.isRunning = false;
        this.hasExpired = false; // Track if timer has already expired
    }

    /**
     * Start the timer with a base time
     * @param {number} baseTime - Starting time in seconds
     */
    start(baseTime) {
        this.baseTime = baseTime;
        this.timeRemaining = baseTime;
        this.isRunning = true;
        this.hasExpired = false; // Reset expiry flag
    }

    /**
     * Update the timer, decrementing by delta time
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (this.isRunning && this.timeRemaining > 0) {
            const wasPositive = this.timeRemaining > 0;
            this.timeRemaining -= dt;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.isRunning = false; // Stop timer when it expires
                // Mark as expired only if it just transitioned from > 0 to <= 0
                if (wasPositive) {
                    this.hasExpired = true;
                }
            }
        }
    }

    /**
     * Check if the timer has expired
     * @returns {boolean} True if timeRemaining <= 0
     */
    isExpired() {
        return this.timeRemaining <= 0;
    }

    /**
     * Check if the timer just expired (only returns true once)
     * @returns {boolean} True if timer just expired this frame
     */
    justExpired() {
        if (this.hasExpired) {
            this.hasExpired = false; // Reset after checking
            return true;
        }
        return false;
    }

    /**
     * Get the current time remaining
     * @returns {number} Time remaining in seconds
     */
    getTimeRemaining() {
        return this.timeRemaining;
    }

    /**
     * Get the base time for the current round
     * @returns {number} Base time in seconds
     */
    getBaseTime() {
        return this.baseTime;
    }

    /**
     * Pause the timer
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * Resume the timer
     */
    resume() {
        this.isRunning = true;
    }

    /**
     * Reset the timer
     */
    reset() {
        this.timeRemaining = this.baseTime;
        this.isRunning = false;
        this.hasExpired = false;
    }
}

