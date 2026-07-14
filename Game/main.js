// Game/main.js
const Game = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    playerModel: null, // The local player's block
    otherPlayers: {},  // Store other player models by peerId

    init() {
        // 1. Verify we have a P2P session (prevents direct access to game.html)
        if (!P2P.loadState()) {
            alert("No game session found. Returning to menu.");
            window.location.href = 'index.html';
            return;
        }

        // 2. Setup Three.js Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.Fog(0x1a1a1a, 20, 60);

        // 3. Setup Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // 4. Setup Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 5. Setup Clock for delta time
        this.clock = new THREE.Clock();

        // 6. Setup Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        // Configure shadow bounds so shadows actually render properly
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        this.scene.add(dirLight);

        // 7. Create Local Player Block
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4a4a, roughness: 0.5, metalness: 0.1 });
        this.playerModel = new THREE.Mesh(geo, mat);
        this.playerModel.castShadow = true;
        this.playerModel.position.y = 0.5; // Sit on the floor
        this.scene.add(this.playerModel);

        // 8. Initialize Sub-systems
        Controls.init(this.playerModel, this.camera);
        Maps.loadIntermissionMap(this.scene);
        GameMode.init(); // This also initializes MapSelector

        // 9. Show Host Settings if Host
        if (P2P.isHost) {
            document.getElementById('host-settings').classList.add('active');
        }

        // 10. Setup P2P Callbacks
        P2P.onPlayerListUpdate = (players) => {
            // For now, just log to console. Later, we spawn blocks for other players.
            console.log("Players in lobby:", players.map(p => p.name).join(", "));
        };

        P2P.onGameDataReceived = (payload) => {
            // Handle game state from host (e.g., round starting)
            if (payload.type === 'round_start') {
                GameMode.receiveRoundStart(payload.role, payload.time);
            }
        };

        P2P.onError = (errorType) => {
            if (errorType === 'host-disconnected') {
                alert("Host has disconnected. Returning to menu.");
                leaveGame();
            }
        };

        // 11. Re-establish P2P Connection seamlessly
        if (P2P.isHost) {
            P2P.hostGame();
        } else {
            P2P.joinGame(P2P.roomCode);
        }

        // 12. Start Game Loop
        this.animate();
        window.addEventListener('resize', () => this.onWindowResize(), false);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        
        // Update controls (handles movement or paint camera)
        Controls.update(delta);
        
        // Update painting (handles mouse clicks for painting)
        Painting.update();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    },

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};

// Global function to leave the game, attached to HTML button
function leaveGame() {
    P2P.disconnect();
    window.location.href = 'index.html';
}

// Global function for the host's time slider
function updateTimeVal(val) { 
    document.getElementById('time-val').innerText = val; 
}

// Start the game as soon as the page and scripts load
window.onload = () => Game.init();
