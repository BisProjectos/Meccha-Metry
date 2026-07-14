// assets/playermodel.js
// Defines the blocky player character and its walk/run animations.

class PlayerModel {
    constructor() {
        this.group = new THREE.Group();
        this.parts = {};
        this.materials = [];
        
        // Animation state
        this.animTime = 0;
        this.isMoving = false;
        this.isRunning = false;

        this.buildModel();
    }

    buildModel() {
        // We use a single material instance for the whole body for now.
        // Later, playerpainting.js will replace this with a 32x32 texture canvas.
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.1 });
        this.materials.push(baseMat);

        // Dimensions (keeping it symmetrical)
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const torsoGeo = new THREE.BoxGeometry(0.75, 1.0, 0.4);
        const limbGeo = new THREE.BoxGeometry(0.25, 1.0, 0.25);

        // 1. Torso
        this.parts.torso = new THREE.Mesh(torsoGeo, baseMat);
        this.parts.torso.position.y = 1.0; // Center of torso
        this.parts.torso.castShadow = true;
        this.group.add(this.parts.torso);

        // 2. Head
        this.parts.head = new THREE.Mesh(headGeo, baseMat);
        this.parts.head.position.y = 1.75; // On top of torso
        this.parts.head.castShadow = true;
        this.group.add(this.parts.head);

        // 3. Arms (Using pivot groups so they rotate from the shoulder)
        this.parts.leftArmPivot = new THREE.Group();
        this.parts.leftArmPivot.position.set(-0.5, 1.5, 0); // Left shoulder
        this.group.add(this.parts.leftArmPivot);

        this.parts.leftArm = new THREE.Mesh(limbGeo, baseMat);
        this.parts.leftArm.position.y = -0.5; // Offset down so top is at pivot
        this.parts.leftArm.castShadow = true;
        this.parts.leftArmPivot.add(this.parts.leftArm);

        this.parts.rightArmPivot = new THREE.Group();
        this.parts.rightArmPivot.position.set(0.5, 1.5, 0); // Right shoulder
        this.group.add(this.parts.rightArmPivot);

        this.parts.rightArm = new THREE.Mesh(limbGeo, baseMat);
        this.parts.rightArm.position.y = -0.5;
        this.parts.rightArm.castShadow = true;
        this.parts.rightArmPivot.add(this.parts.rightArm);

        // 4. Legs (Using pivot groups so they rotate from the hip)
        this.parts.leftLegPivot = new THREE.Group();
        this.parts.leftLegPivot.position.set(-0.2, 0.5, 0); // Left hip
        this.group.add(this.parts.leftLegPivot);

        this.parts.leftLeg = new THREE.Mesh(limbGeo, baseMat);
        this.parts.leftLeg.position.y = -0.5;
        this.parts.leftLeg.castShadow = true;
        this.parts.leftLegPivot.add(this.parts.leftLeg);

        this.parts.rightLegPivot = new THREE.Group();
        this.parts.rightLegPivot.position.set(0.2, 0.5, 0); // Right hip
        this.group.add(this.parts.rightLegPivot);

        this.parts.rightLeg = new THREE.Mesh(limbGeo, baseMat);
        this.parts.rightLeg.position.y = -0.5;
        this.parts.rightLeg.castShadow = true;
        this.parts.rightLegPivot.add(this.parts.rightLeg);
    }

    // Called every frame by main.js
    // delta: time since last frame, isMoving: boolean, isRunning: boolean
    updateAnimation(delta, isMoving, isRunning) {
        this.isMoving = isMoving;
        this.isRunning = isRunning;

        if (isMoving) {
            // Determine swing speed and amplitude based on running or walking
            const swingSpeed = isRunning ? 12 : 6;
            const swingAmplitude = isRunning ? 0.9 : 0.4; // Radians

            this.animTime += delta * swingSpeed;

            const swing = Math.sin(this.animTime) * swingAmplitude;

            // Swing opposite arms and legs
            this.parts.leftArmPivot.rotation.x = swing;
            this.parts.rightArmPivot.rotation.x = -swing;
            this.parts.leftLegPivot.rotation.x = -swing;
            this.parts.rightLegPivot.rotation.x = swing;
        } else {
            // Reset to resting position smoothly
            this.parts.leftArmPivot.rotation.x *= 0.8;
            this.parts.rightArmPivot.rotation.x *= 0.8;
            this.parts.leftLegPivot.rotation.x *= 0.8;
            this.parts.rightLegPivot.rotation.x *= 0.8;
            this.animTime = 0;
        }
    }

    // Used later by playerpainting.js to apply a 32x32 texture seamlessly
    getPaintableMeshes() {
        return [
            this.parts.head,
            this.parts.torso,
            this.parts.leftArm,
            this.parts.rightArm,
            this.parts.leftLeg,
            this.parts.rightLeg
        ];
    }
}
