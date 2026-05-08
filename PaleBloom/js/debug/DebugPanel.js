/**
 * DebugPanel.js
 * An in-browser developer panel for toggling debug features and tuning
 * scene parameters at runtime.
 *
 * Usage:
 *   const panel = new DebugPanel();
 *   panel.addToggle('FPS Counter', true, (enabled) => game.setShowFps(enabled));
 *   panel.addToggle('Wireframe',  false, (enabled) => scene.setWireframe(enabled));
 *   // future: panel.addSlider(...)  panel.addButton(...)
 *
 * Open/close: click the DEV button (top-right) or press the backtick key (`).
 */
export class DebugPanel {
    constructor() {
        this._visible = false;
        this._buildDOM();

        // Keyboard shortcut: backtick toggles the panel
        window.addEventListener('keydown', (e) => {
            if (e.key === '`') this._toggle();
        });
    }

    // Public API

    /**
     * Add a labelled on/off toggle to the panel.
     * @param {string}   label        - Display name for the control.
     * @param {boolean}  initialValue - Starting state.
     * @param {function} onChange     - Called with the new boolean whenever it changes.
     */
    addToggle(label, initialValue, onChange) {
        const row = this._makeRow();

        const lbl = document.createElement('label');
        Object.assign(lbl.style, STYLES.label);

        const checkbox = document.createElement('input');
        checkbox.type    = 'checkbox';
        checkbox.checked = initialValue;
        Object.assign(checkbox.style, STYLES.checkbox);
        checkbox.addEventListener('change', () => onChange(checkbox.checked));

        const text = document.createElement('span');
        text.textContent = label;

        lbl.appendChild(checkbox);
        lbl.appendChild(text);
        row.appendChild(lbl);
        this._panel.appendChild(row);
    }

    // Private — DOM construction

    _buildDOM() {
        // Toggle button (always visible)
        this._btn = document.createElement('button');
        this._btn.textContent = 'DEV';
        Object.assign(this._btn.style, STYLES.button);
        this._btn.addEventListener('click', () => this._toggle());
        document.body.appendChild(this._btn);

        // Panel
        this._panel = document.createElement('div');
        Object.assign(this._panel.style, STYLES.panel);
        this._panel.style.display = 'none';

        const heading = document.createElement('div');
        heading.textContent = 'Debug Panel  ·  ` to toggle';
        Object.assign(heading.style, STYLES.heading);
        this._panel.appendChild(heading);

        document.body.appendChild(this._panel);
    }

    _makeRow() {
        const row = document.createElement('div');
        Object.assign(row.style, STYLES.row);
        return row;
    }

    _toggle() {
        this._visible = !this._visible;
        this._panel.style.display = this._visible ? 'block' : 'none';
        this._btn.style.background = this._visible
            ? 'rgba(0, 255, 136, 0.2)'
            : STYLES.button.background;
    }
}

// Styles — defined once as a plain object to keep the class body readable
const STYLES = {
    button: {
        position:       'fixed',
        top:            '10px',
        right:          '10px',
        padding:        '4px 10px',
        background:     'rgba(0, 0, 0, 0.55)',
        color:          '#00ff88',
        fontFamily:     'monospace',
        fontSize:       '12px',
        fontWeight:     'bold',
        border:         '1px solid #00ff8855',
        borderRadius:   '4px',
        cursor:         'pointer',
        pointerEvents:  'auto',
        userSelect:     'none',
        zIndex:         '9999',
    },
    panel: {
        position:       'fixed',
        top:            '38px',
        right:          '10px',
        minWidth:       '220px',
        padding:        '10px 14px 14px',
        background:     'rgba(0, 0, 0, 0.75)',
        border:         '1px solid #00ff8833',
        borderRadius:   '6px',
        fontFamily:     'monospace',
        fontSize:       '13px',
        color:          '#ccffee',
        userSelect:     'none',
        zIndex:         '9998',
        backdropFilter: 'blur(4px)',
    },
    heading: {
        color:          '#00ff8899',
        fontSize:       '11px',
        marginBottom:   '10px',
        paddingBottom:  '8px',
        borderBottom:   '1px solid #00ff8822',
    },
    row: {
        display:        'flex',
        alignItems:     'center',
        marginBottom:   '8px',
    },
    label: {
        display:        'flex',
        alignItems:     'center',
        gap:            '8px',
        cursor:         'pointer',
        width:          '100%',
    },
    checkbox: {
        accentColor:    '#00ff88',
        width:          '14px',
        height:         '14px',
        cursor:         'pointer',
    },
};
