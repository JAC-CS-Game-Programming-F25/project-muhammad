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

    // Initialize offsets (will be updated by camera)
    this.offsetX = 0;
    this.offsetY = 0;

    // ZOOM LEVEL - Change this number to zoom in/out
    this.zoom = 2; // 2 = double size, 1.5 = 50% bigger, 3 = triple size

    // Store context reference for player rendering
    this.context = context;

    // Player will be added later when entity is created
    this.player = null;
  }

  update(dt) {
    if (this.player) {
      this.player.update(dt);

      // Update camera to follow player (keep player centered)
      this.updateCamera();
    }
  }

  updateCamera() {
    if (!this.player) return;

    // Get canvas dimensions
    const canvasWidth = context.canvas.width;
    const canvasHeight = context.canvas.height;

    // Player's fixed screen position (always center of screen)
    const playerScreenX = canvasWidth / 2;
    const playerScreenY = canvasHeight / 2;

    // Calculate map offset to center player's map position on screen
    // The map moves opposite to the player's map position
    this.offsetX = playerScreenX - this.player.mapPosition.x * this.zoom;
    this.offsetY = playerScreenY - this.player.mapPosition.y * this.zoom;

    // Store player's screen position (this never changes - always centered)
    this.player.canvasPosition.x = playerScreenX;
    this.player.canvasPosition.y = playerScreenY;
  }

  render() {
    // Clear the entire canvas first
    context.save();
    context.fillStyle = Colour.CanvasBlack;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.restore();

    // Apply ZOOM and camera transform
    context.save();
    context.scale(this.zoom, this.zoom);
    context.translate(this.offsetX / this.zoom, this.offsetY / this.zoom);

    // Render visible tiles (bottom and collision layers only)
    if (this.player) {
      this.renderBottomAndCollisionLayers();
    } else {
      // Fallback: render everything if no player
      if (this.bottomLayer) this.bottomLayer.render();
      if (this.collisionLayer) this.collisionLayer.render();
    }

    // Render sign before player (so player appears on top)
    if (this.player && this.player.sign) {
      this.player.sign.render();
    }

    // Render player at their map position
    if (this.player) {
      const renderX = Math.floor(this.player.mapPosition.x);
      const renderY = Math.floor(
        this.player.mapPosition.y - this.player.dimensions.y / 2
      );
      this.player.sprites[this.player.currentFrame].render(renderX, renderY);
      
      // Render speech bubble above player
      if (this.player.speechBubble) {
        this.player.speechBubble.render();
      }
      
      // Render particles from player's current state
      if (this.player.stateMachine && this.player.stateMachine.currentState) {
        this.player.stateMachine.currentState.render();
      }
    }

    // Render top layer AFTER player (so top layer appears on top)
    if (this.player) {
      this.renderTopLayer();
    } else {
      // Fallback: render top layer if no player
      if (this.topLayer) this.topLayer.render();
    }

    context.restore();

    if (DEBUG) {
      Map.renderGrid();
    }
  }

  /**
   * Render only the bottom and collision layers visible around the player (viewport culling)
   */
  renderBottomAndCollisionLayers() {
    const canvasWidth = context.canvas.width;
    const canvasHeight = context.canvas.height;

    // Player position in tiles (using mapPosition, not screen position)
    const playerTileX = Math.floor(this.player.mapPosition.x / Tile.SIZE);
    const playerTileY = Math.floor(this.player.mapPosition.y / Tile.SIZE);

    // Calculate visible radius in tiles (adjusted for zoom)
    const visibleRadiusX =
      Math.ceil(canvasWidth / Tile.SIZE / this.zoom / 2) + 2;
    const visibleRadiusY =
      Math.ceil(canvasHeight / Tile.SIZE / this.zoom / 2) + 2;

    // Calculate tile range to render
    const startX = Math.max(0, playerTileX - visibleRadiusX);
    const endX = Math.min(this.mapWidth - 1, playerTileX + visibleRadiusX);
    const startY = Math.max(0, playerTileY - visibleRadiusY);
    const endY = Math.min(this.mapHeight - 1, playerTileY + visibleRadiusY);

    // Render only visible tiles for bottom and collision layers
    this.renderLayerArea(this.bottomLayer, startX, endX, startY, endY);
    this.renderLayerArea(this.collisionLayer, startX, endX, startY, endY);
  }

  /**
   * Render only the top layer visible around the player (viewport culling)
   */
  renderTopLayer() {
    const canvasWidth = context.canvas.width;
    const canvasHeight = context.canvas.height;

    // Player position in tiles (using mapPosition, not screen position)
    const playerTileX = Math.floor(this.player.mapPosition.x / Tile.SIZE);
    const playerTileY = Math.floor(this.player.mapPosition.y / Tile.SIZE);

    // Calculate visible radius in tiles (adjusted for zoom)
    const visibleRadiusX =
      Math.ceil(canvasWidth / Tile.SIZE / this.zoom / 2) + 2;
    const visibleRadiusY =
      Math.ceil(canvasHeight / Tile.SIZE / this.zoom / 2) + 2;

    // Calculate tile range to render
    const startX = Math.max(0, playerTileX - visibleRadiusX);
    const endX = Math.min(this.mapWidth - 1, playerTileX + visibleRadiusX);
    const startY = Math.max(0, playerTileY - visibleRadiusY);
    const endY = Math.min(this.mapHeight - 1, playerTileY + visibleRadiusY);

    // Render only visible tiles for top layer
    this.renderLayerArea(this.topLayer, startX, endX, startY, endY);
  }

  /**
   * Render a specific area of a layer
   */
  renderLayerArea(layer, startX, endX, startY, endY) {
    if (!layer) return;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tile = layer.getTile(x, y);
        if (tile) {
          tile.render(x, y);
        }
      }
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
   * This now uses mapPosition instead of screen position
   */
  checkCollisionAtPixel(x, y) {
    if (!this.collisionLayer) {
      return false;
    }

    // Convert map pixel position to tile coordinates
    const tileX = Math.floor(x / Tile.SIZE);
    const tileY = Math.floor(y / Tile.SIZE);

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
