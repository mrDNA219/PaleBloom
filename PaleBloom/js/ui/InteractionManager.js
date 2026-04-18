/**
 * InteractionManager.js
 * Proximity-based interaction system.
 *
 * Register interactables with a range, a prompt string, and a callback.
 * Each frame, call update(playerPosition) — the manager shows a DOM prompt
 * for the nearest in-range interactable and fires the callback on E-key press.
 *
 * Usage:
 *   const im = new InteractionManager();
 *
 *   // Register interactables (e.g. all flora in the scene):
 *   for (const flora of allFlora) {
 *       im.register({
 *           group:      flora.group,
 *           range:      3.5,
 *           prompt:     '[ E ]  Hide here',
 *           onInteract: () => hideInFlora(flora),
 *       });
 *   }
 *
 *   // Each frame:
 *   im.update(playerCreature.group.position);
 *
 *   // On scene exit:
 *   im.dispose();
 */

export class InteractionManager {
    constructor() {
        /** @type {Array<{group, range, prompt, onInteract}>} */
        this._entries   = [];
        this._active    = null;   // currently highlighted entry
        this._enabled   = true;

        this._prompt = this._buildPrompt();
        this._onKeyDown = (e) => {
            if (!this._enabled) return;
            if (e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                this._active?.onInteract();
            }
        };
        window.addEventListener('keydown', this._onKeyDown);
    }

    // ── Registration ──────────────────────────────────────────────────────────

    /**
     * Register an object the player can interact with.
     * @param {{group: THREE.Group, range: number, prompt: string, onInteract: function}} entry
     */
    register(entry) {
        this._entries.push(entry);
    }

    /**
     * Remove a previously registered entry by its group reference.
     * @param {THREE.Group} group
     */
    unregister(group) {
        this._entries = this._entries.filter(e => e.group !== group);
        if (this._active?.group === group) {
            this._active = null;
            this._hidePrompt();
        }
    }

    // ── Per-frame update ──────────────────────────────────────────────────────

    /**
     * Check proximity of all registered entries against the player position.
     * Shows the prompt for the nearest in-range entry; hides it if none qualify.
     * @param {THREE.Vector3} playerPos
     */
    update(playerPos) {
        if (!this._enabled) {
            this._hidePrompt();
            return;
        }

        let best     = null;
        let bestDist = Infinity;

        for (const entry of this._entries) {
            const gp = entry.group.position;
            const dx = gp.x - playerPos.x;
            const dz = gp.z - playerPos.z;
            const distSq = dx * dx + dz * dz;

            if (distSq <= entry.range * entry.range && distSq < bestDist) {
                best     = entry;
                bestDist = distSq;
            }
        }

        if (best !== this._active) {
            this._active = best;
            if (best) {
                this._showPrompt(best.prompt);
            } else {
                this._hidePrompt();
            }
        }
    }

    /**
     * Enable or disable the interaction system entirely.
     * While disabled the prompt is hidden and E-key does nothing.
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
        if (!enabled) this._hidePrompt();
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────

    dispose() {
        window.removeEventListener('keydown', this._onKeyDown);
        this._prompt?.remove();
        this._prompt  = null;
        this._entries = [];
        this._active  = null;
    }

    // ── DOM helpers ───────────────────────────────────────────────────────────

    _buildPrompt() {
        const el = document.createElement('div');
        Object.assign(el.style, {
            position:        'fixed',
            bottom:          '80px',
            left:            '50%',
            transform:       'translateX(-50%)',
            fontFamily:      'monospace',
            fontSize:        '15px',
            color:           '#aaffcc',
            background:      'rgba(0,0,0,0.55)',
            padding:         '6px 18px',
            borderRadius:    '4px',
            border:          '1px solid rgba(100,255,180,0.25)',
            letterSpacing:   '0.08em',
            pointerEvents:   'none',
            opacity:         '0',
            transition:      'opacity 0.18s ease',
            zIndex:          '20',
            userSelect:      'none',
            whiteSpace:      'nowrap',
        });
        document.body.appendChild(el);
        return el;
    }

    _showPrompt(text) {
        if (!this._prompt) return;
        this._prompt.textContent = text;
        this._prompt.style.opacity = '1';
    }

    _hidePrompt() {
        if (!this._prompt) return;
        this._prompt.style.opacity = '0';
    }
}
