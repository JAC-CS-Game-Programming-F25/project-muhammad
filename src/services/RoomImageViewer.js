export default class RoomImageViewer {
    /**
     * Manages the 360° panorama viewer using Pannellum
     * @param {string} containerId - DOM element ID
     */
    constructor(containerId) {
        this.containerId = containerId;
        this.viewer = null;
        this.currentImage = null;
        this.rotationAngle = 0;
    }

    /**
     * Initialize viewer with a room image
     * @param {string} imagePath - Path to panorama image
     */
    loadPanorama(imagePath) {
        // Destroy existing viewer if present
        if (this.viewer) {
            this.viewer.destroy();
        }

        // Create new Pannellum viewer with proper aspect ratio
        this.viewer = pannellum.viewer(this.containerId, {
            type: "equirectangular",
            panorama: imagePath,
            autoLoad: true,
            showControls: false,
            mouseZoom: false,
            draggable: true,
            friction: 0.15,
            pitch: 0,
            yaw: 0,
            hfov: 100,
            haov: 360,
            vaov: 180,
            autoRotate: false,
        });

        this.currentImage = imagePath;
    }

    /**
     * Rotate the view
     * @param {number} angle - Rotation angle
     */
    rotate(angle) {
        if (this.viewer) {
            this.rotationAngle = angle;
            this.viewer.setYaw(angle);
        }
    }

    render() {
    }

    /**
     * Change to a different panorama
     */
    changePanorama(imagePath) {
        this.loadPanorama(imagePath);
    }

    /**
     * Get current viewer instance
     */
    getViewer() {
        return this.viewer;
    }

    /**
     * Destroy the viewer
     */
    destroy() {
        if (this.viewer) {
            this.viewer.destroy();
            this.viewer = null;
        }
    }
}
