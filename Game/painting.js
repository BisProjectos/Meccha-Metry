// Game/painting.js
const Painting = {
    currentTool: 'brush',
    currentColor: '#ff4a4a',
    brushSize: 4,
    isMouseDown: false,

    setTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.paint-btn').forEach(btn => btn.classList.remove('active'));
        // event is passed by the onclick in HTML
        if (event && event.target) event.target.classList.add('active'); 
    },

    setColor(color) { 
        this.currentColor = color; 
    },
    
    setBrushSize(size) { 
        this.brushSize = parseInt(size); 
    },

    update() {
        if (!Controls.isPaintMode) return;

        // Apply paint while mouse is held down (for brush)
        if (this.isMouseDown) {
            this.applyPaint();
        }
    },

    applyPaint() {
        // Raycast from the center of the screen (or mouse position) to the player model
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(0, 0); // Center of screen for simplicity
        
        // If you want to click exactly where the mouse is, uncomment below:
        // mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        // mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, Controls.camera);
        const intersects = raycaster.intersectObject(Game.playerModel, false);

        if (intersects.length > 0) {
            // We hit our player model
            if (this.currentTool === 'brush' || this.currentTool === 'fill') {
                // For now, changing the whole block color. 
                // Later, this will use a 32x32 canvas texture to paint specific pixels!
                Game.playerModel.material.color.set(this.currentColor);
            } 
            else if (this.currentTool === 'eyedropper') {
                // Grab the current color of the block
                const hexColor = '#' + Game.playerModel.material.color.getHexString();
                document.getElementById('paint-color').value = hexColor;
                this.currentColor = hexColor;
            }
        }
    }
};

// Mouse listeners for painting
document.addEventListener('mousedown', () => { 
    if(Controls.isPaintMode) Painting.isMouseDown = true; 
});
document.addEventListener('mouseup', () => { 
    Painting.isMouseDown = false; 
});
