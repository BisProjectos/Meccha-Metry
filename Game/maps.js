// Game/maps.js
const Maps = {
    intermissionObjects: [],
    volunteerZone: null,

    loadIntermissionMap(scene) {
        // Clear any existing game maps first
        this.clearIntermissionMap(scene);

        // Mock intermission floor
        const floorGeo = new THREE.PlaneGeometry(50, 50);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        this.intermissionObjects.push(floor);

        // Add some abstract shapes for players to look at while waiting
        for (let i = 0; i < 10; i++) {
            const geo = new THREE.BoxGeometry(2, Math.random() * 5 + 1, 2);
            const mat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
            const block = new THREE.Mesh(geo, mat);
            block.position.set((Math.random() - 0.5) * 40, geo.parameters.height / 2, (Math.random() - 0.5) * 40);
            block.castShadow = true;
            block.receiveShadow = true;
            scene.add(block);
            this.intermissionObjects.push(block);
        }

        // Volunteer Zone (Red glowing circle)
        const zoneGeo = new THREE.CylinderGeometry(3, 3, 0.1, 32);
        const zoneMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.4 });
        this.volunteerZone = new THREE.Mesh(zoneGeo, zoneMat);
        this.volunteerZone.position.set(0, 0.05, -15);
        scene.add(this.volunteerZone);
        this.intermissionObjects.push(this.volunteerZone);

        // Invisible walls for boundaries
        const wallGeo = new THREE.BoxGeometry(50, 10, 1);
        const wallMat = new THREE.MeshBasicMaterial({ visible: false });
        const wall1 = new THREE.Mesh(wallGeo, wallMat);
        wall1.position.set(0, 5, -25);
        scene.add(wall1);
        this.intermissionObjects.push(wall1);
        // Repeat for other 3 walls...
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
        const dx = playerPos.x - this.volunteerZone.position.x;
        const dz = playerPos.z - this.volunteerZone.position.z;
        return Math.sqrt(dx*dx + dz*dz) < 3; // radius of 3
    }
};
