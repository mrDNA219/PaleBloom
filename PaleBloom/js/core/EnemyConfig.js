/**
 * EnemyConfig.js
 * Difficulty preset definitions for the AI seeker.
 *
 * Each config object fully describes one difficulty level across three axes:
 *   Perception    — what the AI can detect and how quickly
 *   Search        — how intelligently it hunts after losing the player
 *   Physical      — how fast and how much of the map it covers
 *
 * Usage:
 *   import { DIFFICULTY, lerpConfig } from '../core/EnemyConfig.js';
 *   const ai = new EnemyAI(enemy, DIFFICULTY.MEDIUM);
 *   const custom = lerpConfig(DIFFICULTY.MEDIUM, DIFFICULTY.HARD, 0.6);
 */

// ── Search quality enum ───────────────────────────────────────────────────────
export const SEARCH_QUALITY = Object.freeze({
    /**
     * Wanders randomly. Will miss large portions of the map.
     * Easy to evade by staying still after the AI passes.
     */
    RANDOM:     'random',

    /**
     * Two concentric rings of waypoints. Covers the area in broad sweeps
     * but leaves predictable gaps an attentive player can exploit.
     */
    SWEEP:      'sweep',

    /**
     * Serpentine grid. Methodically covers every row of the patrol zone.
     * Very difficult to hide from once a search is triggered.
     */
    SYSTEMATIC: 'systematic',
});

// ── Base template ─────────────────────────────────────────────────────────────
// All presets spread from this, overriding only what differs.
const BASE = {
    // ── Perception ────────────────────────────────────────────────────────────

    /** Full angle (degrees) of the vision cone. Easy = narrow tunnel. */
    fovAngle:              60,

    /** Maximum detection distance (world units). */
    fovRange:              10,

    /**
     * Suspicion built per second when the player is at the FOV centre at
     * maximum range. Scales up as the player gets closer.
     * At 1.0: fully detected in ~1 s from centre; at 0.2: ~5 s.
     */
    detectionSpeed:        0.5,

    /**
     * [0–1] Multiplier applied to detectionSpeed for the outer 30 % of
     * the FOV cone (the "peripheral zone").
     * 0.0 = peripheral zone is completely blind.
     * 1.0 = full sensitivity all the way to the edge.
     */
    peripheralSensitivity: 0.3,

    /**
     * Seconds the AI remembers a last-known position before abandoning the
     * search and returning to patrol.
     */
    memoryDuration:        12,

    // ── Search behaviour ──────────────────────────────────────────────────────

    /** How the AI covers space when patrolling or searching. */
    searchQuality:         SEARCH_QUALITY.SWEEP,

    /**
     * [0–1] Probability of a scrutiny check triggering when the AI comes
     * within ~4 units of the player's hiding flora.
     * A successful check reveals the player despite being hidden.
     */
    disguiseScrutiny:      0.2,

    /** Radius (world units) the AI wanders from the map origin during patrol. */
    patrolRadius:          16,

    /**
     * Whether the AI revisits "chokepoints" — locations the player is
     * likely to pass through (e.g. the player start position).
     */
    chokepointAwareness:   false,

    // ── Physical ──────────────────────────────────────────────────────────────

    /** World units per second during patrol / search. */
    moveSpeed:             2.4,

    /** World units per second during active chase. */
    chaseSpeed:            3.5,

    /**
     * Seconds before the AI can re-engage after the player successfully hides.
     * Acts as a grace window: if the player rehides within this window the AI
     * won't immediately pursue again.
     */
    reDetectionCooldown:   4.0,
};

// ── Difficulty presets ────────────────────────────────────────────────────────

export const DIFFICULTY = Object.freeze({

    /**
     * EASY — tunnel vision, slow reactions, poor memory, random wandering.
     * Survivable with minimal effort; good for onboarding.
     */
    EASY: {
        ...BASE,
        fovAngle:              35,
        fovRange:               6,
        detectionSpeed:         0.18,
        peripheralSensitivity:  0.0,
        memoryDuration:         5,
        searchQuality:          SEARCH_QUALITY.RANDOM,
        disguiseScrutiny:       0.04,
        patrolRadius:           10,
        chokepointAwareness:    false,
        moveSpeed:              1.7,
        chaseSpeed:             2.4,
        reDetectionCooldown:    8.0,
    },

    /**
     * MEDIUM — balanced. The "intended" difficulty.
     * Requires deliberate hiding and movement to survive.
     */
    MEDIUM: { ...BASE },

    /**
     * HARD — wide FOV, fast detection, systematic search.
     * Chokepoint revisits make opportunistic movement risky.
     */
    HARD: {
        ...BASE,
        fovAngle:              72,
        fovRange:              15,
        detectionSpeed:         1.0,
        peripheralSensitivity:  0.65,
        memoryDuration:         22,
        searchQuality:          SEARCH_QUALITY.SYSTEMATIC,
        disguiseScrutiny:       0.55,
        patrolRadius:           20,
        chokepointAwareness:    true,
        moveSpeed:              3.0,
        chaseSpeed:             4.4,
        reDetectionCooldown:    2.0,
    },

    /**
     * NIGHTMARE — near-omniscient, near-instant detection.
     * Virtually no safe movement; surviving requires perfect timing and
     * exploiting the reDetectionCooldown window.
     */
    NIGHTMARE: {
        ...BASE,
        fovAngle:              88,
        fovRange:              22,
        detectionSpeed:         2.0,
        peripheralSensitivity:  1.0,
        memoryDuration:         45,
        searchQuality:          SEARCH_QUALITY.SYSTEMATIC,
        disguiseScrutiny:       0.90,
        patrolRadius:           26,
        chokepointAwareness:    true,
        moveSpeed:              3.5,
        chaseSpeed:             5.5,
        reDetectionCooldown:    0.5,
    },
});

/**
 * Linearly interpolate between two config objects.
 * Numeric fields are lerped; enum/boolean fields snap at t = 0.5.
 *
 * @param {object} a  Starting config (t = 0)
 * @param {object} b  Ending config   (t = 1)
 * @param {number} t  [0–1]
 * @returns {object}
 */
export function lerpConfig(a, b, t) {
    const numericKeys = [
        'fovAngle', 'fovRange', 'detectionSpeed', 'peripheralSensitivity',
        'memoryDuration', 'disguiseScrutiny', 'patrolRadius',
        'moveSpeed', 'chaseSpeed', 'reDetectionCooldown',
    ];
    const result = {};
    for (const k of numericKeys) {
        result[k] = a[k] + (b[k] - a[k]) * t;
    }
    result.searchQuality       = t < 0.5 ? a.searchQuality       : b.searchQuality;
    result.chokepointAwareness = t < 0.5 ? a.chokepointAwareness : b.chokepointAwareness;
    return result;
}
