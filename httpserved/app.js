// Simple DXF to SVG Preview
import { f_o_sketch_from_o_dxf, f_s_svg_from_o_sketch } from './manual.module.h.js';

// ============ STATE ============

let o_state = {
    s_svg: '',
    s_name__file: '',
    o_sketch: null,
    o_options: {
        b_entity: true,
        b_point: true,
        b_angle: true,
        b_bbox: true,
        b_legend: true,
        n_base_size: 2
    }
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
    },

    updateSVG(s_svg) {
        let el_wrapper = document.getElementById('svg-wrapper');
        el_wrapper.innerHTML = s_svg;

        let el_svg = el_wrapper.querySelector('svg');
        if (el_svg) {
            el_svg.style.width = 'auto';
            el_svg.style.height = 'auto';
        }
    }
};

// ============ UI HELPERS ============

let f_update_status = function(s_msg) {
    document.getElementById('status').textContent = s_msg;
};

let f_download_file = function(s_content, s_filename, s_mime_type) {
    let o_blob = new Blob([s_content], { type: s_mime_type });
    let s_url = URL.createObjectURL(o_blob);
    let el_a = document.createElement('a');
    el_a.href = s_url;
    el_a.download = s_filename;
    el_a.click();
    URL.revokeObjectURL(s_url);
};

// ============ SVG REGENERATION ============

let f_regenerate_svg = function() {
    if (!o_state.o_sketch) return;

    let s_svg = f_s_svg_from_o_sketch(o_state.o_sketch, o_state.o_options);
    o_state.s_svg = s_svg;
    o_viewer.updateSVG(s_svg);
};

let f_read_options_from_ui = function() {
    o_state.o_options.b_entity = document.getElementById('toggle-entity').checked;
    o_state.o_options.b_point = document.getElementById('toggle-point').checked;
    o_state.o_options.b_angle = document.getElementById('toggle-angle').checked;
    o_state.o_options.b_bbox = document.getElementById('toggle-bbox').checked;
    o_state.o_options.b_legend = document.getElementById('toggle-legend').checked;
    o_state.o_options.n_base_size = parseFloat(document.getElementById('slider-base-size').value);
};

// ============ MAIN ============

let f_handle_file = async function(o_file) {
    try {
        f_update_status('Parsing...');

        let s_text = await f_s_text_from_o_file(o_file);
        let o_sketch = await f_o_sketch_from_s_dxf(s_text);

        o_state.o_sketch = o_sketch;
        o_state.s_name__file = o_file.name.replace(/\.dxf$/i, '');

        // Generate SVG with current options
        f_read_options_from_ui();
        let s_svg = f_s_svg_from_o_sketch(o_sketch, o_state.o_options);
        o_state.s_svg = s_svg;

        if (o_state.s_svg) {
            o_viewer.setSVG(o_state.s_svg);
            document.getElementById('download-svg').disabled = false;
            f_update_status('Ready');
        } else {
            f_update_status('No SVG generated');
        }

        document.getElementById('file-name').textContent = o_file.name;
        document.getElementById('file-name').classList.add('loaded');

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

    // Download
    document.getElementById('download-svg').addEventListener('click', () => {
        if (o_state.s_svg) {
            f_download_file(o_state.s_svg, `${o_state.s_name__file}.svg`, 'image/svg+xml');
        }
    });

    // Toggle checkboxes
    let a_s_toggle_id = ['toggle-entity', 'toggle-point', 'toggle-angle', 'toggle-bbox', 'toggle-legend'];
    for (let s_id of a_s_toggle_id) {
        document.getElementById(s_id).addEventListener('change', () => {
            f_read_options_from_ui();
            f_regenerate_svg();
        });
    }

    // Base size slider
    let el_slider = document.getElementById('slider-base-size');
    let el_slider_value = document.getElementById('base-size-value');

    el_slider.addEventListener('input', (evt) => {
        el_slider_value.textContent = evt.target.value;
        f_read_options_from_ui();
        f_regenerate_svg();
    });
});
