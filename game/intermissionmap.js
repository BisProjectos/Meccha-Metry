// game/intermissionmap.js
// Builds the spacious interior lobby and the hunter volunteer zone.

const Maps = {
    intermissionObjects: [],
    volunteerZoneRadius: 5,
    volunteerZone: null,

    loadIntermissionMap(scene) {
        // Clear any existing map elements first
        this.clearIntermissionMap(scene);

        // Materials
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a35, roughness: 0.8, metalness: 0.2 });
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d3d4d, roughness: 0.9, metalness: 0.1 });
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.7, metalness: 0.3 });

        // 1. Spacious Floor
        const floorGeo = new THREE.PlaneGeometry(60, 60);
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        this.intermissionObjects.push(floor);

        // 2. Enclosing Walls (Interior shell)
        const wallHeight = 15;
        const wallThickness = 1;
        const roomSize = 60;
        const wallGeo = new THREE.BoxGeometry(roomSize, wallHeight, wallThickness);

        // North Wall
        const wallN = new THREE.Mesh(wallGeo, wallMat);
        wallN.position.set(0, wallHeight / 2, -roomSize / 2);
        wallN.receiveShadow = true;
        wallN.castShadow = true;
        scene.add(wallN);
        this.intermissionObjects.push(wallN);

        // South Wall
        const wallS = new THREE.Mesh(wallGeo, wallMat);
        wallS.position.set(0, wallHeight / 2, roomSize / 2);
        wallS.receiveShadow = true;
        wallS.castShadow = true;
        scene.add(wallS);
        this.intermissionObjects.push(wallS);

        // East & West Walls (Rotated)
        const wallGeoSide = new THREE.BoxGeometry(wallThickness, wallHeight, roomSize);
        
        const wallE = new THREE.Mesh(wallGeoSide, wallMat);
        wallE.position.set(roomSize / 2, wallHeight / 2, 0);
        wallE.receiveShadow = true;
        wallE.castShadow = true;
        scene.add(wallE);
        this.intermissionObjects.push(wallE);

        const wallW = new THREE.Mesh(wallGeoSide, wallMat);
        wallW.position.set(-roomSize / 2, wallHeight / 2, 0);
        wallW.receiveShadow = true;
        wallW.castShadow = true;
        scene.add(wallW);
        this.intermissionObjects.push(wallW);

        // 3. Architectural Pillars (Symmetrical, spacious layout)
        const pillarGeo = new THREE.BoxGeometry(2, wallHeight, 2);
        const pillarPositions = [
            [-25, -25], [25, -25], // Back corners
            [-25, 25], [25, 25]    // Front corners
        ];

        pillarPositions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(pos[0], wallHeight / 2, pos[1]);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            scene.add(pillar);
            this.intermissionObjects.push(pillar);
        });

        // 4. Hunter Volunteer Zone (Center piece)
        // A glowing red ring/platform on the floor
        const zoneGeo = new THREE.CylinderGeometry(this.volunteerZoneRadius, this.volunteerZoneRadius, 0.2, 64);
        const zoneMat = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            emissive: 0xff0000, 
            emissiveIntensity: 0.5, 
            transparent: true, 
            opacity: 0.7 
        });
        this.volunteerZone = new THREE.Mesh(zoneGeo, zoneMat);
        this.volunteerZone.position.set(0, 0.1, 0); // Slightly above floor to prevent Z-fighting
        scene.add(this.volunteerZone);
        this.intermissionObjects.push(this.volunteerZone);
    },

    clearIntermissionMap(scene) {
        this.intermissionObjects.forEach(obj => {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
        this.intermissionObjects = [];
        this.volunteerZone = null;
    },

    checkInVolunteerZone(playerPos) {
        if (!this.volunteerZone) return false;
        
        // Calculate distance from center on the X/Z plane
        const dx = playerPos.x - this.volunteerZone.position.x;
        const dz = playerPos.z - this.volunteerZone.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Return true if player is inside the radius
        return distance < this.volunteerZoneRadius;
    }
};
