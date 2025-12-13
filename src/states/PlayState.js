import State from "../../lib/State.js";
import Map from "../services/Map.js";
import RoomLoader from "../services/RoomLoader.js";
import Player from "../entities/Player.js";
import Vector from "../../lib/Vector.js";

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
    }

    async enter() {
        // Load map definition
        const mapDefinition = await fetch("./config/map.json").then(
            (response) => response.json()
        );

        // Create map (for the canvas view)
        this.map = new Map(mapDefinition);

        // CREATE PLAYER
        // Spawn player at bottom-middle of map (2 tiles from bottom edge)
        const startX = Math.floor(mapDefinition.width / 2) + 2;
        const startY = mapDefinition.height - 4;
        
        this.player = new Player(
            {
                position: new Vector(startX, startY),
            },
            this.map
        );
        
        // Set player reference in map for rendering
        this.map.player = this.player;

        // Create room loader to get room data
        this.roomLoader = new RoomLoader(mapDefinition);

        // Setup grid layout
        this.setupLayout();

        // Wait for Photo Sphere Viewer to be available
        await this.waitForPhotoSphereViewer();

        // Load a random room
        this.loadRandomRoom();
    }

    setupLayout() {
        // Get the main canvas
        const canvas = document.querySelector("canvas");

        // Base dimensions (same as title screen)
        const baseWidth = 800;
        const baseHeight = 600;
        
        // Calculate scale to fill the window while maintaining aspect ratio
        const scaleX = window.innerWidth / baseWidth;
        const scaleY = window.innerHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // Define logo height and content distribution
        const logoHeight = 100;
        const contentHeight = baseHeight - logoHeight; // 500px
        
        // 360° image takes 3/5 of width (480px base), map takes 2/5 (320px base)
        const imageWidth = Math.floor(baseWidth * 0.6); // 480px - 360 image
        const mapWidth = baseWidth - imageWidth; // 320px - map

        // Create a grid wrapper
        const wrapper = document.createElement("div");
        wrapper.id = "play-state-wrapper";
        wrapper.style.position = "fixed";
        wrapper.style.left = "50%";
        wrapper.style.top = "50%";
        // Apply CSS scaling to match window size (like title screen) - CENTER IT
        wrapper.style.transformOrigin = "center center";
        wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
        wrapper.style.width = `${baseWidth}px`;
        wrapper.style.height = `${baseHeight}px`;
        wrapper.style.display = "grid";
        wrapper.style.gridTemplateColumns = `repeat(5, ${baseWidth / 5}px)`; // 5 columns of 160px each
        wrapper.style.gridTemplateRows = `${logoHeight}px repeat(4, ${contentHeight / 4}px)`; // 1 logo row + 4 content rows
        wrapper.style.backgroundColor = "#1a1a1a";
        wrapper.style.gap = "0px";

        document.body.appendChild(wrapper);

        // 1. Logo area (grid-area: 1 / 1 / 2 / 4) - spans columns 1-3
        const logoContainer = document.createElement("div");
        logoContainer.id = "logo-container";
        logoContainer.style.gridArea = "1 / 1 / 2 / 4";
        logoContainer.style.backgroundColor = "#0a0a0a";
        logoContainer.style.display = "flex";
        logoContainer.style.alignItems = "center";
        logoContainer.style.justifyContent = "center";
        logoContainer.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');
                
                .logo-text {
                    font-family: 'Anton', sans-serif;
                    font-size: 60px;
                    color: rgb(255, 50, 50);
                    text-align: center;
                    text-shadow: 0 0 30px rgba(255, 0, 0, 0.8);
                    letter-spacing: 4px;
                    margin: 0;
                }
            </style>
            <h1 class="logo-text">JACGUESSR</h1>
        `;

        // 2. 360° Image area (grid-area: 2 / 1 / 6 / 4) - spans rows 2-5, columns 1-3
        this.pannellumContainer = document.createElement("div");
        this.pannellumContainer.id = "photo-sphere-viewer";
        this.pannellumContainer.style.gridArea = "2 / 1 / 6 / 4";
        this.pannellumContainer.style.backgroundColor = "#000";
        this.pannellumContainer.style.position = "relative";

        // Add room name overlay on panorama
        const roomInfoOverlay = document.createElement("div");
        roomInfoOverlay.style.position = "absolute";
        roomInfoOverlay.style.top = "15px";
        roomInfoOverlay.style.left = "15px";
        roomInfoOverlay.style.zIndex = "100";
        roomInfoOverlay.style.pointerEvents = "none";
        roomInfoOverlay.innerHTML = `
            <style>
                .room-info-box {
                    background: rgba(0, 0, 0, 0.85);
                    color: white;
                    padding: 10px 16px;
                    border-radius: 6px;
                    font-family: Arial, sans-serif;
                    border: 2px solid rgba(255, 50, 50, 0.6);
                }
                
                .room-info-box p {
                    margin: 0;
                    font-size: 16px;
                    font-weight: bold;
                    color: #fff;
                }
            </style>
            <div class="room-info-box">
                <p id="current-room-name">Loading...</p>
            </div>
        `;
        this.pannellumContainer.appendChild(roomInfoOverlay);

        // 3. Map canvas area (grid-area: 1 / 4 / 6 / 6) - spans rows 1-5, columns 4-5
        canvas.style.gridArea = "1 / 4 / 6 / 6";
        canvas.width = mapWidth * 3; // Increase internal resolution to show more of the map (3x zoom out)
        canvas.height = baseHeight * 3;
        canvas.style.width = `${mapWidth}px`;
        canvas.style.height = `${baseHeight}px`;
        canvas.style.backgroundColor = "#2a2a2a";

        // Add all elements to wrapper
        wrapper.appendChild(logoContainer);
        wrapper.appendChild(this.pannellumContainer);
        wrapper.appendChild(canvas);
    }

    async waitForPhotoSphereViewer() {
        // Wait for the Viewer class to be available from the module script in index.html
        return new Promise((resolve) => {
            const checkInterval = setInterval(async () => {
                try {
                    const module = await import("@photo-sphere-viewer/core");
                    this.ViewerClass = module.Viewer;
                    clearInterval(checkInterval);
                    resolve();
                } catch (error) {
                    // Still loading, keep waiting
                }
            }, 100);
        });
    }

    loadRandomRoom() {
        // Get random room name
        this.currentRoomName = this.roomLoader.getRandomRoomName();
        const room = this.roomLoader.getRoom(this.currentRoomName);

        console.log("Loading room:", this.currentRoomName, room);

        // Update UI
        const roomNameEl = document.getElementById("current-room-name");
        if (roomNameEl) {
            roomNameEl.textContent = this.currentRoomName;
        }

        // Load panorama with Photo Sphere Viewer
        if (this.ViewerClass && this.pannellumContainer) {
            // Destroy previous viewer
            if (this.roomViewer) {
                this.roomViewer.destroy();
                this.roomViewer = null;
            }

            // Create new Photo Sphere Viewer
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
        // Cleanup panorama viewer
        if (this.roomViewer) {
            this.roomViewer.destroy();
        }

        // Remove wrapper (contains everything)
        const wrapper = document.getElementById("play-state-wrapper");
        if (wrapper) {
            // Move canvas back to body before removing wrapper
            const canvas = document.querySelector("canvas");
            if (canvas) {
                document.body.appendChild(canvas);
                // Reset canvas styles to original
                canvas.style.width = "800px";
                canvas.style.height = "600px";
                canvas.style.gridArea = "";
            }
            wrapper.remove();
        }
    }

    update(dt) {
        if (this.map) {
            this.map.update(dt);
        }
        
        if (this.player) {
            this.player.update(dt);
        }
    }

    render() {
        if (this.map) {
            this.map.render();
        }
    }
}