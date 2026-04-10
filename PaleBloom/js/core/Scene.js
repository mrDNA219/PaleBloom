/**
 * Scene.js
 * Abstract base class for all game scenes.
 * Concrete scenes extend this and implement the lifecycle hooks.
 */
export class Scene {
    /**
     * Called once when the scene becomes active.
     * Use this to create Three.js objects, set up cameras, add event listeners, etc.
     * @param {Renderer} renderer
     */
    onEnter(renderer) {}   // eslint-disable-line no-unused-vars

    /**
     * Called once just before the scene is replaced by another.
     * Use this to dispose geometries/materials and remove event listeners.
     */
    onExit() {}

    /**
     * Called every frame before rendering.
     * @param {number} deltaTime - Seconds elapsed since the last frame.
     */
    update(deltaTime) {}   // eslint-disable-line no-unused-vars

    /**
     * Called every frame after update().
     * @param {Renderer} renderer
     */
    render(renderer) {}    // eslint-disable-line no-unused-vars
}
