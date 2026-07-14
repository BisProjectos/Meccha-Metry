// game/maphandaling.js
// Handles picking and loading game maps, as well as fetching 32x32 textures.

const MapHandaling = {
    currentMapObjects: [],
    textureLoader: new THREE.TextureLoader(),
    textures: {},
    maps: [],

    init() {
        // Preload 32x32 textures. 
        // NOTE: You will need to place actual 32x32 .png files in an /assets folder.
        // If the files are missing, Three.js will just render black, but the code works.
        this.textures.brick = this.loadTexture('/assets/textures/bricks.png');
        this.textures.concrete = this.loadTexture('/assets/textures/concrete.png');
        this.textures.wood = this.loadTexture('/assets/textures/wood.png');

        // Define Map Blueprints
        this.maps = [
            {
                name: "Warehouse",
                floorTexture: this.textures.concrete,
                wallTexture: this.textures.brick,
                obstacleColor: 0x884422
            },
            {
                name: "Sauna",
                floorTexture: this.textures.wood,
                wallTexture: this.textures.wood,
                obstacleColor: 0x6b4423
            }
        ];
    },

    loadTexture(path) {
        const texture = this.textureLoader.load(path);
        // Crisp pixel art style
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    },

    loadRandomMap(scene) {
        this.clearCurrentMap(scene);
        
        const selectedMap = this.maps[Math.floor(Math.random() * this.maps.length)];
        console.log("Loading Map:", selectedMap.name);

        // 1. Floor
        const floorTexture = selectedMap.floorTexture.clone();
        floorTexture.repeat.set(20, 20); // Tile the 32x32 texture
        floorTexture.needsUpdate = true;
        
        const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.8, metalness: 0.2 });
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        this.currentMapObjects.push(floor);

        // 2. Boundary Walls
        const wallTexture = selectedMap.wallTexture.clone();
        wallTexture.repeat.set(15, 5);
        wallTexture.needsUpdate = true;
        const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.7, metalness: 0.1 });
        const wallGeo = new THREE.BoxGeometry(60, 10, 1);

        // North & South
        const wallN = new THREE.Mesh(wallGeo, wallMat); wallN.position.set(0, 5, -30); scene.add(wallN); this.currentMapObjects.push(wallN);
        const wallS = new THREE.Mesh(wallGeo, wallMat); wallS.position.set(0, 5, 30); scene.add(wallS); this.currentMapObjects.push(wallS);

        // East & West
        const wallGeoSide = new THREE.BoxGeometry(1, 10, 60);
        const wallE = new THREE.Mesh(wallGeoSide, wallMat); wallE.position.set(30, 5, 0); scene.add(wallE); this.currentMapObjects.push(wallE);
        const wallW = new THREE.Mesh(wallGeoSide, wallMat); wallW.position.set(-30, 5, 0); scene.add(wallW); this.currentMapObjects.push(wallW);

        // 3. Structured Obstacles (Crates/Pillars for hiders to blend against)
        const obstacleMat = new THREE.MeshStandardMaterial({ map: selectedMap.wallTexture, roughness: 0.9, metalness: 0.0 });
        const obstacleGeo = new THREE.BoxGeometry(2, 2, 2);

        // Create symmetrical clusters instead of completely random scatter
        const clusterPositions = [
            [-15, -15], [15, -15], [-15, 15], [15, 15], // Corners
            [0, 0] // Center
        ];

        clusterPositions.forEach(pos => {
            // Build a small stack of blocks at each position
            for (let i = 0; i < 3; i++) {
                const block = new THREE.Mesh(obstacleGeo, obstacleMat);
                // Offset slightly so they don't perfectly overlap, creating a cluster
                block.position.set(
                    pos[0] + (Math.random() - 0.5) * 2, 
                    1 + (i * 2), // Stack them upwards
                    pos[1] + (Math.random() - 0.5) * 2
                );
                block.castShadow = true;
                block.receiveShadow = true;
                scene.add(block);
                this.currentMapObjects.push(block);
            }
        });
    },

    clearCurrentMap(scene) {
        this.currentMapObjects.forEach(obj => {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                // Dispose textures safely
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
        });
        this.currentMapObjects = [];
    }
};
