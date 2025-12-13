import Tile from "./Tile.js";

export default class Layer {
    static BOTTOM = 0;
    static COLLISION = 1;
    static OBJECT = 2;
    static TOP = 3;

    constructor(layerDefinition, sprites) {
        this.tiles = Layer.generateTiles(layerDefinition.data, sprites);
        this.width = layerDefinition.width;
        this.height = layerDefinition.height;
    }

    render() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.getTile(x, y)?.render(x, y);
            }
        }
    }

    getTile(x, y) {
        return this.tiles[x + y * this.width];
    }

    static generateTiles(layerData, sprites) {
        const tiles = [];

        layerData.forEach((tileId) => {
            if (tileId === 0) {
                tiles.push(null);
            } else {
                const tile = new Tile(tileId, sprites);
                tiles.push(tile);
            }
        });

        return tiles;
    }
}
