// Game/controls.js
const Controls = {
    player: null,
    camera: null,
    isPaintMode: false,
    keys: {},
    paintAngle: 0,
    paintDistance: 5,

    init(player, camera) {
        this.player = player;
        this.camera = camera;
        this.camera.position.set(0, 3, 5);

        document.addEventListener('keydown', (e) => this.handleKey(e, true));
        document.addEventListener('keyup', (e) => this.handleKey(e, false));
    },

    handleKey(e, isDown) {
        this.keys[e.code] = isDown;
        
        // Toggle Paint Mode
        if (e.code === 'KeyF' && isDown) {
            this.togglePaintMode();
        }
    },

    togglePaintMode() {
        // Don't allow painting if spectating
        if (GameMode.myRole === 'spectator') return;

        this.isPaintMode = !this.isPaintMode;
        document.getElementById('paint-tools').classList.toggle('active', this.isPaintMode);
        
        if (this.isPaintMode) {
            document.getElementById('role-indicator').innerText = "PAINT MODE (DECOR)";
            this.paintAngle = 0; // Reset orbit angle
        } else {
            document.getElementById('role-indicator').innerText = `YOU ARE A ${GameMode.myRole.toUpperCase()}`;
        }
    },

    update(delta) {
        if (this.isPaintMode) {
            this.updatePaintCamera();
        } else {
            this.updateMovement(delta);
        }
    },

    updateMovement(delta) {
        const speed = 5 * delta;
        let moveX = 0, moveZ = 0;

        if (this.keys['KeyW']) moveZ -= speed;
        if (this.keys['KeyS']) moveZ += speed;
        if (this.keys['KeyA']) moveX -= speed;
        if (this.keys['KeyD']) moveX += speed;

        this.player.position.x += moveX;
        this.player.position.z += moveZ;

        // Simple camera follow
        const targetCamPos = new THREE.Vector3(
            this.player.position.x,
            this.player.position.y + 4,
            this.player.position.z + 6
        );
        this.camera.position.lerp(targetCamPos, 0.1);
        this.camera.lookAt(this.player.position);
    },

    updatePaintCamera() {
        // Rotate camera around player with Arrow Keys
        if (this.keys['ArrowLeft']) this.paintAngle -= 0.05;
        if (this.keys['ArrowRight']) this.paintAngle += 0.05;
        if (this.keys['ArrowUp']) this.paintDistance = Math.max(2, this.paintDistance - 0.1);
        if (this.keys['ArrowDown']) this.paintDistance = Math.min(10, this.paintDistance + 0.1);

        // Calculate desired camera position
        const desiredPos = new THREE.Vector3(
            this.player.position.x + Math.sin(this.paintAngle) * this.paintDistance,
            this.player.position.y + 2,
            this.player.position.z + Math.cos(this.paintAngle) * this.paintDistance
        );

        // Camera Collision (Raycast from player to desired camera position)
        const dir = desiredPos.clone().sub(this.player.position);
        const raycaster = new THREE.Raycaster(this.player.position, dir.normalize(), 0, this.paintDistance);
        
        // Only check collisions against the map objects, not the player
        const collidables = [...Maps.intermissionObjects, ...MapSelector.currentMapObjects];
        const intersects = raycaster.intersectObjects(collidables, true);
        
        let actualDistance = this.paintDistance;
        if (intersects.length > 0) {
            // If a wall is between player and camera, stop camera before the wall
            actualDistance = intersects[0].distance - 0.2; 
        }

        this.camera.position.set(
            this.player.position.x + Math.sin(this.paintAngle) * actualDistance,
            this.player.position.y + 2,
            this.player.position.z + Math.cos(this.paintAngle) * actualDistance
        );
        this.camera.lookAt(this.player.position);
    }
};
