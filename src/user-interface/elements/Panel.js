import UserInterfaceElement from '../UserInterfaceElement.js';
import Colour from '../../enums/Colour.js';
import { roundedRectangle } from '../../../lib/Drawing.js';
import { context } from '../../globals.js';

export default class Panel extends UserInterfaceElement {
    static DEFAULT_PADDING = 20;
    static BORDER_WIDTH = 10;

    /**
     * A UI element that is simply a rectangle that
     * other UI elements are placed on top of.
     *
     * @param {number} x - X position in tiles
     * @param {number} y - Y position in tiles
     * @param {number} width - Width in tiles
     * @param {number} height - Height in tiles
     * @param {object} options - Options for styling
     */
    constructor(x, y, width, height, options = {}) {
        super(x, y, width, height);

        this.borderColour = options.borderColour ?? Colour.Grey;
        this.panelColour = options.panelColour ?? Colour.Black;
        this.padding = options.padding ?? Panel.DEFAULT_PADDING;
        this.isVisible = options.isVisible ?? true;
    }

    render() {
        if (!this.isVisible) {
            return;
        }

        context.save();
        this.renderBackground();
        this.renderForeground();
        context.restore();
    }

    renderBackground() {
        context.fillStyle = this.borderColour;
        roundedRectangle(
            context,
            this.position.x,
            this.position.y,
            this.dimensions.x,
            this.dimensions.y,
            Panel.BORDER_WIDTH,
            true,
            false
        );
    }

    renderForeground() {
        context.fillStyle = this.panelColour;
        roundedRectangle(
            context,
            this.position.x + Panel.BORDER_WIDTH / 2,
            this.position.y + Panel.BORDER_WIDTH / 2,
            this.dimensions.x - Panel.BORDER_WIDTH,
            this.dimensions.y - Panel.BORDER_WIDTH,
            Panel.BORDER_WIDTH,
            true,
            false
        );
    }

    toggle() {
        this.isVisible = !this.isVisible;
    }
}
