// Game/gamemode.js
const GameMode = {
    isIntermission: true,
    myRole: 'hider', // 'hider', 'hunter', 'spectator'
    volunteers: [],

    init() {
        this.isIntermission = true;
        document.getElementById('role-indicator').innerText = "INTERMISSION";
        MapSelector.init(); // Initialize textures
    },

    // Called only by Host
    startRound() {
        if (!P2P.isHost) return;

        const players = P2P.players;
        const playerCount = players.length;
        let hunterCount = 1;

        if (playerCount <= 5) hunterCount = 1;
        else if (playerCount <= 10) hunterCount = 2;
        else if (playerCount <= 20) hunterCount = 4;

        // Sort Hunters
        let hunters = [];
        let potentialHiders = [...players];

        this.volunteers.forEach(vol => {
            if (hunters.length < hunterCount) {
                hunters.push(vol);
                potentialHiders = potentialHiders.filter(p => p.id !== vol.id);
            }
        });

        while (hunters.length < hunterCount && potentialHiders.length > 0) {
            const randomIndex = Math.floor(Math.random() * potentialHiders.length);
            hunters.push(potentialHiders.splice(randomIndex, 1)[0]);
        }

        const timeLimit = parseInt(document.getElementById('time-slider').value);

        // Send assignments to everyone
        players.forEach(player => {
            const role = hunters.includes(player) ? 'hunter' : 'hider';
            const payload = { type: 'round_start', role: role, time: timeLimit };
            
            if (player.id === P2P.myPeerId) {
                this.receiveRoundStart(role, timeLimit);
            } else {
                P2P.connections[player.id].send({ type: 'game_data', payload });
            }
        });

        // Host loads the map
        MapSelector.loadRandomMap(Game.scene);
    },

    receiveRoundStart(role, time) {
        this.isIntermission = false;
        this.myRole = role;
        document.getElementById('role-indicator').innerText = `YOU ARE A ${role.toUpperCase()}`;
        document.getElementById('host-settings').classList.remove('active');
        
        // If joiner, we need to tell MapSelector to load a map too.
        // (Note: For perfect sync, host should send the map name. For now, joiner just loads a random one to test)
        if (!P2P.isHost) {
            MapSelector.loadRandomMap(Game.scene);
        }
        
        // Clear intermission map
        Maps.clearIntermissionMap(Game.scene);

        this.startTimer(time);
    },

    startTimer(duration) {
        let timer = duration, minutes, seconds;
        const display = document.getElementById('timer-display');
        const interval = setInterval(() => {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);
            display.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            if (--timer < 0) {
                clearInterval(interval);
                this.endRound();
            }
        }, 1000);
    },

    endRound() {
        this.isIntermission = true;
        document.getElementById('role-indicator').innerText = "INTERMISSION";
        if (P2P.isHost) document.getElementById('host-settings').classList.add('active');
        
        // Clear game map and reload intermission
        MapSelector.clearCurrentMap(Game.scene);
        Maps.loadIntermissionMap(Game.scene);
    }
};
