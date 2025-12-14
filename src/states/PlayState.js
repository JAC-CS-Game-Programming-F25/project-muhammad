import State from "../../lib/State.js";
import Map from "../services/Map.js";
import RoomLoader from "../services/RoomLoader.js";
import Player from "../entities/Player.js";
import Vector from "../../lib/Vector.js";
import UIOverlay from "../user-interface/UIOverlay.js";

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

        // Game state
        this.timer = 60;
        this.maxTime = 60;
        this.lives = 3;
        this.score = 0;
        this.currentRound = 1;
        this.maxRounds = 5;
        this.grainOffset = 0;
    }

    async enter() {
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
        this.currentRoomName = this.roomLoader.getRandomRoomName();
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

        if (this.player && this.roomLoader && this.currentRoomName) {
            this.player.update(dt);

            // Update timer
            this.timer -= dt;
            if (this.timer <= 0) {
                this.timer = 0;
                // TODO: Handle timeout
            }

            // Check room
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
                console.log("Correct room!");
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
