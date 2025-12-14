import Colour from "../enums/Colour.js";

export default class LayoutManager {
    constructor() {
        this.wrapper = null;
        this.pannellumContainer = null;
    }

    /**
     * Setup the split-screen layout (360° viewer + map)
     */
    setupLayout(canvas) {
        const baseWidth = 950;
        const baseHeight = 600;

        const scaleX = window.innerWidth / baseWidth;
        const scaleY = window.innerHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY);

        const imageWidth = Math.floor(baseWidth * 0.6);
        const mapWidth = baseWidth - imageWidth;

        // Create wrapper
        this.wrapper = document.createElement("div");
        this.wrapper.id = "play-state-wrapper";
        this.wrapper.style.position = "fixed";
        this.wrapper.style.left = "50%";
        this.wrapper.style.top = "50%";
        this.wrapper.style.transformOrigin = "center center";
        this.wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
        this.wrapper.style.width = `${baseWidth}px`;
        this.wrapper.style.height = `${baseHeight}px`;
        this.wrapper.style.display = "flex";
        this.wrapper.style.backgroundColor = Colour.BgVeryDark;

        document.body.appendChild(this.wrapper);

        // 360° Image container
        const imageContainer = document.createElement("div");
        imageContainer.style.width = `${imageWidth}px`;
        imageContainer.style.height = `${baseHeight}px`;
        imageContainer.style.position = "relative";

        // 360° viewer
        this.pannellumContainer = document.createElement("div");
        this.pannellumContainer.id = "photo-sphere-viewer";
        this.pannellumContainer.style.width = "100%";
        this.pannellumContainer.style.height = "100%";
        this.pannellumContainer.style.backgroundColor = Colour.BgBlack;

        imageContainer.appendChild(this.pannellumContainer);

        // Map canvas
        canvas.style.width = `${mapWidth}px`;
        canvas.style.height = `${baseHeight}px`;
        canvas.width = mapWidth * 2;
        canvas.height = baseHeight * 2;
        canvas.style.backgroundColor = Colour.BgDarkGray;

        this.wrapper.appendChild(imageContainer);
        this.wrapper.appendChild(canvas);
    }

    /**
     * Cleanup and reset layout
     */
    cleanup(canvas, CANVAS_WIDTH, CANVAS_HEIGHT) {
        if (this.wrapper) {
            // Remove wrapper completely
            this.wrapper.remove();
            this.wrapper = null;

            // Reset canvas
            if (canvas) {
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }

                canvas.width = CANVAS_WIDTH;
                canvas.height = CANVAS_HEIGHT;

                canvas.style.removeProperty("width");
                canvas.style.removeProperty("height");
                canvas.style.removeProperty("position");
                canvas.style.removeProperty("left");
                canvas.style.removeProperty("top");
                canvas.style.removeProperty("transform");
                canvas.style.backgroundColor = Colour.BgVeryDark;

                document.body.appendChild(canvas);
                window.dispatchEvent(new Event("resize"));
            }
        }
    }

    /**
     * Get the pannellum container for 360° viewer
     */
    getPannellumContainer() {
        return this.pannellumContainer;
    }
}
