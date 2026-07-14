// game/main.js
// Core engine setup, system initialization, and game loop.

const Game = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    localPlayer: null,
    state: {
        isMoving: false,
        isRunning: false,
        isPosing: false // Updated by playerposes.js
    },

    init() {
        // 1. Verify P2P Session
        if (!P2P.loadState()) {
            alert("No game session found. Returning to menu.");
            window.location.href = 'index.html';
            return;
        }

        // 2. Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.Fog(0x1a1a1a, 40, 100);

        // 3. Camera Setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // 4. Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('game-canvas'), 
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 5. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(15, 30, 15);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -40;
        dirLight.shadow.camera.right = 40;
        dirLight.shadow.camera.top = 40;
        dirLight.shadow.camera.bottom = -40;
        this.scene.add(dirLight);

        // 6. Local Player Setup
        this.localPlayer = new PlayerModel();
        this.localPlayer.group.position.y = 0; // Stand on the floor
        this.scene.add(this.localPlayer.group);

        // 7. Initialize Sub-systems (Order matters!)
        UI.init();
        PlayerPainting.init();
        PlayerPainting.applyToModel(this.localPlayer);
        Controls.init();
        ClimbingControls.init();
        Painter.init();
        CameraControls.init();
        MapHandaling.init();
        RoleHandaler.init();
        GameMode.init();

        // 8. Load the Lobby Map
        Maps.loadIntermissionMap(this.scene);

        // 9. Setup P2P Data Router
        P2P.onGameDataReceived = (payload) => {
            // Route to game mode
            if (payload.type === 'round_start') {
                GameMode.handleGameData(payload);
            }
            // Route to role handler
            else if (payload.type === 'volunteer_update' || payload.type === 'role_assignment') {
                RoleHandaler.handleGameData(payload);
            }
        };

        // 10. Reconnect P2P
        if (P2P.isHost) {
            P2P.hostGame();
        } else {
            P2P.joinGame(P2P.roomCode);
        }

        // 11. Clock & Game Loop
        this.clock = new THREE.Clock();
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();

        // Update input and movement
        Controls.update(delta);
        ClimbingControls.update(delta);
        
        // Update camera (must happen after player moves)
        CameraControls.update(delta);
        
        // Update painting raycaster
        Painter.update();

        // Update player animations
        if (this.localPlayer) {
            this.localPlayer.updateAnimation(delta, this.state.isMoving, this.state.isRunning);
        }

        // Render the 3D scene
        this.renderer.render(this.scene, this.camera);
    },

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};

// Global helper to leave the game
function leaveGame() {
    P2P.disconnect();
    window.location.href = 'index.html';
}

// Boot the game when the page loads
window.onload = () => Game.init();
