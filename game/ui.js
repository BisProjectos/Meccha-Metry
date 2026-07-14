// game/ui.js
// Handles dynamic generation and management of all game UI elements.

const UI = {
    elements: {},

    init() {
        this.injectStyles();
        this.buildHUD();
        this.buildHostMenu();
        this.buildPoseWheel();
        this.buildPainterUI();
    },

    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .mm-panel { background: rgba(20, 20, 20, 0.8); padding: 15px; border-radius: 4px; border: 1px solid #333; color: #e0e0e0; font-family: 'Russo One', sans-serif; }
            .mm-btn { background: #333; color: white; border: 1px solid #555; padding: 8px 12px; cursor: pointer; font-family: 'Russo One', sans-serif; border-radius: 4px; transition: all 0.2s; }
            .mm-btn:hover { background: #444; border-color: #ff4a4a; }
            .mm-btn.active { background: #ff4a4a; border-color: #ff4a4a; }
            .mm-slider { width: 100%; margin-top: 5px; }
            #pose-wheel { background: transparent !important; border: none !important; display: flex; flex-direction: column; gap: 10px; align-items: center; }
            .pose-btn { width: 60px; height: 60px; border-radius: 50%; font-size: 0.8rem; }
            #painter-ui { flex-direction: column; gap: 10px; align-items: center; }
            .paint-row { display: flex; gap: 10px; align-items: center; }
        `;
        document.head.appendChild(style);
    },

    buildHUD() {
        const container = document.getElementById('hud-container');
        container.classList.add('mm-panel');
        container.innerHTML = `
            <div id="role-indicator" style="font-size: 1.5rem; color: #ff4a4a; margin-bottom: 10px;">INTERMISSION</div>
            <div id="timer-display" style="font-size: 1.2rem; margin-bottom: 10px;">00:00</div>
            <button class="mm-btn" onclick="leaveGame()">Leave Game</button>
        `;
        this.elements.role = document.getElementById('role-indicator');
        this.elements.timer = document.getElementById('timer-display');
    },

    buildHostMenu() {
        const container = document.getElementById('host-menu');
        container.classList.add('mm-panel');
        container.innerHTML = `
            <h3 style="margin-bottom: 10px;">Host Settings</h3>
            <label>Round Time: <span id="time-val">120</span>s</label>
            <input type="range" class="mm-slider" id="time-slider" min="100" max="300" step="10" value="120" oninput="UI.updateTimeVal(this.value)">
            <br>
            <button class="mm-btn" style="width: 100%; margin-top: 10px;" onclick="if(window.GameMode) GameMode.startRound()">Start Round</button>
        `;
        this.elements.timeVal = document.getElementById('time-val');
    },

    buildPoseWheel() {
        const container = document.getElementById('pose-wheel');
        container.innerHTML = `
            <button class="mm-btn pose-btn" onclick="if(window.PlayerPoses) PlayerPoses.setPose('stand')">Stand</button>
            <button class="mm-btn pose-btn" onclick="if(window.PlayerPoses) PlayerPoses.setPose('sit')">Sit</button>
            <button class="mm-btn pose-btn" onclick="if(window.PlayerPoses) PlayerPoses.setPose('lie')">Lie</button>
        `;
    },

    buildPainterUI() {
        const container = document.getElementById('painter-ui');
        container.classList.add('mm-panel');
        container.innerHTML = `
            <div class="paint-row">
                <button class="mm-btn active" onclick="if(window.Painter) Painter.setTool('brush', this)">Brush</button>
                <button class="mm-btn" onclick="if(window.Painter) Painter.setTool('fill', this)">Fill</button>
                <button class="mm-btn" onclick="if(window.Painter) Painter.setTool('eyedropper', this)">Eyedropper</button>
            </div>
            <div class="paint-row">
                <input type="color" id="paint-color" value="#ff0000" onchange="if(window.Painter) Painter.setColor(this.value)">
                <input type="range" class="mm-slider" id="brush-size" min="1" max="32" value="4" style="width: 100px;" onchange="if(window.Painter) Painter.setBrushSize(this.value)">
            </div>
            <div class="paint-row" style="flex-direction: column; text-align: left; width: 200px;">
                <label>Roughness: <span id="rough-val">50</span>%</label>
                <input type="range" class="mm-slider" id="rough-slider" min="0" max="100" value="50" onchange="if(window.Painter) Painter.setRoughness(this.value)">
                <label style="margin-top: 5px;">Metallic: <span id="metal-val">10</span>%</label>
                <input type="range" class="mm-slider" id="metal-slider" min="0" max="100" value="10" onchange="if(window.Painter) Painter.setMetallicness(this.value)">
            </div>
            <button class="mm-btn" onclick="if(window.Controls) Controls.togglePaintMode()">Exit (F)</button>
        `;
    },

    // --- Helper Functions ---
    showHostMenu(show) {
        document.getElementById('host-menu').style.display = show ? 'block' : 'none';
    },

    showPainterUI(show) {
        document.getElementById('painter-ui').style.display = show ? 'flex' : 'none';
    },

    showPoseWheel(show) {
        document.getElementById('pose-wheel').style.display = show ? 'flex' : 'none';
    },

    updateRole(text) {
        if (this.elements.role) this.elements.role.innerText = text;
    },

    updateTimer(text) {
        if (this.elements.timer) this.elements.timer.innerText = text;
    },

    updateTimeVal(val) {
        if (this.elements.timeVal) this.elements.timeVal.innerText = val;
    }
};

// Initialize UI as soon as the script loads
window.onload = () => UI.init();
