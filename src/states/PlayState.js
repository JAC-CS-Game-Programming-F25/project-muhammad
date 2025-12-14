import State from "../../lib/State.js";
import Map from "../services/Map.js";
import RoomLoader from "../services/RoomLoader.js";
import RoundManager from "../services/RoundManager.js";
import Player from "../entities/Player.js";
import Vector from "../../lib/Vector.js";
import UIOverlay from "../user-interface/UIOverlay.js";
import SoundName from "../enums/SoundName.js";
import { sounds } from "../globals.js";

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
        this.grainOffset = 0;
        this.hasCheckedSign = false; // Track if we've already checked the sign for this round
        this.hasHandledTimerExpiry = false; // Track if we've already handled timer expiry
    }

    async enter() {
        // Play horror ambient music on loop
        sounds.play(SoundName.HorrorAmbient);

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
        
        // Initialize RoundManager
        this.roundManager = new RoundManager(this.roomLoader);
        this.roundManager.startRound();
        this.hasCheckedSign = false; // Reset sign check flag for new round
        this.hasHandledTimerExpiry = false; // Reset timer expiry flag for new round
        
        // Give player access to roundManager for signing checks
        this.player.roundManager = this.roundManager;
        
        this.setupLayout();
        await this.waitForPhotoSphereViewer();
        this.loadRandomRoom();
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

        const wrapper = document.createElement("div");
        wrapper.id = "play-state-wrapper";
        wrapper.style.position = "fixed";
        wrapper.style.left = "50%";
        wrapper.style.top = "50%";
        wrapper.style.transformOrigin = "center center";
        wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
        wrapper.style.width = `${baseWidth}px`;
        wrapper.style.height = `${baseHeight}px`;
        wrapper.style.display = "flex";
        wrapper.style.backgroundColor = "#0a0a0a";

        document.body.appendChild(wrapper);

        // 360° Image container with UI overlay
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

        // UI Overlay (Silent Hill style)
        this.uiOverlay = new UIOverlay(imageContainer, this);
        this.uiOverlay.create();

        imageContainer.appendChild(this.pannellumContainer);

        // Map canvas
        canvas.style.width = `${mapWidth}px`;
        canvas.style.height = `${baseHeight}px`;
        canvas.width = mapWidth * 2;
        canvas.height = baseHeight * 2;
        canvas.style.backgroundColor = "#2a2a2a";

        wrapper.appendChild(imageContainer);
        wrapper.appendChild(canvas);
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
        // Use target room from RoundManager
        this.currentRoomName = this.roundManager.getTargetRoom();
        const room = this.roomLoader.getRoom(this.currentRoomName);

        console.log("Loading room:", this.currentRoomName, room);

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
        // Stop the horror ambient music when leaving play state
        sounds.stop(SoundName.HorrorAmbient);

        if (this.roomViewer) {
            this.roomViewer.destroy();
        }

        if (this.uiOverlay) {
            this.uiOverlay.destroy();
            this.uiOverlay = null;
        }

        const wrapper = document.getElementById("play-state-wrapper");
        if (wrapper) {
            const canvas = document.querySelector("canvas");
            if (canvas) {
                document.body.appendChild(canvas);
                canvas.style.width = "800px";
                canvas.style.height = "600px";
            }
            wrapper.remove();
        }
    }

    update(dt) {
        if (this.map) {
            this.map.update(dt);
        }

        if (this.roundManager) {
            // Update game timer
            this.roundManager.gameTimer.update(dt);

            // Check if timer expired (only handle once)
            if (this.roundManager.checkRoundComplete() && !this.hasHandledTimerExpiry) {
                // Timer expired - end round with failure
                this.hasHandledTimerExpiry = true;
                this.roundManager.endRound(false);
                // TODO: Transition to GameOver state
            }
        }

        if (this.player && this.roomLoader && this.currentRoomName) {
            this.player.update(dt);

            // Check if player has planted a sign and verify if it's in the correct room
            // Only check once when sign is first planted (not every frame)
            if (this.player.sign && this.roundManager && !this.hasCheckedSign) {
                // Check if player is still in signing state (signing takes 4 seconds)
                const isSigning = this.player.stateMachine.currentState.constructor.name === 'PlayerSigningState';
                
                // Only check when signing is complete (player has exited signing state)
                if (!isSigning) {
                    const playerX = this.player.sign.position.x;
                    const playerY = this.player.sign.position.y;
                    const roomAtSignPosition = this.roomLoader.getRoomAtPosition(
                        playerX,
                        playerY
                    );
                    const targetRoom = this.roundManager.getTargetRoom();

                    // Mark as checked to prevent multiple checks
                    this.hasCheckedSign = true;

                    // Check if sign is in the correct room
                    if (roomAtSignPosition === targetRoom) {
                        // Correct room - end round with success
                        this.roundManager.endRound(true);
                        // TODO: Transition to RoundEnd state
                    } else if (roomAtSignPosition !== null) {
                        // Wrong room - end round with failure
                        this.roundManager.endRound(false);
                        // TODO: Transition to GameOver state
                    }
                }
            }

            // Check room for UI feedback (not for scoring)
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

        // Update UI overlay
        if (this.uiOverlay) {
            this.uiOverlay.update(dt);
        }
    }

    render() {
        if (this.map) {
            this.map.render();
        }

        // Render UI overlay
        if (this.uiOverlay) {
            this.uiOverlay.render();
        }
    }
}
