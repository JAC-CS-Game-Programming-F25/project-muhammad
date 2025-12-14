export default class RoomViewerManager {
    constructor() {
        this.ViewerClass = null;
        this.roomViewer = null;
    }

    /**
     * Wait for PhotoSphereViewer library to load
     */
    async waitForPhotoSphereViewer() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(async () => {
                try {
                    const module = await import("@photo-sphere-viewer/core");
                    this.ViewerClass = module.Viewer;
                    clearInterval(checkInterval);
                    resolve();
                } catch (error) {
                    // Still loading
                }
            }, 100);
        });
    }

    /**
     * Load a room into the 360° viewer
     */
    loadRoom(roomName, room, pannellumContainer) {
        if (this.ViewerClass && pannellumContainer) {
            // Destroy existing viewer
            if (this.roomViewer) {
                this.roomViewer.destroy();
                this.roomViewer = null;
            }

            // Create new viewer
            this.roomViewer = new this.ViewerClass({
                container: pannellumContainer,
                panorama: room.imagePath,
                navbar: false,
                defaultZoomLvl: 0,
                minFov: 30,
                maxFov: 90,
                mousewheel: true,
                mousemove: true,
            });
        }
    }

    /**
     * Cleanup viewer
     */
    cleanup() {
        if (this.roomViewer) {
            this.roomViewer.destroy();
            this.roomViewer = null;
        }
    }
}
