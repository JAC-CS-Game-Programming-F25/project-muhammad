import { images, context } from "../globals.js";
import ImageName from "../enums/ImageName.js";
import Sprite from "../../lib/Sprite.js";
import Vector from "../../lib/Vector.js";
import Tile from "../services/Tile.js";
import GameObject from "./GameObject.js";

/**
 * Illuminated sign entity that appears at player's feet when signing.
 * Uses sign.png which is 64x64 pixels (2x2 tiles).
 * Extends GameObject for proper inheritance structure.
 */
export default class Sign extends GameObject {
    constructor(mapPosition) {
        super({
            position: new Vector(mapPosition.x, mapPosition.y),
            dimensions: new Vector(Tile.SIZE * 2, Tile.SIZE * 2),
            opacity: 1.0,
            isVisible: true
        });

        // Get the sign image (64x64 pixels)
        const signImage = images.get(ImageName.Sign);

        // Split the 64x64 sign.png into 4 tiles (2x2 grid of 32x32 tiles)
        // Top row
        const topLeft = new Sprite(signImage, 0, 0, Tile.SIZE, Tile.SIZE);
        const topRight = new Sprite(
            signImage,
            Tile.SIZE,
            0,
            Tile.SIZE,
            Tile.SIZE
        );

        // Bottom row
        const bottomLeft = new Sprite(
            signImage,
            0,
            Tile.SIZE,
            Tile.SIZE,
            Tile.SIZE
        );
        const bottomRight = new Sprite(
            signImage,
            Tile.SIZE,
            Tile.SIZE,
            Tile.SIZE,
            Tile.SIZE
        );

        this.tiles = [topLeft, topRight, bottomLeft, bottomRight];
    }

    /**
     * Render the sign at its position, centered under player's feet
     * Overrides GameObject.render()
     */
    render() {
        if (!this.isVisible) return;

        const renderX = Math.floor(this.position.x - this.dimensions.x / 2) + 15;
        const renderY = Math.floor(this.position.y - this.dimensions.y / 2) + 20;

        // Apply opacity
        context.save();
        context.globalAlpha = this.opacity;

        // Render the 2x2 tile square
        // Top row
        this.tiles[0].render(renderX, renderY); // Top-left
        this.tiles[1].render(renderX + Tile.SIZE, renderY); // Top-right

        // Bottom row
        this.tiles[2].render(renderX, renderY + Tile.SIZE); // Bottom-left
        this.tiles[3].render(renderX + Tile.SIZE, renderY + Tile.SIZE); // Bottom-right

        context.restore();
    }
}


