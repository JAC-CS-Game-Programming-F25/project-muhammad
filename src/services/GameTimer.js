export default class GameTimer {
    /**
     * Manages the countdown timer for each round
     */
    constructor() {
        this.baseTime = 0;
        this.timeRemaining = 0;
        this.isRunning = false;
    }

    /**
     * Start the timer with a base time
     * @param {number} baseTime - Starting time in seconds
     */
    start(baseTime) {
        this.baseTime = baseTime;
        this.timeRemaining = baseTime;
        this.isRunning = true;
    }

    /**
     * Update the timer, decrementing by delta time
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (this.isRunning && this.timeRemaining > 0) {
            this.timeRemaining -= dt;
            if (this.timeRemaining < 0) {
                this.timeRemaining = 0;
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
    }
}

