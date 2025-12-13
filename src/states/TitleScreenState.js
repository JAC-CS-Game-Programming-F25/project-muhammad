import Input from "../../lib/Input.js";
import State from "../../lib/State.js";
import GameStateName from "../enums/GameStateName.js";
import Colour from "../enums/Colour.js";
import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    context,
    input,
    stateMachine,
    timer,
} from "../globals.js";

export default class TitleScreenState extends State {
    constructor() {
        super();
        this.timeElapsed = 0;
    }

    update(dt) {
        timer.update(dt);
        this.timeElapsed += dt;

        if (input.isKeyPressed(Input.KEYS.ENTER)) {
            stateMachine.change(GameStateName.Play);
        }
    }

    render() {
        const pulse = Math.sin(this.timeElapsed * 2) * 0.5 + 0.5;
        const bgRed = Math.floor(10 + pulse * 15);
        context.fillStyle = `rgb(${bgRed}, 0, 0)`;
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const titlePulse = Math.sin(this.timeElapsed * 3) * 0.3 + 0.7;
        const titleRed = Math.floor(200 + titlePulse * 55);
        const titleGreen = Math.floor(0 + titlePulse * 20);
        
        context.font = "100px Anton";
        context.fillStyle = `rgb(${titleRed}, ${titleGreen}, 0)`;
        context.textBaseline = "middle";
        context.textAlign = "center";
        
        context.shadowColor = Colour.HorrorShadow;
        context.shadowBlur = 20;
        context.fillText("JACGUESSR", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
        context.shadowBlur = 0;

        const textFlash = Math.sin(this.timeElapsed * 4) > 0 ? 1 : 0.3;
        const textRed = Math.floor(255 * textFlash);
        const textGreen = Math.floor(100 * textFlash);
        
        context.font = "32px Anton";
        context.fillStyle = `rgb(${textRed}, ${textGreen}, ${textGreen})`;
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.fillText("Press Enter to Play", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
}
