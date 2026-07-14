// Game/mapselector.js
const MapSelector = {
    currentMapObjects: [],
    textureLoader: null,
    textures: {},

    init() {
        this.textureLoader = new THREE.TextureLoader();
        // Preload base 32x32 textures (Mock paths for now)
        // In the future, these will point to /assets/textures/bricks.png, etc.
        this.textures.brick = this.loadTexture('https://via.placeholder.com/32/8B4513/FFFFFF?text=Brick');
        this.textures.concrete = this.loadTexture('https://via.placeholder.com/32/A9A9A9/000000?text=Concrete');
        this.textures.wood = this.loadTexture('https://via.placeholder.com/32/DEB887/000000?text=Wood');
    },

    loadTexture(path) {
        const texture = this.textureLoader.load(path);
        texture.magFilter = THREE.NearestFilter; // Keep it pixelated
        texture.minFilter = THREE.NearestFilter;
        return texture;
    },

    loadRandomMap(scene) {
        this.clearCurrentMap(scene);
        
        // Mock list of map layouts. Later, these could be JSON files fetched from /assets/maps/
        const mapLayouts = [
            { name: "Warehouse", wallTexture: this.textures.brick, floorTexture: this.textures.concrete },
            { name: "Sauna", wallTexture: this.textures.wood, floorTexture: this.textures.wood }
        ];

        const selectedMap = mapLayouts[Math.floor(Math.random() * mapLayouts.length)];
        console.log("Loading map:", selectedMap.name);

        // Build Floor
        const floorGeo = new THREE.PlaneGeometry(60, 60);
        const floorMat = new THREE.MeshStandardMaterial({ map: selectedMap.floorTexture, roughness: 0.8 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        this.currentMapObjects.push(floor);

        // Build Walls using 32x32 grid logic
        // Example: A border of walls
        const wallGeo = new THREE.BoxGeometry(2, 4, 2);
        const wallMat = new THREE.MeshStandardMaterial({ map: selectedMap.wallTexture, roughness: 0.6 });

        for (let x = -14; x <= 14; x += 2) {
            // North Wall
            const wallN = new THREE.Mesh(wallGeo, wallMat);
            wallN.position.set(x * 2, 2, -30);
            wallN.castShadow = true;
            wallN.receiveShadow = true;
            scene.add(wallN);
            this.currentMapObjects.push(wallN);

            // South Wall
            const wallS = new THREE.Mesh(wallGeo, wallMat);
            wallS.position.set(x * 2, 2, 30);
            scene.add(wallS);
            this.currentMapObjects.push(wallS);
        }

        // Scatter some random blocks for hiders to blend into
        for (let i = 0; i < 15; i++) {
            const block = new THREE.Mesh(wallGeo, wallMat);
            block.position.set((Math.random() - 0.5) * 50, 2, (Math.random() - 0.5) * 50);
            block.castShadow = true;
            block.receiveShadow = true;
            scene.add(block);
            this.currentMapObjects.push(block);
        }
    },

    clearCurrentMap(scene) {
        this.currentMapObjects.forEach(obj => {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                // Don't dispose shared textures, just the material
                obj.material.dispose(); 
            }
        });
        this.currentMapObjects = [];
    }
};
