# JAC Ghost Hunt

## Description

JAC Ghost Hunt is a horror-themed location guessing game set in John Abbott College. Players view a 360° photograph of a random room on campus and must navigate a 2D top-down map of the building to locate and mark the correct room before being caught by a pursuing ghost. The game combines spatial awareness, campus knowledge, and time pressure into an educational yet thrilling survival experience.

## Gameplay

Players begin the game by selecting **Quick Play** from the title screen. The system randomly selects a building and room and displays a **360° image** of that room on the left side of the screen. On the right side, the player sees a **top-down canvas map** of the entire building, including multiple floors.

The player spawns on **Floor 1**. A timer immediately begins, starting at **60 seconds** for Round 1 and decreasing slightly each round to increase difficulty. Using WASD, the player navigates hallways, rooms, and stairs to travel between floors. The player rotates the 360° room photo to identify visual clues such as windows, wall colors, or classroom objects.

When the player believes they are standing in the correct room on the map, they press **Enter** to plant a flag. Planting a flag requires **two full seconds**, during which the player is vulnerable. If the flag is placed in the correct room, the round ends successfully and the player earns **100 points** before moving to the next round.

If the flag is planted in the wrong room, the timer hits zero during planting, or the player fails to plant before time runs out, a ghost materializes instantly and kills the player. The death animation plays, and the player loses one life before automatically starting the next round.

After all **five rounds** are completed or all three lives are lost the game ends and displays the final score and high scores stored locally on the device.

## Requirements

### Game Initialization

1. The system shall display a title screen on startup.
2. The system shall allow the user to begin the game by selecting “Play.”
3. The system shall randomly select a building and room for the first round.
4. The system shall load a 360° image of the selected room.
5. The system shall load the multi-floor map of the selected building.
6. The system shall spawn the player at a defined starting location on Floor 1.

### Gameplay Loop

7. The system shall start a countdown timer of 60 seconds for Round 1.
8. The system shall decrease the timer amount for each subsequent round.
9. The user shall move their character using WASD.
10. The system shall prevent the player from passing through walls or locked areas.
11. The user shall change floors by moving onto stairs.
12. The user shall rotate the 360° photograph with the mouse.
13. The user shall press Enter to plant a flag.
14. The system shall require a 2-second planting duration to complete the flag action.
15. The system shall check whether the flag was planted in the correct room.
16. The system shall end the round immediately if the planted flag is correct.
17. The system shall award 100 points for a correct answer.
18. The system shall end the round and deduct one life if the flag is incorrect.
19. The system shall end the round and deduct one life if the timer reaches zero.
20. The system shall end the round and deduct one life if the user is killed while planting.
21. The system shall display the score, timer, and lives visually at all times.

### Ghost Logic

22. The ghost shall remain invisible during normal gameplay.
23. The ghost shall appear only when the user fails the round (wrong room or timeout).
24. The ghost shall kill the player instantly when it appears.
25. The system shall play a death animation upon ghost kill.

### Round Management

26. The system shall track the number of completed rounds.
27. The system shall advance automatically to the next round after each round ends.
28. The system shall select a new random room for each round.
29. The system shall end the game after five total rounds.

### Win/Loss Conditions

30. The user shall lose one life upon being killed by the ghost.
31. The user shall start the game with three lives.
32. The system shall end the game when all lives are lost.
33. The system shall display a Game Over screen when the game ends.
34. The system shall display the final score on the Game Over screen.

### Persistence

35. The system shall save the user’s highest scores using LocalStorage.
36. The system shall load saved scores when the game starts.
37. The system shall allow the user to view high scores from the title screen.

### State Diagram

![State Diagram](./assets/images/proposal/StateDiagram.png)


