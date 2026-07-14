// game/main.js
// Core engine setup and game loop.

const Game = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    localPlayer: null,
    state: {
        isMoving: false,
        isRunning: false
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
        this.scene.fog = new THREE.Fog(0x1a1a1a, 30, 80);

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
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        // 6. Local Player Setup
        this.localPlayer = new PlayerModel();
        this.localPlayer.group.position.y = 0; // Stand on the floor
        this.scene.add(this.localPlayer.group);

        // Static camera position for now (cameracontrols.js will replace this)
        this.camera.position.set(0, 4, 8);
        this.camera.lookAt(0, 1, 0);

        // 7. Clock for delta time
        this.clock = new THREE.Clock();

        // 8. Reconnect P2P
        if (P2P.isHost) {
            P2P.hostGame();
        } else {
            P2P.joinGame(P2P.roomCode);
        }

        // 9. Start Game Loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();

        // Update player animation
        // (For now, isMoving/isRunning are false. controls.js will update Game.state later)
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

// Global helper to leave the game (will be hooked up by ui.js later)
function leaveGame() {
    P2P.disconnect();
    window.location.href = 'index.html';
}

// Boot the game when the page loads
window.onload = () => Game.init();
