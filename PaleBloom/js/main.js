/**
 * main.js — Entry point
 *
 * Bootstraps the engine: creates the Renderer, wires it into the Game,
 * loads the initial scene, and starts the loop.
 */
import { Renderer    } from './core/Renderer.js';
import { Game        } from './core/Game.js';
import { TestScene   } from './scenes/TestScene.js';
import { DebugPanel  } from './debug/DebugPanel.js';

const container = document.getElementById('app');

const renderer = new Renderer(container);
const game     = new Game(renderer, { showFps: true });

// Debug panel
const debug = new DebugPanel();
debug.addToggle('FPS Counter', true, (enabled) => game.setShowFps(enabled));

game.loadScene(new TestScene());
game.start();
