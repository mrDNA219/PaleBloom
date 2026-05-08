/**
 * EnemyCreature.js
 * The hunting predator — angular, multi-legged, faceted.
 * Aesthetically opposite to the player creature: nothing soft or rounded.
 *
 * This class owns VISUALS + MOVEMENT only.
 * All target selection and AI decision-making lives in EnemyAI.js.
 *
 * Movement API (called by EnemyAI each frame):
 *   enemy.setMoveTarget(x, z, speed)  — move toward a world position
 *   enemy.clearMoveTarget()           — stop and idle
 *   enemy.hasTarget                   — true while still travelling
 *
 * Usage:
 *   const enemy = new EnemyCreature();
 *   scene.add(enemy.group);
 *   // each frame — call creature first, then AI:
 *   enemy.update(deltaTime);
 *   enemyAI.update(deltaTime, playerGroup, isHiding, hidingGroup);
 */
import * as THREE from 'three';
import { LIME_VIVID } from '../palette.js';

// Movement constants
const DEFAULT_MOVE_SPEED = 2.4;   // fallback if EnemyAI doesn't supply a speed
const TURN_SPEED         = 3.5;   // radians / second — slow deliberate turn
const ARRIVAL_DIST       = 0.18;

// Animation constants
const HOVER_Y = 0.55;
const BOB_AMP = 0.06;
const BOB_SPD = 4.2;

function rnd(min, max) { return min + Math.random() * (max - min); }

function lerpAngle(cur, tgt, t) {
    let d = tgt - cur;
    while (d >  Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return cur + d * Math.min(t, 1);
}

export class EnemyCreature {
    constructor() {
        /** THREE.Group — add to scene and set XZ position from outside. */
        this.group = new THREE.Group();

        this._elapsed      = 0;
        this._heading      = Math.random() * Math.PI * 2;
        this._target       = null;       // current movement target (Vector3 | null)
        this._moving       = false;
        this._currentSpeed = DEFAULT_MOVE_SPEED;

        this._build();
    }

    // Movement API (driven by EnemyAI)

    /**
     * Instruct the creature to walk toward (x, z) at the given speed.
     * EnemyAI should call this whenever it wants the creature to go somewhere.
     * @param {number} x
     * @param {number} z
     * @param {number} [speed]  World units / second. Defaults to DEFAULT_MOVE_SPEED.
     */
    setMoveTarget(x, z, speed = DEFAULT_MOVE_SPEED) {
        this._target       = new THREE.Vector3(x, 0, z);
        this._moving       = true;
        this._currentSpeed = speed;
    }

    /** Stop moving and idle at the current position. */
    clearMoveTarget() {
        this._target  = null;
        this._moving  = false;
        this.group.rotation.z = 0;
    }

    /**
     * True while the creature is still travelling toward its current target.
     * Becomes false on arrival — EnemyAI should then assign the next waypoint.
     */
    get hasTarget() { return this._moving && this._target !== null; }

    // Per-frame update

    /** Advance movement and animation. Call before EnemyAI.update() each frame. */
    update(deltaTime) {
        this._elapsed += deltaTime;
        this._updateMovement(deltaTime);
        // Vertical hover-bob (Y managed here; XZ managed by _updateMovement)
        this.group.position.y = HOVER_Y + Math.sin(this._elapsed * BOB_SPD) * BOB_AMP;
    }

    dispose() {
        this.group.traverse(obj => {
            if (!obj.isMesh) return;
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
        });
    }

    // Internal movement

    _updateMovement(deltaTime) {
        if (!this._moving || !this._target) return;

        const pos  = this.group.position;
        const dx   = this._target.x - pos.x;
        const dz   = this._target.z - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < ARRIVAL_DIST) {
            pos.x = this._target.x;
            pos.z = this._target.z;
            this._moving = false;   // signal to EnemyAI that we need a new target
            this.group.rotation.z = 0;
        } else {
            const step = Math.min(this._currentSpeed * deltaTime, dist);
            pos.x += (dx / dist) * step;
            pos.z += (dz / dist) * step;

            const desired = Math.atan2(dx, dz);
            this._heading = lerpAngle(this._heading, desired, TURN_SPEED * deltaTime);
            this.group.rotation.y = this._heading;
            this.group.rotation.z = Math.sin(this._elapsed * 5.0) * 0.04; // prowl sway
        }
    }

    // Build pipeline

    _build() {
        this._buildBody();
        this._buildSnout();
        this._buildEyes();
        this._buildSpines();
        this._buildLimbs();
    }

    _buildBody() {
        const geo = new THREE.SphereGeometry(0.9, 6, 4);
        const mat = new THREE.MeshStandardMaterial({
            color:             0x120808,
            roughness:         0.85,
            metalness:         0.05,
            flatShading:       true,
            emissive:          0x3a0808,
            emissiveIntensity: 0.18,
        });
        const body = new THREE.Mesh(geo, mat);
        body.scale.set(1.3, 0.62, 1.1);
        body.castShadow    = true;
        body.receiveShadow = true;
        this.group.add(body);
    }

    _buildSnout() {
        const geo = new THREE.ConeGeometry(0.28, 0.85, 5);
        const mat = new THREE.MeshStandardMaterial({
            color:       0x0e0606,
            roughness:   0.9,
            flatShading: true,
        });
        const snout = new THREE.Mesh(geo, mat);
        snout.position.set(0, -0.04, -0.92);
        snout.rotation.x = -Math.PI / 2;
        snout.castShadow = true;
        this.group.add(snout);
    }

    _buildEyes() {
        const eyeMat = new THREE.MeshStandardMaterial({
            color:             LIME_VIVID,
            emissive:          LIME_VIVID,
            emissiveIntensity: 2.5,
            roughness:         0.05,
        });
        const positions = [
            new THREE.Vector3(-0.20,  0.18, -0.88),
            new THREE.Vector3( 0.28,  0.13, -0.82),
            new THREE.Vector3(-0.10,  0.04, -0.98),
            new THREE.Vector3( 0.09,  0.24, -0.76),
        ];
        for (const pos of positions) {
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(rnd(0.035, 0.058), 6, 6),
                eyeMat,
            );
            eye.position.copy(pos);
            this.group.add(eye);
        }
        const light = new THREE.PointLight(LIME_VIVID, 2.0, 3.2);
        light.position.set(0, 0.14, -0.92);
        this.group.add(light);
    }

    _buildSpines() {
        const mat = new THREE.MeshStandardMaterial({
            color:       0x220808,
            roughness:   0.9,
            flatShading: true,
        });
        const spines = [
            { z:  0.40, h: 0.42, tilt:  0.12 },
            { z:  0.10, h: 0.55, tilt: -0.08 },
            { z: -0.20, h: 0.50, tilt:  0.10 },
            { z: -0.48, h: 0.30, tilt: -0.14 },
        ];
        for (const { z, h, tilt } of spines) {
            const geo = new THREE.ConeGeometry(0.07, h, 4);
            geo.translate(0, h / 2, 0);
            const spine = new THREE.Mesh(geo, mat);
            spine.position.set(rnd(-0.07, 0.07), 0.56, z);
            spine.rotation.z = tilt;
            spine.castShadow = true;
            this.group.add(spine);
        }
    }

    _buildLimbs() {
        const mat = new THREE.MeshStandardMaterial({ color: 0x100505, roughness: 0.95 });
        for (let i = 0; i < 6; i++) {
            const side = (i % 2 === 0) ? -1 : 1;
            const row  = Math.floor(i / 2);
            const zOff = (row - 1) * 0.55;
            const geo  = new THREE.CylinderGeometry(0.028, 0.015, 0.95, 5);
            const limb = new THREE.Mesh(geo, mat);
            limb.position.set(side * 0.88, -0.24, zOff);
            limb.rotation.z = side * (Math.PI / 2 + 0.5);
            limb.rotation.y = zOff * 0.25 * side;
            limb.castShadow = true;
            this.group.add(limb);
        }
    }
}
