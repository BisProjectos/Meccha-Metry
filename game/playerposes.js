// game/playerposes.js
// Handles right-click pose wheel and applying body postures to the player.

const PlayerPoses = {
    currentPose: 'stand',
    isWheelOpen: false,

    init() {
        // Right-click to open pose wheel
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent browser default right-click menu
            if (this.canPose()) {
                this.toggleWheel(true);
            }
        });

        // Left-click to close pose wheel (if clicking outside the wheel)
        document.addEventListener('click', (e) => {
            if (this.isWheelOpen && !e.target.closest('#pose-wheel')) {
                this.toggleWheel(false);
            }
        });
    },

    // Don't allow posing if in paint mode or spectating
    canPose() {
        if (!Game.localPlayer) return false;
        if (Controls.isPaintMode) return false;
        if (window.GameMode && GameMode.myRole === 'spectator') return false;
        return true;
    },

    toggleWheel(show) {
        this.isWheelOpen = show;
        UI.showPoseWheel(show);
    },

    setPose(pose) {
        this.currentPose = pose;
        this.toggleWheel(false); // Close wheel after selecting

        const parts = Game.localPlayer.parts;
        const root = Game.localPlayer.group;

        // Reset everything to 0 first
        root.rotation.set(0, 0, 0);
        parts.torso.rotation.set(0, 0, 0);
        parts.head.rotation.set(0, 0, 0);
        parts.leftArmPivot.rotation.set(0, 0, 0);
        parts.rightArmPivot.rotation.set(0, 0, 0);
        parts.leftLegPivot.rotation.set(0, 0, 0);
        parts.rightLegPivot.rotation.set(0, 0, 0);

        if (pose === 'stand') {
            Game.state.isPosing = false;
        } 
        else if (pose === 'sit') {
            Game.state.isPosing = true;
            // Rotate hips forward like sitting in a chair
            parts.leftLegPivot.rotation.x = -1.4; // ~ -80 degrees
            parts.rightLegPivot.rotation.x = -1.4;
            // Lean torso forward slightly
            parts.torso.rotation.x = 0.2;
            // Bring arms forward to rest on lap
            parts.leftArmPivot.rotation.x = -0.8;
            parts.rightArmPivot.rotation.x = -0.8;
        } 
        else if (pose === 'lie') {
            Game.state.isPosing = true;
            // Rotate entire body 90 degrees backwards to lie on back
            root.rotation.x = -Math.PI / 2;
            // Splay arms and legs outward slightly
            parts.leftArmPivot.rotation.z = 0.4;
            parts.rightArmPivot.rotation.z = -0.4;
            parts.leftLegPivot.rotation.z = 0.2;
            parts.rightLegPivot.rotation.z = -0.2;
        }
    }
};

// Initialize when page loads
window.onload = () => PlayerPoses.init();
