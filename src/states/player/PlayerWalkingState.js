import PlayerMovingState from "./PlayerMovingState.js";
import PlayerStateName from "../../enums/PlayerStateName.js";
import SoundName from "../../enums/SoundName.js";
import Input from "../../../lib/Input.js";
import { input, sounds } from "../../globals.js";

export default class PlayerWalkingState extends PlayerMovingState {
  static WALK_ANIMATION_TIME = 0.1;

  constructor(player) {
    super(player, player.speed, PlayerWalkingState.WALK_ANIMATION_TIME);
  }

  enter() {
    super.enter();
    // Play walking breathing sound
    sounds.play(SoundName.WalkingBreathing);
  }

  exit() {
    // Stop walking breathing sound
    sounds.stop(SoundName.WalkingBreathing);
  }

  shouldChangeState() {
    // Check for signing (Enter key)
    if (input.isKeyPressed(Input.KEYS.ENTER)) {
      this.player.changeState(PlayerStateName.Signing);
      return true;
    }

    if (
      input.isKeyHeld(Input.KEYS.SHIFT) &&
      this.player.stamina >= this.player.maxStamina
    ) {
      this.player.changeState(PlayerStateName.Running);
      return true;
    }

    return false;
  }

  onNoInput() {
    this.player.changeState(PlayerStateName.Idling);
  }
}
