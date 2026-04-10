/**
 * FpsCounter.js
 * Lightweight FPS monitor that renders as a DOM overlay.
 *
 * Tracks a rolling 1-second window of frame timestamps to calculate
 * a stable FPS value, updating the display every 200ms so it's
 * readable without flickering.
 */
export class FpsCounter {
    constructor() {
        this._frameTimes   = [];   // timestamps (ms) of recent frames
        this._lastDisplay  = 0;    // last time the DOM was updated
        this._displayEvery = 200;  // ms between DOM updates

        this._el = this._createElement();
        document.body.appendChild(this._el);
    }

    /**
     * Call once per frame from the game loop.
     * @param {number} timestamp - The same timestamp passed to the rAF callback (ms).
     */
    update(timestamp) {
        // Keep only frames from the last second
        this._frameTimes.push(timestamp);
        const cutoff = timestamp - 1000;
        while (this._frameTimes.length > 0 && this._frameTimes[0] < cutoff) {
            this._frameTimes.shift();
        }

        // Throttle DOM writes to avoid layout thrashing every frame
        if (timestamp - this._lastDisplay >= this._displayEvery) {
            this._el.textContent = `FPS: ${this._frameTimes.length}`;
            this._lastDisplay = timestamp;
        }
    }

    /** Remove the overlay element from the DOM. */
    dispose() {
        this._el.remove();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _createElement() {
        const el = document.createElement('div');

        Object.assign(el.style, {
            position:        'fixed',
            top:             '10px',
            left:            '10px',
            padding:         '4px 8px',
            background:      'rgba(0, 0, 0, 0.55)',
            color:           '#00ff88',
            fontFamily:      'monospace',
            fontSize:        '13px',
            borderRadius:    '4px',
            pointerEvents:   'none',   // never blocks mouse events on the canvas
            userSelect:      'none',
            zIndex:          '9999',
        });

        el.textContent = 'FPS: --';
        return el;
    }
}
