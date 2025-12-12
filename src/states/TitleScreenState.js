import Input from "../../lib/Input.js";
import State from "../../lib/State.js";
import GameStateName from "../enums/GameStateName.js";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  context,
  input,
  stateMachine,
  timer,
} from "../globals.js";

const BG_COLOR = "#faf8f3";
const TITLE_COLOR = "#2563eb";
const TEXT_COLOR = "#0f172a";

export default class TitleScreenState extends State {
  constructor() {
    super();
    this.showHowToPlay = false;
  }

  update(dt) {
    timer.update(dt);

    if (input.isKeyPressed(Input.KEYS.ENTER)) {
      stateMachine.change(GameStateName.Play);
    }

    if (input.isKeyPressed(Input.KEYS.H)) {
      this.showHowToPlay = !this.showHowToPlay;
    }
  }

  render() {
    // Background
    context.fillStyle = BG_COLOR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Title
    context.font = "100px Anton";
    context.fillStyle = TITLE_COLOR;
    context.textBaseline = "middle";
    context.textAlign = "center";
    context.fillText("JACGUESSR", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);

    // Options row
    context.font = "32px Anton";
    context.fillStyle = TEXT_COLOR;

    const optionY = CANVAS_HEIGHT / 2 + 20;
    const offsetX = 140;

    context.fillText("Quick Play", CANVAS_WIDTH / 2 - offsetX, optionY);
    context.fillText("How to Play", CANVAS_WIDTH / 2 + offsetX, optionY);

    // Footer hint
    context.font = "20px Anton";
    context.fillStyle = TEXT_COLOR;
    context.fillText(
      "Press Enter to start, H for how-to",
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT - 50
    );

    // How-to overlay (toggle with H)
    if (this.showHowToPlay) {
      this.renderHowToOverlay();
    }
  }

  renderHowToOverlay() {
    const panelWidth = CANVAS_WIDTH * 0.8;
    const panelHeight = 180;
    const x = (CANVAS_WIDTH - panelWidth) / 2;
    const y = CANVAS_HEIGHT / 2 + 80;

    // Panel
    context.fillStyle = "rgba(15, 23, 42, 0.08)";
    context.fillRect(x, y, panelWidth, panelHeight);

    // Text
    context.font = "22px Anton";
    context.fillStyle = TEXT_COLOR;
    context.textAlign = "center";
    context.textBaseline = "middle";

    const lines = [
      "How to Play:",
      "Explore the campus map, match the room, and avoid the ghost.",
      "Enter = Quick Play    H = Toggle this help",
    ];

    const lineSpacing = 32;
    const startY = y + panelHeight / 2 - ((lines.length - 1) * lineSpacing) / 2;

    lines.forEach((line, index) => {
      context.fillText(line, CANVAS_WIDTH / 2, startY + index * lineSpacing);
    });
  }
}
