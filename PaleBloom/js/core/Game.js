/**
 * Game.js
 * Central game manager.
 * Owns the main loop (requestAnimationFrame) and the active Scene.
 * Scenes are swapped via loadScene() — only one scene is active at a time.
 */
import { FpsCounter } from './FpsCounter.js';

export class Game {
    /**
     * @param {Renderer} renderer
     * @param {object}   [options]
     * @param {boolean}  [options.showFps=false] - Display the FPS counter overlay.
     */
    constructor(renderer, options = {}) {
        this._renderer   = renderer;
        this._scene      = null;
        this._rafId      = null;
        this._lastTime   = 0;
        this._running    = false;
        this._fpsCounter = options.showFps ? new FpsCounter() : null;
    }

    /**
     * Replace the current scene with a new one.
     * Calls onExit() on the outgoing scene and onEnter() on the incoming one.
     * @param {Scene} scene
     */
    loadScene(scene) {
        if (this._scene) {
            this._scene.onExit();
        }

        this._scene = scene;
        this._scene.onEnter(this._renderer);
    }

    /** Start the game loop. Safe to call multiple times (idempotent). */
    start() {
        if (this._running) return;
        this._running = true;
        this._lastTime = performance.now();
        this._rafId = requestAnimationFrame(this._loop.bind(this));
    }

    /** Pause the game loop without destroying anything. */
    pause() {
        this._running = false;
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    /**
     * Enable or disable the FPS counter at runtime.
     * @param {boolean} enabled
     */
    setShowFps(enabled) {
        if (enabled && !this._fpsCounter) {
            this._fpsCounter = new FpsCounter();
        } else if (!enabled && this._fpsCounter) {
            this._fpsCounter.dispose();
            this._fpsCounter = null;
        }
    }

    /** Resume after pause(). */
    resume() {
        if (this._running) return;
        this._lastTime = performance.now(); // reset delta so we don't get a huge spike
        this._running = true;
        this._rafId = requestAnimationFrame(this._loop.bind(this));
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _loop(timestamp) {
        if (!this._running) return;

        const deltaTime = Math.min((timestamp - this._lastTime) / 1000, 0.1); // cap at 100 ms
        this._lastTime  = timestamp;

        this._fpsCounter?.update(timestamp);

        if (this._scene) {
            this._scene.update(deltaTime);
            this._scene.render(this._renderer);
        }

        this._rafId = requestAnimationFrame(this._loop.bind(this));
    }
}
