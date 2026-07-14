// game/climbingcontrols.js
// Handles sticking to walls/ceilings and detaching with Space.

const ClimbingControls = {
    isClimbing: false,
    surfaceNormal: new THREE.Vector3(0, 0, 1), // Default to facing forward
    raycaster: new THREE.Raycaster(),
    climbSpeed: 4,

    init() {
        // Listen for Spacebar to detach
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isClimbing) {
                this.detach();
            }
        });
    },

    update(delta) {
        // Do not climb if posing, painting, or if game hasn't started
        if (!Game.localPlayer || Controls.isPaintMode || Game.state.isPosing) {
            if (this.isClimbing) this.detach(); // Force detach if entering paint/pose
            return;
        }

        // If already climbing, handle climb movement
        if (this.isClimbing) {
            this.handleClimbMovement(delta);
            return;
        }

        // If not climbing, check if we walked into a climbable surface
        this.checkForClimbable();
    },

    checkForClimbable() {
        const player = Game.localPlayer.group;
        // We cast rays from the player's center in multiple directions to find walls/ceilings
        const origins = [
            { pos: player.position.clone(), dir: new THREE.Vector3(0, 0, 1).applyQuaternion(player.quaternion) }, // Front
            { pos: player.position.clone().add(new THREE.Vector3(0, 0.5, 0)), dir: new THREE.Vector3(0, 1, 0) }, // Above
            { pos: player.position.clone().add(new THREE.Vector3(0, -0.5, 0)), dir: new THREE.Vector3(0, -1, 0) } // Below
        ];

        for (let ray of origins) {
            this.raycaster.set(ray.pos, ray.dir);
            this.raycaster.far = 1.1; // Only detect if very close
            
            // Check against intermission map and game maps
            const collidables = [];
            if (window.Maps) collidables.push(...Maps.intermissionObjects);
            if (window.MapHandaling) collidables.push(...MapHandaling.currentMapObjects);
            
            const intersects = this.raycaster.intersectObjects(collidables, true);

            if (intersects.length > 0) {
                // Hit a surface! Attach to it.
                this.attach(intersects[0]);
                break;
            }
        }
    },

    attach(intersection) {
        this.isClimbing = true;
        this.surfaceNormal = intersection.face.normal.clone(); // The angle of the wall
        
        // Snap player slightly away from the wall to prevent clipping
        const targetPos = intersection.point.clone().add(this.surfaceNormal.clone().multiplyScalar(0.5));
        Game.localPlayer.group.position.copy(targetPos);

        // Make the player face the wall/ceiling
        const lookTarget = intersection.point.clone();
        Game.localPlayer.group.lookAt(lookTarget);
        
        Game.state.isMoving = false; // Stop walk animation
    },

    detach() {
        this.isClimbing = false;
        // Reset player rotation to stand upright (X and Z back to 0)
        Game.localPlayer.group.rotation.set(0, Game.localPlayer.group.rotation.y, 0);
    },

    handleClimbMovement(delta) {
        let moveX = 0; // A/D
        let moveY = 0; // W/S
        
        if (Controls.keys['KeyW']) moveY += 1;
        if (Controls.keys['KeyS']) moveY -= 1;
        if (Controls.keys['KeyA']) moveX -= 1;
        if (Controls.keys['KeyD']) moveX += 1;

        const isMoving = moveX !== 0 || moveY !== 0;
        Game.state.isMoving = isMoving; // Plays walk animation while climbing
        Game.state.isRunning = false;

        if (isMoving) {
            const speed = this.climbSpeed * delta;
            
            // Calculate movement along the wall's surface
            // Up/Down is World Y axis
            // Left/Right is perpendicular to surface normal and World Y
            const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), this.surfaceNormal).normalize();
            
            const moveVec = new THREE.Vector3();
            moveVec.y += moveY * speed; // Climb up/down
            moveVec.add(right.multiplyScalar(moveX * speed)); // Strafe left/right
            
            Game.localPlayer.group.position.add(moveVec);
        }
    }
};

// Initialize on load
window.onload = () => ClimbingControls.init();
