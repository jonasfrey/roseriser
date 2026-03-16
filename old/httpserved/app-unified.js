// Roseriser DXF Parser Application
// Load a single DXF, view all SVG debug views, categorize and save to database

import { f_o_sketch_from_o_dxf } from './manual.module.h.js';

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
    return f_o_sketch_from_o_dxf(o_dxf);
};

// ============ STATE ============

let o_state = {
    o_sketch: null,
    s_name__file: ''
};

// ============ SVG PAN/ZOOM VIEWER FACTORY ============

let f_o_viewer_svg = function(s_id__container, s_id__wrapper) {
    return {
        n_scl: 1,
        n_trn_x: 0,
        n_trn_y: 0,
        b_dragging: false,
        n_x__last: 0,
        n_y__last: 0,

        init() {
            let el_container = document.getElementById(s_id__container);
            if (!el_container) return;

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
            let el_wrapper = document.getElementById(s_id__wrapper);
            if (el_wrapper) {
                el_wrapper.style.transform = `translate(${this.n_trn_x}px, ${this.n_trn_y}px) scale(${this.n_scl})`;
            }
        },

        fitToContainer() {
            let el_container = document.getElementById(s_id__container);
            let el_wrapper = document.getElementById(s_id__wrapper);
            if (!el_container || !el_wrapper) return;
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

                let n_scl_x = (o_rect__container.width - 10) / o_rect__svg.width;
                let n_scl_y = (o_rect__container.height - 10) / o_rect__svg.height;
                this.n_scl = Math.min(n_scl_x, n_scl_y, 5);

                this.n_trn_x = (o_rect__container.width - o_rect__svg.width * this.n_scl) / 2;
                this.n_trn_y = (o_rect__container.height - o_rect__svg.height * this.n_scl) / 2;
                this.updateTransform();
            }, 50);
        },

        setSVG(s_svg) {
            let el_wrapper = document.getElementById(s_id__wrapper);
            if (!el_wrapper) return;

            el_wrapper.innerHTML = s_svg;
            let el_svg = el_wrapper.querySelector('svg');
            if (el_svg) {
                el_svg.style.width = 'auto';
                el_svg.style.height = 'auto';
            }

            setTimeout(() => this.fitToContainer(), 100);
        }
    };
};

// Create 4 viewers for the 2x2 grid
let a_o_viewer = [
    f_o_viewer_svg('svg-container-0', 'svg-wrapper-0'),
    f_o_viewer_svg('svg-container-1', 'svg-wrapper-1'),
    f_o_viewer_svg('svg-container-2', 'svg-wrapper-2'),
    f_o_viewer_svg('svg-container-3', 'svg-wrapper-3')
];

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

    let s_svg_group = o_sketch.s_svg_a_a_o_entity_group || '';
    let a_match = s_svg_group.match(/Group \d+/g);
    document.getElementById('info-group-count').textContent = a_match ? a_match.length : 0;
};

// ============ LOAD SAVED PROFILES FOR LINKING ============

let f_populate_linked_profile = async function() {
    let el_select = document.getElementById('select-linked-profile');
    try {
        let o_response = await fetch('/api/list-parsed-dxf');
        let a_o_entry = await o_response.json();

        el_select.innerHTML = '<option value="">-- Select profile --</option>';

        let a_o_profile = a_o_entry.filter(o => o.s_type === 'profile');
        for (let o_profile of a_o_profile) {
            let el_option = document.createElement('option');
            el_option.value = o_profile.s_name;
            el_option.textContent = o_profile.s_name;
            el_select.appendChild(el_option);
        }
    } catch (o_err) {
        console.error('Failed to load profiles:', o_err);
    }
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

let f_handle_file = async function(o_file) {
    try {
        f_update_status('Parsing...');

        let s_text = await f_s_text_from_o_file(o_file);
        let o_sketch = await f_o_sketch_from_s_dxf(s_text);

        o_state.o_sketch = o_sketch;
        o_state.s_name__file = o_file.name.replace(/\.dxf$/i, '');

        // Update file name display
        let el_file_name = document.getElementById('file-name');
        el_file_name.textContent = o_file.name;
        el_file_name.classList.add('loaded');

        // Auto-fill name input
        document.getElementById('input-name').value = o_state.s_name__file;

        // Update info panel
        f_update_info_panel(o_sketch);

        // Set all 4 SVG panels
        let a_s_svg = [
            o_sketch.s_svg_a_a_o_entity_group || '',
            o_sketch.s_svg_a_a_o_vec3_trn_ordered || '',
            o_sketch.s_svg_a_a_o_vec3_trn_ordered_mirrored || '',
            o_sketch.s_svg || ''
        ];

        for (let n_idx = 0; n_idx < 4; n_idx++) {
            if (a_s_svg[n_idx]) {
                a_o_viewer[n_idx].setSVG(a_s_svg[n_idx]);
            }
        }

        // Enable save button
        document.getElementById('save-btn').disabled = false;

        f_update_status('Parsed - ready to save');
        console.log('Sketch object:', o_sketch);

    } catch (o_err) {
        f_update_status(`Error: ${o_err.message}`);
        console.error(o_err);
    }
};

// ============ SAVE ============

let f_save_to_database = async function() {
    let s_name = document.getElementById('input-name').value.trim();
    let s_type = document.getElementById('select-type').value;
    let s_id__linked_profile = document.getElementById('select-linked-profile').value || null;

    if (!s_name) {
        f_update_status('Error: name is required');
        return;
    }

    if (!o_state.o_sketch) {
        f_update_status('Error: no DXF loaded');
        return;
    }

    if (s_type === 'remover' && !s_id__linked_profile) {
        f_update_status('Error: remover must be linked to a profile');
        return;
    }

    try {
        f_update_status('Saving...');

        let o_response = await fetch('/api/save-parsed-dxf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                s_name,
                s_type,
                s_id__linked_profile,
                o_sketch: o_state.o_sketch
            })
        });

        let o_result = await o_response.json();

        if (o_result.b_success) {
            f_update_status(`Saved "${s_name}" as ${s_type}`);
            // Refresh linked profiles dropdown in case we just saved a profile
            if (s_type === 'profile') {
                await f_populate_linked_profile();
            }
        } else {
            f_update_status(`Error: ${o_result.error}`);
        }
    } catch (o_err) {
        f_update_status(`Error saving: ${o_err.message}`);
        console.error(o_err);
    }
};

// ============ INIT ============

document.addEventListener('DOMContentLoaded', async () => {
    // Init all 4 SVG viewers
    for (let o_viewer of a_o_viewer) {
        o_viewer.init();
    }

    // File input
    let el_file_input = document.getElementById('file-input');
    let el_select_btn = document.getElementById('select-btn');

    el_select_btn.addEventListener('click', () => el_file_input.click());

    el_file_input.addEventListener('change', (evt) => {
        if (evt.target.files[0]) {
            f_handle_file(evt.target.files[0]);
        }
    });

    // Type selector — show/hide linked profile dropdown
    let el_select__type = document.getElementById('select-type');
    let el_linked_profile_wrapper = document.getElementById('linked-profile-wrapper');

    el_select__type.addEventListener('change', () => {
        if (el_select__type.value === 'remover') {
            el_linked_profile_wrapper.classList.add('visible');
        } else {
            el_linked_profile_wrapper.classList.remove('visible');
        }
    });

    // Save button
    document.getElementById('save-btn').addEventListener('click', f_save_to_database);

    // Load existing profiles for linking
    await f_populate_linked_profile();
});
