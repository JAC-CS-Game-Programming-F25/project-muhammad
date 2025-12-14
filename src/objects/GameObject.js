import Vector from "../../lib/Vector.js";
import Tile from "../services/Tile.js";

/**
 * Base class for non-moving game objects (signs, flags, items, etc.)
 * Things that exist in the world but don't move
 */
export default class GameObject {
    /**
     * @param {object} definition - Object definition with position, dimensions, etc.
     */
    constructor(definition = {}) {
        // Position in map coordinates (pixels)
        this.position = definition.position ?? new Vector();
        
        // Dimensions of the object
        this.dimensions = definition.dimensions ?? new Vector(Tile.SIZE, Tile.SIZE);
        
        // Opacity for rendering (0.0 to 1.0)
        this.opacity = definition.opacity ?? 1.0;
        
        // Whether the object is visible
        this.isVisible = definition.isVisible ?? true;
    }

    /**
     * Update the game object
     * Override in subclasses if needed
     * @param {number} dt - Delta time
     */
    update(dt) {
        // Most game objects don't need updates
    }

    /**
     * Render the game object
     * Override in subclasses
     */
    render() {
        // Override in subclasses
    }
}

