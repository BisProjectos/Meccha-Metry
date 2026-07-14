// server/p2p.js
// Uses PeerJS to handle WebRTC connections directly in the browser.

const P2P = {
    peer: null,
    connections: {}, // Stores active data connections by peerId
    isHost: false,
    myUsername: "",
    roomCode: "",
    myPeerId: null,
    players: [], // {id: peerId, name: username, isHost: boolean}

    // Callbacks for UI updates
    onPlayerListUpdate: null,
    onHostStartGame: null,
    onError: null,

    init(username) {
        this.myUsername = username;
    },

    // --- State Management (for navigating between index.html and game.html) ---
    saveState() {
        sessionStorage.setItem('mm_p2p_state', JSON.stringify({
            myUsername: this.myUsername,
            isHost: this.isHost,
            roomCode: this.roomCode,
            myPeerId: this.myPeerId
        }));
    },

    loadState() {
        const stateStr = sessionStorage.getItem('mm_p2p_state');
        if (stateStr) {
            const data = JSON.parse(stateStr);
            this.myUsername = data.myUsername;
            this.isHost = data.isHost;
            this.roomCode = data.roomCode;
            this.myPeerId = data.myPeerId;
            return true;
        }
        return false;
    },

    clearState() {
        sessionStorage.removeItem('mm_p2p_state');
    },

    // --- Host Logic ---
    hostGame() {
        this.isHost = true;
        if (!this.roomCode) {
            this.roomCode = this.generateRoomCode();
        }

        // Host registers themselves with the room code as their Peer ID
        this.peer = new Peer(this.roomCode, { debug: 2 });

        this.peer.on('open', (id) => {
            this.myPeerId = id;
            this.players = [{ id: id, name: this.myUsername, isHost: true }];
            if (this.onPlayerListUpdate) this.onPlayerListUpdate(this.players);
        });

        this.peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
            if (err.type === 'unavailable-id') {
                // ID is still registering from the previous page transition, retry in 1s
                setTimeout(() => {
                    this.peer.destroy();
                    this.hostGame();
                }, 1000);
            } else {
                if (this.onError) this.onError(err.type);
                console.error("P2P Host Error:", err);
            }
        });
    },

    // --- Join Logic ---
    joinGame(code) {
        this.isHost = false;
        if (code) this.roomCode = code.toUpperCase();
        
        const peerConfig = { debug: 2 };
        // If reconnecting (e.g. on game.html), reuse the same random Peer ID
        if (this.myPeerId) {
            peerConfig.id = this.myPeerId;
        }

        this.peer = new Peer(peerConfig);

        this.peer.on('open', (myId) => {
            this.myPeerId = myId;
            this.connectToHost();
        });

        this.peer.on('error', (err) => {
            if (err.type === 'unavailable-id') {
                // Our random ID is still registering from page transition, retry
                setTimeout(() => {
                    this.peer.destroy();
                    this.joinGame(this.roomCode);
                }, 1000);
            } else {
                if (this.onError) this.onError(err.type);
                console.error("P2P Join Error:", err);
            }
        });
    },

    connectToHost() {
        const conn = this.peer.connect(this.roomCode, { reliable: true });

        conn.on('open', () => {
            this.connections[conn.peer] = conn;
            // Tell the host who we are
            conn.send({ type: 'join', name: this.myUsername, id: this.myPeerId });
        });

        conn.on('data', (data) => {
            this.handleData(data, conn);
        });

        conn.on('close', () => {
            if (this.onError) this.onError('host-disconnected');
        });

        conn.on('error', (err) => {
            if (err.type === 'peer-unavailable') {
                // Host might still be loading game.html, retry connecting in 1s
                setTimeout(() => {
                    this.connectToHost();
                }, 1000);
            } else {
                if (this.onError) this.onError(err.type);
            }
        });
    },

    // --- Connection Handling ---
    setupConnection(conn) {
        this.connections[conn.peer] = conn;
        conn.on('open', () => {
            conn.on('data', (data) => {
                this.handleData(data, conn);
            });
            conn.on('close', () => {
                this.removePlayer(conn.peer);
            });
        });
    },

    handleData(data, conn) {
        if (data.type === 'join' || data.type === 'rejoin') {
            if (this.isHost) {
                // Check if player already exists in list (e.g., they reconnected)
                let existing = this.players.find(p => p.name === data.name);
                if (existing) {
                    existing.id = data.id; // Update their connection ID
                } else {
                    this.players.push({ id: data.id, name: data.name, isHost: false });
                }
                this.broadcastPlayerList();
            }
        } 
        else if (data.type === 'player_list') {
            if (!this.isHost) {
                this.players = data.players;
                if (this.onPlayerListUpdate) this.onPlayerListUpdate(this.players);
            }
        } 
        else if (data.type === 'start_game') {
            if (!this.isHost && this.onHostStartGame) {
                this.onHostStartGame();
            }
        }
    },

    // --- Broadcasting ---
    broadcastPlayerList() {
        if (!this.isHost) return;
        const data = { type: 'player_list', players: this.players };
        for (let id in this.connections) {
            if (this.connections[id] && this.connections[id].open) {
                this.connections[id].send(data);
            }
        }
        if (this.onPlayerListUpdate) this.onPlayerListUpdate(this.players);
    },

    startGame() {
        if (!this.isHost) return;
        const data = { type: 'start_game' };
        for (let id in this.connections) {
            if (this.connections[id] && this.connections[id].open) {
                this.connections[id].send(data);
            }
        }
        if (this.onHostStartGame) this.onHostStartGame();
    },

    removePlayer(peerId) {
        this.players = this.players.filter(p => p.id !== peerId);
        delete this.connections[peerId];
        if (this.isHost) {
            this.broadcastPlayerList();
        }
    },

    disconnect() {
        for (let id in this.connections) {
            if (this.connections[id] && this.connections[id].open) {
                this.connections[id].close();
            }
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.connections = {};
        this.players = [];
        this.isHost = false;
        this.roomCode = "";
        this.myPeerId = null;
        this.clearState();
    },

    generateRoomCode() {
        // No ambiguous chars like O/0, I/1
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
};
