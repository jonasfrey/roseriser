// DXF Debug Viewer - for debugging DXF to JS data conversion
import { f_o_sketch_from_o_dxf } from './manual.module.h.js';

// ============ STATE ============

let o_state = {
    o_sketch: null,
    s_name__file: '',
    s_tab__active: 'entity-groups'
};
globalThis.o_state = o_state;

// ============ API ============

let f_o_dxf__parsed = async function(s_dxf) {
    let o_response = await fetch('/api/parse-dxf', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: s_dxf
    });

    if (!o_response.ok) {
        let o_err = await o_response.json();
        throw new Error(o_err.error || 'Failed to parse DXF');
    }

    return await o_response.json();
};

let f_o_sketch_from_s_dxf = async function(s_dxf) {
    let o_dxf = await f_o_dxf__parsed(s_dxf);
    let o_sketch = await f_o_sketch_from_o_dxf(o_dxf);
    return o_sketch;
};

// ============ FILE HANDLING ============

let f_s_text_from_o_file = function(o_file) {
    return new Promise((resolve, reject) => {
        let o_reader = new FileReader();
        o_reader.onload = () => resolve(o_reader.result);
        o_reader.onerror = reject;
        o_reader.readAsText(o_file);
    });
};

// ============ SVG VIEWER ============

let o_viewer = {
    n_scl: 1,
    n_trn_x: 0,
    n_trn_y: 0,
    b_dragging: false,
    n_x__last: 0,
    n_y__last: 0,

    init() {
        let el_container = document.getElementById('svg-container');

        el_container.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            let n_delta = evt.deltaY > 0 ? 0.9 : 1.1;
            let o_rect = el_container.getBoundingClientRect();
            let n_x = evt.clientX - o_rect.left;
            let n_y = evt.clientY - o_rect.top;

            let n_scl__new = Math.max(0.1, Math.min(20, this.n_scl * n_delta));
            let n_scl__change = n_scl__new / this.n_scl;

            this.n_trn_x = n_x - (n_x - this.n_trn_x) * n_scl__change;
            this.n_trn_y = n_y - (n_y - this.n_trn_y) * n_scl__change;
            this.n_scl = n_scl__new;
            this.updateTransform();
        });

        el_container.addEventListener('mousedown', (evt) => {
            this.b_dragging = true;
            this.n_x__last = evt.clientX;
            this.n_y__last = evt.clientY;
        });

        el_container.addEventListener('mousemove', (evt) => {
            if (!this.b_dragging) return;
            this.n_trn_x += evt.clientX - this.n_x__last;
            this.n_trn_y += evt.clientY - this.n_y__last;
            this.n_x__last = evt.clientX;
            this.n_y__last = evt.clientY;
            this.updateTransform();
        });

        el_container.addEventListener('mouseup', () => { this.b_dragging = false; });
        el_container.addEventListener('mouseleave', () => { this.b_dragging = false; });
    },

    updateTransform() {
        let el_wrapper = document.getElementById('svg-wrapper');
        el_wrapper.style.transform = `translate(${this.n_trn_x}px, ${this.n_trn_y}px) scale(${this.n_scl})`;
    },

    fitToContainer() {
        let el_container = document.getElementById('svg-container');
        let el_wrapper = document.getElementById('svg-wrapper');
        let el_svg = el_wrapper.querySelector('svg');
        if (!el_svg) return;

        this.n_scl = 1;
        this.n_trn_x = 0;
        this.n_trn_y = 0;
        this.updateTransform();

        setTimeout(() => {
            let o_rect__container = el_container.getBoundingClientRect();
            let o_rect__svg = el_svg.getBoundingClientRect();
            if (o_rect__svg.width === 0 || o_rect__svg.height === 0) return;

            let n_scl_x = (o_rect__container.width - 40) / o_rect__svg.width;
            let n_scl_y = (o_rect__container.height - 40) / o_rect__svg.height;
            this.n_scl = Math.min(n_scl_x, n_scl_y, 5);

            this.n_trn_x = (o_rect__container.width - o_rect__svg.width * this.n_scl) / 2;
            this.n_trn_y = (o_rect__container.height - o_rect__svg.height * this.n_scl) / 2;
            this.updateTransform();
        }, 50);
    },

    reset() {
        this.n_scl = 1;
        this.n_trn_x = 0;
        this.n_trn_y = 0;
        this.updateTransform();
    },

    setSVG(s_svg) {
        let el_wrapper = document.getElementById('svg-wrapper');
        let el_placeholder = document.getElementById('placeholder');

        el_wrapper.innerHTML = s_svg;
        el_placeholder.style.display = 'none';

        let el_svg = el_wrapper.querySelector('svg');
        if (el_svg) {
            el_svg.style.width = 'auto';
            el_svg.style.height = 'auto';
        }

        setTimeout(() => this.fitToContainer(), 100);
    }
};

// ============ UI HELPERS ============

let f_update_status = function(s_msg) {
    document.getElementById('status').textContent = s_msg;
};

let f_update_info_panel = function(o_sketch) {
    if (!o_sketch) {
        document.getElementById('info-entity-count').textContent = '-';
        document.getElementById('info-group-count').textContent = '-';
        document.getElementById('info-connection-count').textContent = '-';
        document.getElementById('info-point-count').textContent = '-';
        return;
    }

    document.getElementById('info-entity-count').textContent = o_sketch.a_o_entity?.length || 0;
    document.getElementById('info-connection-count').textContent = o_sketch.a_o_entity_connection?.length || 0;
    document.getElementById('info-point-count').textContent = o_sketch.a_o_vec3_trn?.length || 0;

    // count groups from svg (we don't have direct access to a_a_o_entity_group)
    // count "Group" occurrences in s_svg_a_a_o_entity_group as approximation
    let s_svg_groups = o_sketch.s_svg_a_a_o_entity_group || '';
    let a_match = s_svg_groups.match(/Group \d+/g);
    document.getElementById('info-group-count').textContent = a_match ? a_match.length : 0;
};

// ============ TAB HANDLING ============

let f_s_svg_for_tab = function(s_tab) {
    if (!o_state.o_sketch) return '';

    switch (s_tab) {
        case 'entity-groups':
            return o_state.o_sketch.s_svg_a_a_o_entity_group || '';
        case 'points-ordered':
            return o_state.o_sketch.s_svg_a_a_o_vec3_trn_ordered || '';
        case 'points-ordered-mirrored':
            return o_state.o_sketch.s_svg_a_a_o_vec3_trn_ordered_mirrored || '';
        case 'main-svg':
            return o_state.o_sketch.s_svg || '';
        case 'points-mirrored':
            return o_state.o_sketch.s_svg_points_ordered_mirrored || '';
        default:
            return '';
    }
};

let f_switch_tab = function(s_tab) {
    o_state.s_tab__active = s_tab;

    // update tab UI
    let a_el_tab = document.querySelectorAll('.tab');
    for (let el_tab of a_el_tab) {
        if (el_tab.dataset.tab === s_tab) {
            el_tab.classList.add('active');
        } else {
            el_tab.classList.remove('active');
        }
    }

    // update SVG display
    let s_svg = f_s_svg_for_tab(s_tab);
    if (s_svg) {
        o_viewer.setSVG(s_svg);
    }
};

let f_enable_tab = function() {
    let a_el_tab = document.querySelectorAll('.tab');
    for (let el_tab of a_el_tab) {
        el_tab.classList.remove('disabled');
    }
};

// ============ MAIN ============

let f_handle_file = async function(o_file) {
    try {
        f_update_status('Parsing...');

        let s_text = await f_s_text_from_o_file(o_file);
        let o_sketch = await f_o_sketch_from_s_dxf(s_text);

        o_state.o_sketch = o_sketch;
        o_state.s_name__file = o_file.name.replace(/\.dxf$/i, '');

        // enable tabs
        f_enable_tab();

        // update info panel
        f_update_info_panel(o_sketch);

        // show current tab's SVG
        let s_svg = f_s_svg_for_tab(o_state.s_tab__active);
        if (s_svg) {
            o_viewer.setSVG(s_svg);
            f_update_status('Ready');
        } else {
            f_update_status('No SVG for this view');
        }

        document.getElementById('file-name').textContent = o_file.name;
        document.getElementById('file-name').classList.add('loaded');

        console.log('Sketch object:', o_sketch);

    } catch (o_err) {
        f_update_status(`Error: ${o_err.message}`);
        console.error(o_err);
    }
};

// ============ INIT ============

document.addEventListener('DOMContentLoaded', () => {
    o_viewer.init();

    let el_file_input = document.getElementById('file-input');
    let el_select_btn = document.getElementById('select-btn');

    el_select_btn.addEventListener('click', () => el_file_input.click());

    el_file_input.addEventListener('change', (evt) => {
        if (evt.target.files[0]) {
            f_handle_file(evt.target.files[0]);
        }
    });

    // Tab click handlers
    let a_el_tab = document.querySelectorAll('.tab');
    for (let el_tab of a_el_tab) {
        el_tab.addEventListener('click', () => {
            if (el_tab.classList.contains('disabled')) return;
            f_switch_tab(el_tab.dataset.tab);
        });
    }

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        o_viewer.n_scl *= 1.3;
        o_viewer.updateTransform();
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
        o_viewer.n_scl /= 1.3;
        o_viewer.updateTransform();
    });
    document.getElementById('zoom-fit').addEventListener('click', () => {
        o_viewer.fitToContainer();
    });
    document.getElementById('zoom-reset').addEventListener('click', () => {
        o_viewer.reset();
    });
});
