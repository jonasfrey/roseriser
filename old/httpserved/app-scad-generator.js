// Roseriser SCAD Generator Application
// Select saved/parsed DXFs and generate SCAD code

import {
    f_s_scad_path_sweep_sketch,
    f_s_scad_cylindric_sweep,
    f_s_scad_button_generator,
    f_s_scad_profile_functions_from_o_sketch
} from './manual.module.h.js';

// ============ STATE ============

let o_state = {
    o_parsed__path: null,
    o_parsed__profile: null,
    o_parsed__remover: null,
    o_output: {
        s_scad__path_sweep: '',
        s_scad__cylindric_sweep: '',
        s_scad__button: '',
        s_json: ''
    },
    editor: null,
    s_tab__editor: 'path-sweep',
    a_o_entry: [] // list of all saved DXFs
};

// ============ SVG PAN/ZOOM VIEWER ============

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
        if (el_wrapper) {
            el_wrapper.style.transform = `translate(${this.n_trn_x}px, ${this.n_trn_y}px) scale(${this.n_scl})`;
        }
    },

    fitToContainer() {
        let el_container = document.getElementById('svg-container');
        let el_wrapper = document.getElementById('svg-wrapper');
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

            let n_scl_x = (o_rect__container.width - 20) / o_rect__svg.width;
            let n_scl_y = (o_rect__container.height - 20) / o_rect__svg.height;
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
        if (!el_wrapper) return;

        el_wrapper.innerHTML = s_svg;
        let el_svg = el_wrapper.querySelector('svg');
        if (el_svg) {
            el_svg.style.width = 'auto';
            el_svg.style.height = 'auto';
        }

        let el_placeholder = document.getElementById('placeholder');
        if (el_placeholder) el_placeholder.style.display = 'none';

        setTimeout(() => this.fitToContainer(), 100);
    }
};

// ============ MONACO EDITOR ============

let f_init_monaco = function() {
    return new Promise((resolve) => {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            o_state.editor = monaco.editor.create(document.getElementById('editor-container'), {
                value: '// Select saved DXFs to generate SCAD output',
                language: 'cpp',
                theme: 'vs-dark',
                automaticLayout: true,
                readOnly: true,
                minimap: { enabled: false }
            });
            resolve();
        });
    });
};

// ============ UI HELPERS ============

let f_update_status = function(s_msg) {
    document.getElementById('status').textContent = s_msg;
};

let f_update_editor = function() {
    if (!o_state.editor) return;
    let s_content = f_s_scad_for_tab(o_state.s_tab__editor);
    let s_language = o_state.s_tab__editor === 'json' ? 'json' : 'cpp';
    monaco.editor.setModelLanguage(o_state.editor.getModel(), s_language);
    o_state.editor.setValue(s_content || '// No content yet');
};

let f_s_scad_for_tab = function(s_tab) {
    switch (s_tab) {
        case 'path-sweep': return o_state.o_output.s_scad__path_sweep;
        case 'cylindric-sweep': return o_state.o_output.s_scad__cylindric_sweep;
        case 'buttons': return o_state.o_output.s_scad__button;
        case 'json': return o_state.o_output.s_json;
        default: return '';
    }
};

// ============ LOAD SAVED DXF DATA ============

let f_o_parsed_dxf = async function(s_name) {
    let o_response = await fetch(`/api/get-parsed-dxf?name=${encodeURIComponent(s_name)}`);
    if (!o_response.ok) throw new Error(`Failed to load ${s_name}`);
    return await o_response.json();
};

let f_populate_select = async function() {
    try {
        let o_response = await fetch('/api/list-parsed-dxf');
        o_state.a_o_entry = await o_response.json();

        let el_select__path = document.getElementById('select-path');
        let el_select__profile = document.getElementById('select-profile');

        // Populate path selector
        el_select__path.innerHTML = '<option value="">-- Select path --</option>';
        let a_o_path = o_state.a_o_entry.filter(o => o.s_type === 'path');
        for (let o_entry of a_o_path) {
            let el_option = document.createElement('option');
            el_option.value = o_entry.s_name;
            el_option.textContent = o_entry.s_name;
            el_select__path.appendChild(el_option);
        }

        // Populate profile selector
        el_select__profile.innerHTML = '<option value="">-- Select profile --</option>';
        let a_o_profile = o_state.a_o_entry.filter(o => o.s_type === 'profile');
        for (let o_entry of a_o_profile) {
            let el_option = document.createElement('option');
            el_option.value = o_entry.s_name;
            el_option.textContent = o_entry.s_name;
            el_select__profile.appendChild(el_option);
        }

    } catch (o_err) {
        console.error('Failed to load saved DXFs:', o_err);
        f_update_status('Error loading saved DXFs');
    }
};

// ============ SELECTION HANDLERS ============

let f_handle_path_change = async function() {
    let s_name = document.getElementById('select-path').value;
    if (!s_name) {
        o_state.o_parsed__path = null;
        f_process_all();
        return;
    }

    try {
        f_update_status(`Loading path "${s_name}"...`);
        o_state.o_parsed__path = await f_o_parsed_dxf(s_name);
        document.getElementById('select-path').classList.add('loaded');
        f_update_status(`Loaded path "${s_name}"`);

        // Show path SVG in viewer
        if (o_state.o_parsed__path.o_sketch?.s_svg) {
            o_viewer.setSVG(o_state.o_parsed__path.o_sketch.s_svg);
        }

        f_process_all();
    } catch (o_err) {
        f_update_status(`Error: ${o_err.message}`);
        console.error(o_err);
    }
};

let f_handle_profile_change = async function() {
    let s_name = document.getElementById('select-profile').value;
    if (!s_name) {
        o_state.o_parsed__profile = null;
        o_state.o_parsed__remover = null;
        document.getElementById('remover-info').textContent = 'No remover';
        document.getElementById('remover-info').classList.remove('loaded');
        f_process_all();
        return;
    }

    try {
        f_update_status(`Loading profile "${s_name}"...`);
        o_state.o_parsed__profile = await f_o_parsed_dxf(s_name);
        document.getElementById('select-profile').classList.add('loaded');

        // Auto-load linked remover
        let o_remover_entry = o_state.a_o_entry.find(
            o => o.s_type === 'remover' && o.s_id__linked_profile === s_name
        );

        if (o_remover_entry) {
            o_state.o_parsed__remover = await f_o_parsed_dxf(o_remover_entry.s_name);
            let el_remover_info = document.getElementById('remover-info');
            el_remover_info.textContent = `Remover: ${o_remover_entry.s_name}`;
            el_remover_info.classList.add('loaded');
            f_update_status(`Loaded profile "${s_name}" + remover "${o_remover_entry.s_name}"`);
        } else {
            o_state.o_parsed__remover = null;
            let el_remover_info = document.getElementById('remover-info');
            el_remover_info.textContent = 'No linked remover';
            el_remover_info.classList.remove('loaded');
            f_update_status(`Loaded profile "${s_name}" (no linked remover)`);
        }

        f_process_all();
    } catch (o_err) {
        f_update_status(`Error: ${o_err.message}`);
        console.error(o_err);
    }
};

// ============ SCAD GENERATION ============

let f_process_all = function() {
    let o_sketch__path = o_state.o_parsed__path?.o_sketch;
    let o_sketch__profile = o_state.o_parsed__profile?.o_sketch;
    let o_sketch__remover = o_state.o_parsed__remover?.o_sketch;

    let s_name__path = o_state.o_parsed__path?.s_name || 'path';
    let s_name__profile = o_state.o_parsed__profile?.s_name || 'profile';
    let s_name__remover = o_state.o_parsed__remover?.s_name || 'remover';

    // Generate SCAD for all modes
    if (o_sketch__path && o_sketch__profile && o_sketch__remover) {
        o_state.o_output.s_scad__path_sweep = f_s_scad_path_sweep_sketch(
            o_sketch__path, s_name__path,
            o_sketch__profile, s_name__profile,
            o_sketch__remover, s_name__remover
        );

        o_state.o_output.s_scad__cylindric_sweep = f_s_scad_cylindric_sweep(
            o_sketch__path, s_name__path,
            o_sketch__profile, s_name__profile,
            2, 0
        );

        o_state.o_output.s_scad__button = f_s_scad_button_generator(
            o_sketch__path, s_name__path,
            o_sketch__profile, s_name__profile,
            o_sketch__remover, s_name__remover,
            32
        );

        document.getElementById('dl-scad').disabled = false;
        f_save_scad_to_server(o_state.o_output.s_scad__path_sweep, 'scad-generator');
    } else if (o_sketch__path && o_sketch__profile) {
        o_state.o_output.s_scad__path_sweep = f_s_scad_profile_functions_from_o_sketch(
            o_sketch__profile, s_name__profile, true
        );
        o_state.o_output.s_scad__cylindric_sweep = '// Need remover for full cylindric sweep';
        o_state.o_output.s_scad__button = '// Need remover for button generator';
        document.getElementById('dl-scad').disabled = false;
    } else {
        o_state.o_output.s_scad__path_sweep = '// Select path + profile to generate SCAD';
        o_state.o_output.s_scad__cylindric_sweep = '// Select path + profile to generate SCAD';
        o_state.o_output.s_scad__button = '// Select path + profile to generate SCAD';
        document.getElementById('dl-scad').disabled = true;
    }

    // JSON output
    let o_data = {};
    if (o_sketch__path) o_data.path = o_sketch__path;
    if (o_sketch__profile) o_data.profile = o_sketch__profile;
    if (o_sketch__remover) o_data.remover = o_sketch__remover;
    o_state.o_output.s_json = JSON.stringify(o_data, null, 2);
    document.getElementById('dl-json').disabled = !o_sketch__path;

    f_update_editor();
};

// ============ DOWNLOADS ============

let f_download_file = function(s_content, s_filename, s_mime_type) {
    let o_blob = new Blob([s_content], { type: s_mime_type });
    let s_url = URL.createObjectURL(o_blob);
    let el_a = document.createElement('a');
    el_a.href = s_url;
    el_a.download = s_filename;
    el_a.click();
    URL.revokeObjectURL(s_url);
};

let f_save_scad_to_server = async function(s_scad, s_app) {
    try {
        let o_response = await fetch('/api/save-scad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ s_scad, s_app })
        });
        let o_result = await o_response.json();
        if (o_result.b_success) {
            console.log(`SCAD saved: ${o_result.s_filename}`);
        }
    } catch (o_err) {
        console.error('Failed to save SCAD:', o_err);
    }
};

// ============ INIT ============

document.addEventListener('DOMContentLoaded', async () => {
    await f_init_monaco();
    o_viewer.init();

    // Populate dropdowns
    await f_populate_select();

    // Selection handlers
    document.getElementById('select-path').addEventListener('change', f_handle_path_change);
    document.getElementById('select-profile').addEventListener('change', f_handle_profile_change);

    // Editor tabs
    document.querySelectorAll('.editor-tab').forEach(el_tab => {
        el_tab.addEventListener('click', () => {
            document.querySelectorAll('.editor-tab').forEach(el => el.classList.remove('active'));
            el_tab.classList.add('active');
            o_state.s_tab__editor = el_tab.dataset.tab;
            f_update_editor();
        });
    });

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        o_viewer.n_scl *= 1.3;
        o_viewer.updateTransform();
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
        o_viewer.n_scl /= 1.3;
        o_viewer.updateTransform();
    });
    document.getElementById('zoom-fit').addEventListener('click', () => o_viewer.fitToContainer());
    document.getElementById('zoom-reset').addEventListener('click', () => o_viewer.reset());

    // Download buttons
    document.getElementById('dl-scad').addEventListener('click', () => {
        let s_scad = f_s_scad_for_tab(o_state.s_tab__editor);
        let s_name = o_state.o_parsed__path?.s_name || 'output';
        f_download_file(s_scad, `${s_name}_${o_state.s_tab__editor}.scad`, 'text/plain');
    });
    document.getElementById('dl-json').addEventListener('click', () => {
        let s_name = o_state.o_parsed__path?.s_name || 'data';
        f_download_file(o_state.o_output.s_json, `${s_name}.json`, 'application/json');
    });
});
