import Sprite from "../../lib/Sprite.js";
import Vector from "../../lib/Vector.js";
import Tile from "./Tile.js";
import Layer from "./Layer.js";
import TilesetManager from "./TilesetManager.js";
import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    context,
    DEBUG,
    images,
} from "../globals.js";
import Colour from "../enums/Colour.js";

export default class Map {
    /**
     * The collection of layers, sprites,
     * and characters that comprises the world.
     *
     * @param {object} mapDefinition JSON from Tiled map editor.
     */
    constructor(mapDefinition) {
        // Use TilesetManager to load sprites from multiple tilesets
        const tilesetManager = new TilesetManager();
        const sprites = tilesetManager.loadSpritesForRoom(mapDefinition);

        // Find layers by name (like Alessandro project does)
        const bottomLayer = mapDefinition.layers.find(
            (l) => l.name === "Bottom" && l.type === "tilelayer"
        );
        const collisionLayer = mapDefinition.layers.find(
            (l) => l.name === "Collison" && l.type === "tilelayer"
        );
        const topLayer = mapDefinition.layers.find(
            (l) => l.name === "Top" && l.type === "tilelayer"
        );

        this.bottomLayer = bottomLayer ? new Layer(bottomLayer, sprites) : null;
        this.collisionLayer = collisionLayer
            ? new Layer(collisionLayer, sprites)
            : null;
        this.topLayer = topLayer ? new Layer(topLayer, sprites) : null;

        // Store map dimensions for positioning
        this.mapWidth = mapDefinition.width;
        this.mapHeight = mapDefinition.height;

        // Initialize offsets (will be updated by camera)
        this.offsetX = 0;
        this.offsetY = 0;
        
        // Camera zoom/scale - increase to make everything bigger
        this.scale = 2.0;  // 2x zoom - shows less map, bigger character

        // Player will be added later when entity is created
        this.player = null;
    }

    update(dt) {
        if (this.player) {
            this.player.update(dt);
            
            // Update camera to follow player (center player on screen)
            this.updateCamera();
        }
    }

    /**
     * Update camera position to keep player centered on screen
     */
    updateCamera() {
        if (!this.player) return;

        // Use the actual canvas internal resolution
        const canvasWidth = context.canvas.width;
        const canvasHeight = context.canvas.height;

        // Account for scale when centering player
        const scaledPlayerWidth = this.player.dimensions.x * this.scale;
        const scaledPlayerHeight = this.player.dimensions.y * this.scale;
        
        // Calculate where the player should be on screen (center)
        const targetX = (canvasWidth / 2 - scaledPlayerWidth / 2) / this.scale;
        const targetY = (canvasHeight / 2 - scaledPlayerHeight / 2) / this.scale;

        // Calculate map offset to center player (in unscaled coordinates)
        this.offsetX = (targetX - this.player.canvasPosition.x) * this.scale;
        this.offsetY = (targetY - this.player.canvasPosition.y) * this.scale;

        // Clamp camera so we don't see beyond map edges
        const mapWidthPixels = this.mapWidth * Tile.SIZE * this.scale;
        const mapHeightPixels = this.mapHeight * Tile.SIZE * this.scale;

        // If map is smaller than canvas, center it (don't scroll)
        if (mapWidthPixels < canvasWidth) {
            this.offsetX = (canvasWidth - mapWidthPixels) / 2;
        } else {
            // Clamp to map boundaries
            this.offsetX = Math.min(0, this.offsetX);
            this.offsetX = Math.max(canvasWidth - mapWidthPixels, this.offsetX);
        }

        if (mapHeightPixels < canvasHeight) {
            this.offsetY = (canvasHeight - mapHeightPixels) / 2;
        } else {
            // Clamp to map boundaries
            this.offsetY = Math.min(0, this.offsetY);
            this.offsetY = Math.max(canvasHeight - mapHeightPixels, this.offsetY);
        }
    }

    render() {
        // Clear the entire canvas first to prevent duplication/ghosting
        context.save();
        context.fillStyle = "#000000";
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.restore();

        // Apply camera transform (offset + scale)
        context.save();
        context.translate(this.offsetX, this.offsetY);
        context.scale(this.scale, this.scale);  // Apply zoom

        if (this.bottomLayer) {
            this.bottomLayer.render();
        }

        if (this.collisionLayer) {
            this.collisionLayer.render();
        }

        if (this.player) {
            this.player.render();
        }

        if (this.topLayer) {
            this.topLayer.render();
        }

        context.restore();

        if (DEBUG) {
            Map.renderGrid();
        }
    }

    /**
     * Draws a grid of squares on the screen to help with debugging.
     */
    static renderGrid() {
        context.save();
        context.strokeStyle = Colour.White;

        for (let y = 1; y < CANVAS_HEIGHT / Tile.SIZE; y++) {
            context.beginPath();
            context.moveTo(0, y * Tile.SIZE);
            context.lineTo(CANVAS_WIDTH, y * Tile.SIZE);
            context.closePath();
            context.stroke();

            for (let x = 1; x < CANVAS_WIDTH / Tile.SIZE; x++) {
                context.beginPath();
                context.moveTo(x * Tile.SIZE, 0);
                context.lineTo(x * Tile.SIZE, CANVAS_HEIGHT);
                context.closePath();
                context.stroke();
            }
        }

        context.restore();
    }

    /**
     * Check for collision at a specific pixel position
     * @param {number} x - X position in pixels
     * @param {number} y - Y position in pixels
     * @returns {boolean} - True if there's a collision tile at this position
     */
    checkCollisionAtPixel(x, y) {
        if (!this.collisionLayer) {
            return false;
        }

        // Convert pixel position to tile coordinates
        const tileX = Math.floor((x - this.offsetX) / Tile.SIZE);
        const tileY = Math.floor((y - this.offsetY) / Tile.SIZE);

        // Check if coordinates are within bounds
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
            return true; // Treat out of bounds as collision
        }

        // Get the tile at this position
        const tile = this.collisionLayer.getTile(tileX, tileY);
        
        // If there's a tile here, it's a collision
        return tile !== null;
    }
}