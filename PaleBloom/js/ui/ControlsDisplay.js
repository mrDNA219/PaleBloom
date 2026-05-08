export class ControlsDisplay {
    constructor() {
        this._el = this._createElement();
        document.body.appendChild(this._el);
    }

    dispose() {
        this._el.remove();
    }

    _createElement() {
        const el = document.createElement('div');
        Object.assign(el.style, {
            position:      'fixed',
            bottom:        '16px',
            left:          '16px',
            padding:       '10px 14px',
            background:    'rgba(0, 0, 0, 0.55)',
            border:        '1px solid #44ffaa33',
            borderRadius:  '4px',
            color:         '#aaffcc',
            fontFamily:    'monospace',
            fontSize:      '12px',
            lineHeight:    '1.7',
            pointerEvents: 'none',
            userSelect:    'none',
            zIndex:        '50',
        });

        const controls = [
            ['Click ground', 'Move'],
            ['Click flora',  'Hide (when nearby)'],
            ['E',            'Hide here'],
            ['Esc',          'Unhide'],
            ['Hold Tab',     'Orbit / Pan camera'],
            ['Scroll',       'Zoom'],
        ];

        el.innerHTML = controls
            .map(([key, action]) =>
                `<div><span style="color:#44ffaa;min-width:6.5ch;display:inline-block">${key}</span>  ${action}</div>`
            )
            .join('');

        return el;
    }
}
