// game/cameracontrols.js
// Manages chase camera, paint mode orbit camera, and collision detection.

const CameraControls = {
    yaw: 0,            // Left/Right angle
    pitch: 0.3,        // Up/Down angle (slightly looking down)
    distance: 6,       // Zoom distance
    raycaster: new THREE.Raycaster(),

    init() {
        // We will use arrow keys for paint mode rotation
        // Mouse drag for chase mode could be added here later if desired
    },

    update(delta) {
        if (Controls.isPaintMode) {
            this.updatePaintCamera(delta);
        } else {
            this.updateChaseCamera(delta);
        }
    },

    updateChaseCamera(delta) {
        const player = Game.localPlayer.group;
        
        // If the player is moving, smoothly snap the camera yaw to match their rotation
        if (Game.state.isMoving) {
            // player.rotation.y is where they are looking. Camera should be behind them (+ PI)
            const targetYaw = player.rotation.y + Math.PI;
            
            // Smoothly interpolate yaw
            let diff = targetYaw - this.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.yaw += diff * (delta * 5); // 5 is snap speed
        }

        // Calculate desired camera position behind player
        const targetPos = new THREE.Vector3(
            player.position.x + Math.sin(this.yaw) * this.distance,
            player.position.y + 3 + Math.sin(this.pitch) * this.distance, // Hover above
            player.position.z + Math.cos(this.yaw) * this.distance
        );

        // Apply collision detection
        const finalPos = this.checkCollision(player.position, targetPos);

        // Smoothly move camera to final position
        Game.camera.position.lerp(finalPos, 0.1);
        
        // Look at the player's upper torso/head
        const lookTarget = new THREE.Vector3(player.position.x, player.position.y + 1.2, player.position.z);
        Game.camera.lookAt(lookTarget);
    },

    updatePaintCamera(delta) {
        const player = Game.localPlayer.group;

        // Orbit controls using Arrow Keys
        if (Controls.keys['ArrowLeft']) this.yaw -= delta * 2;
        if (Controls.keys['ArrowRight']) this.yaw += delta * 2;
        if (Controls.keys['ArrowUp']) this.distance = Math.max(2, this.distance - delta * 5);
        if (Controls.keys['ArrowDown']) this.distance = Math.min(10, this.distance + delta * 5);

        // Calculate spherical orbit position
        const targetPos = new THREE.Vector3(
            player.position.x + Math.sin(this.yaw) * this.distance,
            player.position.y + 1.5, // Look straight at center
            player.position.z + Math.cos(this.yaw) * this.distance
        );

        // Apply collision detection
        const finalPos = this.checkCollision(player.position, targetPos);

        // In paint mode, move instantly for precision (no lerp)
        Game.camera.position.copy(finalPos);
        Game.camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
    },

    // Prevents camera from phasing through walls
    checkCollision(fromPos, toPos) {
        const dir = new THREE.Vector3().subVectors(toPos, fromPos);
        const dist = dir.length();
        dir.normalize();

        this.raycaster.set(fromPos, dir);
        this.raycaster.far = dist;

        // Gather all collidable objects
        const collidables = [];
        if (window.Maps) collidables.push(...Maps.intermissionObjects);
        if (window.MapHandaling) collidables.push(...MapHandaling.currentMapObjects);

        const intersects = this.raycaster.intersectObjects(collidables, true);

        if (intersects.length > 0) {
            // If a wall is between player and camera, move camera to just in front of the wall
            const hitPoint = intersects[0].point;
            return hitPoint.add(dir.multiplyScalar(-0.2)); // Pull back slightly so it doesn't clip
        }

        return toPos;
    }
};

// Initialize on load
window.onload = () => CameraControls.init();
