import Animation from "../../../lib/Animation.js";
import State from "../../../lib/State.js";
import Direction from "../../enums/Direction.js";
import Input from "../../../lib/Input.js";
import { input } from "../../globals.js";
import Tile from "../../services/Tile.js";
import GameEntity from "../../entities/GameEntity.js";

export default class PlayerMovingState extends State {
  constructor(player, speed, animationTime) {
    super();

    this.player = player;
    this.speed = speed;

    // Access collision layer from map
    this.collisionLayer = this.player.map.collisionLayer;

    this.animation = {
      [Direction.Up]: new Animation([6, 7, 8, 9, 10, 11], animationTime),
      [Direction.Down]: new Animation([18, 19, 20, 21, 22, 23], animationTime),
      [Direction.Left]: new Animation([12, 13, 14, 15, 16, 17], animationTime),
      [Direction.Right]: new Animation([0, 1, 2, 3, 4, 5], animationTime),
    };
  }

  enter() {
    this.player.sprites = this.player.walkSprites;
    this.player.currentAnimation = this.animation[this.player.direction];
  }

  update(dt) {
    this.player.currentAnimation = this.animation[this.player.direction];

    if (this.shouldChangeState()) {
      return;
    }

    this.handleMovement(dt);
  }

  shouldChangeState() {
    return false;
  }

  handleMovement(dt) {
    // Store desired velocity (don't reset it)
    let velocityX = 0;
    let velocityY = 0;

    const isMoving =
      input.isKeyHeld(Input.KEYS.W) ||
      input.isKeyHeld(Input.KEYS.A) ||
      input.isKeyHeld(Input.KEYS.S) ||
      input.isKeyHeld(Input.KEYS.D);

    if (!isMoving) {
      this.player.velocity.x = 0;
      this.player.velocity.y = 0;
      this.onNoInput();
      return;
    }

    // Set velocity based on input
    if (input.isKeyHeld(Input.KEYS.W)) {
      velocityY = -this.speed;
      this.player.direction = Direction.Up;
    }
    if (input.isKeyHeld(Input.KEYS.S)) {
      velocityY = this.speed;
      this.player.direction = Direction.Down;
    }
    if (input.isKeyHeld(Input.KEYS.A)) {
      velocityX = -this.speed;
      this.player.direction = Direction.Left;
    }
    if (input.isKeyHeld(Input.KEYS.D)) {
      velocityX = this.speed;
      this.player.direction = Direction.Right;
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      const length = Math.hypot(velocityX, velocityY);
      velocityX = (velocityX / length) * this.speed;
      velocityY = (velocityY / length) * this.speed;
    }

    // Store the velocity for animation/state purposes
    this.player.velocity.x = velocityX;
    this.player.velocity.y = velocityY;

    // Calculate movement amounts
    const moveX = velocityX * dt;
    const moveY = velocityY * dt;

    // Move X axis - check collision and apply if safe
    if (moveX !== 0) {
      const newX = this.player.mapPosition.x + moveX;
      if (!this.willCollide(newX, this.player.mapPosition.y)) {
        this.player.mapPosition.x = newX;
      }
      // Don't set velocity to 0 - just don't move
    }

    // Move Y axis - check collision and apply if safe
    if (moveY !== 0) {
      const newY = this.player.mapPosition.y + moveY;
      if (!this.willCollide(this.player.mapPosition.x, newY)) {
        this.player.mapPosition.y = newY;
      }
      // Don't set velocity to 0 - just don't move
    }
  }

  onNoInput() {
    // Default: do nothing
  }

  /**
   * Check if the player will collide with a wall at the given position
   * Uses mapPosition (world coordinates) directly
   */
  willCollide(x, y) {
    if (!this.collisionLayer) {
      return false;
    }

    // Define hitbox (smaller than sprite for better feel)
    const hitboxOffsetX = 4;
    const hitboxOffsetY = GameEntity.HEIGHT / 4;
    const hitboxWidth = 24;
    const hitboxHeight = 16;

    // Convert map pixel position directly to tile coordinates
    const left = Math.floor((x + hitboxOffsetX) / Tile.SIZE);
    const right = Math.floor((x + hitboxOffsetX + hitboxWidth - 1) / Tile.SIZE);
    const top = Math.floor((y + hitboxOffsetY) / Tile.SIZE);
    const bottom = Math.floor(
      (y + hitboxOffsetY + hitboxHeight - 1) / Tile.SIZE
    );

    // Get map bounds
    const mapWidth = this.collisionLayer.width;
    const mapHeight = this.collisionLayer.height;

    // Treat out of bounds as collision
    if (left < 0 || right >= mapWidth || top < 0 || bottom >= mapHeight) {
      return true;
    }

    // Check if any corner of the hitbox collides with a tile
    const topLeft = this.collisionLayer.getTile(left, top);
    const topRight = this.collisionLayer.getTile(right, top);
    const bottomLeft = this.collisionLayer.getTile(left, bottom);
    const bottomRight = this.collisionLayer.getTile(right, bottom);

    return (
      topLeft !== null ||
      topRight !== null ||
      bottomLeft !== null ||
      bottomRight !== null
    );
  }
}
