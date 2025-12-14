import UserInterfaceElement from "./UserInterfaceElement.js";

/**
 * UI Overlay for Silent Hill style interface.
 * Displays timer, stamina, round, and score.
 */
export default class UIOverlay extends UserInterfaceElement {
    constructor(container, playState) {
        super(container);
        this.playState = playState;
    }

    create() {
        // Create the UI overlay element
        this.element = document.createElement("div");
        this.element.id = "ui-overlay";
        this.element.style.position = "absolute";
        this.element.style.top = "20px";
        this.element.style.left = "20px";
        this.element.style.zIndex = "100";
        this.element.style.pointerEvents = "none";

        // Add styles and HTML
        this.element.innerHTML = `
            <style>
                @keyframes grain {
                    0%, 100% { opacity: 0.03; }
                    50% { opacity: 0.06; }
                }
                
                .ui-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    font-family: 'Courier New', monospace;
                    background: rgba(10, 10, 10, 0.85);
                    padding: 15px;
                    border: 1px solid #333;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
                }
                
                .bar-container {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .bar-label {
                    font-size: 10px;
                    color: #c8c8b4;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 0 8px rgba(200, 200, 180, 0.5);
                    font-weight: bold;
                }
                
                .bar-background {
                    width: 200px;
                    height: 16px;
                    background: #000;
                    border: 2px solid #555;
                    position: relative;
                    box-shadow: inset 0 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5);
                    overflow: hidden;
                }
                
                .bar-background::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: repeating-linear-gradient(
                        90deg,
                        rgba(255,255,255,0.02) 0px,
                        transparent 1px,
                        transparent 2px,
                        rgba(255,255,255,0.02) 3px
                    );
                    pointer-events: none;
                }
                
                .bar-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                    position: relative;
                    box-shadow: 0 0 8px rgba(200, 200, 180, 0.2);
                }
                
                .bar-fill.timer {
                    background: linear-gradient(90deg, #c8c8b4 0%, #a8a89a 100%);
                }
                
                .bar-fill.timer.warning {
                    background: linear-gradient(90deg, #8b4a4a 0%, #6b3a3a 100%);
                    animation: pulse 0.5s infinite;
                }
                
                .bar-fill.stamina {
                    background: linear-gradient(90deg, #7a8a8a 0%, #6a7a7a 100%);
                }
                
                .bar-fill.stamina.low {
                    background: linear-gradient(90deg, #9a7a4a 0%, #7a5a3a 100%);
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                
                .info-text {
                    font-size: 14px;
                    color: #c8c8b4;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    text-shadow: 0 0 8px rgba(200, 200, 180, 0.3);
                    display: flex;
                    gap: 20px;
                }
                
                .scanlines {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: repeating-linear-gradient(
                        0deg,
                        rgba(0,0,0,0.1) 0px,
                        transparent 1px,
                        transparent 2px,
                        rgba(0,0,0,0.1) 3px
                    );
                    pointer-events: none;
                    z-index: 1000;
                }
            </style>
            
            <div class="ui-container">
                <div class="bar-container">
                    <div class="bar-label">Timer</div>
                    <div class="bar-background">
                        <div id="timer-bar" class="bar-fill timer" style="width: 100%"></div>
                    </div>
                </div>
                
                <div class="bar-container">
                    <div class="bar-label">Stamina</div>
                    <div class="bar-background">
                        <div id="stamina-bar" class="bar-fill stamina" style="width: 100%"></div>
                    </div>
                </div>
                
                <div class="info-text">
                    <span>R: <span id="round-display">1</span>/5</span>
                    <span>SCORE: <span id="score-display">0</span></span>
                </div>
            </div>
            
            <div class="scanlines"></div>
        `;

        // Append to container
        this.container.appendChild(this.element);
    }

    update(dt) {
        // Update UI elements based on playState
        if (!this.playState || !this.playState.roundManager) return;

        const roundManager = this.playState.roundManager;
        const gameTimer = roundManager.gameTimer;
        const scoreManager = roundManager.scoreManager;

        // Update timer bar
        const timerBar = document.getElementById("timer-bar");
        if (timerBar && gameTimer) {
            const timeRemaining = gameTimer.getTimeRemaining();
            const baseTime = gameTimer.getBaseTime();
            const timerPercent = baseTime > 0 ? (timeRemaining / baseTime) * 100 : 0;
            timerBar.style.width = timerPercent + "%";
            timerBar.className =
                timeRemaining < 10 ? "bar-fill timer warning" : "bar-fill timer";
        }

        // Update stamina bar
        const staminaBar = document.getElementById("stamina-bar");
        if (staminaBar && this.playState.player) {
            const staminaPercent =
                (this.playState.player.stamina / this.playState.player.maxStamina) * 100;
            staminaBar.style.width = staminaPercent + "%";
            staminaBar.className =
                staminaPercent < 30
                    ? "bar-fill stamina low"
                    : "bar-fill stamina";
        }

        // Update round
        const roundDisplay = document.getElementById("round-display");
        if (roundDisplay) {
            roundDisplay.textContent = roundManager.getCurrentRound();
        }

        // Update score
        const scoreDisplay = document.getElementById("score-display");
        if (scoreDisplay) {
            scoreDisplay.textContent = scoreManager.getCurrentScore();
        }
    }

    render() {
        // DOM-based UI doesn't need explicit render call
        // Updates are handled in update() method
    }
}

