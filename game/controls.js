// game/controls.js
// Handles WASD movement, running, and the paint mode lock.

const Controls = {
    keys: {},
    isPaintMode: false,

    init() {
        // Listen for key presses
        document.addEventListener('keydown', (e) => this.handleKey(e, true));
        document.addEventListener('keyup', (e) => this.handleKey(e, false));
    },

    handleKey(e, isDown) {
        this.keys[e.code] = isDown;

        // Toggle paint mode on F key press (only on keydown)
        if (e.code === 'KeyF' && isDown) {
            this.togglePaintMode();
        }
    },

    togglePaintMode() {
        // Don't allow painting if spectating
        if (window.GameMode && GameMode.myRole === 'spectator') return;

        this.isPaintMode = !this.isPaintMode;
        UI.showPainterUI(this.isPaintMode);
        
        if (this.isPaintMode) {
            UI.updateRole("PAINT MODE");
            // Force stop movement when entering paint mode
            Game.state.isMoving = false; 
        } else {
            UI.updateRole(GameMode.myRole ? GameMode.myRole.toUpperCase() : "INTERMISSION");
        }
    },

    update(delta) {
        // If in paint mode or posing, do not process movement
        if (this.isPaintMode || Game.state.isPosing) {
            Game.state.isMoving = false;
            return;
        }

        let moveX = 0;
        let moveZ = 0;

        // Check WASD keys
        if (this.keys['KeyW']) moveZ -= 1;
        if (this.keys['KeyS']) moveZ += 1;
        if (this.keys['KeyA']) moveX -= 1;
        if (this.keys['KeyD']) moveX += 1;

        const isMoving = moveX !== 0 || moveZ !== 0;
        const isRunning = this.keys['ShiftLeft'] && isMoving;

        Game.state.isMoving = isMoving;
        Game.state.isRunning = isRunning;

        if (isMoving) {
            // Normalize the movement vector so diagonal isn't faster
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;

            // Base speeds
            const baseSpeed = isRunning ? 7 : 3.5;
            const speed = baseSpeed * delta;

            // Determine movement direction relative to camera YAW
            // (We assume cameracontrols.js will manage the camera, 
            // but we need the camera's Y rotation to move correctly)
            const cameraYaw = Game.camera.rotation.y; 
            // Note: Three.js camera rotation might need PI offset depending on setup.
            // We will adjust this precision once cameracontrols.js is built.
            
            const cos = Math.cos(cameraYaw);
            const sin = Math.sin(cameraYaw);

            // Apply rotation to movement vector
            const forwardX = -moveX * sin - moveZ * cos;
            const forwardZ = -moveX * cos + moveZ * sin;

            // Move the player
            Game.localPlayer.group.position.x += forwardX * speed;
            Game.localPlayer.group.position.z += forwardZ * speed;

            // Rotate player to face movement direction smoothly
            const targetAngle = Math.atan2(forwardX, forwardZ);
            const currentAngle = Game.localPlayer.group.rotation.y;
            
            // Smooth interpolation (Lerp) for rotation
            let diff = targetAngle - currentAngle;
            // Wrap diff to -PI to PI
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            
            Game.localPlayer.group.rotation.y += diff * 0.2; // 0.2 is rotation speed
        }
    }
};

// Initialize controls on load
window.onload = () => Controls.init();
