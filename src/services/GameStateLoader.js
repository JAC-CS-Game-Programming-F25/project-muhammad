import Map from "./Map.js";
import RoomLoader from "./RoomLoader.js";
import RoundManager from "./RoundManager.js";
import Player from "../entities/Player.js";
import Vector from "../../lib/Vector.js";
import SaveManager from "./SaveManager.js";
import Tile from "./Tile.js";

export default class GameStateLoader {
    /**
     * Load a saved game state
     * @returns {Object} Loaded game state with map, player, managers
     */
    static async loadSavedGame() {
        const saveData = SaveManager.loadGameState();
        if (!saveData) return null;

        // Load map definition
        const mapDefinition = await fetch("./config/map.json").then((r) =>
            r.json()
        );

        // Create core objects
        const map = new Map(mapDefinition);
        const roomLoader = new RoomLoader(mapDefinition);
        const roundManager = new RoundManager(roomLoader);

        // Create player at saved position
        const savedX = saveData.playerPosition.x / Tile.SIZE;
        const savedY = saveData.playerPosition.y / Tile.SIZE;
        const player = new Player(
            { position: new Vector(savedX, savedY) },
            map
        );

        // Link objects
        map.player = player;
        player.roundManager = roundManager;

        // Restore state from save data
        const playStateFlags = SaveManager.restoreGameState(
            saveData,
            roundManager,
            player,
            {} // Temporary object for flags
        );

        // Handle RoundEnd continuation
        const shouldStartNextRound =
            saveData.gameStateName === "round-end" && saveData.nextRound;

        if (shouldStartNextRound) {
            roundManager.currentRound = saveData.nextRound;
            roundManager.startRound();
            player.reset(20.5, 63.4);
        }

        return {
            map,
            roomLoader,
            roundManager,
            player,
            currentRoomName: roundManager.getTargetRoom(),
            flags: {
                hasCheckedSign: shouldStartNextRound
                    ? false
                    : saveData.hasCheckedSign || false,
                hasHandledTimerExpiry: shouldStartNextRound
                    ? false
                    : saveData.hasHandledTimerExpiry || false,
            },
        };
    }

    /**
     * Load state for continuing from a previous round
     * @param {Object} params - Parameters from previous state
     * @returns {Object} Game state ready for next round
     */
    static async continueFromPreviousRound(params) {
        const { roundManager, roomLoader, map, player } = params;

        // Reset player for new round
        player.reset(20.5, 63.4);

        return {
            map,
            roomLoader,
            roundManager,
            player,
            currentRoomName: roundManager.getTargetRoom(),
            flags: {
                hasCheckedSign: false,
                hasHandledTimerExpiry: false,
            },
        };
    }

    /**
     * Create a fresh new game
     * @returns {Object} Brand new game state
     */
    static async startNewGame() {
        // Delete any existing save
        SaveManager.deleteSaveGame();

        // Load map definition
        const mapDefinition = await fetch("./config/map.json").then((r) =>
            r.json()
        );

        // Create core objects
        const map = new Map(mapDefinition);
        const player = new Player({ position: new Vector(20.5, 63.4) }, map);

        // Create managers
        const roomLoader = new RoomLoader(mapDefinition);
        const roundManager = new RoundManager(roomLoader);
        roundManager.startRound();

        // Link objects
        map.player = player;
        player.roundManager = roundManager;

        return {
            map,
            roomLoader,
            roundManager,
            player,
            currentRoomName: roundManager.getTargetRoom(),
            flags: {
                hasCheckedSign: false,
                hasHandledTimerExpiry: false,
            },
        };
    }
}
