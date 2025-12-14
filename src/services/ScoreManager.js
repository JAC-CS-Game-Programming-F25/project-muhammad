export default class ScoreManager {
    /**
     * Manages score tracking and LocalStorage persistence
     */
    constructor() {
        this.currentScore = 0;
        this.highScore = 0;
        this.loadScores();
    }

    /**
     * Load high score from LocalStorage
     */
    loadScores() {
        try {
            const savedHighScore = localStorage.getItem("jac-ghost-hunt-high-score");
            if (savedHighScore !== null) {
                this.highScore = parseInt(savedHighScore, 10);
            }
        } catch (error) {
            console.error("Failed to load high score from LocalStorage:", error);
            this.highScore = 0;
        }
    }

    /**
     * Calculate score based on time remaining
     * @param {number} timeRemaining - Time remaining in seconds
     * @param {number} baseTime - Base time for the round (not used in calculation, but kept for potential future use)
     * @returns {number} Calculated score (10 points per second remaining)
     */
    calculateScoreFromTime(timeRemaining, baseTime) {
        return Math.floor(timeRemaining * 10);
    }

    /**
     * Add points to current score
     * @param {number} points - Points to add
     */
    addPoints(points) {
        this.currentScore += points;
    }

    /**
     * Get the current score
     * @returns {number} Current score
     */
    getCurrentScore() {
        return this.currentScore;
    }

    /**
     * Get the high score
     * @returns {number} High score
     */
    getHighScore() {
        return this.highScore;
    }

    /**
     * Save current score to LocalStorage if it's higher than high score
     */
    saveScore() {
        if (this.currentScore > this.highScore) {
            this.highScore = this.currentScore;
            try {
                localStorage.setItem("jac-ghost-hunt-high-score", this.highScore.toString());
            } catch (error) {
                console.error("Failed to save high score to LocalStorage:", error);
            }
        }
    }

    /**
     * Reset current score to 0 (for new game)
     */
    reset() {
        this.currentScore = 0;
    }
}
