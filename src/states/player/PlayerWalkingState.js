import PlayerMovingState from "./PlayerMovingState.js";
import PlayerStateName from "../../enums/PlayerStateName.js";
import Input from "../../../lib/Input.js";
import { input } from "../../globals.js";

export default class PlayerWalkingState extends PlayerMovingState {
    static WALK_ANIMATION_TIME = 0.1;

    constructor(player) {
        super(player, player.speed, PlayerWalkingState.WALK_ANIMATION_TIME);
    }

    shouldChangeState() {
        if (input.isKeyHeld(Input.KEYS.SHIFT) && this.player.canRun()) {
            this.player.changeState(PlayerStateName.Running);
            return true;
        }

        return false;
    }

    onNoInput() {
        this.player.changeState(PlayerStateName.Idling);
    }
}