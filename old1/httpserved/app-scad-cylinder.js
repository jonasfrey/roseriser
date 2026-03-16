// Roseriser Cylindric Sweep Application
// Wraps 2D sketches around a cylinder

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
    f_o_sketch_from_o_dxf,
    f_s_scad_cylindric_sweep,
    f_s_scad_profile_functions_from_o_sketch
} from './manual.module.h.js';

// ============ API FUNCTIONS ============

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

// ============ CONVERSION FUNCTIONS ============

let f_o_sketch_from_s_dxf = async function(s_dxf) {
    let o_dxf = await f_o_dxf__parsed(s_dxf);
    let o_sketch = await f_o_sketch_from_o_dxf(o_dxf);
    return o_sketch;
};

let f_s_svg_from_o_sketch = function(o_sketch) {
    return o_sketch.s_svg || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="10" y="50">No SVG</text></svg>';
};

let f_s_scad_from_a_o_sketch = function(o_sketch__path, s_name__path, o_sketch__profile, s_name__profile, o_sketch__remover, s_name__remover, n_radius_offset) {
    return f_s_scad_cylindric_sweep(
        o_sketch__path, s_name__path,
        o_sketch__profile, s_name__profile,
        o_sketch__remover, s_name__remover,
        2,  // n_segment_per_unit
        n_radius_offset
    );
};

// Calculate bounding box and cylinder parameters
let f_o_cylinder_info_from_o_sketch = function(o_sketch, n_radius_offset = 0) {
    let a_o_entity = o_sketch.a_o_entity.filter(o => o != null);
    let n_x__min = Infinity, n_x__max = -Infinity;
    let n_y__min = Infinity, n_y__max = -Infinity;

    for(let o_entity of a_o_entity){
        if(o_entity.o_vec3_trn_start){
            n_x__min = Math.min(n_x__min, o_entity.o_vec3_trn_start.n_x);
            n_x__max = Math.max(n_x__max, o_entity.o_vec3_trn_start.n_x);
            n_y__min = Math.min(n_y__min, o_entity.o_vec3_trn_start.n_y);
            n_y__max = Math.max(n_y__max, o_entity.o_vec3_trn_start.n_y);
        }
        if(o_entity.o_vec3_trn_end){
            n_x__min = Math.min(n_x__min, o_entity.o_vec3_trn_end.n_x);
            n_x__max = Math.max(n_x__max, o_entity.o_vec3_trn_end.n_x);
            n_y__min = Math.min(n_y__min, o_entity.o_vec3_trn_end.n_y);
            n_y__max = Math.max(n_y__max, o_entity.o_vec3_trn_end.n_y);
        }
        if(o_entity.o_vec3_trn && o_entity.n_radius){
            n_x__min = Math.min(n_x__min, o_entity.o_vec3_trn.n_x - o_entity.n_radius);
            n_x__max = Math.max(n_x__max, o_entity.o_vec3_trn.n_x + o_entity.n_radius);
            n_y__min = Math.min(n_y__min, o_entity.o_vec3_trn.n_y - o_entity.n_radius);
            n_y__max = Math.max(n_y__max, o_entity.o_vec3_trn.n_y + o_entity.n_radius);
        }
    }

    let n_scl_x = n_x__max - n_x__min;
    let n_scl_y = n_y__max - n_y__min;
    let n_tau = Math.PI * 2;
    let n_radius = n_scl_x / n_tau + n_radius_offset;

    return {
        n_scl_x,
        n_scl_y,
        n_radius
    };
};

// ============ THREE.JS 3D VIEWER ============

let o_viewer__three = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    a_o_mesh: [],
    b_wireframe: false,
    n_scl: 0.5,

    init() {
        let el_container = document.getElementById('threejs-container');
        let o_rect = el_container.getBoundingClientRect();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        this.camera = new THREE.PerspectiveCamera(45, o_rect.width / o_rect.height, 0.1, 10000);
        this.camera.position.set(100, 100, 100);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(o_rect.width, o_rect.height);
        el_container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        let o_light__ambient = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(o_light__ambient);

        let o_light__directional = new THREE.DirectionalLight(0xffffff, 1);
        o_light__directional.position.set(100, 100, 100);
        this.scene.add(o_light__directional);

        let o_light__directional2 = new THREE.DirectionalLight(0xffffff, 0.5);
        o_light__directional2.position.set(-100, -100, -100);
        this.scene.add(o_light__directional2);

        let o_helper__grid = new THREE.GridHelper(200, 20, 0x444444, 0x333333);
        o_helper__grid.rotation.x = Math.PI / 2;
        this.scene.add(o_helper__grid);

        let o_helper__axis = new THREE.AxesHelper(50);
        this.scene.add(o_helper__axis);

        let f_animate = () => {
            requestAnimationFrame(f_animate);
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };
        f_animate();

        window.addEventListener('resize', () => this.onResize());

        document.getElementById('reset-camera').addEventListener('click', () => this.resetCamera());
        document.getElementById('toggle-wireframe').addEventListener('click', () => this.toggleWireframe());
        document.getElementById('scale-slider').addEventListener('input', (evt) => {
            this.n_scl = parseFloat(evt.target.value);
            document.getElementById('scale-value').textContent = this.n_scl.toFixed(1);
        });
    },

    onResize() {
        let el_container = document.getElementById('threejs-container');
        let o_rect = el_container.getBoundingClientRect();
        this.camera.aspect = o_rect.width / o_rect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(o_rect.width, o_rect.height);
    },

    resetCamera() {
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    },

    toggleWireframe() {
        this.b_wireframe = !this.b_wireframe;
        this.a_o_mesh.forEach(o_mesh => {
            if (o_mesh.material) o_mesh.material.wireframe = this.b_wireframe;
        });
    },

    clearMeshes() {
        this.a_o_mesh.forEach(o_mesh => {
            this.scene.remove(o_mesh);
            if (o_mesh.geometry) o_mesh.geometry.dispose();
            if (o_mesh.material) o_mesh.material.dispose();
        });
        this.a_o_mesh = [];
    }
};

globalThis.o_viewer__three = o_viewer__three;

// ============ APPLICATION STATE ============

let o_state = {
    o_file: { sketch: null, profile: null, remover: null },
    o_sketch: { sketch: null, profile: null, remover: null },
    o_output: { svg: '', scad: '', json: '' },
    editor: null,
    s_tab__current: 'scad',
    s_view__current: 'svg',
    n_radius_offset: 0
};
globalThis.o_state = o_state;

// ============ SVG PAN/ZOOM ============

let f_o_viewer_svg = function(s_id__container, s_id__wrapper, s_id__header) {
    return {
        n_scl: 1,
        n_trn_x: 0,
        n_trn_y: 0,
        b_dragging: false,
        n_x__last: 0,
        n_y__last: 0,
        s_id__container,
        s_id__wrapper,
        s_id__header,

        init() {
            let el_container = document.getElementById(this.s_id__container);
            if (!el_container) return;

            el_container.addEventListener('wheel', (evt) => {
                evt.preventDefault();
                let n_delta = evt.deltaY > 0 ? 0.9 : 1.1;
                let o_rect = el_container.getBoundingClientRect();
                let n_x = evt.clientX - o_rect.left;
                let n_y = evt.clientY - o_rect.top;

                let n_scl__new = Math.max(0.1, Math.min(10, this.n_scl * n_delta));
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
            let el_wrapper = document.getElementById(this.s_id__wrapper);
            if (el_wrapper) {
                el_wrapper.style.transform = `translate(${this.n_trn_x}px, ${this.n_trn_y}px) scale(${this.n_scl})`;
            }
        },

        fitToContainer() {
            let el_container = document.getElementById(this.s_id__container);
            let el_wrapper = document.getElementById(this.s_id__wrapper);
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
                this.n_scl = Math.min(n_scl_x, n_scl_y, 2);

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
            let el_wrapper = document.getElementById(this.s_id__wrapper);
            let el_header = document.getElementById(this.s_id__header);
            if (!el_wrapper) return;

            el_wrapper.innerHTML = s_svg;
            let el_svg = el_wrapper.querySelector('svg');
            if (el_svg) {
                el_svg.style.width = 'auto';
                el_svg.style.height = 'auto';
                el_svg.style.maxWidth = '100%';
                el_svg.style.maxHeight = '100%';
            }
            if (el_header) {
                el_header.classList.add('loaded');
            }
            setTimeout(() => this.fitToContainer(), 100);
        }
    };
};

let o_viewer__sketch = f_o_viewer_svg('svg-container-sketch', 'svg-wrapper-sketch', 'header-sketch');

let o_viewer__profile = {
    ...f_o_viewer_svg('svg-container-profile', 'svg-wrapper-profile', 'header-profile'),

    updateTransform() {
        let el_wrapper__profile = document.getElementById('svg-wrapper-profile');
        let el_wrapper__remover = document.getElementById('svg-wrapper-remover');
        let s_transform = `translate(${this.n_trn_x}px, ${this.n_trn_y}px) scale(${this.n_scl})`;
        if (el_wrapper__profile) el_wrapper__profile.style.transform = s_transform;
        if (el_wrapper__remover) el_wrapper__remover.style.transform = s_transform;
    },

    setRemoverSVG(s_svg) {
        let el_wrapper = document.getElementById('svg-wrapper-remover');
        let el_header = document.getElementById('header-remover');
        if (!el_wrapper) return;

        el_wrapper.innerHTML = s_svg;
        let el_svg = el_wrapper.querySelector('svg');
        if (el_svg) {
            el_svg.style.width = 'auto';
            el_svg.style.height = 'auto';
        }
        if (el_header) {
            el_header.classList.add('loaded');
        }
        this.updateTransform();
    }
};

let f_init_viewer_svg = function() {
    o_viewer__sketch.init();
    o_viewer__profile.init();

    document.getElementById('zoom-in').addEventListener('click', () => {
        o_viewer__sketch.n_scl *= 1.2; o_viewer__sketch.updateTransform();
        o_viewer__profile.n_scl *= 1.2; o_viewer__profile.updateTransform();
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
        o_viewer__sketch.n_scl /= 1.2; o_viewer__sketch.updateTransform();
        o_viewer__profile.n_scl /= 1.2; o_viewer__profile.updateTransform();
    });
    document.getElementById('zoom-reset').addEventListener('click', () => {
        o_viewer__sketch.reset();
        o_viewer__profile.reset();
    });
    document.getElementById('zoom-fit').addEventListener('click', () => {
        o_viewer__sketch.fitToContainer();
        o_viewer__profile.fitToContainer();
    });
};

// ============ MONACO EDITOR ============

let f_init_monaco = function() {
    return new Promise((resolve) => {
        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
        require(['vs/editor/editor.main'], function () {
            o_state.editor = monaco.editor.create(document.getElementById('editor-container'), {
                value: '// Upload DXF files to generate cylindric SCAD output',
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

// ============ FILE HANDLING ============

let f_s_text_from_o_file = function(o_file) {
    return new Promise((resolve, reject) => {
        let o_reader = new FileReader();
        o_reader.onload = () => resolve(o_reader.result);
        o_reader.onerror = reject;
        o_reader.readAsText(o_file);
    });
};

let f_handle_file_upload = async function(s_type, o_file) {
    try {
        f_update_status(`Parsing ${o_file.name}...`);
        let s_text = await f_s_text_from_o_file(o_file);
        o_state.o_file[s_type] = { name: o_file.name, text: s_text };
        o_state.o_sketch[s_type] = await f_o_sketch_from_s_dxf(s_text);

        f_update_status(`Loaded ${o_file.name}`);
        f_process_all_file();
    } catch (o_err) {
        f_update_status(`Error loading ${o_file.name}: ${o_err.message}`);
        console.error(o_err);
    }
};

let f_update_cylinder_info = function() {
    let el_info = document.getElementById('cylinder-info');
    if (!o_state.o_sketch.sketch) {
        el_info.style.display = 'none';
        return;
    }

    let o_info = f_o_cylinder_info_from_o_sketch(o_state.o_sketch.sketch, o_state.n_radius_offset);
    document.getElementById('info-width').textContent = o_info.n_scl_x.toFixed(2) + ' mm';
    document.getElementById('info-height').textContent = o_info.n_scl_y.toFixed(2) + ' mm';
    document.getElementById('info-radius').textContent = o_info.n_radius.toFixed(2) + ' mm';
    el_info.style.display = 'block';
};

let f_process_all_file = function() {
    // Generate SVG previews
    if (o_state.o_sketch.sketch) {
        let s_svg = f_s_svg_from_o_sketch(o_state.o_sketch.sketch);
        o_viewer__sketch.setSVG(s_svg);
        o_state.o_output.svg = s_svg;
        document.getElementById('dl-svg').disabled = false;
        f_update_cylinder_info();
    }
    if (o_state.o_sketch.profile) {
        o_viewer__profile.setSVG(f_s_svg_from_o_sketch(o_state.o_sketch.profile));
    }
    if (o_state.o_sketch.remover) {
        o_viewer__profile.setRemoverSVG(f_s_svg_from_o_sketch(o_state.o_sketch.remover));
    }

    // Generate JSON
    let o_data__json = {};
    if (o_state.o_sketch.sketch) o_data__json.sketch = o_state.o_sketch.sketch;
    if (o_state.o_sketch.profile) o_data__json.profile = o_state.o_sketch.profile;
    if (o_state.o_sketch.remover) o_data__json.remover = o_state.o_sketch.remover;
    o_state.o_output.json = JSON.stringify(o_data__json, null, 2);
    document.getElementById('dl-json').disabled = !o_state.o_sketch.sketch;

    // Generate SCAD if all three files are loaded
    if (o_state.o_sketch.sketch && o_state.o_sketch.profile && o_state.o_sketch.remover) {
        let s_name__sketch = o_state.o_file.sketch.name.replace(/\.dxf$/i, '');
        let s_name__profile = o_state.o_file.profile.name.replace(/\.dxf$/i, '');
        let s_name__remover = o_state.o_file.remover.name.replace(/\.dxf$/i, '');

        o_state.o_output.scad = f_s_scad_from_a_o_sketch(
            o_state.o_sketch.sketch, s_name__sketch,
            o_state.o_sketch.profile, s_name__profile,
            o_state.o_sketch.remover, s_name__remover,
            o_state.n_radius_offset
        );
        document.getElementById('dl-scad').disabled = false;
        f_update_status('All files processed - Cylindric SCAD generated');
        f_save_scad_to_server(o_state.o_output.scad, 'dxf-scad-cylinder');
    } else if (o_state.o_sketch.sketch && o_state.o_sketch.profile) {
        let s_name__profile = o_state.o_file.profile.name.replace(/\.dxf$/i, '');
        o_state.o_output.scad = f_s_scad_profile_functions_from_o_sketch(o_state.o_sketch.profile, s_name__profile, true);
        document.getElementById('dl-scad').disabled = false;
        f_update_status('Profile loaded - upload remover for full SCAD output');
    } else if (o_state.o_sketch.sketch) {
        o_state.o_output.scad = '// Upload profile and profile remover DXF files to generate full cylindric SCAD output';
        f_update_status('Sketch loaded - upload profile files');
    }

    f_update_editor();
};

let f_update_editor = function() {
    if (!o_state.editor) return;
    let s_content = o_state.s_tab__current === 'scad' ? o_state.o_output.scad : o_state.o_output.json;
    let s_language = o_state.s_tab__current === 'scad' ? 'cpp' : 'json';
    monaco.editor.setModelLanguage(o_state.editor.getModel(), s_language);
    o_state.editor.setValue(s_content || '// No content yet');
};

let f_update_status = function(s_msg) {
    document.getElementById('status').textContent = s_msg;
};

// ============ VIEW SWITCHING ============

let f_switch_view = function(s_view) {
    o_state.s_view__current = s_view;
    let el_panel__svg = document.getElementById('svg-panels');
    let el_container__threejs = document.getElementById('threejs-container');
    let el_toolbar__svg = document.getElementById('svg-toolbar');
    let el_toolbar__threejs = document.getElementById('threejs-toolbar');

    if (s_view === 'svg') {
        el_panel__svg.classList.remove('hidden');
        el_container__threejs.classList.remove('active');
        el_toolbar__svg.style.display = 'flex';
        el_toolbar__threejs.style.display = 'none';
    } else {
        el_panel__svg.classList.add('hidden');
        el_container__threejs.classList.add('active');
        el_toolbar__svg.style.display = 'none';
        el_toolbar__threejs.style.display = 'flex';
        o_viewer__three.onResize();
    }
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
            console.log(`SCAD saved to server: ${o_result.s_filename}`);
        }
    } catch (o_err) {
        console.error('Failed to save SCAD to server:', o_err);
    }
};

// ============ FILE SELECTION HANDLING ============

let f_handle_select_change = async function(s_type, el_select, el_file_input) {
    let s_val = el_select.value;

    if (s_val === 'custom') {
        el_file_input.click();
        el_select.value = '';
        return;
    }

    if (s_val === '') {
        return;
    }

    try {
        f_update_status(`Loading ${s_val}...`);
        let o_response = await fetch(s_val);
        if (!o_response.ok) {
            throw new Error(`Failed to load ${s_val}`);
        }
        let s_text = await o_response.text();
        let s_name__file = s_val.split('/').pop();

        o_state.o_file[s_type] = { name: s_name__file, text: s_text };
        o_state.o_sketch[s_type] = await f_o_sketch_from_s_dxf(s_text);

        el_select.classList.add('loaded');
        f_update_status(`Loaded ${s_name__file}`);
        f_process_all_file();
    } catch (o_err) {
        f_update_status(`Error: ${o_err.message}`);
        console.error(o_err);
        el_select.value = '';
    }
};

let f_handle_custom_file_upload = function(s_type, o_file, el_select) {
    f_handle_file_upload(s_type, o_file).then(() => {
        el_select.value = '';
        el_select.classList.add('loaded');
    });
};

// ============ FILE LIST LOADING ============

let a_o_combo__loaded = [];

let f_populate_file_select = async function(el_select, s_default_value = ''){
    try {
        let o_response = await fetch('/api/list-profiles');
        let a_s_file = await o_response.json();

        el_select.innerHTML = '<option value="">-- Select --</option>';

        for(let s_file of a_s_file){
            let el_option = document.createElement('option');
            el_option.value = `dxffiles/${s_file}`;
            let s_name = s_file.replace('.dxf', '').replace(/_/g, ' ');
            s_name = s_name.charAt(0).toUpperCase() + s_name.slice(1);
            el_option.textContent = s_name;
            if(s_default_value && s_file === s_default_value){
                el_option.selected = true;
            }
            el_select.appendChild(el_option);
        }

        let el_option__custom = document.createElement('option');
        el_option__custom.value = 'custom';
        el_option__custom.textContent = 'Custom file...';
        el_select.appendChild(el_option__custom);

    } catch(e) {
        console.error('Failed to load file list:', e);
        el_select.innerHTML = '<option value="">-- Error loading --</option><option value="custom">Custom file...</option>';
    }
};

let f_populate_combo_select = async function(el_select){
    try {
        let o_response = await fetch('/api/list-profile-combo');
        a_o_combo__loaded = await o_response.json();

        el_select.innerHTML = '<option value="">-- Custom --</option>';

        for(let o_combo of a_o_combo__loaded){
            let el_option = document.createElement('option');
            el_option.value = o_combo.s_folder;
            el_option.textContent = o_combo.s_name;
            el_select.appendChild(el_option);
        }

    } catch(e) {
        console.error('Failed to load combo list:', e);
        el_select.innerHTML = '<option value="">-- Custom --</option>';
    }
};

let f_handle_combo_change = function(el_select__combo, el_select__profile, el_select__remover){
    let s_folder = el_select__combo.value;
    if(!s_folder){
        el_select__profile.disabled = false;
        el_select__remover.disabled = false;
        return;
    }

    let o_combo = a_o_combo__loaded.find(o => o.s_folder === s_folder);
    if(!o_combo) return;

    let s_path__profile = `dxffiles/${o_combo.s_path__profile}`;
    let s_path__remover = `dxffiles/${o_combo.s_path__remover}`;

    let f_ensure_option = function(el_select, s_value, s_name){
        if(!el_select.querySelector(`option[value="${s_value}"]`)){
            let el_option = document.createElement('option');
            el_option.value = s_value;
            el_option.textContent = s_name;
            let el_custom = el_select.querySelector('option[value="custom"]');
            el_select.insertBefore(el_option, el_custom);
        }
    };

    f_ensure_option(el_select__profile, s_path__profile, `[${o_combo.s_name}] Profile`);
    f_ensure_option(el_select__remover, s_path__remover, `[${o_combo.s_name}] Remover`);

    el_select__profile.value = s_path__profile;
    el_select__remover.value = s_path__remover;

    el_select__profile.dispatchEvent(new Event('change'));
    el_select__remover.dispatchEvent(new Event('change'));
};

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', async () => {
    await f_init_monaco();
    f_init_viewer_svg();
    o_viewer__three.init();

    // Select dropdowns and file inputs
    let el_select__sketch = document.getElementById('select-sketch');
    let el_select__combo = document.getElementById('select-combo');
    let el_select__profile = document.getElementById('select-profile');
    let el_select__remover = document.getElementById('select-remover');
    let el_input__radius_offset = document.getElementById('input-radius-offset');

    // Populate selects from server
    await Promise.all([
        f_populate_file_select(el_select__sketch),
        f_populate_combo_select(el_select__combo),
        f_populate_file_select(el_select__profile, 'profile_full.dxf'),
        f_populate_file_select(el_select__remover, 'profile_remover.dxf')
    ]);
    let el_file__sketch = document.getElementById('file-sketch');
    let el_file__profile = document.getElementById('file-profile');
    let el_file__remover = document.getElementById('file-remover');

    // Radius offset handler
    el_input__radius_offset.addEventListener('change', () => {
        o_state.n_radius_offset = parseFloat(el_input__radius_offset.value) || 0;
        f_update_cylinder_info();
        f_process_all_file();  // regenerate SCAD with new offset
    });

    // Combo preset change handler
    el_select__combo.addEventListener('change', () => f_handle_combo_change(el_select__combo, el_select__profile, el_select__remover));

    // Select change handlers
    el_select__sketch.addEventListener('change', () => f_handle_select_change('sketch', el_select__sketch, el_file__sketch));
    el_select__profile.addEventListener('change', () => f_handle_select_change('profile', el_select__profile, el_file__profile));
    el_select__remover.addEventListener('change', () => f_handle_select_change('remover', el_select__remover, el_file__remover));

    // Custom file upload handlers
    el_file__sketch.addEventListener('change', (evt) => {
        if (evt.target.files[0]) f_handle_custom_file_upload('sketch', evt.target.files[0], el_select__sketch);
    });
    el_file__profile.addEventListener('change', (evt) => {
        if (evt.target.files[0]) f_handle_custom_file_upload('profile', evt.target.files[0], el_select__profile);
    });
    el_file__remover.addEventListener('change', (evt) => {
        if (evt.target.files[0]) f_handle_custom_file_upload('remover', evt.target.files[0], el_select__remover);
    });

    // Editor tabs
    document.querySelectorAll('.editor-tab').forEach(el_tab => {
        el_tab.addEventListener('click', () => {
            document.querySelectorAll('.editor-tab').forEach(el_t => el_t.classList.remove('active'));
            el_tab.classList.add('active');
            o_state.s_tab__current = el_tab.dataset.content;
            f_update_editor();
        });
    });

    // Viewer tabs
    document.querySelectorAll('.viewer-tab').forEach(el_tab => {
        el_tab.addEventListener('click', () => {
            document.querySelectorAll('.viewer-tab').forEach(el_t => el_t.classList.remove('active'));
            el_tab.classList.add('active');
            f_switch_view(el_tab.dataset.view);
        });
    });

    // Download buttons
    document.getElementById('dl-svg').addEventListener('click', () => {
        let s_name = o_state.o_file.sketch?.name.replace(/\.dxf$/i, '') || 'sketch';
        f_download_file(o_state.o_output.svg, `${s_name}.svg`, 'image/svg+xml');
    });
    document.getElementById('dl-scad').addEventListener('click', () => {
        let s_name = o_state.o_file.sketch?.name.replace(/\.dxf$/i, '') || 'output';
        f_download_file(o_state.o_output.scad, `${s_name}_cylinder.scad`, 'text/plain');
    });
    document.getElementById('dl-json').addEventListener('click', () => {
        let s_name = o_state.o_file.sketch?.name.replace(/\.dxf$/i, '') || 'data';
        f_download_file(o_state.o_output.json, `${s_name}.json`, 'application/json');
    });

    f_update_status('Ready - select a sketch path to wrap around cylinder');

    // Auto-load preselected files
    if (el_select__profile.value) {
        await f_handle_select_change('profile', el_select__profile, el_file__profile);
    }
    if (el_select__remover.value) {
        await f_handle_select_change('remover', el_select__remover, el_file__remover);
    }
});
