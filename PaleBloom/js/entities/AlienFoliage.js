/**
 * AlienFoliage.js
 * Small procedural ground-level plants for bioluminescent alien environments.
 * Three distinct types — mushroom, pod, frond — each randomized at construction.
 *
 * Usage:
 *   const plant = new AlienFoliage();                    // fully random
 *   const plant = new AlienFoliage({ type: 'mushroom' }); // specific type, rest random
 *   scene.add(plant.group);
 *   plant.dispose();
 *
 *   // Scatter a mixed batch in a 1–8 unit ring:
 *   const flora = AlienFoliage.scatter(20, 1, 8);
 *   flora.forEach(f => scene.add(f.group));
 */
import * as THREE from 'three';
import { pick, PALETTE_GLOW } from '../palette.js';

const TYPES = ['mushroom', 'pod', 'frond'];

// ── Internal helpers ──────────────────────────────────────────────────────────
function rnd(min, max)    { return min + Math.random() * (max - min); }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }

export class AlienFoliage {
    /**
     * @param {object}  [options]
     * @param {string}  [options.type]       'mushroom' | 'pod' | 'frond' (default random)
     * @param {number}  [options.scale]      Uniform world-space scale (default random 0.5–1.5)
     * @param {number}  [options.glowColor]  Hex bioluminescent color (default random)
     */
    constructor(options = {}) {
        /** THREE.Group — add to scene and transform from outside. */
        this.group = new THREE.Group();

        this._cfg = {
            type:      options.type      ?? pick(TYPES),
            scale:     options.scale     ?? rnd(0.5, 1.5),
            glowColor: options.glowColor ?? pick(PALETTE_GLOW),
        };

        this.group.scale.setScalar(this._cfg.scale);
        this._build();
    }

    /**
     * Return a new fully-random AlienFoliage.
     * @returns {AlienFoliage}
     */
    static random() { return new AlienFoliage(); }

    /**
     * Scatter `count` random plants in a ring between radiusMin and radiusMax.
     * Positions are on the XZ plane (y = 0) with random Y rotation.
     * @param {number} count
     * @param {number} radiusMin
     * @param {number} radiusMax
     * @param {object} [overrides]  Any constructor options to fix across the batch.
     * @returns {AlienFoliage[]}
     */
    static scatter(count, radiusMin, radiusMax, overrides = {}) {
        return Array.from({ length: count }, () => {
            const plant = new AlienFoliage(overrides);
            const angle = Math.random() * Math.PI * 2;
            const r     = radiusMin + Math.random() * (radiusMax - radiusMin);
            plant.group.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
            plant.group.rotation.y = Math.random() * Math.PI * 2;
            return plant;
        });
    }

    /**
     * Boost all emissive materials to signal the player is hiding here.
     * Call unhighlight() to restore original values.
     */
    highlight() {
        this._glowSave = [];
        this.group.traverse(obj => {
            if (!obj.isMesh || !obj.material) return;
            const mat = obj.material;
            this._glowSave.push({ mat, val: mat.emissiveIntensity ?? 0 });
            mat.emissiveIntensity = Math.min((mat.emissiveIntensity ?? 0) * 3 + 1.5, 8);
        });
    }

    /** Restore emissive values saved by highlight(). */
    unhighlight() {
        for (const { mat, val } of (this._glowSave ?? [])) {
            mat.emissiveIntensity = val;
        }
        this._glowSave = null;
    }

    /** Dispose all geometries and materials owned by this plant. */
    dispose() {
        this.group.traverse(obj => {
            if (!obj.isMesh) return;
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
        });
    }

    // ── Build pipeline ────────────────────────────────────────────────────────

    _build() {
        const { type, glowColor } = this._cfg;
        if      (type === 'mushroom') this._buildMushroom(glowColor);
        else if (type === 'pod')      this._buildPod(glowColor);
        else                           this._buildFrond(glowColor);
    }

    // ── Types ─────────────────────────────────────────────────────────────────

    /**
     * Mushroom: dark organic stem + glowing domed cap.
     * Emissive underside gives a lantern-like diffuse glow.
     */
    _buildMushroom(glowColor) {
        const stemH = rnd(0.2, 0.55);
        const capR  = rnd(0.18, 0.42);

        const stemMat = new THREE.MeshStandardMaterial({ color: 0x0d1a10, roughness: 0.9 });
        const capMat  = new THREE.MeshStandardMaterial({
            color:             glowColor,
            emissive:          glowColor,
            emissiveIntensity: rnd(0.3, 0.9),
            roughness:         0.45,
            side:              THREE.DoubleSide,
        });

        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.07, stemH, 7),
            stemMat,
        );
        stem.position.y   = stemH / 2;
        stem.castShadow   = true;
        stem.receiveShadow = true;
        this.group.add(stem);

        // Hemispherical cap — SphereGeometry with partial phi sweep, flipped dome-up.
        const capGeo = new THREE.SphereGeometry(capR, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58);
        const cap    = new THREE.Mesh(capGeo, capMat);
        cap.position.y  = stemH;
        cap.rotation.x  = Math.PI;    // dome faces upward
        cap.castShadow  = true;
        this.group.add(cap);

        // Faint point light underneath the cap
        const light = new THREE.PointLight(glowColor, rnd(0.4, 0.9), 1.4);
        light.position.y = stemH * 0.6;
        this.group.add(light);
    }

    /**
     * Pod: bulbous dark body tapering to a glowing bioluminescent tip.
     * Like an alien deep-sea bioluminescent plant or seed pod.
     */
    _buildPod(glowColor) {
        const bodyH = rnd(0.25, 0.6);
        const bodyR = rnd(0.08, 0.14);

        const bodyMat = new THREE.MeshStandardMaterial({
            color:     0x0f1e12,
            roughness: 0.85,
        });
        const tipMat = new THREE.MeshStandardMaterial({
            color:             glowColor,
            emissive:          glowColor,
            emissiveIntensity: rnd(1.8, 2.8),
            roughness:         0.1,
        });

        // Elongated body — sphere scaled on Y
        const body = new THREE.Mesh(new THREE.SphereGeometry(bodyR, 9, 9), bodyMat);
        body.scale.y   = (bodyH / bodyR) * 0.5;
        body.position.y = bodyH * 0.3;
        body.castShadow = true;
        this.group.add(body);

        // Glowing orb at the tip
        const tipR = bodyR * rnd(0.35, 0.55);
        const tip  = new THREE.Mesh(new THREE.SphereGeometry(tipR, 8, 8), tipMat);
        tip.position.y = bodyH * 0.6 + tipR;
        this.group.add(tip);

        const light = new THREE.PointLight(glowColor, rnd(0.7, 1.4), rnd(0.7, 1.2));
        light.position.copy(tip.position);
        this.group.add(light);
    }

    /**
     * Frond: fan of flat tapered leaves radiating from a ground base.
     * Subtly emissive along veins — like bioluminescent alien ferns.
     */
    _buildFrond(glowColor) {
        const leafCount = rndInt(3, 5);
        const leafH     = rnd(0.28, 0.65);

        const frondMat = new THREE.MeshStandardMaterial({
            color:             glowColor,
            emissive:          glowColor,
            emissiveIntensity: rnd(0.12, 0.40),
            roughness:         0.75,
            side:              THREE.DoubleSide,
        });

        for (let i = 0; i < leafCount; i++) {
            const azimuth = (i / leafCount) * Math.PI * 2 + rnd(-0.2, 0.2);
            const width   = rnd(0.06, 0.14);

            // Tapered plane — wide at base, narrow at tip
            const geo = new THREE.PlaneGeometry(width, leafH, 1, 3);
            geo.translate(0, leafH / 2, 0);   // pivot at base

            const leaf = new THREE.Mesh(geo, frondMat);
            leaf.rotation.y = azimuth;
            leaf.rotation.z = rnd(0.15, 0.45);  // natural outward droop
            leaf.castShadow  = true;
            this.group.add(leaf);
        }
    }
}
