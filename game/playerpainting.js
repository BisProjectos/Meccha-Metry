// game/playerpainting.js
// Handles the 32x32 texture canvas and applying paint to the player model.

const PlayerPainting = {
    canvas: null,
    ctx: null,
    texture: null,
    material: null,

    init() {
        // 1. Create 32x32 Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 32;
        this.canvas.height = 32;
        this.ctx = this.canvas.getContext('2d');

        // Fill with a default base color (e.g., light gray)
        this.ctx.fillStyle = '#cccccc';
        this.ctx.fillRect(0, 0, 32, 32);

        // 2. Create Three.js Texture from Canvas
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.magFilter = THREE.NearestFilter; // Crisp pixels
        this.texture.minFilter = THREE.NearestFilter;

        // 3. Create Material
        // MeshStandardMaterial allows roughness/metallicness to work later
        this.material = new THREE.MeshStandardMaterial({
            map: this.texture,
            roughness: 0.6,
            metalness: 0.1
        });
    },

    applyToModel(playerModel) {
        if (!this.material) this.init();
        
        // Replace materials on all body parts
        const meshes = playerModel.getPaintableMeshes();
        meshes.forEach(mesh => {
            mesh.material = this.material;
        });
    },

    // Called by painter.js when clicking on the player
    // uv: THREE.Vector2 (from raycaster intersection), color: hex string, size: int
    paint(uv, color, size) {
        // Convert UV (0.0 to 1.0) to 32x32 pixel coordinates
        const x = Math.floor(uv.x * 32);
        const y = Math.floor((1 - uv.y) * 32); // Flip Y for canvas coordinates

        // Calculate brush bounds
        const halfSize = Math.floor(size / 2);
        const startX = Math.max(0, x - halfSize);
        const endX = Math.min(32, x + halfSize + 1);
        const startY = Math.max(0, y - halfSize);
        const endY = Math.min(32, y + halfSize + 1);

        // Draw square on canvas
        this.ctx.fillStyle = color;
        this.ctx.fillRect(startX, startY, endX - startX, endY - startY);

        // Tell Three.js to update the texture
        this.texture.needsUpdate = true;
    },

    // Fill tool - basic version fills the whole canvas for now
    // Later this can be upgraded to a proper flood-fill algorithm
    fill(uv, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, 32, 32);
        this.texture.needsUpdate = true;
    },

    // Eyedropper tool
    getColorAt(uv) {
        const x = Math.floor(uv.x * 32);
        const y = Math.floor((1 - uv.y) * 32);
        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        
        // Convert RGB array to hex string
        const hex = '#' + 
            pixel[0].toString(16).padStart(2, '0') + 
            pixel[1].toString(16).padStart(2, '0') + 
            pixel[2].toString(16).padStart(2, '0');
        return hex;
    },

    // Called by painter.js to update material properties
    setRoughness(val) {
        if (this.material) this.material.roughness = val / 100;
    },

    setMetallicness(val) {
        if (this.material) this.material.metalness = val / 100;
    }
};
