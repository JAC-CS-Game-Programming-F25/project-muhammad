import GameTimer from "./GameTimer.js";
import ScoreManager from "./ScoreManager.js";

export default class RoundManager {
    /**
     * Coordinates rounds, target room selection, and integrates ScoreManager and GameTimer
     * @param {RoomLoader} roomLoader - Instance of RoomLoader for room selection
     */
    constructor(roomLoader) {
        this.roomLoader = roomLoader;
        this.scoreManager = new ScoreManager();
        this.gameTimer = new GameTimer();
        
        this.currentRound = 1;
        this.maxRounds = 5;
        this.targetRoomId = null;
        this.hasSignedThisRound = false;
    }

    /**
     * Start a new round
     * Selects random room, starts timer with appropriate baseTime
     */
    startRound() {
        // Select random target room
        this.targetRoomId = this.roomLoader.getRandomRoomName();
        
        // Reset sign flag for new round
        this.hasSignedThisRound = false;
        
        // Calculate base time: 20 seconds for all rounds
        // Round 1: 20s, Round 2: 20s, Round 3: 20s, Round 4: 20s, Round 5: 20s
        const baseTime = 20;
        
        // Start the timer
        this.gameTimer.start(baseTime);
    }

    /**
     * End the current round
     * @param {boolean} success - True if player correctly identified the room
     */
    endRound(success) {
        if (success) {
            // Calculate score based on time remaining
            const timeRemaining = this.gameTimer.getTimeRemaining();
            const baseTime = this.gameTimer.getBaseTime();
            const points = this.scoreManager.calculateScoreFromTime(timeRemaining, baseTime);
            this.scoreManager.addPoints(points);
            console.log("User guessed correct room! Score:", this.scoreManager.getCurrentScore());
        } else {
            // Wrong room - user dies (death not implemented yet)
            console.log("User guessed wrong room! Game over.");
            // TODO: Implement death/GameOver state
        }
    }

    /**
     * Check if round should end (timer expired)
     * @returns {boolean} True if timer has expired
     */
    checkRoundComplete() {
        return this.gameTimer.isExpired();
    }

    /**
     * Advance to the next round
     * @returns {boolean} True if successfully advanced, false if game should end
     */
    nextRound() {
        if (this.currentRound < this.maxRounds) {
            this.currentRound++;
            return true;
        }
        return false;
    }

    /**
     * Check if game is over
     * @returns {boolean} True if lives = 0 or rounds = 5
     */
    isGameOver() {
        return this.currentRound >= this.maxRounds;
    }

    /**
     * Get the target room ID for current round
     * @returns {string} Target room name
     */
    getTargetRoom() {
        return this.targetRoomId;
    }

    /**
     * Get current round number
     * @returns {number} Current round (1-5)
     */
    getCurrentRound() {
        return this.currentRound;
    }

    /**
     * Get remaining lives
     * @returns {number} Lives remaining
     */
    /**
     * Check if player can sign (only once per round)
     * @returns {boolean} True if player can sign
     */
    canSign() {
        return !this.hasSignedThisRound;
    }

    /**
     * Mark that player has signed this round
     */
    markSigned() {
        this.hasSignedThisRound = true;
    }

    /**
     * Reset for a new game
     */
    reset() {
        this.currentRound = 1;
        this.targetRoomId = null;
        this.hasSignedThisRound = false;
        this.scoreManager.reset();
        this.gameTimer.reset();
    }
}

