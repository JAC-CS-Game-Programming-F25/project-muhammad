import Sprite from "../../lib/Sprite.js";
import Tile from "./Tile.js";
import { images } from "../globals.js";

export default class TilesetManager {
    /**
     * Manages loading and organizing sprites from multiple tilesets
     * based on Tiled's tileset configuration
     */
    constructor() {
        this.tilesetMapping = this.createTilesetMapping();
    }

    /**
     * Map Tiled tileset file names to loaded image names
     */
    createTilesetMapping() {
        return {
            "sidewall.tsj": "sidewall",
            "Room_Builder.tsj": "room-builder",
            "Interiors.tsj": "tiles", 
        };
    }

    /**
     * Load all sprites from tilesets defined in the room JSON
     * @param {object} roomDefinition - The Tiled JSON data
     * @returns {array|Proxy} Array or Proxy of sprites indexed by global tile ID
     */
    loadSpritesForRoom(roomDefinition) {
        // Find the maximum tile ID used in this room to size our array
        const maxTileId = this.getMaxTileId(roomDefinition);

        // If maxTileId is reasonable, use array
        // Otherwise use Map-based approach for large tile IDs
        if (maxTileId < 100000) {
            const allSprites = new Array(maxTileId + 1).fill(null);

            // Process each tileset
            roomDefinition.tilesets.forEach((tilesetRef) => {
                try {
                    const sprites = this.loadTilesetSprites(tilesetRef);
                    const firstGid = tilesetRef.firstgid;

                    console.log(
                        `[TilesetManager] Loading tileset with firstgid: ${firstGid}, sprite count: ${sprites.length}`
                    );

                    // Place sprites at the correct indices based on firstgid
                    sprites.forEach((sprite, index) => {
                        const globalId = firstGid + index;
                        if (globalId < allSprites.length) {
                            allSprites[globalId] = sprite;
                        }
                    });
                } catch (error) {
                    // Skip tilesets that aren't mapped (e.g., removed tilesets)
                    console.warn(
                        `[TilesetManager] Skipping tileset: ${tilesetRef.source}`,
                        error.message
                    );
                }
            });

            // Debug: Log sprite array info
            console.log(
                `[TilesetManager] Created sprite array with ${allSprites.length} slots`
            );
            const filledSlots = allSprites.filter((s) => s !== null).length;
            console.log(
                `[TilesetManager] Filled slots: ${filledSlots}/${allSprites.length}`
            );

            return allSprites;
        } else {
            // Use Map for large tile IDs (memory efficient)
            const spriteMap = new Map();

            // Process each tileset
            roomDefinition.tilesets.forEach((tilesetRef) => {
                try {
                    const sprites = this.loadTilesetSprites(tilesetRef);
                    const firstGid = tilesetRef.firstgid;

                    // Place sprites in the map at the correct global IDs based on firstgid
                    sprites.forEach((sprite, spriteIndex) => {
                        const globalId = firstGid + spriteIndex;
                        spriteMap.set(globalId, sprite);
                    });
                } catch (error) {
                    // Skip tilesets that aren't mapped (e.g., removed tilesets)
                    console.warn(
                        `[TilesetManager] Skipping tileset: ${tilesetRef.source}`,
                        error.message
                    );
                }
            });

            // Create a Proxy that looks like an array but uses the Map internally
            const proxy = new Proxy(
                {},
                {
                    get: (target, prop) => {
                        if (prop === "length") {
                            return spriteMap.size;
                        }
                        if (typeof prop === "string" && /^\d+$/.test(prop)) {
                            return spriteMap.get(parseInt(prop, 10)) || null;
                        }
                        return target[prop];
                    },
                    has: (target, prop) => {
                        if (typeof prop === "string" && /^\d+$/.test(prop)) {
                            return spriteMap.has(parseInt(prop, 10));
                        }
                        return prop in target;
                    },
                    ownKeys: (target) => {
                        const keys = Array.from(spriteMap.keys()).map((k) =>
                            String(k)
                        );
                        keys.push("length");
                        return keys;
                    },
                    getOwnPropertyDescriptor: (target, prop) => {
                        if (typeof prop === "string" && /^\d+$/.test(prop)) {
                            return {
                                enumerable: true,
                                configurable: true,
                                value:
                                    spriteMap.get(parseInt(prop, 10)) || null,
                            };
                        }
                        return Object.getOwnPropertyDescriptor(target, prop);
                    },
                }
            );

            return proxy;
        }
    }

    /**
     * Load sprites for a single tileset
     * @param {object} tilesetRef - Tileset reference from room JSON
     * @returns {array} Array of sprites for this tileset
     */
    loadTilesetSprites(tilesetRef) {
        // Extract the tileset filename from the source path
        // e.g., "../assets/maps/tilesets/museum-entrance-layer-1.tsj" -> "museum-entrance-layer-1.tsj"
        const tilesetFileName = this.extractFileName(tilesetRef.source);

        // Look up the image name from our mapping
        const imageName = this.tilesetMapping[tilesetFileName];

        if (!imageName) {
            throw new Error(
                `No image mapping found for tileset: ${tilesetFileName}`
            );
        }

        // Get the image
        const image = images.get(imageName);

        if (!image) {
            throw new Error(`Image not loaded: ${imageName}`);
        }

        // Generate sprites from the tileset image
        return Sprite.generateSpritesFromSpriteSheet(
            image,
            Tile.SIZE,
            Tile.SIZE
        );
    }

    /**
     * Extract filename from a path
     * @param {string} path - e.g., "../assets/maps/tilesets/file.tsj"
     * @returns {string} - e.g., "file.tsj"
     */
    extractFileName(path) {
        return path.split("/").pop();
    }

    /**
     * Find the highest tile ID used in the room
     * This determines how large our sprite array needs to be
     * @param {object} roomDefinition
     * @returns {number}
     */
    getMaxTileId(roomDefinition) {
        let maxId = 0;

        roomDefinition.layers.forEach((layer) => {
            if (layer.type === "tilelayer" && layer.data) {
                layer.data.forEach((tileId) => {
                    const maskedId = tileId & 0x1fffffff;
                    if (maskedId > maxId) {
                        maxId = maskedId;
                    }   
                });
            }
        });

        return maxId;
    }
}
