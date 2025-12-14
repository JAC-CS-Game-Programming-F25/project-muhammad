import State from "../../lib/State.js";
import Map from "../services/Map.js";
import RoomLoader from "../services/RoomLoader.js";
import RoundManager from "../services/RoundManager.js";
import Player from "../entities/Player.js";
import Ghost from "../entities/Ghost.js";
import Vector from "../../lib/Vector.js";
import UIOverlay from "../user-interface/UIOverlay.js";
import SoundName from "../enums/SoundName.js";
import PlayerStateName from "../enums/PlayerStateName.js";
import GameStateName from "../enums/GameStateName.js";
import { sounds, context, stateMachine, canvas } from "../globals.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../globals.js";
import SaveManager from "../services/SaveManager.js";
import Tile from "../services/Tile.js";

export default class PlayState extends State {
    constructor() {
        super();
        this.map = null;
        this.roomLoader = null;
        this.roomViewer = null;
        this.currentRoomName = null;
        this.pannellumContainer = null;
        this.ViewerClass = null;
        this.player = null;
        this.lastRoomCheck = null;
        this.uiOverlay = null;
        this.roundManager = null;
        this.hasCheckedSign = false;
        this.hasHandledTimerExpiry = false;
        this.ghosts = [];
        this.wrapper = null; // Store reference to wrapper
        this.damageStateTimer = 0;
        this.isInDamageState = false;
        this.saveTimer = 0; // Timer for auto-saving
        this.saveInterval = 5.0; // Auto-save every 5 seconds
    }

    async enter(parameters = {}) {
        sounds.play(SoundName.HorrorAmbient);

        // Check if we're loading a saved game
        if (parameters.loadGame) {
            const saveData = SaveManager.loadGameState();
            if (saveData) {
                // Load map and create base objects
                const mapDefinition = await fetch("./config/map.json").then(
                    (response) => response.json()
                );

                this.map = new Map(mapDefinition);
                this.roomLoader = new RoomLoader(mapDefinition);
                this.roundManager = new RoundManager(this.roomLoader);

                // Create player at saved position
                const savedX = saveData.playerPosition.x / Tile.SIZE; // Convert to tiles
                const savedY = saveData.playerPosition.y / Tile.SIZE;
                this.player = new Player(
                    {
                        position: new Vector(savedX, savedY),
                    },
                    this.map
                );
                this.map.player = this.player;
                this.player.roundManager = this.roundManager;

                // Restore game state
                SaveManager.restoreGameState(saveData, this.roundManager, this.player, this);

                // Restore flags
                this.hasCheckedSign = saveData.hasCheckedSign || false;
                this.hasHandledTimerExpiry = saveData.hasHandledTimerExpiry || false;
                this.ghosts = [];
                this.damageStateTimer = 0;
                this.isInDamageState = false;
                this.saveTimer = 0;

                // If we're loading from RoundEnd state, start the next round
                if (saveData.gameStateName === GameStateName.RoundEnd && saveData.nextRound) {
                    // We're continuing from RoundEnd - start the next round
                    this.roundManager.currentRound = saveData.nextRound;
                    this.roundManager.startRound();
                    this.hasCheckedSign = false;
                    this.hasHandledTimerExpiry = false;
                    
                    // Reset player to start position for new round
                    const startX = 20.5;
                    const startY = 63.4;
                    this.player.reset(startX, startY);
                }

                // Setup layout and load the target room
                this.setupLayout();
                await this.waitForPhotoSphereViewer();
                this.currentRoomName = this.roundManager.getTargetRoom();
                this.loadRoomByName(this.currentRoomName);

                // Focus canvas
                if (canvas) {
                    canvas.focus();
                }
                return; // Exit early, game loaded
            }
        }

        // Check if we're continuing from a previous round
        if (parameters.roundManager) {
            // Reuse existing objects
            this.roundManager = parameters.roundManager;
            this.roomLoader = parameters.roomLoader;
            this.map = parameters.map;
            this.player = parameters.player;

            // Reset player for new round
            const startX = 20.5;
            const startY = 63.4;
            this.player.reset(startX, startY);

            // Reset flags for new round
            this.hasCheckedSign = false;
            this.hasHandledTimerExpiry = false;
            this.ghosts = [];
            this.damageStateTimer = 0;
            this.isInDamageState = false;

            // Setup layout and load new room
            this.setupLayout();
            await this.waitForPhotoSphereViewer();
            this.loadRandomRoom();
        } else {
            // First round - create everything from scratch
            // Delete any existing save when starting a new game
            SaveManager.deleteSaveGame();
            
            const mapDefinition = await fetch("./config/map.json").then(
                (response) => response.json()
            );

            this.map = new Map(mapDefinition);

            const startX = 20.5;
            const startY = 63.4;

            this.player = new Player(
                {
                    position: new Vector(startX, startY),
                },
                this.map
            );

            this.map.player = this.player;
            this.roomLoader = new RoomLoader(mapDefinition);

            this.roundManager = new RoundManager(this.roomLoader);
            this.roundManager.startRound();
            this.hasCheckedSign = false;
            this.hasHandledTimerExpiry = false;
            this.ghosts = [];
            this.damageStateTimer = 0;
            this.isInDamageState = false;

            this.player.roundManager = this.roundManager;

            this.setupLayout();
            await this.waitForPhotoSphereViewer();
            this.loadRandomRoom();
        }

        // Focus canvas for keyboard input
        if (canvas) {
            canvas.focus();
        }
    }

    setupLayout() {
        const canvas = document.querySelector("canvas");
        const baseWidth = 950;
        const baseHeight = 600;

        const scaleX = window.innerWidth / baseWidth;
        const scaleY = window.innerHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY);

        const imageWidth = Math.floor(baseWidth * 0.6);
        const mapWidth = baseWidth - imageWidth;

        // Create wrapper
        this.wrapper = document.createElement("div");
        this.wrapper.id = "play-state-wrapper";
        this.wrapper.style.position = "fixed";
        this.wrapper.style.left = "50%";
        this.wrapper.style.top = "50%";
        this.wrapper.style.transformOrigin = "center center";
        this.wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
        this.wrapper.style.width = `${baseWidth}px`;
        this.wrapper.style.height = `${baseHeight}px`;
        this.wrapper.style.display = "flex";
        this.wrapper.style.backgroundColor = "#0a0a0a";

        document.body.appendChild(this.wrapper);

        // 360° Image container
        const imageContainer = document.createElement("div");
        imageContainer.style.width = `${imageWidth}px`;
        imageContainer.style.height = `${baseHeight}px`;
        imageContainer.style.position = "relative";

        // 360° viewer
        this.pannellumContainer = document.createElement("div");
        this.pannellumContainer.id = "photo-sphere-viewer";
        this.pannellumContainer.style.width = "100%";
        this.pannellumContainer.style.height = "100%";
        this.pannellumContainer.style.backgroundColor = "#000";

        // UI Overlay (canvas-based, no DOM container needed)
        this.uiOverlay = new UIOverlay(this);

        imageContainer.appendChild(this.pannellumContainer);

        // Map canvas
        canvas.style.width = `${mapWidth}px`;
        canvas.style.height = `${baseHeight}px`;
        canvas.width = mapWidth * 2;
        canvas.height = baseHeight * 2;
        canvas.style.backgroundColor = "#2a2a2a";

        this.wrapper.appendChild(imageContainer);
        this.wrapper.appendChild(canvas);
    }

    async waitForPhotoSphereViewer() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(async () => {
                try {
                    const module = await import("@photo-sphere-viewer/core");
                    this.ViewerClass = module.Viewer;
                    clearInterval(checkInterval);
                    resolve();
                } catch (error) {
                    // Still loading
                }
            }, 100);
        });
    }

    loadRandomRoom() {
        this.currentRoomName = this.roundManager.getTargetRoom();
        this.loadRoomByName(this.currentRoomName);
    }

    loadRoomByName(roomName) {
        this.currentRoomName = roomName;
        const room = this.roomLoader.getRoom(roomName);

        console.log("Loading room:", roomName, room);

        if (this.ViewerClass && this.pannellumContainer) {
            if (this.roomViewer) {
                this.roomViewer.destroy();
                this.roomViewer = null;
            }

            this.roomViewer = new this.ViewerClass({
                container: this.pannellumContainer,
                panorama: room.imagePath,
                navbar: false,
                defaultZoomLvl: 0,
                minFov: 30,
                maxFov: 90,
                mousewheel: true,
                mousemove: true,
            });
        }
    }

    exit() {
        // Don't save on exit - we only save during active gameplay (auto-save)
        // This prevents saving when transitioning to RoundEndState/GameOverState
        
        sounds.stop(SoundName.HorrorAmbient);
        sounds.stop(SoundName.HorrorLaugh);

        if (this.roomViewer) {
            this.roomViewer.destroy();
            this.roomViewer = null;
        }

        if (this.uiOverlay) {
            this.uiOverlay.destroy();
            this.uiOverlay = null;
        }

        if (this.wrapper) {
            const canvas = document.querySelector("canvas");

            // Remove wrapper completely
            this.wrapper.remove();
            this.wrapper = null;

            // Reset canvas - let globals.js resizeCanvas handle the scaling
            if (canvas) {
                // Remove from current parent
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }

                // Reset canvas dimensions (actual pixel dimensions)
                canvas.width = CANVAS_WIDTH;
                canvas.height = CANVAS_HEIGHT;

                // Clear inline styles so resizeCanvas can work
                canvas.style.removeProperty("width");
                canvas.style.removeProperty("height");
                canvas.style.removeProperty("position");
                canvas.style.removeProperty("left");
                canvas.style.removeProperty("top");
                canvas.style.removeProperty("transform");
                canvas.style.backgroundColor = "#0a0a0a";

                // Re-append to body
                document.body.appendChild(canvas);

                // Trigger resize to apply proper scaling
                window.dispatchEvent(new Event("resize"));
            }
        }
    }

    update(dt) {
        if (this.map) {
            this.map.update(dt);
        }

        for (const ghost of this.ghosts) {
            ghost.update(dt);
        }

        if (this.roundManager) {
            this.roundManager.gameTimer.update(dt);

            if (
                this.roundManager.checkRoundComplete() &&
                !this.hasHandledTimerExpiry
            ) {
                this.hasHandledTimerExpiry = true;
                this.roundManager.endRound(false);
                console.log("user lost - timer expired");
                this.spawnGhosts();
            }
        }

        // Check if we need to transition to RoundEnd state after damage state (5 seconds)
        if (this.isInDamageState) {
            this.damageStateTimer -= dt;
            if (this.damageStateTimer <= 0) {
                // Save with next round number before transitioning to RoundEnd
                const nextRound = this.roundManager.currentRound < 5 
                    ? this.roundManager.currentRound + 1 
                    : null; // Game over if round 5
                
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
                
                // Transition to RoundEnd state after 5 seconds
                stateMachine.change(GameStateName.RoundEnd, {
                    roundManager: this.roundManager,
                    roomLoader: this.roomLoader,
                    map: this.map,
                    player: this.player,
                });
                this.isInDamageState = false;
                this.damageStateTimer = 0;
            }
        }

        // Auto-save game state every few seconds
        if (this.player && this.roundManager) {
            this.saveTimer += dt;
            if (this.saveTimer >= this.saveInterval) {
                SaveManager.saveGameState({
                    player: this.player,
                    roundManager: this.roundManager,
                    hasCheckedSign: this.hasCheckedSign,
                    hasHandledTimerExpiry: this.hasHandledTimerExpiry,
                });
                this.saveTimer = 0; // Reset timer
            }
        }

        if (this.player && this.roomLoader && this.currentRoomName) {
            this.player.update(dt);

            if (this.player.sign && this.roundManager && !this.hasCheckedSign) {
                const isSigning =
                    this.player.stateMachine.currentState.constructor.name ===
                    "PlayerSigningState";

                if (!isSigning) {
                    const playerX = this.player.sign.position.x;
                    const playerY = this.player.sign.position.y;
                    const roomAtSignPosition =
                        this.roomLoader.getRoomAtPosition(playerX, playerY);
                    const targetRoom = this.roundManager.getTargetRoom();

                    this.hasCheckedSign = true;

                    if (roomAtSignPosition === targetRoom) {
                        this.roundManager.endRound(true);
                        console.log("user won - correct room!");

                        // Save with next round number before transitioning to RoundEnd
                        const nextRound = this.roundManager.currentRound < 5 
                            ? this.roundManager.currentRound + 1 
                            : null; // Game over if round 5
                        
                        SaveManager.saveGameState({
                            player: this.player,
                            roundManager: this.roundManager,
                            hasCheckedSign: this.hasCheckedSign,
                            hasHandledTimerExpiry: this.hasHandledTimerExpiry,
                            nextRound: nextRound,
                            gameStateName: GameStateName.RoundEnd,
                        });

                        // FIXED: Transition to RoundEnd state
                        stateMachine.change(GameStateName.RoundEnd, {
                            roundManager: this.roundManager,
                            roomLoader: this.roomLoader,
                            map: this.map,
                            player: this.player,
                        });
                    } else {
                        this.roundManager.endRound(false);
                        console.log("user lost - wrong room");
                        this.spawnGhosts();
                    }
                }
            }

            const playerX = this.player.mapPosition.x;
            const playerY = this.player.mapPosition.y;
            const roomAtPosition = this.roomLoader.getRoomAtPosition(
                playerX,
                playerY
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

        if (this.uiOverlay) {
            this.uiOverlay.update(dt);
        }
    }

    spawnGhosts() {
        if (this.player) {
            // Transition player to damage state (death animation)
            this.player.changeState(PlayerStateName.Damage);
            this.isInDamageState = true;
            this.damageStateTimer = 5.0; // 5 seconds before transitioning to RoundEnd

            const playerHeadY =
                this.player.mapPosition.y - this.player.dimensions.y / 2;
            const playerX = this.player.mapPosition.x;

            const triangleSpacing = 32;
            const triangleHeight = 40;

            this.ghosts = [
                new Ghost(new Vector(playerX, playerHeadY - triangleHeight)),
                new Ghost(
                    new Vector(playerX - triangleSpacing, playerHeadY - 8)
                ),
                new Ghost(
                    new Vector(playerX + triangleSpacing, playerHeadY - 8)
                ),
            ];

            for (const ghost of this.ghosts) {
                ghost.materialize();
            }
        }
    }

    render() {
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

        if (this.uiOverlay) {
            this.uiOverlay.render();
        }
    }
}
