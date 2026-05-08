/**
 * Creature.js
 * Builds and owns the geometry for a genetically-engineered creature companion.
 *
 * Usage:
 *   const c = new Creature();
 *   scene.add(c.group);          // position / rotate c.group from outside
 *   c.lure.material.emissiveIntensity = pulse;   // animate each frame
 *   c.lureLight.intensity = pulse;
 *   c.dispose();                 // clean up when done
 */
import * as THREE from 'three';

// Body geometry constants
// Change BODY_RADIUS or BODY_SCALE and every surface attachment moves with it.
const BODY_RADIUS = 0.7;
const BODY_SCALE  = { x: 0.88, y: 1.08, z: 0.78 };

// Lure stalk constants
const STALK_LENGTH = 0.55;
const STALK_TILT   = 0.22;   // rotation.z in radians — slight forward bend
const STALK_EMBED  = 0.05;   // how far the stalk base overlaps the body top

// Body-space helper
// Maps normalised body-space coords to local 3-D offsets from the body centre.
//   1.0  → exactly at the body surface
//  >1.0  → outside the surface (fins, lure stalk)
//   0.0  → body centre
function bp(nx, ny, nz) {
    return new THREE.Vector3(
        nx * BODY_RADIUS * BODY_SCALE.x,
        ny * BODY_RADIUS * BODY_SCALE.y,
        nz * BODY_RADIUS * BODY_SCALE.z,
    );
}

export class Creature {
    constructor() {
        /** THREE.Group — add this to your scene and move it as needed. */
        this.group = new THREE.Group();
        /** Bioluminescent lure mesh — animate `emissiveIntensity` each frame. */
        this.lure = null;
        /** Point light at the lure tip — animate `intensity` each frame. */
        this.lureLight = null;

        this._build();
    }

    /** Dispose all geometries and materials owned by this creature. */
    dispose() {
        this.group.traverse((obj) => {
            if (!obj.isMesh) return;
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
        });
    }

    // Build pipeline

    _build() {
        this._buildBody();
        this._buildPatches();
        this._buildEyes();
        this._buildFins();
        this._buildLure();
    }

    _buildBody() {
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(BODY_RADIUS, 32, 32),
            new THREE.MeshStandardMaterial({
                color:     0x1c3020,
                roughness: 0.85,
                metalness: 0.05,
                emissive:  0x060e08,
            }),
        );
        body.scale.set(BODY_SCALE.x, BODY_SCALE.y, BODY_SCALE.z);
        body.castShadow    = true;
        body.receiveShadow = true;
        this.group.add(body);
    }

    _buildPatches() {
        const geo = new THREE.SphereGeometry(0.07, 10, 10);
        const mat = new THREE.MeshStandardMaterial({
            color:             0xff8822,
            emissive:          0xff5500,
            emissiveIntensity: 1.8,
            roughness:         0.2,
        });

        // bp() coords: (left/right, up/down, forward/back) — >1 means on/past surface.
        for (const pos of [
            bp(-0.57,  0.40, 1.03),   // upper front-left
            bp( 0.65, -0.13, 0.92),   // mid front-right
            bp(-0.29, -0.53, 0.97),   // lower front-left
            bp( 0.19,  0.66, 0.75),   // upper front center-right
        ]) {
            const patch = new THREE.Mesh(geo, mat);
            patch.position.copy(pos);
            this.group.add(patch);
        }
    }

    _buildEyes() {
        const scleraMat = new THREE.MeshStandardMaterial({ color: 0x0a1a0c, roughness: 0.6 });
        const pupilMat  = new THREE.MeshStandardMaterial({
            color:             0xaaffcc,
            emissive:          0x55ff99,
            emissiveIntensity: 2.0,
            roughness:         0.1,
        });

        this._addEye(bp(-0.45,  0.29, 1.10), 0.13, 0.07, scleraMat, pupilMat); // left — dominant
        this._addEye(bp( 0.39,  0.03, 1.14), 0.09, 0.05, scleraMat, pupilMat); // right — smaller
    }

    /** Place a sclera sphere and a slightly protruding pupil at the given surface position. */
    _addEye(surfacePos, scleraRadius, pupilRadius, scleraMat, pupilMat) {
        const sclera = new THREE.Mesh(new THREE.SphereGeometry(scleraRadius, 16, 16), scleraMat);
        sclera.position.copy(surfacePos);
        this.group.add(sclera);

        const pupil = new THREE.Mesh(new THREE.SphereGeometry(pupilRadius, 12, 12), pupilMat);
        pupil.position.copy(surfacePos);
        pupil.position.z += scleraRadius * 0.5;   // protrudes slightly toward the viewer
        this.group.add(pupil);
    }

    _buildFins() {
        const geo = new THREE.ConeGeometry(0.26, 0.48, 6);
        const mat = new THREE.MeshStandardMaterial({
            color:     0x0f2018,
            roughness: 0.9,
            metalness: 0.0,
            side:      THREE.DoubleSide,
        });

        const finL = new THREE.Mesh(geo, mat);
        finL.position.copy(bp(-1.17, 0.16, 0));   // left side, past the body surface
        finL.rotation.z =  Math.PI / 2 + 0.3;
        finL.rotation.y = -0.3;
        finL.castShadow = true;
        this.group.add(finL);

        const finR = new THREE.Mesh(geo, mat);
        finR.position.copy(bp( 1.17, 0.16, 0));   // right side, past the body surface
        finR.rotation.z = -(Math.PI / 2 + 0.3);
        finR.rotation.y =  0.3;
        finR.castShadow = true;
        this.group.add(finR);
    }

    _buildLure() {
        // Stalk base embeds slightly into the body top, then rises through STALK_LENGTH.
        const bodyTopY     = BODY_RADIUS * BODY_SCALE.y;
        const stalkCenterY = bodyTopY - STALK_EMBED + STALK_LENGTH * 0.5;

        const stalk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.022, 0.042, STALK_LENGTH, 8),
            new THREE.MeshStandardMaterial({ color: 0x0d1f10, roughness: 0.8 }),
        );
        stalk.position.set(0, stalkCenterY, 0);
        stalk.rotation.z = STALK_TILT;
        this.group.add(stalk);

        // Lure orb sits at the stalk tip: stalk centre offset by half-length along tilt axis.
        const lurePosX = Math.sin(STALK_TILT) * (STALK_LENGTH / 2);
        const lurePosY = stalkCenterY + Math.cos(STALK_TILT) * (STALK_LENGTH / 2);

        const lure = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshStandardMaterial({
                color:             0xffdd66,
                emissive:          0xffaa00,
                emissiveIntensity: 3.0,
                roughness:         0.05,
            }),
        );
        lure.position.set(lurePosX, lurePosY, 0);
        this.group.add(lure);
        this.lure = lure;

        const lureLight = new THREE.PointLight(0xffaa22, 4, 3.5);
        lureLight.position.copy(lure.position);
        this.group.add(lureLight);
        this.lureLight = lureLight;
    }
}
