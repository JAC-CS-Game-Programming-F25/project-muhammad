import Particle from "./Particle.js";

export default class ParticleEmitter {
    constructor() {
        this.particles = [];
    }

    /**
     * Emit a burst of particles
     * @param {number} x - Spawn X position
     * @param {number} y - Spawn Y position
     * @param {object} config - Emission configuration
     */
    emit(x, y, config = {}) {
        const count = config.count ?? 20;
        const colors = config.colors ?? ["#ff6b6b", "#ffd93d", "#6bcf7f"];

        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, {
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: config.speed ?? Math.random() * 150 + 50,
                size: config.size ?? Math.random() * 5 + 2,
                lifetime: config.lifetime ?? Math.random() * 0.5 + 0.5,
                gravity: config.gravity ?? 200,
                friction: config.friction ?? 0.95,
            });

            this.particles.push(particle);
        }
    }

    /**
     * Create running dust particles - small, subtle, gray puffs
     */
    emitRunDust(x, y) {
        this.emit(x, y, {
            count: 3, // Just a few particles
            colors: ["#95a5a6", "#bdc3c7", "#7f8c8d"],
            speed: 40, // Slow speed
            size: 2, // Small size
            lifetime: 0.4, // Quick fade
            gravity: 30, // Low gravity - floats
            friction: 0.92, // Medium friction
        });
    }

    update(dt) {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);

            // Remove dead particles
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(context) {
        this.particles.forEach((particle) => particle.render(context));
    }

    clear() {
        this.particles = [];
    }
}
