import { context } from "../globals.js";
import Colour from "../enums/Colour.js";

export default class Tile {
    static SIZE = 32;

    // Tiled flip flags
    static FLIPPED_HORIZONTALLY = 0x80000000;
    static FLIPPED_VERTICALLY = 0x40000000;
    static FLIPPED_DIAGONALLY = 0x20000000;

    /**
     * Represents one tile in a Layer and on the screen.
     *
     * @param {number} tileId - The global tile ID from Tiled (may include flip flags)
     * @param {array} sprites - Array of all sprites indexed by tile ID
     */
    constructor(tileId, sprites) {
        this.sprites = sprites;

        // Extract flip flags
        this.flippedHorizontally = (tileId & Tile.FLIPPED_HORIZONTALLY) !== 0;
        this.flippedVertically = (tileId & Tile.FLIPPED_VERTICALLY) !== 0;
        this.flippedDiagonally = (tileId & Tile.FLIPPED_DIAGONALLY) !== 0;

        // Mask out flip flags to get the actual tile ID (keep lower 30 bits)
        this.id = tileId & 0x1fffffff;

        // Debug: Track if we have a sprite
        this.hasSprite =
            this.sprites[this.id] !== null &&
            this.sprites[this.id] !== undefined;

        // Debug: Log missing sprites (only once per unique ID)
        if (!this.hasSprite && !Tile.loggedMissingIds) {
            Tile.loggedMissingIds = new Set();
        }
        if (!this.hasSprite && !Tile.loggedMissingIds.has(this.id)) {
            console.warn(
                `[Tile] Missing sprite for tile ID: ${this.id} (original with flags: ${tileId})`
            );
            Tile.loggedMissingIds.add(this.id);
        }
    }

    render(x, y) {
        const sprite = this.sprites[this.id];
        if (!sprite) {
            // Debug: Show missing tiles as red squares
            if (window.DEBUG_TILES) {
                context.save();
                context.fillStyle = Colour.DebugRed;
                context.fillRect(
                    x * Tile.SIZE,
                    y * Tile.SIZE,
                    Tile.SIZE,
                    Tile.SIZE
                );
                context.restore();
            }
            return;
        }

        const canvasX = x * Tile.SIZE;
        const canvasY = y * Tile.SIZE;

        // If no flips, render normally
        if (
            !this.flippedHorizontally &&
            !this.flippedVertically &&
            !this.flippedDiagonally
        ) {
            sprite.render(canvasX, canvasY);
            return;
        }

        // Apply flips using canvas transformations
        context.save();

        // Translate to the tile position first
        context.translate(canvasX, canvasY);

        // Apply transformations based on Tiled's flip flag logic
        // Tiled applies diagonal flip FIRST, then horizontal/vertical
        if (this.flippedDiagonally) {
            // Diagonal flip = transpose (swap x and y axes)
            // This is done by rotating 90° clockwise and flipping horizontally
            context.translate(Tile.SIZE / 2, Tile.SIZE / 2);
            context.rotate(Math.PI / 2);
            context.scale(-1, 1);
            context.translate(-Tile.SIZE / 2, -Tile.SIZE / 2);
        }

        // Then apply horizontal and vertical flips
        if (this.flippedHorizontally || this.flippedVertically) {
            context.translate(Tile.SIZE / 2, Tile.SIZE / 2);
            context.scale(
                this.flippedHorizontally ? -1 : 1,
                this.flippedVertically ? -1 : 1
            );
            context.translate(-Tile.SIZE / 2, -Tile.SIZE / 2);
        }

        // Draw sprite at origin (transformations have been applied)
        sprite.render(0, 0);

        context.restore();
    }
}

// Static property to track logged IDs
Tile.loggedMissingIds = null;
