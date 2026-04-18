/**
 * EnemyAI.js
 * State-machine brain for EnemyCreature. Drives movement via the creature's
 * setMoveTarget / clearMoveTarget API — never touches geometry directly.
 *
 * States
 *   PATROL  — wanders the map using search-quality waypoints
 *   ALERT   — suspicion building; creature slows and orients toward player
 *   CHASE   — full pursuit of last-known player position
 *   SEARCH  — player lost; methodically or randomly covers the last-known area
 *
 * Usage:
 *   import { EnemyAI }    from '../entities/EnemyAI.js';
 *   import { DIFFICULTY } from '../core/EnemyConfig.js';
 *
 *   const ai = new EnemyAI(enemyCreature, DIFFICULTY.MEDIUM);
 *   // each frame (creature.update FIRST, then ai.update):
 *   ai.update(deltaTime, playerGroup, isHiding, hidingFloraGroup);
 *
 * The AI fires an optional callback when it catches the player:
 *   ai.onCatch = () => { /* game-over logic *\/ };
 */
import * as THREE from 'three';
import { SEARCH_QUALITY } from '../core/EnemyConfig.js';

// ── Tuning ────────────────────────────────────────────────────────────────────
const CATCH_DIST         = 1.1;   // world units — triggers onCatch
const ALERT_SLOW_FACTOR  = 0.55;  // patrol speed multiplier while suspicious
const SEARCH_WAYPOINT_R  = 5.0;   // radius of the search grid/ring around LKP
const PATROL_WAIT_MIN    = 0.6;   // seconds to idle between patrol waypoints
const PATROL_WAIT_MAX    = 2.2;
const ALERT_DECAY_RATE   = 0.25;  // suspicion lost per second when out of view

// ── States ────────────────────────────────────────────────────────────────────
const STATE = Object.freeze({
    PATROL: 'patrol',
    ALERT:  'alert',
    CHASE:  'chase',
    SEARCH: 'search',
});

// ── Helper ────────────────────────────────────────────────────────────────────
function rnd(min, max) { return min + Math.random() * (max - min); }

export class EnemyAI {
    /**
     * @param {import('./EnemyCreature.js').EnemyCreature} creature
     * @param {object} config  A DIFFICULTY preset from EnemyConfig.js
     */
    constructor(creature, config) {
        this._c   = creature;
        this._cfg = config;

        this._state        = STATE.PATROL;
        this._suspicion    = 0;          // [0, 1]
        this._lkp          = null;       // last-known player position (Vector3)
        this._memoryTimer  = 0;          // counts down from memoryDuration
        this._waitTimer    = 0;          // idle pause between waypoints
        this._reDetectCD   = 0;          // re-detection cooldown timer
        this._searchQueue  = [];         // ordered waypoints for SEARCH state
        this._chokepoints  = [];         // revisit hotspots for chokepointAwareness

        /** Called when the AI reaches the player. Override from outside. */
        this.onCatch = null;

        this._buildChokepoints();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Advance the AI one tick.
     * @param {number}             dt
     * @param {THREE.Group}        playerGroup    The player creature's group
     * @param {boolean}            isHiding       Whether the player is currently hidden
     * @param {object|null}        hidingFlora    The flora instance (with .group) used for hiding
     */
    update(dt, playerGroup, isHiding, hidingFlora) {
        // Tick cooldown timers
        if (this._reDetectCD > 0) this._reDetectCD -= dt;

        switch (this._state) {
            case STATE.PATROL: this._tickPatrol(dt, playerGroup, isHiding, hidingFlora); break;
            case STATE.ALERT:  this._tickAlert(dt, playerGroup, isHiding, hidingFlora);  break;
            case STATE.CHASE:  this._tickChase(dt, playerGroup, isHiding, hidingFlora);  break;
            case STATE.SEARCH: this._tickSearch(dt, playerGroup, isHiding, hidingFlora); break;
        }
    }

    /** Read-only state access (useful for HUD / debug). */
    get state()      { return this._state; }
    get suspicion()  { return this._suspicion; }

    // ── Perception helpers ────────────────────────────────────────────────────

    /**
     * Returns a [0, 1] visibility factor:
     *   0  = player completely outside FOV or hidden
     *   >0 = how strongly the player registers (1 = dead-centre, close)
     */
    _visibilityOf(playerGroup, isHiding, hidingFlora, dt = 0.016) {
        if (this._reDetectCD > 0) return 0;

        const cfg        = this._cfg;
        const enemyPos   = this._c.group.position;
        const playerPos  = playerGroup.position;

        const dx = playerPos.x - enemyPos.x;
        const dz = playerPos.z - enemyPos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq > cfg.fovRange * cfg.fovRange) return 0;

        const dist = Math.sqrt(distSq);

        // Angle between enemy forward direction and direction-to-player
        const enemyFwd  = new THREE.Vector3(
            Math.sin(this._c.group.rotation.y),
            0,
            Math.cos(this._c.group.rotation.y),
        );
        const toPlayer  = new THREE.Vector3(dx, 0, dz).normalize();
        const cosAngle  = enemyFwd.dot(toPlayer);
        const halfFovR  = (cfg.fovAngle / 2) * (Math.PI / 180);
        const cosHalfFov = Math.cos(halfFovR);

        if (cosAngle < cosHalfFov) return 0;  // outside FOV cone entirely

        // Peripheral zone: outer 30 % of the half-angle
        const innerCos = Math.cos(halfFovR * 0.7);
        const isPeripheral = cosAngle < innerCos;
        if (isPeripheral && cfg.peripheralSensitivity === 0) return 0;

        // Range factor: stronger the closer the player is
        const rangeFactor = 1 - (dist / cfg.fovRange);

        // Peripheral dampening
        const sensitivityMul = isPeripheral ? cfg.peripheralSensitivity : 1.0;

        let vis = rangeFactor * sensitivityMul;

        // Hidden in flora: scrutiny check
        if (isHiding && hidingFlora) {
            // Flat disguise factor — only a scrutiny roll can break it
            const proximity = dist < 4 ? 1 : 0;
            if (proximity && Math.random() < cfg.disguiseScrutiny * dt) {
                // Scrutiny succeeded — treat as fully visible for this frame
                vis *= 1.0;
            } else {
                vis = 0;
            }
        }

        return Math.max(0, vis);
    }

    // ── State ticks ───────────────────────────────────────────────────────────

    _tickPatrol(dt, playerGroup, isHiding, hidingFlora) {
        const vis = this._visibilityOf(playerGroup, isHiding, hidingFlora, dt);

        if (vis > 0) {
            this._suspicion += vis * this._cfg.detectionSpeed * dt;
            if (this._suspicion >= 1) {
                this._suspicion = 1;
                this._enterChase(playerGroup.position);
                return;
            }
            this._enterAlert();
            return;
        }

        // Decay suspicion when nothing is seen
        this._suspicion = Math.max(0, this._suspicion - ALERT_DECAY_RATE * dt);

        this._doPatrolMovement(dt);

        if (this._cfg.chokepointAwareness) {
            this._injectChokepoint();
        }
    }

    _tickAlert(dt, playerGroup, isHiding, hidingFlora) {
        const vis = this._visibilityOf(playerGroup, isHiding, hidingFlora, dt);

        if (vis > 0) {
            this._suspicion += vis * this._cfg.detectionSpeed * dt;
            // Face the player slowly while alert
            this._c.setMoveTarget(
                playerGroup.position.x,
                playerGroup.position.z,
                this._cfg.moveSpeed * ALERT_SLOW_FACTOR,
            );

            if (this._suspicion >= 1) {
                this._suspicion = 1;
                this._enterChase(playerGroup.position);
            }
        } else {
            this._suspicion = Math.max(0, this._suspicion - ALERT_DECAY_RATE * dt);
            if (this._suspicion <= 0) {
                this._state = STATE.PATROL;
                this._c.clearMoveTarget();
            }
        }
    }

    _tickChase(dt, playerGroup, isHiding, hidingFlora) {
        const vis = this._visibilityOf(playerGroup, isHiding, hidingFlora, dt);

        if (vis > 0 || !isHiding) {
            // Update last-known position while we can see them (or they aren't hidden)
            if (vis > 0) {
                this._lkp = playerGroup.position.clone();
                this._memoryTimer = this._cfg.memoryDuration;
            }
        }

        // Check catch distance
        const ep = this._c.group.position;
        const pp = playerGroup.position;
        const catchDx = pp.x - ep.x;
        const catchDz = pp.z - ep.z;
        if (!isHiding && catchDx * catchDx + catchDz * catchDz < CATCH_DIST * CATCH_DIST) {
            this.onCatch?.();
            this._enterSearch();
            return;
        }

        if (this._lkp) {
            this._c.setMoveTarget(this._lkp.x, this._lkp.z, this._cfg.chaseSpeed);
        }

        // Player successfully hid — start memory timer and switch to search
        if (isHiding && vis === 0) {
            this._reDetectCD = this._cfg.reDetectionCooldown;
            this._enterSearch();
        }

        this._memoryTimer -= dt;
        if (this._memoryTimer <= 0) {
            this._enterSearch();
        }
    }

    _tickSearch(dt, playerGroup, isHiding, hidingFlora) {
        const vis = this._visibilityOf(playerGroup, isHiding, hidingFlora, dt);
        if (vis > 0) {
            this._suspicion += vis * this._cfg.detectionSpeed * dt;
            if (this._suspicion >= 1) {
                this._suspicion = 1;
                this._enterChase(playerGroup.position);
                return;
            }
        }

        this._memoryTimer -= dt;
        if (this._memoryTimer <= 0) {
            this._state = STATE.PATROL;
            this._c.clearMoveTarget();
            return;
        }

        // Advance through the search waypoint queue
        if (!this._c.hasTarget) {
            if (this._searchQueue.length > 0) {
                const wp = this._searchQueue.shift();
                this._c.setMoveTarget(wp.x, wp.z, this._cfg.moveSpeed);
            } else {
                // Re-generate the queue so we keep searching until memory runs out
                this._buildSearchQueue(this._lkp);
            }
        }
    }

    // ── State transitions ─────────────────────────────────────────────────────

    _enterAlert() {
        if (this._state === STATE.ALERT) return;
        this._state = STATE.ALERT;
    }

    _enterChase(targetPos) {
        this._state = STATE.CHASE;
        this._lkp   = targetPos.clone();
        this._memoryTimer = this._cfg.memoryDuration;
        this._c.setMoveTarget(targetPos.x, targetPos.z, this._cfg.chaseSpeed);
    }

    _enterSearch() {
        if (this._state === STATE.SEARCH) return;
        this._state = STATE.SEARCH;
        this._memoryTimer = this._cfg.memoryDuration;
        this._buildSearchQueue(this._lkp ?? this._c.group.position);
    }

    // ── Patrol movement ───────────────────────────────────────────────────────

    _doPatrolMovement(dt) {
        if (this._c.hasTarget) return;

        if (this._waitTimer > 0) {
            this._waitTimer -= dt;
            return;
        }

        const wp = this._nextPatrolWaypoint();
        this._c.setMoveTarget(wp.x, wp.z, this._cfg.moveSpeed);
        this._waitTimer = rnd(PATROL_WAIT_MIN, PATROL_WAIT_MAX);
    }

    _nextPatrolWaypoint() {
        const r = this._cfg.patrolRadius;
        switch (this._cfg.searchQuality) {
            case SEARCH_QUALITY.SYSTEMATIC:
                return this._systematicPatrolPoint(r);
            case SEARCH_QUALITY.SWEEP:
                return this._sweepPatrolPoint(r);
            default:
                return this._randomPatrolPoint(r);
        }
    }

    _randomPatrolPoint(r) {
        const angle = Math.random() * Math.PI * 2;
        const dist  = Math.random() * r;
        return { x: Math.cos(angle) * dist, z: Math.sin(angle) * dist };
    }

    _sweepPatrolPoint(r) {
        // Alternate between inner ring (r*0.45) and outer ring (r*0.85)
        this._sweepToggle = !this._sweepToggle;
        const ringR = this._sweepToggle ? r * 0.45 : r * 0.85;
        const angle = Math.random() * Math.PI * 2;
        return { x: Math.cos(angle) * ringR, z: Math.sin(angle) * ringR };
    }

    _systematicPatrolPoint(r) {
        // Advance along a serpentine grid over the patrol area
        if (!this._gridState) {
            const cols = 5;
            this._gridState = { row: 0, col: 0, dir: 1, cols };
        }
        const g    = this._gridState;
        const step = (r * 2) / g.cols;
        const x    = -r + g.col * step + rnd(-step * 0.2, step * 0.2);
        const z    = -r + g.row * step + rnd(-step * 0.2, step * 0.2);

        g.col += g.dir;
        if (g.col >= g.cols || g.col < 0) {
            g.dir = -g.dir;
            g.col += g.dir;
            g.row = (g.row + 1) % g.cols;
        }
        return { x, z };
    }

    // ── Search-mode waypoint generation ──────────────────────────────────────

    _buildSearchQueue(origin) {
        this._searchQueue = [];
        const lkp = origin ?? { x: 0, z: 0 };

        switch (this._cfg.searchQuality) {
            case SEARCH_QUALITY.SYSTEMATIC:
                this._buildSystematicSearch(lkp);
                break;
            case SEARCH_QUALITY.SWEEP:
                this._buildSweepSearch(lkp);
                break;
            default:
                this._buildRandomSearch(lkp);
        }
    }

    _buildRandomSearch(lkp) {
        for (let i = 0; i < 6; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = SEARCH_WAYPOINT_R * Math.random();
            this._searchQueue.push({
                x: lkp.x + Math.cos(a) * r,
                z: lkp.z + Math.sin(a) * r,
            });
        }
    }

    _buildSweepSearch(lkp) {
        const rings = [SEARCH_WAYPOINT_R * 0.4, SEARCH_WAYPOINT_R];
        for (const r of rings) {
            const steps = r < 3 ? 4 : 6;
            for (let i = 0; i < steps; i++) {
                const a = (i / steps) * Math.PI * 2;
                this._searchQueue.push({
                    x: lkp.x + Math.cos(a) * r,
                    z: lkp.z + Math.sin(a) * r,
                });
            }
        }
    }

    _buildSystematicSearch(lkp) {
        const r    = SEARCH_WAYPOINT_R;
        const cols = 4;
        const step = (r * 2) / cols;
        let dir = 1;
        for (let row = 0; row <= cols; row++) {
            const rowZ = lkp.z - r + row * step;
            const colRange = dir > 0
                ? Array.from({ length: cols + 1 }, (_, i) => i)
                : Array.from({ length: cols + 1 }, (_, i) => cols - i);
            for (const col of colRange) {
                this._searchQueue.push({
                    x: lkp.x - r + col * step + rnd(-step * 0.1, step * 0.1),
                    z: rowZ                     + rnd(-step * 0.1, step * 0.1),
                });
            }
            dir = -dir;
        }
    }

    // ── Chokepoints ───────────────────────────────────────────────────────────

    _buildChokepoints() {
        // Player start is the most likely high-traffic point
        this._chokepoints = [
            { x: 0, z: 0 },
            { x: 3, z: 3 }, { x: -3, z: -3 },
            { x: 3, z: -3 }, { x: -3, z: 3 },
        ];
        this._chokeIndex = 0;
    }

    _injectChokepoint() {
        // Only inject a chokepoint visit when idle — avoid disrupting active pursuit
        if (this._c.hasTarget || this._waitTimer > 0) return;
        if (Math.random() > 0.18) return;   // 18 % chance per idle tick

        const cp = this._chokepoints[this._chokeIndex % this._chokepoints.length];
        this._chokeIndex++;
        this._c.setMoveTarget(cp.x, cp.z, this._cfg.moveSpeed);
    }
}
