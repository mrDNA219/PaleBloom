/**
 * Renderer.js
 * Thin wrapper around the Three.js WebGLRenderer.
 * Owns the canvas element and handles viewport resizing.
 */
import * as THREE from 'three';

export class Renderer {
    /**
     * @param {HTMLElement} container - The DOM element that will hold the canvas.
     */
    constructor(container) {
        this._renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        });

        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(container.clientWidth, container.clientHeight);
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.appendChild(this._renderer.domElement);

        this._container = container;
        this._resizeObserver = new ResizeObserver(() => this._onResize());
        this._resizeObserver.observe(container);
    }

    /** The raw Three.js WebGLRenderer — exposed for scenes that need it directly. */
    get three() {
        return this._renderer;
    }

    /** Render a Three.js scene from a given camera. */
    render(threeScene, camera) {
        this._renderer.render(threeScene, camera);
    }

    /** Current viewport width in pixels. */
    get width() {
        return this._renderer.domElement.clientWidth;
    }

    /** Current viewport height in pixels. */
    get height() {
        return this._renderer.domElement.clientHeight;
    }

    get aspectRatio() {
        return this.width / this.height;
    }

    _onResize() {
        const w = this._container.clientWidth;
        const h = this._container.clientHeight;
        this._renderer.setSize(w, h); // updateStyle=true (default) keeps canvas inline style in sync
    }

    dispose() {
        this._resizeObserver.disconnect();
        this._renderer.dispose();
    }
}
