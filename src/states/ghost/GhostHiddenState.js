import State from "../../../lib/State.js";

export default class GhostHiddenState extends State {
    constructor(ghost) {
        super();
        this.ghost = ghost;
    }

    enter() {
        // Ghost is invisible in hidden state
        this.ghost.isVisible = false;
    }

    update() {
        // Ghost remains hidden until triggered to materialize
        // Materializing is triggered externally from PlayState
    }

    render() {
        // Don't render when hidden - ghost is invisible
    }
}


