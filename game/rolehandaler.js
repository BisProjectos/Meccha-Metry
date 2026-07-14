// game/rolehandaler.js
// Handles player volunteering, hunter math, and role distribution.

const RoleHandaler = {
    myRole: 'hider', // Default state
    isVolunteering: false,
    volunteers: [], // Array of peer IDs (maintained by host)
    checkInterval: null,

    init() {
        // Start checking if we are in the volunteer zone every 0.5 seconds
        this.checkInterval = setInterval(() => this.updateVolunteerStatus(), 500);
    },

    updateVolunteerStatus() {
        if (!Game.localPlayer || !P2P.peer) return;

        // Only allow volunteering during intermission
        if (window.GameMode && !GameMode.isIntermission) return;

        // Check if local player is inside the red circle
        const inZone = Maps.checkInVolunteerZone(Game.localPlayer.group.position);
        
        // If our status changed (we stepped in or out)
        if (inZone !== this.isVolunteering) {
            this.isVolunteering = inZone;
            
            // Tell the host about our new status
            const payload = { type: 'volunteer_update', id: P2P.myPeerId, isVolunteering: inZone };
            
            if (P2P.isHost) {
                this.handleVolunteerUpdate(payload);
            } else {
                // Send to host
                const hostConn = P2P.connections[P2P.roomCode];
                if (hostConn && hostConn.open) hostConn.send({ type: 'game_data', payload });
            }
        }
    },

    // --- Host Only Functions ---
    handleVolunteerUpdate(data) {
        if (!P2P.isHost) return;

        const exists = this.volunteers.includes(data.id);
        
        if (data.isVolunteering && !exists) {
            this.volunteers.push(data.id);
        } else if (!data.isVolunteering && exists) {
            this.volunteers = this.volunteers.filter(id => id !== data.id);
        }
    },

    assignRoles() {
        if (!P2P.isHost) return;

        const players = P2P.players;
        const playerCount = players.length;
        let hunterCount = 1;

        // Math logic: 1 for <=5, 2 for <=10, 4 for <=20
        if (playerCount <= 5) hunterCount = 1;
        else if (playerCount <= 10) hunterCount = 2;
        else if (playerCount <= 20) hunterCount = 4;

        let hunters = [];
        let potentialHiders = [...players];

        // 1. Use volunteers first
        this.volunteers.forEach(volId => {
            if (hunters.length < hunterCount) {
                hunters.push(volId);
                potentialHiders = potentialHiders.filter(p => p.id !== volId);
            }
        });

        // 2. If not enough volunteers, randomly sort the rest
        while (hunters.length < hunterCount && potentialHiders.length > 0) {
            const randomIndex = Math.floor(Math.random() * potentialHiders.length);
            hunters.push(potentialHiders.splice(randomIndex, 1)[0].id);
        }

        // 3. Send assignments to everyone
        players.forEach(player => {
            const role = hunters.includes(player.id) ? 'hunter' : 'hider';
            const payload = { type: 'role_assignment', role: role };

            if (player.id === P2P.myPeerId) {
                this.receiveRole(role);
            } else {
                const conn = P2P.connections[player.id];
                if (conn && conn.open) conn.send({ type: 'game_data', payload });
            }
        });

        // Clear volunteers after round starts so it's fresh for next time
        this.volunteers = []; 
    },

    // --- Client Functions ---
    receiveRole(role) {
        this.myRole = role;
        this.isVolunteering = false; // Reset local visual state
        UI.updateRole(`YOU ARE A ${role.toUpperCase()}`);
        console.log(`Assigned role: ${role}`);
    },

    handleGameData(payload) {
        if (payload.type === 'volunteer_update') {
            this.handleVolunteerUpdate(payload);
        } else if (payload.type === 'role_assignment') {
            this.receiveRole(payload.role);
        }
    }
};

// Initialize on load
window.onload = () => RoleHandaler.init();
