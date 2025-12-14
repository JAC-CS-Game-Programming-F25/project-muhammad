import Vector from "../../lib/Vector.js";
import Tile from "../services/Tile.js";
import FontName from "../enums/FontName.js";

/**
 * The base UI element that all interface elements should extend.
 * Uses tile-based positioning.
 */
export default class UserInterfaceElement {
    static FONT_SIZE = Tile.SIZE * 0.65;
    static FONT_FAMILY = FontName.CourierNew;

    /**
     * @param {number} x - X position in tiles
     * @param {number} y - Y position in tiles
     * @param {number} width - Width in tiles
     * @param {number} height - Height in tiles
     */
    constructor(x, y, width, height) {
        this.position = new Vector(x * Tile.SIZE, y * Tile.SIZE);
        this.dimensions = new Vector(width * Tile.SIZE, height * Tile.SIZE);
    }

    /**
     * Called every frame to update the UI element.
     * @param {number} dt - Delta time
     */
    update(dt) {
        // Override in subclasses
    }

    /**
     * Called every frame to render the UI element.
     */
    render() {
        // Override in subclasses
    }

    /**
     * Called when the UI element should be removed.
     */
    destroy() {
        // Override in subclasses if needed
    }
}

