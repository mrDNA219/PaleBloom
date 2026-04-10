/**
 * TestScene.js
 * A simple sandbox scene used to verify the rendering pipeline.
 *
 * What it contains:
 *  - Perspective camera with OrbitControls (left-drag orbit, scroll zoom)
 *  - Warm ambient + directional lighting evoking an alien bioluminescent forest
 *  - A dark mossy ground with scattered glowing spores
 *  - A floating, rotating placeholder "pet" — a genetically engineered creature
 *    with an organic ovoid body, asymmetric eyes, side fins, bioluminescent
 *    patches, and a pulsing lure stalk (Scavenger's Reign / Synergy art style)
 *  - Subtle floating-bob animation and lure pulse
 *  - Click-to-move: click the ground and the pet saunters to that position
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Scene }  from '../core/Scene.js';

// How quickly the pet spins while idle (radians per second)
const PET_SPIN_SPEED       = 1.2;
// Walk speed (units per second) and turn speed (radians per second)
const PET_MOVE_SPEED       = 2.2;
const PET_TURN_SPEED       = 8.0;
// Stop moving when this close to the target
const PET_ARRIVAL_DIST     = 0.08;
// Amplitude and speed of the vertical bobbing (idle vs. walking)
const BOB_AMPLITUDE        = 0.18;
const BOB_SPEED_IDLE       = 2.0;
const BOB_SPEED_WALK       = 7.0;   // quicker stride bounce while moving
// Click vs. orbit-drag discrimination threshold (pixels)
const CLICK_MOVE_THRESHOLD = 5;

export class TestScene extends Scene {
    constructor() {
        super();

        this._threeScene = new THREE.Scene();
        this._camera     = null;
        this._controls   = null;   // OrbitControls for scene inspection
        this._pet        = null;   // Group containing all pet geometry
        this._lure       = null;   // Bioluminescent lure orb, animated separately
        this._lureLight  = null;   // Point light parented to lure position
        this._elapsed    = 0;      // total time, used for bob and pulse animation

        // Movement state
        this._targetPos      = null;    // THREE.Vector3 — current ground target
        this._isMoving       = false;
        this._heading        = 0;       // pet's current Y rotation (radians)
        this._pointerDownPos = null;    // {x,y} for click vs drag discrimination

        // Bound event handlers (kept for removeEventListener in onExit)
        this._onPointerDown = null;
        this._onPointerUp   = null;
    }

    // -------------------------------------------------------------------------
    // Scene lifecycle
    // -------------------------------------------------------------------------

    onEnter(renderer) {
        this._buildCamera(renderer.aspectRatio);
        this._buildLighting();
        this._buildEnvironment();
        this._buildPet();

        // Orbit controls — left-drag to orbit, right-drag to pan, scroll to zoom.
        this._controls = new OrbitControls(this._camera, renderer.three.domElement);
        this._controls.target.set(0, 1, 0);   // look at the pet, not the origin
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.08;
        this._controls.update();

        this._setupClickControls(renderer.three.domElement);

        // Keep the camera aspect correct when the viewport changes.
        this._resizeObserver = new ResizeObserver(() => {
            this._camera.aspect = renderer.aspectRatio;
            this._camera.updateProjectionMatrix();
        });
        this._resizeObserver.observe(renderer.three.domElement.parentElement);
    }

    onExit() {
        this._resizeObserver?.disconnect();
        this._controls?.dispose();

        if (this._onPointerDown) {
            this._controls?.domElement?.removeEventListener('pointerdown', this._onPointerDown);
            this._controls?.domElement?.removeEventListener('pointerup',   this._onPointerUp);
        }

        // Dispose all geometries and materials owned by this scene.
        this._threeScene.traverse((obj) => {
            if (obj.isMesh) {
                obj.geometry.dispose();
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m) => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
    }

    render(renderer) {
        renderer.render(this._threeScene, this._camera);
    }

    // -------------------------------------------------------------------------
    // Scene construction helpers
    // -------------------------------------------------------------------------

    _buildCamera(aspect) {
        this._camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200);
        this._camera.position.set(0, 2.5, 6);
        this._camera.lookAt(0, 1, 0);
    }

    _buildLighting() {
        const scene = this._threeScene;

        // Dim ambient — deep alien forest darkness with a faint green undertone.
        scene.add(new THREE.AmbientLight(0x0d2010, 4));

        // Key light — warm golden, like bioluminescent ambience or a distant alien sun.
        const key = new THREE.DirectionalLight(0xffe8b0, 3);
        key.position.set(4, 8, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far  = 50;
        scene.add(key);

        // Rim light — deep teal from behind, adds alien atmosphere and separation.
        const rim = new THREE.DirectionalLight(0x1a6644, 1.5);
        rim.position.set(-4, 3, -6);
        scene.add(rim);

        // Dense alien forest atmosphere — very dark green-black.
        scene.fog = new THREE.FogExp2(0x030d06, 0.065);
        scene.background = new THREE.Color(0x030d06);
    }

    _buildEnvironment() {
        const scene = this._threeScene;

        // Dark mossy organic ground — no grid, just earth.
        const planeGeo = new THREE.PlaneGeometry(20, 20);
        const planeMat = new THREE.MeshStandardMaterial({
            color:     0x081208,
            roughness: 1.0,
            metalness: 0.0,
        });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        scene.add(plane);

        // Scattered bioluminescent spores — replace the LCD grid with organic life.
        const sporeGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const sporeMat = new THREE.MeshStandardMaterial({
            color:             0x88ffaa,
            emissive:          0x44ff88,
            emissiveIntensity: 1.2,
            roughness:         0.3,
        });
        const sporePositions = [
            [-1.8, 0.04, -1.2], [ 2.1, 0.04, -0.8], [-0.5, 0.04, -2.5],
            [ 3.0, 0.04,  1.5], [-2.5, 0.04,  2.0], [ 1.2, 0.04,  2.8],
            [-1.0, 0.04,  1.8], [ 2.8, 0.04, -2.2], [-3.2, 0.04, -0.5],
            [ 0.8, 0.04, -3.0], [-2.0, 0.04, -3.5], [ 1.5, 0.04, -1.5],
            [-3.5, 0.04,  1.2], [ 0.3, 0.04,  3.5], [ 3.5, 0.04,  0.2],
        ];
        for (const [x, y, z] of sporePositions) {
            const spore = new THREE.Mesh(sporeGeo, sporeMat);
            spore.position.set(x, y, z);
            scene.add(spore);
        }
    }

    _buildPet() {
        const scene = this._threeScene;

        this._pet = new THREE.Group();
        this._pet.position.set(0, 1, 0);

        // --- Body: organic ovoid — dark forest creature, faint inner warmth ---
        const bodyGeo = new THREE.SphereGeometry(0.7, 32, 32);
        const bodyMat = new THREE.MeshStandardMaterial({
            color:     0x1c3020,   // deep forest green
            roughness: 0.85,
            metalness: 0.05,
            emissive:  0x060e08,   // subtle inner glow
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(0.88, 1.08, 0.78);   // slightly taller than wide, ovoid
        body.castShadow    = true;
        body.receiveShadow = true;
        this._pet.add(body);

        // --- Bioluminescent patches: warm amber spots scattered across the body ---
        const patchGeo = new THREE.SphereGeometry(0.07, 10, 10);
        const patchMat = new THREE.MeshStandardMaterial({
            color:             0xff8822,
            emissive:          0xff5500,
            emissiveIntensity: 1.8,
            roughness:         0.2,
        });
        const patchOffsets = [
            { x: -0.35, y:  0.30, z: 0.56 },   // upper front-left
            { x:  0.40, y: -0.10, z: 0.50 },   // mid front-right
            { x: -0.18, y: -0.40, z: 0.53 },   // lower front-left
            { x:  0.12, y:  0.50, z: 0.41 },   // upper front center-right
        ];
        for (const p of patchOffsets) {
            const patch = new THREE.Mesh(patchGeo, patchMat);
            patch.position.set(p.x, p.y, p.z);
            this._pet.add(patch);
        }

        // --- Eyes: asymmetric pair — one dominant, one smaller (creature-like) ---
        const scleraMat = new THREE.MeshStandardMaterial({
            color:     0x0a1a0c,
            roughness: 0.6,
        });
        const pupilMat = new THREE.MeshStandardMaterial({
            color:             0xaaffcc,
            emissive:          0x55ff99,
            emissiveIntensity: 2.0,
            roughness:         0.1,
        });

        // Left eye — dominant (larger, higher)
        const eyeScleraL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), scleraMat);
        eyeScleraL.position.set(-0.28, 0.22, 0.60);
        this._pet.add(eyeScleraL);
        const eyePupilL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), pupilMat);
        eyePupilL.position.set(-0.28, 0.22, 0.66);
        this._pet.add(eyePupilL);

        // Right eye — smaller, lower
        const eyeScleraR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), scleraMat);
        eyeScleraR.position.set(0.24, 0.02, 0.62);
        this._pet.add(eyeScleraR);
        const eyePupilR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), pupilMat);
        eyePupilR.position.set(0.24, 0.02, 0.67);
        this._pet.add(eyePupilR);

        // --- Side fins: two organic fin-like protrusions ---
        const finGeo = new THREE.ConeGeometry(0.26, 0.48, 6);
        const finMat = new THREE.MeshStandardMaterial({
            color:     0x0f2018,
            roughness: 0.9,
            metalness: 0.0,
            side:      THREE.DoubleSide,
        });

        const finL = new THREE.Mesh(finGeo, finMat);
        finL.position.set(-0.72, 0.12, 0.0);
        finL.rotation.z =  Math.PI / 2 + 0.3;
        finL.rotation.y = -0.3;
        finL.castShadow = true;
        this._pet.add(finL);

        const finR = new THREE.Mesh(finGeo, finMat);
        finR.position.set(0.72, 0.12, 0.0);
        finR.rotation.z = -(Math.PI / 2 + 0.3);
        finR.rotation.y =  0.3;
        finR.castShadow = true;
        this._pet.add(finR);

        // --- Bioluminescent lure: tapering stalk + glowing orb (anglerfish-like) ---
        const stalkGeo = new THREE.CylinderGeometry(0.022, 0.042, 0.55, 8);
        const stalkMat = new THREE.MeshStandardMaterial({
            color:     0x0d1f10,
            roughness: 0.8,
        });
        const stalk = new THREE.Mesh(stalkGeo, stalkMat);
        stalk.position.set(0.0, 0.98, 0.0);   // sits just above body top
        stalk.rotation.z = 0.22;               // bends slightly forward
        this._pet.add(stalk);

        const lureGeo = new THREE.SphereGeometry(0.1, 16, 16);
        const lureMat = new THREE.MeshStandardMaterial({
            color:             0xffdd66,
            emissive:          0xffaa00,
            emissiveIntensity: 3.0,
            roughness:         0.05,
        });
        const lure = new THREE.Mesh(lureGeo, lureMat);
        lure.position.set(0.13, 1.28, 0.0);   // tip of the stalk
        this._pet.add(lure);
        this._lure = lure;

        // Warm amber point light parented to the lure position.
        const lureLight = new THREE.PointLight(0xffaa22, 4, 3.5);
        lureLight.position.copy(lure.position);
        this._pet.add(lureLight);
        this._lureLight = lureLight;

        scene.add(this._pet);
    }

    // -------------------------------------------------------------------------
    // Per-frame update: movement, bob, heading, and lure pulse
    // -------------------------------------------------------------------------

    update(deltaTime) {
        this._elapsed += deltaTime;

        this._controls?.update();

        if (this._pet) {
            this._updateMovement(deltaTime);

            // Bob — faster stride bounce while walking, slow float while idle.
            const bobSpeed = this._isMoving ? BOB_SPEED_WALK : BOB_SPEED_IDLE;
            this._pet.position.y = 1.0 + Math.sin(this._elapsed * bobSpeed) * BOB_AMPLITUDE;
        }

        // Gently pulse the lure — breathing bioluminescent rhythm.
        if (this._lure) {
            const pulse = 0.65 + 0.35 * Math.sin(this._elapsed * 3.5);
            this._lure.material.emissiveIntensity = 3.0 * pulse;
            this._lureLight.intensity             = 4.0 * pulse;
        }
    }

    // -------------------------------------------------------------------------
    // Movement helpers
    // -------------------------------------------------------------------------

    _updateMovement(deltaTime) {
        if (this._isMoving && this._targetPos) {
            const pos = this._pet.position;
            const dx  = this._targetPos.x - pos.x;
            const dz  = this._targetPos.z - pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < PET_ARRIVAL_DIST) {
                // Arrived — snap to target and go back to idle spin.
                pos.x = this._targetPos.x;
                pos.z = this._targetPos.z;
                this._isMoving = false;
                this._pet.rotation.z = 0;
            } else {
                // Step toward target.
                const step = Math.min(PET_MOVE_SPEED * deltaTime, dist);
                pos.x += (dx / dist) * step;
                pos.z += (dz / dist) * step;

                // Smoothly rotate to face direction of travel.
                const desiredHeading = Math.atan2(dx, dz);
                this._heading = _lerpAngle(this._heading, desiredHeading, PET_TURN_SPEED * deltaTime);
                this._pet.rotation.y = this._heading;

                // Saunter waddle — gentle side-to-side roll.
                this._pet.rotation.z = Math.sin(this._elapsed * 8.5) * 0.08;
            }
        } else {
            // Idle — slow spin, no waddle.
            this._heading        += PET_SPIN_SPEED * deltaTime;
            this._pet.rotation.y  = this._heading;
            this._pet.rotation.z  = 0;
        }
    }

    /**
     * Wire up pointer events on the canvas.
     * Distinguishes a click (pointer barely moved) from an orbit drag.
     * @param {HTMLCanvasElement} canvas
     */
    _setupClickControls(canvas) {
        this._onPointerDown = (e) => {
            this._pointerDownPos = { x: e.clientX, y: e.clientY };
        };

        this._onPointerUp = (e) => {
            if (!this._pointerDownPos) return;
            const dx = e.clientX - this._pointerDownPos.x;
            const dy = e.clientY - this._pointerDownPos.y;
            this._pointerDownPos = null;

            if (Math.sqrt(dx * dx + dy * dy) < CLICK_MOVE_THRESHOLD) {
                this._handleGroundClick(e, canvas);
            }
        };

        canvas.addEventListener('pointerdown', this._onPointerDown);
        canvas.addEventListener('pointerup',   this._onPointerUp);
    }

    /**
     * Raycast from the click position onto the ground plane (y = 0) and
     * set the pet's movement target.
     * @param {PointerEvent} event
     * @param {HTMLCanvasElement} canvas
     */
    _handleGroundClick(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        const ndc  = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width)  *  2 - 1,
            ((event.clientY - rect.top)  / rect.height) * -2 + 1,
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(ndc, this._camera);

        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const hit = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(groundPlane, hit)) return;

        // Keep the target inside the visible play area.
        hit.x = Math.max(-9, Math.min(9, hit.x));
        hit.z = Math.max(-9, Math.min(9, hit.z));

        this._targetPos = hit;
        this._isMoving  = true;
    }
}

// -------------------------------------------------------------------------
// Module-level utility: lerp between two angles (handles ±π wrapping)
// -------------------------------------------------------------------------
function _lerpAngle(current, target, t) {
    let diff = target - current;
    while (diff >  Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return current + diff * Math.min(t, 1);
}
