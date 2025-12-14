/**
 * The base UI element that all interface elements should extend.
 */
export default class UserInterfaceElement {
    /**
     * @param {HTMLElement} container - The DOM container element
     */
    constructor(container) {
        this.container = container;
        this.element = null;
    }

    /**
     * Called when the UI element is created.
     * Override in subclasses to set up the element.
     */
    create() {
        // Override in subclasses
    }

    /**
     * Called every frame to update the UI element.
     * @param {number} dt - Delta time
     */
    update(dt) {
        // Override in subclasses
    }

    /**
     * Called every frame to render the UI element.
     */
    render() {
        // Override in subclasses
    }

    /**
     * Called when the UI element should be removed.
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

