// game/painter.js
// Handles the painting tool logic, mouse raycasting, and UI interactions.

const Painter = {
    currentTool: 'brush',
    currentColor: '#ff0000',
    brushSize: 4,
    isMouseDown: false,
    
    mouse: new THREE.Vector2(),
    raycaster: new THREE.Raycaster(),

    init() {
        // Track mouse movement for raycasting
        document.addEventListener('mousemove', (e) => {
            // Calculate normalized device coordinates (-1 to +1)
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Track mouse clicks
        document.addEventListener('mousedown', (e) => {
            // Only paint on left click, and only if in paint mode
            if (e.button === 0 && Controls.isPaintMode) {
                this.isMouseDown = true;
                this.applyPaint(); // Apply immediately on click for single clicks
            }
        });

        document.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
    },

    // --- UI Setters called from ui.js ---
    setTool(tool, element) {
        this.currentTool = tool;
        // Update active button styling
        document.querySelectorAll('#painter-ui .paint-row .mm-btn').forEach(btn => btn.classList.remove('active'));
        if (element) element.classList.add('active');
    },

    setColor(color) {
        this.currentColor = color;
    },

    setBrushSize(size) {
        this.brushSize = parseInt(size);
    },

    setRoughness(val) {
        PlayerPainting.setRoughness(val);
    },

    setMetallicness(val) {
        PlayerPainting.setMetallicness(val);
    },

    // --- Core Logic ---
    update() {
        // If holding down mouse button in brush mode, paint continuously
        if (this.isMouseDown && this.currentTool === 'brush') {
            this.applyPaint();
        }
    },

    applyPaint() {
        if (!Game.localPlayer || !Game.camera) return;

        // Setup raycaster from camera to mouse position
        this.raycaster.setFromCamera(this.mouse, Game.camera);

        // Get all paintable meshes from the player model
        const meshes = Game.localPlayer.getPaintableMeshes();
        
        // Check for intersections
        const intersects = this.raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const uv = intersection.uv; // The 2D coordinate on the texture

            if (!uv) return;

            if (this.currentTool === 'brush') {
                PlayerPainting.paint(uv, this.currentColor, this.brushSize);
            } 
            else if (this.currentTool === 'fill') {
                PlayerPainting.fill(uv, this.currentColor);
                // Prevent holding mouse down from filling 60 times a second
                this.isMouseDown = false; 
            } 
            else if (this.currentTool === 'eyedropper') {
                const color = PlayerPainting.getColorAt(uv);
                this.currentColor = color;
                
                // Update the UI color picker to the grabbed color
                const colorInput = document.getElementById('paint-color');
                if (colorInput) colorInput.value = color;
                
                this.isMouseDown = false; // Prevent spamming
            }
        }
    }
};

// Initialize on load
window.onload = () => Painter.init();
