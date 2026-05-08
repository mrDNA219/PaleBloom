/**
 * TestScene.js
 * The primary gameplay scene.
 *
 * Game loop:
 *  1. HIDING phase (30 s) — player clicks flora to hide inside it.
 *     Click ground to move; click any flora object to hide in it.
 *     Press Escape to leave a hiding spot.
 *  2. HUNT phase — an EnemyCreature spawns at the map edge and wanders.
 *     Detection logic is deferred; for now the enemy just patrols.
 *
 * Controls:
 *   Left-click ground  → move player creature
 *   Left-click flora   → hide inside that object (creature becomes invisible)
 *   Escape             → unhide and return to free movement
 *   Hold Tab           → enable camera orbit / pan
 *   Scroll             → zoom (always active)
 */
import * as THREE from 'three';
import { OrbitControls }  from 'three/addons/controls/OrbitControls.js';
import { Scene }          from '../core/Scene.js';
import { Creature }       from '../entities/Creature.js';
import { AlienTree }      from '../entities/AlienTree.js';
import { AlienFoliage }   from '../entities/AlienFoliage.js';
import { EnemyCreature }      from '../entities/EnemyCreature.js';
import { EnemyAI }            from '../entities/EnemyAI.js';
import { DIFFICULTY }         from '../core/EnemyConfig.js';
import { GameHUD }            from '../ui/GameHUD.js';
import { InteractionManager } from '../ui/InteractionManager.js';
import { ControlsDisplay }    from '../ui/ControlsDisplay.js';

// Player movement constants
const PET_SPIN_SPEED       = 1.2;
const PET_MOVE_SPEED       = 2.2;
const PET_TURN_SPEED       = 8.0;
const PET_ARRIVAL_DIST     = 0.08;
const BOB_AMPLITUDE        = 0.18;
const BOB_SPEED_IDLE       = 2.0;
const BOB_SPEED_WALK       = 7.0;
const CLICK_MOVE_THRESHOLD = 5;

// Game phase constants
const HIDE_PHASE_DURATION = 30;   // seconds before the enemy spawns
const ENEMY_SPAWN_RADIUS  = 20;   // units from origin — far edge of map

// Hiding constants
const HIDE_RADIUS = 3.5;          // max distance from creature to a hide-able flora

export class TestScene extends Scene {
    constructor() {
        super();

        this._threeScene = new THREE.Scene();
        this._camera     = null;
        this._controls   = null;
        this._creature   = null;
        this._elapsed    = 0;

        // Player movement state
        this._targetPos      = null;
        this._isMoving       = false;
        this._heading        = 0;
        this._pointerDownPos = null;

        // Hiding state
        this._hidingIn   = null;    // flora instance the player is currently inside
        this._isHiding   = false;
        this._hideRing   = null;    // ground ring visualising the interaction radius

        // Game phase
        this._phase      = 'hiding';
        this._phaseTimer = HIDE_PHASE_DURATION;

        // Enemy
        this._enemy   = null;
        this._enemyAI = null;

        // Interaction
        this._interactionManager = null;

        // Flora
        this._flora       = [];
        this._floraMeshes = [];     // flat list of all flora Mesh objects for raycasting

        // HUD
        this._hud             = null;
        this._controlsDisplay = null;

        // Tab-to-orbit
        this._tabHeld = false;

        // Bound handlers
        this._onPointerDown = null;
        this._onPointerUp   = null;
        this._onKeyDown     = null;
        this._onKeyUp       = null;
    }

    // Scene lifecycle

    onEnter(renderer) {
        this._buildCamera(renderer.aspectRatio);
        this._buildLighting();
        this._interactionManager = new InteractionManager();
        this._buildEnvironment();

        this._creature = new Creature();
        this._creature.group.position.set(0, 1, 0);
        this._threeScene.add(this._creature.group);

        // Circle of influence — shows which flora are within hiding range.
        this._hideRing = new THREE.Mesh(
            new THREE.RingGeometry(HIDE_RADIUS - 0.07, HIDE_RADIUS, 72),
            new THREE.MeshBasicMaterial({
                color:       0x44ffaa,
                transparent: true,
                opacity:     0.35,
                side:        THREE.DoubleSide,
                depthWrite:  false,
            }),
        );
        this._hideRing.rotation.x = -Math.PI / 2;
        this._hideRing.position.y = 0.02;
        this._threeScene.add(this._hideRing);

        this._controls = new OrbitControls(this._camera, renderer.three.domElement);
        this._controls.target.set(0, 1, 0);
        this._controls.enableDamping  = true;
        this._controls.dampingFactor  = 0.08;
        this._controls.enableRotate   = false;
        this._controls.enablePan      = false;
        this._controls.minDistance    = 2;
        this._controls.maxDistance    = 28;
        this._controls.update();

        this._hud = new GameHUD();
        this._hud.setPhase('hiding');
        this._hud.setTime(HIDE_PHASE_DURATION);

        this._controlsDisplay = new ControlsDisplay();

        this._setupClickControls(renderer.three.domElement);
        this._setupKeyControls();

        this._resizeObserver = new ResizeObserver(() => {
            this._camera.aspect = renderer.aspectRatio;
            this._camera.updateProjectionMatrix();
        });
        this._resizeObserver.observe(renderer.three.domElement.parentElement);
    }

    onExit() {
        this._resizeObserver?.disconnect();
        this._controls?.dispose();

        const canvas = this._controls?.domElement;
        if (canvas && this._onPointerDown) {
            canvas.removeEventListener('pointerdown', this._onPointerDown);
            canvas.removeEventListener('pointerup',   this._onPointerUp);
        }
        if (this._onKeyDown) {
            window.removeEventListener('keydown', this._onKeyDown);
            window.removeEventListener('keyup',   this._onKeyUp);
        }

        this._creature?.dispose();
        this._enemy?.dispose();
        this._hud?.dispose();
        this._controlsDisplay?.dispose();
        this._interactionManager?.dispose();

        if (this._hideRing) {
            this._hideRing.geometry.dispose();
            this._hideRing.material.dispose();
            this._hideRing = null;
        }

        for (const f of this._flora) f.dispose();
        this._flora       = [];
        this._floraMeshes = [];
    }

    render(renderer) {
        renderer.render(this._threeScene, this._camera);
    }

    // Scene construction

    _buildCamera(aspect) {
        this._camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200);
        this._camera.position.set(0, 2.5, 6);
        this._camera.lookAt(0, 1, 0);
    }

    _buildLighting() {
        const scene = this._threeScene;

        scene.add(new THREE.AmbientLight(0x0d2010, 4));

        const key = new THREE.DirectionalLight(0xffe8b0, 3);
        key.position.set(4, 8, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far  = 50;
        scene.add(key);

        const rim = new THREE.DirectionalLight(0x1a6644, 1.5);
        rim.position.set(-4, 3, -6);
        scene.add(rim);

        scene.fog        = new THREE.FogExp2(0x030d06, 0.028);
        scene.background = new THREE.Color(0x030d06);
    }

    _buildEnvironment() {
        const scene = this._threeScene;

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 50),
            new THREE.MeshStandardMaterial({ color: 0x081208, roughness: 1.0, metalness: 0.0 }),
        );
        plane.rotation.x  = -Math.PI / 2;
        plane.receiveShadow = true;
        scene.add(plane);

        // Bioluminescent ground spores near the player start area
        const sporeGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const sporeMat = new THREE.MeshStandardMaterial({
            color: 0x88ffaa, emissive: 0x44ff88, emissiveIntensity: 1.2, roughness: 0.3,
        });
        for (const [x, y, z] of [
            [-1.8,0.04,-1.2],[2.1,0.04,-0.8],[-0.5,0.04,-2.5],[3.0,0.04,1.5],
            [-2.5,0.04,2.0],[1.2,0.04,2.8],[-1.0,0.04,1.8],[2.8,0.04,-2.2],
            [-3.2,0.04,-0.5],[0.8,0.04,-3.0],[-2.0,0.04,-3.5],[1.5,0.04,-1.5],
            [-3.5,0.04,1.2],[0.3,0.04,3.5],[3.5,0.04,0.2],
        ]) {
            const spore = new THREE.Mesh(sporeGeo, sporeMat);
            spore.position.set(x, y, z);
            scene.add(spore);
        }

        this._scatterFlora(scene);
    }

    _scatterFlora(scene) {
        const HALF = 23;

        const place = (inst, clearRadius) => {
            let x, z;
            do {
                x = (Math.random() * 2 - 1) * HALF;
                z = (Math.random() * 2 - 1) * HALF;
            } while (x * x + z * z < clearRadius * clearRadius);

            inst.group.position.set(x, 0, z);
            inst.group.rotation.y = Math.random() * Math.PI * 2;
            scene.add(inst.group);
            this._flora.push(inst);

            // Tag every mesh with a back-reference and register for raycasting
            inst.group.traverse(obj => {
                if (!obj.isMesh) return;
                obj.userData.floraInstance = inst;
                this._floraMeshes.push(obj);
            });

            // Register with interaction system so E-key can trigger hiding
            this._interactionManager.register({
                group:      inst.group,
                range:      HIDE_RADIUS,
                prompt:     '[ E ]  Hide here',
                onInteract: () => {
                    if (!this._isHiding) this._hideInFlora(inst);
                },
            });
        };

        for (let i = 0; i < 38; i++) place(AlienTree.random(),    3.5);
        for (let i = 0; i < 95; i++) place(AlienFoliage.random(), 1.0);
    }

    // Per-frame update

    update(deltaTime) {
        this._elapsed += deltaTime;
        this._controls?.update();

        this._updatePhase(deltaTime);

        if (this._creature) {
            if (!this._isHiding) {
                this._updateMovement(deltaTime);

                const bobSpeed = this._isMoving ? BOB_SPEED_WALK : BOB_SPEED_IDLE;
                this._creature.group.position.y =
                    1.0 + Math.sin(this._elapsed * bobSpeed) * BOB_AMPLITUDE;
            }

            // Lure pulse is always running (creature invisible while hiding, harmless)
            const pulse = 0.65 + 0.35 * Math.sin(this._elapsed * 3.5);
            this._creature.lure.material.emissiveIntensity = 3.0 * pulse;
            this._creature.lureLight.intensity             = 4.0 * pulse;
        }

        this._enemy?.update(deltaTime);

        if (this._enemyAI && this._creature) {
            this._enemyAI.update(
                deltaTime,
                this._creature.group,
                this._isHiding,
                this._hidingIn,
            );
        }

        // Disable interaction prompts while hiding; re-enable when free
        if (this._interactionManager && this._creature) {
            this._interactionManager.setEnabled(!this._isHiding);
            if (!this._isHiding) {
                this._interactionManager.update(this._creature.group.position);
            }
        }

        // Keep the ring centred on the creature and gently pulsing
        if (this._hideRing && this._creature) {
            this._hideRing.position.x       = this._creature.group.position.x;
            this._hideRing.position.z       = this._creature.group.position.z;
            this._hideRing.material.opacity = 0.22 + 0.13 * Math.sin(this._elapsed * 2.2);
        }
    }

    // Game phase management

    _updatePhase(deltaTime) {
        if (this._phase !== 'hiding') return;

        this._phaseTimer -= deltaTime;
        this._hud.setTime(Math.max(0, this._phaseTimer));

        if (this._phaseTimer <= 0) this._startHuntPhase();
    }

    _startHuntPhase() {
        this._phase = 'hunt';
        this._hud.setPhase('hunt');

        // Spawn at the map edge, random angle, facing inward
        const angle   = Math.random() * Math.PI * 2;
        const spawnX  = Math.cos(angle) * ENEMY_SPAWN_RADIUS;
        const spawnZ  = Math.sin(angle) * ENEMY_SPAWN_RADIUS;

        this._enemy = new EnemyCreature();
        this._enemy.group.position.set(spawnX, 0, spawnZ);
        this._enemy.group.rotation.y = angle + Math.PI;   // face the center
        this._threeScene.add(this._enemy.group);

        this._enemyAI = new EnemyAI(this._enemy, DIFFICULTY.MEDIUM);
        this._enemyAI.onCatch = () => {
            // TODO: trigger game-over screen
            this._hud.setPhase('caught');
        };
    }

    // Hiding mechanics

    _hideInFlora(flora) {
        // Leave any previous hiding spot
        if (this._hidingIn) this._hidingIn.unhighlight();

        this._isHiding  = true;
        this._hidingIn  = flora;
        this._isMoving  = false;
        this._targetPos = null;

        this._creature.group.visible = false;
        if (this._hideRing) this._hideRing.visible = false;
        flora.highlight();
        this._hud.setHidden(true);
    }

    _unhide() {
        if (!this._isHiding) return;
        this._hidingIn?.unhighlight();
        this._hidingIn  = null;
        this._isHiding  = false;

        this._creature.group.visible = true;
        if (this._hideRing) this._hideRing.visible = true;
        this._hud.setHidden(false);
    }

    // Movement helpers

    _updateMovement(deltaTime) {
        if (this._isMoving && this._targetPos) {
            const pos  = this._creature.group.position;
            const dx   = this._targetPos.x - pos.x;
            const dz   = this._targetPos.z - pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < PET_ARRIVAL_DIST) {
                pos.x = this._targetPos.x;
                pos.z = this._targetPos.z;
                this._isMoving = false;
                this._creature.group.rotation.z = 0;
            } else {
                const step = Math.min(PET_MOVE_SPEED * deltaTime, dist);
                pos.x += (dx / dist) * step;
                pos.z += (dz / dist) * step;

                const desired  = Math.atan2(dx, dz);
                this._heading  = _lerpAngle(this._heading, desired, PET_TURN_SPEED * deltaTime);
                this._creature.group.rotation.y = this._heading;
                this._creature.group.rotation.z = Math.sin(this._elapsed * 8.5) * 0.08;
            }
        } else {
            this._heading += PET_SPIN_SPEED * deltaTime;
            this._creature.group.rotation.y = this._heading;
            this._creature.group.rotation.z = 0;
        }
    }

    // Input setup

    _setupClickControls(canvas) {
        this._onPointerDown = (e) => {
            this._pointerDownPos = { x: e.clientX, y: e.clientY };
        };

        this._onPointerUp = (e) => {
            if (!this._pointerDownPos) return;
            const dx = e.clientX - this._pointerDownPos.x;
            const dy = e.clientY - this._pointerDownPos.y;
            this._pointerDownPos = null;

            if (Math.sqrt(dx * dx + dy * dy) < CLICK_MOVE_THRESHOLD) {
                this._handleClick(e, canvas);
            }
        };

        canvas.addEventListener('pointerdown', this._onPointerDown);
        canvas.addEventListener('pointerup',   this._onPointerUp);
    }

    _setupKeyControls() {
        this._onKeyDown = (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                if (!this._tabHeld) {
                    this._tabHeld = true;
                    this._controls.enableRotate = true;
                    this._controls.enablePan   = true;
                }
            } else if (e.key === 'Escape') {
                this._unhide();
            }
        };

        this._onKeyUp = (e) => {
            if (e.key !== 'Tab') return;
            this._tabHeld = false;
            this._controls.enableRotate = false;
            this._controls.enablePan   = false;
        };

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup',   this._onKeyUp);
    }

    // Click handler

    /**
     * Priority order:
     *   1. Already hiding → any click unhides (flora or ground), then optionally moves
     *   2. Not hiding + flora hit → hide in that object
     *   3. Not hiding + ground hit → move creature
     */
    _handleClick(event, canvas) {
        if (this._tabHeld) return;   // Tab held = orbit mode, ignore game clicks

        const rect = canvas.getBoundingClientRect();
        const ndc  = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width)  *  2 - 1,
            ((event.clientY - rect.top)  / rect.height) * -2 + 1,
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(ndc, this._camera);

        // 1. If hiding, every click exits — no flora switching allowed
        if (this._isHiding) {
            this._unhide();
            // Don't move — the player just stepped out; let them click again to move.
            return;
        }

        // 2. Check flora — only test meshes from flora already within hide range
        const cp   = this._creature.group.position;
        const rSq  = HIDE_RADIUS * HIDE_RADIUS;
        const near = this._floraMeshes.filter(mesh => {
            const fp = mesh.userData.floraInstance?.group.position;
            if (!fp) return false;
            const dx = fp.x - cp.x, dz = fp.z - cp.z;
            return dx * dx + dz * dz <= rSq;
        });
        const floraHits = raycaster.intersectObjects(near, false);
        if (floraHits.length > 0) {
            const flora = floraHits[0].object.userData.floraInstance;
            if (flora && this._withinHideRange(flora)) {
                this._hideInFlora(flora);
                return;
            }
        }

        // 3. Check ground

        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const hit = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(groundPlane, hit)) return;

        hit.x = Math.max(-23, Math.min(23, hit.x));
        hit.z = Math.max(-23, Math.min(23, hit.z));

        this._targetPos = hit;
        this._isMoving  = true;
    }

    /** Returns true if the flora's base position is within the hide radius. */
    _withinHideRange(flora) {
        const cp = this._creature.group.position;
        const fp = flora.group.position;
        const dx = fp.x - cp.x;
        const dz = fp.z - cp.z;
        return (dx * dx + dz * dz) <= HIDE_RADIUS * HIDE_RADIUS;
    }
}

// Module utility
function _lerpAngle(current, target, t) {
    let diff = target - current;
    while (diff >  Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return current + diff * Math.min(t, 1);
}
