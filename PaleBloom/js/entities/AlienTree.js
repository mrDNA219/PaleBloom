/**
 * AlienTree.js
 * Procedural alien tree companion for bioluminescent forest scenes.
 *
 * Usage:
 *   const tree = new AlienTree();            // fully random
 *   const tree = new AlienTree({ height: 3.5, glowColor: 0x44ffaa });
 *   scene.add(tree.group);
 *   tree.dispose();
 *
 *   // Scatter a batch, radius 3–9 units from origin, all random:
 *   const trees = AlienTree.scatter(8, 3, 9);
 *   trees.forEach(t => scene.add(t.group));
 */
import * as THREE from 'three';
import { pick, PALETTE_GLOW, PALETTE_BARK } from '../palette.js';

// ── Internal helpers ──────────────────────────────────────────────────────────
function rnd(min, max)    { return min + Math.random() * (max - min); }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }

export class AlienTree {
    /**
     * @param {object}  [options]
     * @param {number}  [options.height]       Trunk height in world units (default random 2.2–4.8)
     * @param {number}  [options.trunkColor]   Hex color for bark (default random dark palette)
     * @param {number}  [options.branchCount]  Number of branches (default random 2–4)
     * @param {number}  [options.glowColor]    Hex color for bioluminescent elements (default random)
     * @param {string}  [options.canopyStyle]  'umbrella' | 'bulb' | 'droop' (default random)
     */
    constructor(options = {}) {
        /** THREE.Group — add to scene and transform from outside. */
        this.group = new THREE.Group();

        this._cfg = {
            height:      options.height      ?? rnd(2.2, 4.8),
            trunkColor:  options.trunkColor  ?? pick(PALETTE_BARK),
            branchCount: options.branchCount ?? rndInt(2, 4),
            glowColor:   options.glowColor   ?? pick(PALETTE_GLOW),
            canopyStyle: options.canopyStyle ?? pick(['umbrella', 'bulb', 'droop']),
        };

        this._build();
    }

    /**
     * Return a new fully-random AlienTree.
     * @returns {AlienTree}
     */
    static random() { return new AlienTree(); }

    /**
     * Scatter `count` random trees in a ring between radiusMin and radiusMax.
     * Positions are on the XZ plane (y = 0) with random Y rotation.
     * @param {number} count
     * @param {number} radiusMin
     * @param {number} radiusMax
     * @param {object} [overrides]  Any constructor options to fix across the batch.
     * @returns {AlienTree[]}
     */
    static scatter(count, radiusMin, radiusMax, overrides = {}) {
        return Array.from({ length: count }, () => {
            const tree  = new AlienTree(overrides);
            const angle = Math.random() * Math.PI * 2;
            const r     = radiusMin + Math.random() * (radiusMax - radiusMin);
            tree.group.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
            tree.group.rotation.y = Math.random() * Math.PI * 2;
            return tree;
        });
    }

    /**
     * Boost all emissive materials to signal the player is hiding here.
     * Call unhighlight() to restore original values.
     */
    highlight() {
        // Use a Map so shared materials (e.g. _trunkMat reused across trunk,
        // branches, and canopy) are only boosted once and restored cleanly.
        this._glowSave = new Map();
        this.group.traverse(obj => {
            if (!obj.isMesh || !obj.material) return;
            const mat = obj.material;
            if (this._glowSave.has(mat)) return;
            this._glowSave.set(mat, mat.emissiveIntensity ?? 0);
            mat.emissiveIntensity = Math.min((mat.emissiveIntensity ?? 0) * 3 + 1.5, 8);
        });
    }

    /** Restore emissive values saved by highlight(). */
    unhighlight() {
        if (!this._glowSave) return;
        for (const [mat, val] of this._glowSave) {
            mat.emissiveIntensity = val;
        }
        this._glowSave = null;
    }

    /** Dispose all geometries and materials owned by this tree. */
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
        const { height, trunkColor, branchCount, glowColor, canopyStyle } = this._cfg;

        this._trunkMat = new THREE.MeshStandardMaterial({
            color:     trunkColor,
            roughness: 0.85,
            metalness: 0.0,
            // Faint self-glow so bark color reads in the dark ambient.
            emissive:          trunkColor,
            emissiveIntensity: 0.12,
        });

        this._buildTrunk(height);
        this._buildBranches(height, branchCount, glowColor);

        const topY = height * 1.02;
        if      (canopyStyle === 'umbrella') this._canopyUmbrella(topY, height, glowColor);
        else if (canopyStyle === 'bulb')     this._canopyBulb(topY, height, glowColor);
        else                                  this._canopyDroop(topY, height, glowColor);
    }

    _buildTrunk(height) {
        const geo = new THREE.CylinderGeometry(
            height * 0.055,   // top radius — slender
            height * 0.105,   // base radius
            height,
            7,                // 7-sided for slightly irregular silhouette
        );
        const trunk = new THREE.Mesh(geo, this._trunkMat);
        trunk.position.y  = height / 2;
        trunk.rotation.z  = rnd(-0.07, 0.07);   // organic lean
        trunk.rotation.x  = rnd(-0.05, 0.05);
        trunk.castShadow    = true;
        trunk.receiveShadow = true;
        this.group.add(trunk);
    }

    _buildBranches(height, branchCount, glowColor) {
        for (let i = 0; i < branchCount; i++) {
            const azimuth   = (i / branchCount) * Math.PI * 2 + rnd(-0.3, 0.3);
            const attachY   = height * rnd(0.55, 0.85);
            const branchLen = height * rnd(0.28, 0.48);
            const tilt      = rnd(0.45, 0.95);   // radians from vertical

            // Geometry base at origin, tip at +Y — so rotation pivots from the trunk.
            const geo = new THREE.CylinderGeometry(
                height * 0.018,
                height * 0.038,
                branchLen,
                6,
            );
            geo.translate(0, branchLen / 2, 0);

            const branch = new THREE.Mesh(geo, this._trunkMat);
            branch.rotation.z = tilt;           // tilt outward
            branch.castShadow = true;

            const pivot = new THREE.Group();
            pivot.position.y = attachY;
            pivot.rotation.y = azimuth;
            pivot.add(branch);
            this.group.add(pivot);

            // Tip in world space (THREE.js rotation.y matrix applied to pivot-local tip)
            const tipX =  Math.sin(tilt) * branchLen * Math.cos(azimuth);
            const tipY = attachY + Math.cos(tilt) * branchLen;
            const tipZ = -Math.sin(tilt) * branchLen * Math.sin(azimuth);
            this._addGlowNode(new THREE.Vector3(tipX, tipY, tipZ), glowColor, rnd(0.03, 0.06));
        }
    }

    // ── Canopy styles ─────────────────────────────────────────────────────────

    /**
     * Flat disc canopy with a ring of glowing nodes along the rim.
     * Evokes a broad-leafed alien umbrella tree.
     */
    _canopyUmbrella(topY, height, glowColor) {
        const radius = height * rnd(0.32, 0.52);

        const disc = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius * 0.65, height * 0.055, 11),
            new THREE.MeshStandardMaterial({
                color:             this._cfg.trunkColor,
                emissive:          this._cfg.trunkColor,
                emissiveIntensity: 0.08,
                roughness:         0.9,
                side:              THREE.DoubleSide,
            }),
        );
        disc.position.y = topY;
        disc.castShadow = true;
        this.group.add(disc);

        const nodeCount = rndInt(4, 7);
        for (let i = 0; i < nodeCount; i++) {
            const a = (i / nodeCount) * Math.PI * 2;
            const r = radius * rnd(0.7, 1.0);
            this._addGlowNode(
                new THREE.Vector3(Math.cos(a) * r, topY + rnd(-0.08, 0.08), Math.sin(a) * r),
                glowColor, rnd(0.03, 0.065),
            );
        }

        const light = new THREE.PointLight(glowColor, 1.2, height * 2.0);
        light.position.set(0, topY, 0);
        this.group.add(light);
    }

    /**
     * Cluster of elongated organic bulbs at the crown.
     * Evokes a bioluminescent fruiting body or spore pod cluster.
     */
    _canopyBulb(topY, height, glowColor) {
        const count   = rndInt(3, 6);
        const spread  = height * 0.22;
        const bulbMat = new THREE.MeshStandardMaterial({
            color:             glowColor,
            emissive:          glowColor,
            emissiveIntensity: rnd(0.35, 0.65),
            roughness:         0.4,
        });

        for (let i = 0; i < count; i++) {
            const a    = (i / count) * Math.PI * 2;
            const r    = rnd(0.3, 1.0) * spread;
            const size = rnd(0.06, 0.14) * height * 0.3;

            const bulb = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), bulbMat);
            bulb.position.set(Math.cos(a) * r, topY + rnd(0, 0.12), Math.sin(a) * r);
            bulb.scale.y = rnd(1.3, 2.0);    // elongate for organic pod shape
            this.group.add(bulb);
        }

        const light = new THREE.PointLight(glowColor, 1.8, height * 1.6);
        light.position.set(0, topY, 0);
        this.group.add(light);
    }

    /**
     * Hanging glowing tendrils drooping from the crown.
     * Evokes an anglerfish-like lure or weeping bioluminescent fringe.
     */
    _canopyDroop(topY, height, glowColor) {
        const count    = rndInt(5, 9);
        const spread   = height * 0.28;
        const stalkMat = new THREE.MeshStandardMaterial({ color: 0x0d1a10, roughness: 0.9 });
        const tipMat   = new THREE.MeshStandardMaterial({
            color:             glowColor,
            emissive:          glowColor,
            emissiveIntensity: 1.8,
            roughness:         0.15,
        });

        for (let i = 0; i < count; i++) {
            const a        = (i / count) * Math.PI * 2 + rnd(-0.4, 0.4);
            const r        = spread * rnd(0.5, 1.0);
            const droopLen = height * rnd(0.10, 0.26);
            const baseY    = topY + rnd(-0.05, 0.1);
            const ox       = Math.cos(a) * r;
            const oz       = Math.sin(a) * r;

            // Stalk hangs downward from base position
            const stalkGeo = new THREE.CylinderGeometry(0.007, 0.013, droopLen, 4);
            stalkGeo.translate(0, -droopLen / 2, 0);
            const stalk = new THREE.Mesh(stalkGeo, stalkMat);
            stalk.position.set(ox, baseY, oz);
            this.group.add(stalk);

            const tip = new THREE.Mesh(new THREE.SphereGeometry(rnd(0.022, 0.05), 8, 8), tipMat);
            tip.position.set(ox, baseY - droopLen, oz);
            this.group.add(tip);
        }
    }

    // ── Shared helper ─────────────────────────────────────────────────────────

    _addGlowNode(position, color, radius) {
        const node = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 8, 8),
            new THREE.MeshStandardMaterial({
                color:             color,
                emissive:          color,
                emissiveIntensity: 1.8,
                roughness:         0.2,
            }),
        );
        node.position.copy(position);
        this.group.add(node);
    }
}
