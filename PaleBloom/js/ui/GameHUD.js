/**
 * GameHUD.js
 * In-game overlay: countdown timer, phase status, hidden indicator.
 *
 * Usage:
 *   const hud = new GameHUD();
 *   hud.setTime(28.4);          // call each frame during hiding phase
 *   hud.setPhase('hunt');
 *   hud.setHidden(true);
 *   hud.dispose();
 */
export class GameHUD {
    constructor() {
        this._buildDOM();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Update the countdown display. Only visible during 'hiding' phase.
     * @param {number} seconds  Remaining seconds (float).
     */
    setTime(seconds) {
        const s = Math.ceil(seconds);
        this._timerEl.textContent = s;

        if (s > 15)     this._timerEl.style.color = '#44ffaa';
        else if (s > 7) this._timerEl.style.color = '#ffdd88';
        else            this._timerEl.style.color = '#ff5522';
    }

    /**
     * Switch the HUD to match the current game phase.
     * @param {'hiding'|'hunt'} phase
     */
    setPhase(phase) {
        if (phase === 'hiding') {
            this._phaseEl.textContent     = 'FIND COVER';
            this._phaseEl.style.color     = '#aaffcc';
            this._timerWrap.style.display = 'block';
        } else if (phase === 'caught') {
            this._phaseEl.textContent     = '✖  YOU WERE FOUND';
            this._phaseEl.style.color     = '#ff2200';
            this._timerWrap.style.display = 'none';
            this.setHidden(false);
        } else {
            this._phaseEl.textContent     = '⚠  ENEMY IS HUNTING';
            this._phaseEl.style.color     = '#ff5522';
            this._timerWrap.style.display = 'none';
        }
    }

    /**
     * Show or hide the HIDDEN status badge.
     * @param {boolean} hidden
     */
    setHidden(hidden) {
        this._hiddenEl.style.opacity = hidden ? '1' : '0';
    }

    dispose() {
        this._root?.remove();
    }

    // ── DOM construction ──────────────────────────────────────────────────────

    _buildDOM() {
        this._root = document.createElement('div');
        Object.assign(this._root.style, {
            position:      'fixed',
            top:           '0',
            left:          '0',
            width:         '100%',
            pointerEvents: 'none',
            userSelect:    'none',
            fontFamily:    'monospace',
            zIndex:        '100',
        });

        // ── Phase message (top-center) ────────────────────────────────────────
        this._phaseEl = document.createElement('div');
        Object.assign(this._phaseEl.style, {
            textAlign:   'center',
            marginTop:   '18px',
            fontSize:    '14px',
            letterSpacing: '0.18em',
            fontWeight:  'bold',
            color:       '#aaffcc',
            textShadow:  '0 0 10px currentColor',
        });
        this._root.appendChild(this._phaseEl);

        // ── Timer wrapper (top-center, below phase) ───────────────────────────
        this._timerWrap = document.createElement('div');
        Object.assign(this._timerWrap.style, { textAlign: 'center' });

        this._timerEl = document.createElement('div');
        Object.assign(this._timerEl.style, {
            display:    'inline-block',
            fontSize:   '64px',
            fontWeight: 'bold',
            color:      '#44ffaa',
            lineHeight: '1',
            marginTop:  '4px',
            textShadow: '0 0 20px currentColor',
        });
        this._timerWrap.appendChild(this._timerEl);
        this._root.appendChild(this._timerWrap);

        // ── Hidden badge (bottom-center) ──────────────────────────────────────
        this._hiddenEl = document.createElement('div');
        Object.assign(this._hiddenEl.style, {
            position:      'fixed',
            bottom:        '24px',
            left:          '50%',
            transform:     'translateX(-50%)',
            padding:       '5px 18px',
            background:    'rgba(0, 0, 0, 0.6)',
            border:        '1px solid #44ffaa66',
            borderRadius:  '4px',
            fontSize:      '13px',
            letterSpacing: '0.14em',
            color:         '#44ffaa',
            textShadow:    '0 0 8px #44ffaa',
            opacity:       '0',
            transition:    'opacity 0.3s ease',
            pointerEvents: 'none',
        });
        this._hiddenEl.textContent = 'HIDDEN';
        this._root.appendChild(this._hiddenEl);

        document.body.appendChild(this._root);

        // Initialise to hiding phase with placeholder timer
        this.setPhase('hiding');
        this.setTime(30);
        this.setHidden(false);
    }
}
