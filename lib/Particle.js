import Vector from "./Vector.js";

export default class Particle {
    /**
     * A single particle with position, velocity, color, and lifetime
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {object} options - Particle configuration
     */
    constructor(x, y, options = {}) {
        this.position = new Vector(x, y);

        // Random velocity for particle spread
        const angle = options.angle ?? Math.random() * Math.PI * 2;
        const speed = options.speed ?? Math.random() * 100 + 50;
        this.velocity = new Vector(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        // Visual properties
        this.color = options.color ?? "#ffffff";
        this.size = options.size ?? Math.random() * 4 + 2;
        this.opacity = options.opacity ?? 1.0;

        // Lifetime
        this.lifetime = options.lifetime ?? 1.0; // seconds
        this.age = 0;

        // Physics
        this.gravity = options.gravity ?? 200; // pixels per second squared
        this.friction = options.friction ?? 0.95; // velocity multiplier
    }

    update(dt) {
        // Apply gravity
        this.velocity.y += this.gravity * dt;

        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // Update position
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        // Age the particle
        this.age += dt;

        // Fade out over lifetime
        this.opacity = Math.max(0, 1 - this.age / this.lifetime);
    }

    render(context) {
        context.save();
        context.globalAlpha = this.opacity;
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(
            this.position.x,
            this.position.y,
            this.size,
            0,
            Math.PI * 2
        );
        context.fill();
        context.restore();
    }

    isDead() {
        return this.age >= this.lifetime;
    }
}
