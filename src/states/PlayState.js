import State from "../../lib/State.js";
import Ghost from "../entities/Ghost.js";
import Vector from "../../lib/Vector.js";
import UIOverlay from "../user-interface/UIOverlay.js";
import SoundName from "../enums/SoundName.js";
import PlayerStateName from "../enums/PlayerStateName.js";
import GameStateName from "../enums/GameStateName.js";
import { sounds, context, stateMachine, canvas } from "../globals.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../globals.js";
import SaveManager from "../services/SaveManager.js";
import LayoutManager from "../services/LayoutManager.js";
import JuiceEffects from "../services/JuiceEffects.js";
import RoomViewerManager from "../services/RoomViewerManager.js";
import GameStateLoader from "../services/GameStateLoader.js";

export default class PlayState extends State {
    constructor() {
        super();
        // Core game objects
        this.map = null;
        this.player = null;
        this.ghosts = [];

        // Managers
        this.roomLoader = null;
        this.roundManager = null;
        this.layoutManager = new LayoutManager();
        this.juiceEffects = new JuiceEffects();
        this.roomViewerManager = new RoomViewerManager();

        // UI
        this.uiOverlay = null;
        this.currentRoomName = null;
        this.lastRoomCheck = null;

        // State flags
        this.hasCheckedSign = false;
        this.hasHandledTimerExpiry = false;
        this.hasShownHalfwayWarning = false;
        this.isInDamageState = false;
        this.damageStateTimer = 0;

        // Auto-save
        this.saveTimer = 0;
        this.saveInterval = 5.0;
    }

    async enter(parameters = {}) {
        sounds.play(SoundName.HorrorAmbient);

        // Determine which loading mode to use
        let gameState;

        if (parameters.loadGame) {
            gameState = await GameStateLoader.loadSavedGame();
        } else if (parameters.roundManager) {
            gameState = await GameStateLoader.continueFromPreviousRound(
                parameters
            );
        } else {
            gameState = await GameStateLoader.startNewGame();
        }

        // Apply loaded state to PlayState
        if (gameState) {
            this.applyGameState(gameState);
            await this.setupUI();

            // Show speech bubble when starting a new round (not when loading saved game)
            if (this.player && this.roundManager && !parameters.loadGame) {
                this.player.createSpeechBubble();
            }
        }

        // Focus canvas
        if (canvas) {
            canvas.focus();
        }
    }

    /**
     * Apply loaded game state to PlayState properties
     */
    applyGameState(gameState) {
        this.map = gameState.map;
        this.roomLoader = gameState.roomLoader;
        this.roundManager = gameState.roundManager;
        this.player = gameState.player;
        this.currentRoomName = gameState.currentRoomName;

        // Apply flags
        this.hasCheckedSign = gameState.flags.hasCheckedSign;
        this.hasHandledTimerExpiry = gameState.flags.hasHandledTimerExpiry;

        // Reset round state
        this.ghosts = [];
        this.damageStateTimer = 0;
        this.isInDamageState = false;
        this.juiceEffects.reset();
        this.hasShownHalfwayWarning = false;
        this.saveTimer = 0;
    }

    /**
     * Setup UI components (layout, viewer, overlay)
     */
    async setupUI() {
        // Setup layout
        this.layoutManager.setupLayout(canvas);

        // Wait for and load 360° viewer
        await this.roomViewerManager.waitForPhotoSphereViewer();
        const room = this.roomLoader.getRoom(this.currentRoomName);
        const container = this.layoutManager.getPannellumContainer();
        this.roomViewerManager.loadRoom(this.currentRoomName, room, container);

        // Create UI overlay
        this.uiOverlay = new UIOverlay(this);
    }

    exit() {
        sounds.stop(SoundName.HorrorAmbient);
        sounds.stop(SoundName.HorrorLaugh);
        this.roomViewerManager.cleanup();
        if (this.uiOverlay) {
            this.uiOverlay.destroy();
        }
        this.layoutManager.cleanup(canvas, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    /**
     * POLYMORPHISM: Get all entities for uniform treatment
     */
    getAllEntities() {
        const entities = [];
        if (this.player) entities.push(this.player);
        entities.push(...this.ghosts);
        return entities;
    }

    update(dt) {
        if (this.map) this.map.update(dt);

        // POLYMORPHIC UPDATE: Treat all entities uniformly
        for (const entity of this.getAllEntities()) {
            entity.update(dt);
        }

        // Update game objects
        if (this.player?.sign) this.player.sign.update(dt);

        // JUICE: Update visual effects
        this.juiceEffects.update(dt);

        // Update game timer
        if (this.roundManager?.gameTimer) {
            this.roundManager.gameTimer.update(dt);
        }

        // Game logic
        this.updateGameLogic(dt);
        this.updateAutoSave(dt);
        if (this.uiOverlay) this.uiOverlay.update(dt);
    }

    updateGameLogic(dt) {
        // Timer expiry
        if (
            this.roundManager?.checkRoundComplete() &&
            !this.hasHandledTimerExpiry
        ) {
            this.hasHandledTimerExpiry = true;
            this.roundManager.endRound(false);
            this.spawnGhosts();
        }

        // JUICE: Halfway timer warning
        if (this.roundManager && !this.hasShownHalfwayWarning) {
            const timeRemaining = this.roundManager.gameTimer.getTimeRemaining();
            const baseTime = this.roundManager.gameTimer.getBaseTime();
            const halfTime = baseTime / 2;
            
            if (timeRemaining <= halfTime && timeRemaining > halfTime - 0.5) {
                this.hasShownHalfwayWarning = true;
                this.juiceEffects.createFloatingWarning(
                    "HALFWAY!",
                    CANVAS_WIDTH / 2,
                    CANVAS_HEIGHT / 3
                );
            }
        }

        // Damage state timer
        if (this.isInDamageState) {
            this.damageStateTimer -= dt;
            if (this.damageStateTimer <= 0) {
                this.transitionToRoundEnd();
            }
        }

        // Check sign placement
        if (this.player?.sign && this.roundManager && !this.hasCheckedSign) {
            this.checkSignPlacement();
        }

        // Update room detection
        if (this.player && this.roomLoader && this.currentRoomName) {
            this.updateRoomDetection();
        }
    }

    checkSignPlacement() {
        const isSigning =
            this.player.stateMachine.currentState.constructor.name ===
            "PlayerSigningState";
        if (isSigning) return;

        const roomAtSign = this.roomLoader.getRoomAtPosition(
            this.player.sign.position.x,
            this.player.sign.position.y
        );
        const targetRoom = this.roundManager.getTargetRoom();
        this.hasCheckedSign = true;

        if (roomAtSign === targetRoom) {
            this.handleCorrectRoom();
        } else {
            this.handleWrongRoom();
        }
    }

    handleCorrectRoom() {
        this.roundManager.endRound(true);

        this.transitionToRoundEnd();
    }

    handleWrongRoom() {
        this.roundManager.endRound(false);
        this.spawnGhosts();
    }

    transitionToRoundEnd() {
        const nextRound =
            this.roundManager.currentRound < 5
                ? this.roundManager.currentRound + 1
                : null;

        if (this.player && this.roundManager) {
            SaveManager.saveGameState({
                player: this.player,
                roundManager: this.roundManager,
                hasCheckedSign: this.hasCheckedSign,
                hasHandledTimerExpiry: this.hasHandledTimerExpiry,
                nextRound: nextRound,
                gameStateName: GameStateName.RoundEnd,
            });
        }

        stateMachine.change(GameStateName.RoundEnd, {
            roundManager: this.roundManager,
            roomLoader: this.roomLoader,
            map: this.map,
            player: this.player,
        });

        this.isInDamageState = false;
        this.damageStateTimer = 0;
    }

    updateRoomDetection() {
        const roomAtPosition = this.roomLoader.getRoomAtPosition(
            this.player.mapPosition.x,
            this.player.mapPosition.y
        );

        if (
            roomAtPosition === this.currentRoomName &&
            roomAtPosition !== this.lastRoomCheck
        ) {
            this.lastRoomCheck = roomAtPosition;
        } else if (roomAtPosition !== this.currentRoomName) {
            this.lastRoomCheck = null;
        }
    }

    updateAutoSave(dt) {
        if (!this.player || !this.roundManager) return;

        this.saveTimer += dt;
        if (this.saveTimer >= this.saveInterval) {
            SaveManager.saveGameState({
                player: this.player,
                roundManager: this.roundManager,
                hasCheckedSign: this.hasCheckedSign,
                hasHandledTimerExpiry: this.hasHandledTimerExpiry,
            });
            this.saveTimer = 0;
        }
    }

    spawnGhosts() {
        if (!this.player) return;

        this.player.changeState(PlayerStateName.Damage);
        this.isInDamageState = true;
        this.damageStateTimer = 5.0;

        // JUICE: Screen shake!
        this.juiceEffects.startScreenShake(10, 0.6);

        const playerHeadY =
            this.player.mapPosition.y - this.player.dimensions.y / 2;
        const playerX = this.player.mapPosition.x;

        this.ghosts = [
            new Ghost(new Vector(playerX, playerHeadY - 40)),
            new Ghost(new Vector(playerX - 32, playerHeadY - 8)),
            new Ghost(new Vector(playerX + 32, playerHeadY - 8)),
        ];

        for (const ghost of this.ghosts) {
            ghost.materialize();
        }
    }

    render() {
        const shakeApplied = this.juiceEffects.applyScreenShake();

        if (this.map) {
            this.map.render();

            if (this.ghosts.length > 0) {
                context.save();
                context.scale(this.map.zoom, this.map.zoom);
                context.translate(
                    this.map.offsetX / this.map.zoom,
                    this.map.offsetY / this.map.zoom
                );

                for (const ghost of this.ghosts) {
                    ghost.render();
                }

                context.restore();
            }
        }

        this.juiceEffects.restoreScreenShake(shakeApplied);

        // JUICE: Render floating text
        this.juiceEffects.renderFloatingText();

        if (this.uiOverlay) {
            this.uiOverlay.render();
        }
    }
}
