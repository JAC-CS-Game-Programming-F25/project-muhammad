import Tile from "./Tile.js";

/**
 * Manages saving and loading the complete game state
 * Saves: player position, round, score, timer, target room, etc.
 */
export default class SaveManager {
    static SAVE_KEY = "jac-ghost-hunt-save-game";

    /**
     * Save the complete game state
     * @param {object} gameState - Complete game state object
     */
    static saveGameState(gameState) {
        try {
            const saveData = {
                // Player state
                playerPosition: {
                    x: gameState.player.mapPosition.x,
                    y: gameState.player.mapPosition.y,
                },
                playerStamina: gameState.player.stamina,
                
                // Round manager state
                currentRound: gameState.roundManager.currentRound,
                nextRound: gameState.nextRound ?? null, // Next round if at RoundEnd state
                targetRoomId: gameState.roundManager.targetRoomId,
                hasSignedThisRound: gameState.roundManager.hasSignedThisRound,
                
                // Game state name (to know if we're at RoundEnd)
                gameStateName: gameState.gameStateName ?? null,
                
                // Score manager state
                currentScore: gameState.roundManager.scoreManager.currentScore,
                
                // Timer state
                timerBaseTime: gameState.roundManager.gameTimer.baseTime,
                timerRemaining: gameState.roundManager.gameTimer.timeRemaining,
                timerRunning: gameState.roundManager.gameTimer.isRunning,
                
                // PlayState flags
                hasCheckedSign: gameState.hasCheckedSign,
                hasHandledTimerExpiry: gameState.hasHandledTimerExpiry,
                
                // Sign state (if exists)
                signPosition: gameState.player.sign
                    ? {
                          x: gameState.player.sign.position.x,
                          y: gameState.player.sign.position.y,
                      }
                    : null,
                signOpacity: gameState.player.sign ? gameState.player.sign.opacity : 0,
                
                // Timestamp for when save was created
                saveTimestamp: Date.now(),
            };

            localStorage.setItem(SaveManager.SAVE_KEY, JSON.stringify(saveData));
            console.log("Game state saved successfully");
            return true;
        } catch (error) {
            console.error("Failed to save game state:", error);
            return false;
        }
    }

    /**
     * Load the complete game state
     * @returns {object|null} Saved game state or null if no save exists
     */
    static loadGameState() {
        try {
            const saveData = localStorage.getItem(SaveManager.SAVE_KEY);
            if (!saveData) {
                return null;
            }

            const parsed = JSON.parse(saveData);
            console.log("Game state loaded successfully");
            return parsed;
        } catch (error) {
            console.error("Failed to load game state:", error);
            return null;
        }
    }

    /**
     * Check if a save game exists
     * @returns {boolean} True if save exists
     */
    static hasSaveGame() {
        return localStorage.getItem(SaveManager.SAVE_KEY) !== null;
    }

    /**
     * Delete the saved game
     */
    static deleteSaveGame() {
        try {
            localStorage.removeItem(SaveManager.SAVE_KEY);
            console.log("Save game deleted");
        } catch (error) {
            console.error("Failed to delete save game:", error);
        }
    }

    /**
     * Restore game state to RoundManager, Player, etc.
     * @param {object} saveData - Loaded save data
     * @param {RoundManager} roundManager - RoundManager instance to restore
     * @param {Player} player - Player instance to restore
     * @param {PlayState} playState - PlayState instance to restore
     */
    static restoreGameState(saveData, roundManager, player, playState) {
        // Restore player position
        if (saveData.playerPosition) {
            player.mapPosition.x = saveData.playerPosition.x;
            player.mapPosition.y = saveData.playerPosition.y;
            player.position.x = Math.floor(player.mapPosition.x / Tile.SIZE);
            player.position.y = Math.floor(player.mapPosition.y / Tile.SIZE);
        }

        // Restore player stamina
        if (saveData.playerStamina !== undefined) {
            player.stamina = saveData.playerStamina;
        }

        // Restore round manager state
        // If we have nextRound, it means we're loading from RoundEnd state - start next round
        if (saveData.nextRound !== null && saveData.nextRound !== undefined) {
            roundManager.currentRound = saveData.nextRound;
        } else if (saveData.currentRound !== undefined) {
            roundManager.currentRound = saveData.currentRound;
        }
        if (saveData.targetRoomId) {
            roundManager.targetRoomId = saveData.targetRoomId;
        }
        if (saveData.hasSignedThisRound !== undefined) {
            roundManager.hasSignedThisRound = saveData.hasSignedThisRound;
        }

        // Restore score
        if (saveData.currentScore !== undefined) {
            roundManager.scoreManager.currentScore = saveData.currentScore;
        }

        // Restore timer state
        if (saveData.timerBaseTime !== undefined) {
            roundManager.gameTimer.baseTime = saveData.timerBaseTime;
        }
        if (saveData.timerRemaining !== undefined) {
            roundManager.gameTimer.timeRemaining = saveData.timerRemaining;
        }
        if (saveData.timerRunning !== undefined) {
            roundManager.gameTimer.isRunning = saveData.timerRunning;
        }

        // Restore PlayState flags
        if (saveData.hasCheckedSign !== undefined) {
            playState.hasCheckedSign = saveData.hasCheckedSign;
        }
        if (saveData.hasHandledTimerExpiry !== undefined) {
            playState.hasHandledTimerExpiry = saveData.hasHandledTimerExpiry;
        }

        // Restore sign if it existed
        if (saveData.signPosition && saveData.signOpacity > 0) {
            // Sign will be recreated by PlayerSigningState if needed
            // For now, we just restore the position data
        }
    }
}
