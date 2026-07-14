// game/gamemode.js
// Manages round flow, timers, and game modes (Casual vs Infection).

const GameMode = {
    isIntermission: true,
    currentMode: 'casual', // Default mode
    timerInterval: null,

    init() {
        this.isIntermission = true;
        UI.updateRole("INTERMISSION");
        UI.updateTimer("00:00");
        
        // Show host menu if local player is host
        if (P2P.isHost) UI.showHostMenu(true);
    },

    // --- Host Only: Triggered by UI button ---
    startRound() {
        if (!P2P.isHost || !this.isIntermission) return;

        // 1. Read settings from UI
        const timeLimit = parseInt(document.getElementById('time-slider').value);
        this.currentMode = 'casual'; // Hardcoded for now, can add UI selector later

        // 2. Tell all clients to start the round
        const payload = { 
            type: 'round_start', 
            time: timeLimit, 
            mode: this.currentMode 
        };

        for (let id in P2P.connections) {
            if (P2P.connections[id] && P2P.connections[id].open) {
                P2P.connections[id].send({ type: 'game_data', payload });
            }
        }

        // 3. Host starts their own round locally
        this.receiveRoundStart(payload);

        // 4. Assign roles (Hunters/Hiders) via rolehandaler.js
        RoleHandaler.assignRoles();
    },

    // --- All Clients: Receive start command ---
    receiveRoundStart(data) {
        this.isIntermission = false;
        this.currentMode = data.mode;
        
        UI.showHostMenu(false);
        
        // Clear the lobby and load the actual game map
        Maps.clearIntermissionMap(Game.scene);
        MapHandaling.loadRandomMap(Game.scene);

        // Start the countdown
        this.startTimer(data.time);
    },

    startTimer(duration) {
        let timer = duration;
        const display = document.getElementById('timer-display');
        
        // Clear any existing timer
        if (this.timerInterval) clearInterval(this.timerInterval);

        // Update immediately
        this.updateTimerText(timer);

        this.timerInterval = setInterval(() => {
            timer--;
            this.updateTimerText(timer);

            if (timer <= 0) {
                clearInterval(this.timerInterval);
                this.endRound();
            }
        }, 1000);
    },

    updateTimerText(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        UI.updateTimer(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    },

    endRound() {
        this.isIntermission = true;
        
        // Reset UI
        UI.updateRole("INTERMISSION");
        UI.updateTimer("00:00");
        if (P2P.isHost) UI.showHostMenu(true);

        // Reset Roles locally
        RoleHandaler.myRole = 'hider';

        // Clear game map and reload lobby
        MapHandaling.clearCurrentMap(Game.scene);
        Maps.loadIntermissionMap(Game.scene);
    },

    // --- Infection Mode Logic Placeholder ---
    // This will be called later when a hunter shoots a hider
    catchHider(peerId) {
        if (!P2P.isHost) return;
        if (this.currentMode !== 'infection') return;

        // Find the caught player and turn them into a hunter
        const payload = { type: 'role_assignment', role: 'hunter' };
        const conn = P2P.connections[peerId];
        if (conn && conn.open) {
            conn.send({ type: 'game_data', payload });
        }

        // Check if all hiders are caught
        const remainingHiders = RoleHandaler.volunteers.length; // Mock check, needs real tracking later
        // If no hiders left, end round
        // this.endRound(); 
    },

    // Router for P2P game data
    handleGameData(payload) {
        if (payload.type === 'round_start') {
            this.receiveRoundStart(payload);
        }
    }
};
