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

        // Find layers by name
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

        // Calculate offsets to position map at center of canvas
        const mapWidthPixels = this.mapWidth * Tile.SIZE;
        const mapHeightPixels = this.mapHeight * Tile.SIZE;

        // Get actual canvas dimensions (may be different from globals if resized)
        const actualCanvasWidth = context.canvas.width;
        const actualCanvasHeight = context.canvas.height;

        // Center horizontally
        this.offsetX = (actualCanvasWidth - mapWidthPixels) / 2;
        // Center vertically
        this.offsetY = (actualCanvasHeight - mapHeightPixels) / 2;

        // Player will be added later when entity is created
        this.player = null;
    }

    update(dt) {
        if (this.player) {
            this.player.update(dt);
        }
    }

    render() {
        // Apply offsets to position map at center
        context.save();
        context.translate(this.offsetX, this.offsetY);

        // Render bottom layer (floor tiles)
        if (this.bottomLayer) {
            this.bottomLayer.render();
        }

        // Render collision layer (walls)
        if (this.collisionLayer) {
            this.collisionLayer.render();
        }

        // Render player
        if (this.player) {
            this.player.render();
        }

        // Render top layer (decorative elements above player)
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
        if (
            tileX < 0 ||
            tileX >= this.mapWidth ||
            tileY < 0 ||
            tileY >= this.mapHeight
        ) {
            return true; // Treat out of bounds as collision
        }

        // Get the tile at this position
        const tile = this.collisionLayer.getTile(tileX, tileY);

        // If there's a tile here, it's a collision
        return tile !== null;
    }
}
