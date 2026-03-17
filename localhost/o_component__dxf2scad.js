// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { o_state, f_send_wsmsg_with_response, o_wsmsg__syncdata } from './index.js';
import { f_o_html_from_o_js } from "./lib/handyhelpers.js";
import {
    f_o_wsmsg,
    o_wsmsg__upload_dxf,
    o_wsmsg__generate_scad,
    f_s_name_table__from_o_model,
    o_model__o_dxffile,
} from './constructors.js';

let f_s_svg_from_a_o_entity = function(a_o_entity){
    let a_o_line = a_o_entity.filter(function(o){ return o.s_type === "LINE"; });
    let a_o_arc = a_o_entity.filter(function(o){ return o.s_type === "ARC"; });
    let a_o_circle = a_o_entity.filter(function(o){ return o.s_type === "CIRCLE"; });

    let n_x_min = Infinity, n_x_max = -Infinity;
    let n_y_min = Infinity, n_y_max = -Infinity;

    for(let o of a_o_line){
        n_x_min = Math.min(n_x_min, o.o_vec3_trn_start.n_x, o.o_vec3_trn_end.n_x);
        n_x_max = Math.max(n_x_max, o.o_vec3_trn_start.n_x, o.o_vec3_trn_end.n_x);
        n_y_min = Math.min(n_y_min, o.o_vec3_trn_start.n_y, o.o_vec3_trn_end.n_y);
        n_y_max = Math.max(n_y_max, o.o_vec3_trn_start.n_y, o.o_vec3_trn_end.n_y);
    }
    for(let o of a_o_arc){
        let n_sx = o.o_vec3_trn.n_x + o.n_radius * Math.cos(o.n_ang_deg_start * Math.PI / 180);
        let n_sy = o.o_vec3_trn.n_y + o.n_radius * Math.sin(o.n_ang_deg_start * Math.PI / 180);
        let n_ex = o.o_vec3_trn.n_x + o.n_radius * Math.cos(o.n_ang_deg_end * Math.PI / 180);
        let n_ey = o.o_vec3_trn.n_y + o.n_radius * Math.sin(o.n_ang_deg_end * Math.PI / 180);
        n_x_min = Math.min(n_x_min, n_sx, n_ex);
        n_x_max = Math.max(n_x_max, n_sx, n_ex);
        n_y_min = Math.min(n_y_min, n_sy, n_ey);
        n_y_max = Math.max(n_y_max, n_sy, n_ey);
        for(let n_deg of [0, 90, 180, 270]){
            let n_d = n_deg;
            if(n_d < o.n_ang_deg_start) n_d += 360;
            if(n_d >= o.n_ang_deg_start && n_d <= o.n_ang_deg_end){
                let n_px = o.o_vec3_trn.n_x + o.n_radius * Math.cos(n_deg * Math.PI / 180);
                let n_py = o.o_vec3_trn.n_y + o.n_radius * Math.sin(n_deg * Math.PI / 180);
                n_x_min = Math.min(n_x_min, n_px);
                n_x_max = Math.max(n_x_max, n_px);
                n_y_min = Math.min(n_y_min, n_py);
                n_y_max = Math.max(n_y_max, n_py);
            }
        }
    }
    for(let o of a_o_circle){
        n_x_min = Math.min(n_x_min, o.o_vec3_trn.n_x - o.n_radius);
        n_x_max = Math.max(n_x_max, o.o_vec3_trn.n_x + o.n_radius);
        n_y_min = Math.min(n_y_min, o.o_vec3_trn.n_y - o.n_radius);
        n_y_max = Math.max(n_y_max, o.o_vec3_trn.n_y + o.n_radius);
    }

    if(!isFinite(n_x_min)) return '';

    let n_pad = Math.max(n_x_max - n_x_min, n_y_max - n_y_min) * 0.1 || 1;
    let n_vb_x = n_x_min - n_pad;
    let n_vb_y = -(n_y_max + n_pad);
    let n_vb_w = (n_x_max - n_x_min) + n_pad * 2;
    let n_vb_h = (n_y_max - n_y_min) + n_pad * 2;
    let n_sw = Math.max(n_vb_w, n_vb_h) * 0.015;
    let n_r = n_sw * 1.5;

    let a_s = [];
    a_s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + n_vb_x + ' ' + n_vb_y + ' ' + n_vb_w + ' ' + n_vb_h + '">');

    for(let o of a_o_line){
        a_s.push('<line x1="' + o.o_vec3_trn_start.n_x + '" y1="' + (-o.o_vec3_trn_start.n_y) + '" x2="' + o.o_vec3_trn_end.n_x + '" y2="' + (-o.o_vec3_trn_end.n_y) + '" stroke="#8b74ea" stroke-width="' + n_sw + '" fill="none" stroke-linecap="round"/>');
    }
    for(let o of a_o_arc){
        let n_sx = o.o_vec3_trn.n_x + o.n_radius * Math.cos(o.n_ang_deg_start * Math.PI / 180);
        let n_sy = o.o_vec3_trn.n_y + o.n_radius * Math.sin(o.n_ang_deg_start * Math.PI / 180);
        let n_ex = o.o_vec3_trn.n_x + o.n_radius * Math.cos(o.n_ang_deg_end * Math.PI / 180);
        let n_ey = o.o_vec3_trn.n_y + o.n_radius * Math.sin(o.n_ang_deg_end * Math.PI / 180);
        let n_sweep = o.n_ang_deg_end - o.n_ang_deg_start;
        if(n_sweep < 0) n_sweep += 360;
        let n_large = n_sweep > 180 ? 1 : 0;
        a_s.push('<path d="M ' + n_sx + ' ' + (-n_sy) + ' A ' + o.n_radius + ' ' + o.n_radius + ' 0 ' + n_large + ' 0 ' + n_ex + ' ' + (-n_ey) + '" stroke="#8b74ea" stroke-width="' + n_sw + '" fill="none" stroke-linecap="round"/>');
    }
    for(let o of a_o_circle){
        a_s.push('<circle cx="' + o.o_vec3_trn.n_x + '" cy="' + (-o.o_vec3_trn.n_y) + '" r="' + o.n_radius + '" stroke="#8b74ea" stroke-width="' + n_sw + '" fill="none"/>');
    }

    let a_o_point = [];
    for(let o of a_o_line){ a_o_point.push(o.o_vec3_trn_start, o.o_vec3_trn_end); }
    for(let o of a_o_arc){ a_o_point.push(o.o_vec3_trn_start, o.o_vec3_trn_end); }
    for(let o_p of a_o_point){
        a_s.push('<circle cx="' + o_p.n_x + '" cy="' + (-o_p.n_y) + '" r="' + n_r + '" fill="#fc8181" opacity="0.7"/>');
    }

    a_s.push('</svg>');
    return a_s.join('\n');
};

let f_s_svg_from_o_dxffile = function(o_dxffile){
    if(!o_dxffile || !o_dxffile.s_json_a_o_entity) return '';
    let a_o_entity = JSON.parse(o_dxffile.s_json_a_o_entity);
    return f_s_svg_from_a_o_entity(a_o_entity);
};

// ===== PROFILE POINT COMPUTATION (client-side mirror of server logic) =====

let f_a_o_point__from_entity_directed = function(o_ent, b_reversed, n_point_per_mm){
    let a_o = [];
    if(o_ent.s_type === "LINE"){
        let n_dx = o_ent.o_vec3_trn_end.n_x - o_ent.o_vec3_trn_start.n_x;
        let n_dy = o_ent.o_vec3_trn_end.n_y - o_ent.o_vec3_trn_start.n_y;
        let n_len = Math.sqrt(n_dx * n_dx + n_dy * n_dy);
        let n_seg = Math.max(2, Math.ceil(n_len * n_point_per_mm));
        let o_s = b_reversed ? o_ent.o_vec3_trn_end : o_ent.o_vec3_trn_start;
        let o_e = b_reversed ? o_ent.o_vec3_trn_start : o_ent.o_vec3_trn_end;
        for(let n = 0; n <= n_seg; n++){
            let t = n / n_seg;
            a_o.push({ n_x: o_s.n_x + (o_e.n_x - o_s.n_x) * t, n_y: o_s.n_y + (o_e.n_y - o_s.n_y) * t });
        }
    }
    if(o_ent.s_type === "ARC"){
        let n_arc_len = Math.abs(o_ent.n_ang_rad_end - o_ent.n_ang_rad_start) * o_ent.n_radius;
        let n_seg = Math.max(3, Math.ceil(n_arc_len * n_point_per_mm));
        let n_a0 = b_reversed ? o_ent.n_ang_rad_end : o_ent.n_ang_rad_start;
        let n_a1 = b_reversed ? o_ent.n_ang_rad_start : o_ent.n_ang_rad_end;
        for(let n = 0; n <= n_seg; n++){
            let t = n / n_seg;
            let a = n_a0 + (n_a1 - n_a0) * t;
            a_o.push({ n_x: o_ent.o_vec3_trn.n_x + o_ent.n_radius * Math.cos(a), n_y: o_ent.o_vec3_trn.n_y + o_ent.n_radius * Math.sin(a) });
        }
    }
    return a_o;
};

let f_b_pt_eq = function(a, b){ return Math.abs(a.n_x - b.n_x) < 0.0001 && Math.abs(a.n_y - b.n_y) < 0.0001; };

let f_a_o_profile_point_from_a_o_entity = function(a_o_entity, n_point_per_mm = 1){
    // group connected entities, extract ordered points, compute xpositive + mirroredx
    let a_o_connectable = a_o_entity.filter(function(o){ return o && o.s_type !== "CIRCLE" && o.o_vec3_trn_start && o.o_vec3_trn_end; });
    if(a_o_connectable.length === 0) return { a_o_xpositive: [], a_o_mirroredx: [], a_o_ordered: [] };

    // build adjacency + order chain (simplified: single chain)
    let o_map = new Map();
    for(let o of a_o_connectable) o_map.set(o, []);
    for(let i = 0; i < a_o_connectable.length; i++){
        for(let j = i + 1; j < a_o_connectable.length; j++){
            let a = a_o_connectable[i], b = a_o_connectable[j];
            if(f_b_pt_eq(a.o_vec3_trn_start, b.o_vec3_trn_start) || f_b_pt_eq(a.o_vec3_trn_start, b.o_vec3_trn_end) ||
               f_b_pt_eq(a.o_vec3_trn_end, b.o_vec3_trn_start) || f_b_pt_eq(a.o_vec3_trn_end, b.o_vec3_trn_end)){
                o_map.get(a).push(b);
                o_map.get(b).push(a);
            }
        }
    }

    // find endpoint (1 connection) to start from
    let o_start = a_o_connectable[0];
    for(let o of a_o_connectable){
        if(o_map.get(o).length <= 1){ o_start = o; break; }
    }

    // walk chain
    let a_o_ordered = [];
    let o_visited = new Set();
    let o_cur = o_start;
    while(o_cur && !o_visited.has(o_cur)){
        o_visited.add(o_cur);
        a_o_ordered.push(o_cur);
        let o_next = null;
        for(let o_n of o_map.get(o_cur)){ if(!o_visited.has(o_n)){ o_next = o_n; break; } }
        o_cur = o_next;
    }

    // extract points with direction
    let a_o_vec3 = [];
    let o_prev_exit = null;
    for(let n_idx = 0; n_idx < a_o_ordered.length; n_idx++){
        let o_ent = a_o_ordered[n_idx];
        let b_rev = false;
        if(n_idx === 0 && a_o_ordered.length > 1){
            let o_next = a_o_ordered[1];
            let b_end_conn = f_b_pt_eq(o_ent.o_vec3_trn_end, o_next.o_vec3_trn_start) || f_b_pt_eq(o_ent.o_vec3_trn_end, o_next.o_vec3_trn_end);
            b_rev = !b_end_conn;
            o_prev_exit = b_rev ? o_ent.o_vec3_trn_start : o_ent.o_vec3_trn_end;
        } else if(n_idx > 0){
            b_rev = !f_b_pt_eq(o_ent.o_vec3_trn_start, o_prev_exit);
            o_prev_exit = b_rev ? o_ent.o_vec3_trn_start : o_ent.o_vec3_trn_end;
        }
        let a_p = f_a_o_point__from_entity_directed(o_ent, b_rev, n_point_per_mm);
        if(n_idx > 0 && a_p.length > 0) a_p = a_p.slice(1);
        a_o_vec3.push(...a_p);
    }

    if(a_o_vec3.length === 0) return { a_o_xpositive: [], a_o_mirroredx: [], a_o_ordered: [] };

    // same logic as server f_o_profile_points_from_a_o_vec3
    let n_x_min = Math.min(...a_o_vec3.map(function(p){ return p.n_x; }));
    let n_y_min = Math.min(...a_o_vec3.map(function(p){ return p.n_y; }));
    let n_y_max = Math.max(...a_o_vec3.map(function(p){ return p.n_y; }));
    let n_y_center = (n_y_min + n_y_max) / 2;
    let n_axis_x = n_x_min;
    let n_tol = 0.001;

    let b_closed = a_o_vec3.length > 2 &&
        Math.abs(a_o_vec3[0].n_x - a_o_vec3[a_o_vec3.length - 1].n_x) < n_tol &&
        Math.abs(a_o_vec3[0].n_y - a_o_vec3[a_o_vec3.length - 1].n_y) < n_tol;

    let a_o_xpositive = [];

    if(b_closed){
        let a_n_idx__axis = [];
        for(let i = 0; i < a_o_vec3.length; i++){
            if(Math.abs(a_o_vec3[i].n_x - n_axis_x) < n_tol) a_n_idx__axis.push(i);
        }
        if(a_n_idx__axis.length >= 2){
            let n_idx__bottom = a_n_idx__axis[0], n_idx__top = a_n_idx__axis[0];
            for(let i of a_n_idx__axis){
                if(a_o_vec3[i].n_y < a_o_vec3[n_idx__bottom].n_y) n_idx__bottom = i;
                if(a_o_vec3[i].n_y > a_o_vec3[n_idx__top].n_y) n_idx__top = i;
            }
            let f_seg = function(n_from, n_to){
                let a = [], n_len = a_o_vec3.length, i = n_from;
                for(let s = 0; s < n_len; s++){
                    a.push(a_o_vec3[i]);
                    if(i === n_to) break;
                    i = (i + 1) % n_len;
                }
                return a;
            };
            let a_a = f_seg(n_idx__bottom, n_idx__top);
            let a_b = f_seg(n_idx__top, n_idx__bottom);
            a_b.reverse();
            let f_avg = function(a){ return a.reduce(function(s, p){ return s + p.n_x; }, 0) / a.length; };
            let a_right = (f_avg(a_a) >= f_avg(a_b)) ? a_a : a_b;
            a_o_xpositive = a_right.map(function(p){ return { x: p.n_x - n_axis_x, y: p.n_y - n_y_center }; });
        } else {
            a_o_xpositive = a_o_vec3.filter(function(p){ return p.n_x > n_axis_x + n_tol; }).map(function(p){
                return { x: p.n_x - n_axis_x, y: p.n_y - n_y_center };
            });
        }
    } else {
        let a_raw = a_o_vec3.filter(function(p){ return p.n_x >= n_axis_x - n_tol; });
        if(a_raw.length === 0) a_raw = a_o_vec3;
        a_o_xpositive = a_raw.map(function(p){ return { x: p.n_x - n_axis_x, y: p.n_y - n_y_center }; });
    }

    // deduplicate
    let a_o_clean = [a_o_xpositive[0]];
    for(let i = 1; i < a_o_xpositive.length; i++){
        let p = a_o_clean[a_o_clean.length - 1], c = a_o_xpositive[i];
        if(Math.sqrt((c.x - p.x) ** 2 + (c.y - p.y) ** 2) > 0.0001) a_o_clean.push(c);
    }
    a_o_xpositive = a_o_clean;

    let a_o_mirroredx = [...a_o_xpositive];
    for(let i = a_o_xpositive.length - 1; i >= 0; i--){
        if(Math.abs(a_o_xpositive[i].x) < 0.0001) continue;
        a_o_mirroredx.push({ x: -a_o_xpositive[i].x, y: a_o_xpositive[i].y });
    }

    return { a_o_xpositive, a_o_mirroredx, a_o_ordered: a_o_vec3 };
};

let f_s_svg_profile_points = function(o_dxffile, n_point_per_mm = 1){
    if(!o_dxffile || !o_dxffile.s_json_a_o_entity) return '';
    let a_o_entity = JSON.parse(o_dxffile.s_json_a_o_entity);
    let o_profile = f_a_o_profile_point_from_a_o_entity(a_o_entity, n_point_per_mm);
    let a_o_xpos = o_profile.a_o_xpositive;
    let a_o_mirror = o_profile.a_o_mirroredx;

    if(a_o_mirror.length < 2) return '';

    // bounding box from mirroredx
    let n_x_min = Infinity, n_x_max = -Infinity, n_y_min = Infinity, n_y_max = -Infinity;
    for(let p of a_o_mirror){
        n_x_min = Math.min(n_x_min, p.x); n_x_max = Math.max(n_x_max, p.x);
        n_y_min = Math.min(n_y_min, p.y); n_y_max = Math.max(n_y_max, p.y);
    }

    let n_pad = Math.max(n_x_max - n_x_min, n_y_max - n_y_min) * 0.15 || 1;
    let n_vb_x = n_x_min - n_pad;
    let n_vb_y = -(n_y_max + n_pad);
    let n_vb_w = (n_x_max - n_x_min) + n_pad * 2;
    let n_vb_h = (n_y_max - n_y_min) + n_pad * 2;
    let n_sw = Math.max(n_vb_w, n_vb_h) * 0.012;
    let n_r = n_sw * 2;

    let a_s = [];
    a_s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + n_vb_x + ' ' + n_vb_y + ' ' + n_vb_w + ' ' + n_vb_h + '">');

    // mirror axis line at x=0
    a_s.push('<line x1="0" y1="' + (-(n_y_min - n_pad * 0.5)) + '" x2="0" y2="' + (-(n_y_max + n_pad * 0.5)) + '" stroke="#4a5568" stroke-width="' + (n_sw * 0.5) + '" stroke-dasharray="' + (n_sw * 2) + '"/>');

    // mirroredx outline (filled, dim)
    let s_mirror_pts = a_o_mirror.map(function(p){ return p.x + ',' + (-p.y); }).join(' ');
    a_s.push('<polygon points="' + s_mirror_pts + '" fill="rgba(139,116,234,0.1)" stroke="#8b74ea" stroke-width="' + n_sw + '" stroke-linejoin="round"/>');

    // xpositive outline (brighter)
    let s_xpos_pts = a_o_xpos.map(function(p){ return p.x + ',' + (-p.y); }).join(' ');
    a_s.push('<polyline points="' + s_xpos_pts + '" fill="none" stroke="#68d391" stroke-width="' + (n_sw * 1.5) + '" stroke-linejoin="round" stroke-linecap="round"/>');

    // points on xpositive with index numbers
    let n_font = n_r * 2.5;
    for(let i = 0; i < a_o_xpos.length; i++){
        let p = a_o_xpos[i];
        a_s.push('<circle cx="' + p.x + '" cy="' + (-p.y) + '" r="' + n_r + '" fill="#68d391" opacity="0.8"/>');
        a_s.push('<text x="' + (p.x + n_r * 1.5) + '" y="' + (-p.y + n_font * 0.35) + '" font-size="' + n_font + '" fill="#68d391" font-family="monospace">' + i + '</text>');
    }

    a_s.push('</svg>');
    return a_s.join('\n');
};

let a_o_generation_type = [
    { s_value: 'profile_revolve', s_label: 'Profile endpoint revolve — profile revolved around X axis' },
    { s_value: 'simple', s_label: 'Simple — all entities, no endpoint revolves, no joints, no remover' },
    { s_value: 'simple_endpoints', s_label: 'Simple — all entities, endpoint revolves, no joints, no remover' },
    { s_value: 'simple_endpoints_joints', s_label: 'Simple — all entities, endpoint revolves, joints, no remover' },
    { s_value: 'simple_endpoints_joints_remover', s_label: 'Simple — all entities, endpoint revolves, joints, remover' },
];

let o_component__dxf2scad = {
    name: 'component-dxf2scad',
    template: (await f_o_html_from_o_js({
        s_tag: 'div',
        class: 'o_dxf2scad',
        a_o: [
            {
                s_tag: 'h2',
                innerText: 'DXF to OpenSCAD',
            },
            // Generation type selector
            {
                s_tag: 'div',
                class: 'o_dxf2scad__upload_row',
                a_o: [
                    {
                        s_tag: 'div',
                        class: 'o_dxf2scad__upload_label',
                        innerText: 'Generation type',
                    },
                    {
                        s_tag: 'select',
                        'v-model': 's_generation_type',
                        class: 'o_dxf2scad__select',
                        a_o: [
                            {
                                s_tag: 'option',
                                'v-for': 'o_type in a_o_generation_type',
                                ':value': 'o_type.s_value',
                                innerText: '{{ o_type.s_label }}',
                            },
                        ],
                    },
                ],
            },
            // Points per mm
            {
                s_tag: 'div',
                class: 'o_dxf2scad__upload_row',
                a_o: [
                    {
                        s_tag: 'div',
                        class: 'o_dxf2scad__upload_label',
                        innerText: 'Points per mm',
                    },
                    {
                        s_tag: 'input',
                        type: 'number',
                        'v-model.number': 'n_point_per_mm',
                        min: '0.1',
                        max: '20',
                        step: '0.1',
                        class: 'o_dxf2scad__input_number',
                    },
                ],
            },
            {
                s_tag: 'div',
                class: 'o_dxf2scad__upload_row',
                'v-if': "s_generation_type !== 'profile_revolve'",
                a_o: [
                    {
                        s_tag: 'div',
                        class: 'o_dxf2scad__upload_label',
                        innerText: 'Sweep function',
                    },
                    {
                        s_tag: 'select',
                        'v-model': 's_sweep_function',
                        class: 'o_dxf2scad__select',
                        a_o: [
                            { s_tag: 'option', value: 'path_sweep2d', innerText: 'path_sweep2d (2D profile)' },
                            { s_tag: 'option', value: 'path_sweep', innerText: 'path_sweep (3D, faster, no gaps)' },
                        ],
                    },
                ],
            },
            // Upload sections
            {
                s_tag: 'div',
                class: 'o_dxf2scad__upload_section',
                a_o: [
                    // Profile
                    {
                        s_tag: 'div',
                        class: 'o_dxf2scad__upload_group',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_dxf2scad__upload_row',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_dxf2scad__upload_label',
                                        innerText: 'Profile',
                                    },
                                    {
                                        s_tag: 'select',
                                        'v-model': 'n_id__profile',
                                        class: 'o_dxf2scad__select',
                                        a_o: [
                                            {
                                                s_tag: 'option',
                                                ':value': 'null',
                                                innerText: '-- select or upload --',
                                            },
                                            {
                                                s_tag: 'option',
                                                'v-for': "o_dxf in a_o_dxffile__profile",
                                                ':value': 'o_dxf.n_id',
                                                innerText: '{{ o_dxf.s_name }} ({{ JSON.parse(o_dxf.s_json_a_o_entity).length }} entities)',
                                            },
                                        ],
                                    },
                                    {
                                        s_tag: 'input',
                                        type: 'file',
                                        accept: '.dxf',
                                        'v-on:change': "f_upload_dxf($event, 'profile')",
                                        class: 'o_dxf2scad__file_input',
                                    },
                                ],
                            },
                            {
                                s_tag: 'div',
                                'v-if': 'o_svg__profile',
                                class: 'o_dxf2scad__preview_row',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_dxf2scad__preview',
                                        'v-html': 'o_svg__profile',
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_svg__profile_points',
                                        class: 'o_dxf2scad__preview',
                                        'v-html': 'o_svg__profile_points',
                                    },
                                ],
                            },
                        ],
                    },
                    // Profile Remover (only for full mode)
                    {
                        s_tag: 'div',
                        'v-if': "s_generation_type === 'simple_endpoints_joints_remover'",
                        class: 'o_dxf2scad__upload_group',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_dxf2scad__upload_row',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_dxf2scad__upload_label',
                                        innerText: 'Profile Remover',
                                    },
                                    {
                                        s_tag: 'select',
                                        'v-model': 'n_id__profile_remover',
                                        class: 'o_dxf2scad__select',
                                        a_o: [
                                            {
                                                s_tag: 'option',
                                                ':value': 'null',
                                                innerText: '-- select or upload --',
                                            },
                                            {
                                                s_tag: 'option',
                                                'v-for': "o_dxf in a_o_dxffile__profile_remover",
                                                ':value': 'o_dxf.n_id',
                                                innerText: '{{ o_dxf.s_name }} ({{ JSON.parse(o_dxf.s_json_a_o_entity).length }} entities)',
                                            },
                                        ],
                                    },
                                    {
                                        s_tag: 'input',
                                        type: 'file',
                                        accept: '.dxf',
                                        'v-on:change': "f_upload_dxf($event, 'profile_remover')",
                                        class: 'o_dxf2scad__file_input',
                                    },
                                ],
                            },
                            {
                                s_tag: 'div',
                                'v-if': 'o_svg__profile_remover',
                                class: 'o_dxf2scad__preview_row',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_dxf2scad__preview',
                                        'v-html': 'o_svg__profile_remover',
                                    },
                                    {
                                        s_tag: 'div',
                                        'v-if': 'o_svg__profile_remover_points',
                                        class: 'o_dxf2scad__preview',
                                        'v-html': 'o_svg__profile_remover_points',
                                    },
                                ],
                            },
                        ],
                    },
                    // Path
                    {
                        s_tag: 'div',
                        'v-if': "s_generation_type !== 'profile_revolve'",
                        class: 'o_dxf2scad__upload_group',
                        a_o: [
                            {
                                s_tag: 'div',
                                class: 'o_dxf2scad__upload_row',
                                a_o: [
                                    {
                                        s_tag: 'div',
                                        class: 'o_dxf2scad__upload_label',
                                        innerText: 'Path',
                                    },
                                    {
                                        s_tag: 'select',
                                        'v-model': 'n_id__path',
                                        class: 'o_dxf2scad__select',
                                        a_o: [
                                            {
                                                s_tag: 'option',
                                                ':value': 'null',
                                                innerText: '-- select or upload --',
                                            },
                                            {
                                                s_tag: 'option',
                                                'v-for': "o_dxf in a_o_dxffile__path",
                                                ':value': 'o_dxf.n_id',
                                                innerText: '{{ o_dxf.s_name }} ({{ JSON.parse(o_dxf.s_json_a_o_entity).length }} entities)',
                                            },
                                        ],
                                    },
                                    {
                                        s_tag: 'input',
                                        type: 'file',
                                        accept: '.dxf',
                                        'v-on:change': "f_upload_dxf($event, 'path')",
                                        class: 'o_dxf2scad__file_input',
                                    },
                                ],
                            },
                            {
                                s_tag: 'div',
                                'v-if': 'o_svg__path',
                                class: 'o_dxf2scad__preview o_dxf2scad__preview--standalone',
                                'v-html': 'o_svg__path',
                            },
                        ],
                    },
                ],
            },
            // Generate button
            {
                s_tag: 'div',
                class: 'o_dxf2scad__action_row',
                a_o: [
                    {
                        s_tag: 'div',
                        ':class': "'interactable o_dxf2scad__generate_btn' + (b_can_generate ? '' : ' disabled')",
                        'v-on:click': 'f_generate_scad',
                        innerText: "{{ b_generating ? 'Generating...' : 'Generate OpenSCAD' }}",
                    },
                    {
                        s_tag: 'div',
                        'v-if': 's_status',
                        class: 'o_dxf2scad__status',
                        innerText: '{{ s_status }}',
                    },
                ],
            },
            // Output
            {
                s_tag: 'div',
                'v-if': 's_scad_output',
                class: 'o_dxf2scad__output',
                a_o: [
                    {
                        s_tag: 'div',
                        class: 'o_dxf2scad__output_header',
                        a_o: [
                            {
                                s_tag: 'div',
                                innerText: 'Generated OpenSCAD',
                            },
                            {
                                s_tag: 'div',
                                class: 'interactable o_dxf2scad__copy_btn',
                                'v-on:click': 'f_copy_scad',
                                innerText: 'Copy to clipboard',
                            },
                            {
                                s_tag: 'div',
                                class: 'interactable o_dxf2scad__copy_btn',
                                'v-on:click': 'f_download_scad',
                                innerText: 'Download .scad',
                            },
                        ],
                    },
                    {
                        s_tag: 'div',
                        'v-if': 's_path_scad',
                        class: 'o_dxf2scad__path_info',
                        innerText: 'Saved to: {{ s_path_scad }}',
                    },
                    {
                        s_tag: 'pre',
                        class: 'o_dxf2scad__code',
                        innerText: '{{ s_scad_output }}',
                    },
                ],
            },
            // Uploaded DXF files list
            {
                s_tag: 'div',
                'v-if': 'a_o_dxffile__all.length > 0',
                class: 'o_dxf2scad__file_list',
                a_o: [
                    {
                        s_tag: 'h3',
                        innerText: 'Uploaded DXF files',
                    },
                    {
                        s_tag: 'div',
                        'v-for': 'o_dxf in a_o_dxffile__all',
                        class: 'o_dxf2scad__file_item',
                        a_o: [
                            {
                                s_tag: 'span',
                                class: 'o_dxf2scad__file_type',
                                innerText: '{{ o_dxf.s_type }}',
                            },
                            {
                                s_tag: 'span',
                                innerText: '{{ o_dxf.s_name }}',
                            },
                            {
                                s_tag: 'span',
                                class: 'o_dxf2scad__file_entities',
                                innerText: '{{ JSON.parse(o_dxf.s_json_a_o_entity).length }} entities',
                            },
                            {
                                s_tag: 'div',
                                class: 'interactable',
                                'v-on:click': 'f_delete_dxffile(o_dxf)',
                                innerText: 'delete',
                            },
                        ],
                    },
                ],
            },
        ],
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            s_generation_type: 'simple',
            a_o_generation_type,
            n_point_per_mm: 1,
            s_sweep_function: 'path_sweep',
            n_id__profile: null,
            n_id__profile_remover: null,
            n_id__path: null,
            s_scad_output: '',
            s_path_scad: '',
            s_status: '',
            b_generating: false,
        };
    },
    computed: {
        a_o_dxffile__all: function() {
            return o_state[f_s_name_table__from_o_model(o_model__o_dxffile)] || [];
        },
        a_o_dxffile__profile: function() {
            return this.a_o_dxffile__all.filter(function(o) { return o.s_type === 'profile'; });
        },
        a_o_dxffile__profile_remover: function() {
            return this.a_o_dxffile__all.filter(function(o) { return o.s_type === 'profile_remover'; });
        },
        a_o_dxffile__path: function() {
            return this.a_o_dxffile__all.filter(function(o) { return o.s_type === 'path'; });
        },
        o_svg__profile: function() {
            let o_dxf = this.a_o_dxffile__all.find(function(o){ return o.n_id === this.n_id__profile; }.bind(this));
            return o_dxf ? f_s_svg_from_o_dxffile(o_dxf) : '';
        },
        o_svg__profile_points: function() {
            let o_dxf = this.a_o_dxffile__all.find(function(o){ return o.n_id === this.n_id__profile; }.bind(this));
            return o_dxf ? f_s_svg_profile_points(o_dxf, this.n_point_per_mm) : '';
        },
        o_svg__profile_remover: function() {
            let o_dxf = this.a_o_dxffile__all.find(function(o){ return o.n_id === this.n_id__profile_remover; }.bind(this));
            return o_dxf ? f_s_svg_from_o_dxffile(o_dxf) : '';
        },
        o_svg__profile_remover_points: function() {
            let o_dxf = this.a_o_dxffile__all.find(function(o){ return o.n_id === this.n_id__profile_remover; }.bind(this));
            return o_dxf ? f_s_svg_profile_points(o_dxf, this.n_point_per_mm) : '';
        },
        o_svg__path: function() {
            let o_dxf = this.a_o_dxffile__all.find(function(o){ return o.n_id === this.n_id__path; }.bind(this));
            return o_dxf ? f_s_svg_from_o_dxffile(o_dxf) : '';
        },
        b_can_generate: function() {
            if (this.b_generating) return false;
            if (!this.n_id__profile) return false;
            if (this.s_generation_type === 'profile_revolve') return true;
            if (!this.n_id__path) return false;
            if (this.s_generation_type === 'simple_endpoints_joints_remover' && !this.n_id__profile_remover) return false;
            return true;
        },
    },
    methods: {
        f_upload_dxf: async function(o_event, s_type) {
            let o_self = this;
            let o_file = o_event.target.files[0];
            if (!o_file) return;

            o_self.s_status = `Uploading ${o_file.name}...`;

            let s_dxf_content = await o_file.text();

            try {
                let o_resp = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__upload_dxf.s_name, {
                        s_dxf_content,
                        s_name: o_file.name,
                        s_type,
                    })
                );

                if (o_resp.s_error) {
                    o_self.s_status = `Error: ${o_resp.s_error}`;
                    return;
                }

                let o_result = o_resp.v_result;
                o_self.s_status = `Uploaded ${o_file.name}: ${o_result.n_cnt_entity} entities found`;

                if (s_type === 'profile') o_self.n_id__profile = o_result.o_dxffile.n_id;
                if (s_type === 'profile_remover') o_self.n_id__profile_remover = o_result.o_dxffile.n_id;
                if (s_type === 'path') o_self.n_id__path = o_result.o_dxffile.n_id;
            } catch (o_err) {
                o_self.s_status = `Error: ${o_err.message}`;
            }

            o_event.target.value = '';
        },

        f_generate_scad: async function() {
            let o_self = this;
            if (!o_self.b_can_generate) return;

            o_self.b_generating = true;
            o_self.s_status = 'Generating OpenSCAD script...';
            o_self.s_scad_output = '';
            o_self.s_path_scad = '';

            try {
                let o_resp = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__generate_scad.s_name, {
                        s_generation_type: o_self.s_generation_type,
                        n_id__profile: o_self.n_id__profile,
                        n_id__profile_remover: o_self.n_id__profile_remover,
                        n_id__path: o_self.n_id__path,
                        n_point_per_mm: o_self.n_point_per_mm,
                        s_sweep_function: o_self.s_sweep_function,
                    })
                );

                if (o_resp.s_error) {
                    o_self.s_status = `Error: ${o_resp.s_error}`;
                    return;
                }

                let o_result = o_resp.v_result;
                o_self.s_scad_output = o_result.s_scad;
                o_self.s_path_scad = o_result.s_path_scad;
                o_self.s_status = 'OpenSCAD script generated successfully';
            } catch (o_err) {
                o_self.s_status = `Error: ${o_err.message}`;
            } finally {
                o_self.b_generating = false;
            }
        },

        f_copy_scad: function() {
            navigator.clipboard.writeText(this.s_scad_output);
            this.s_status = 'Copied to clipboard';
        },

        f_download_scad: function() {
            let o_blob = new Blob([this.s_scad_output], { type: 'text/plain' });
            let s_url = URL.createObjectURL(o_blob);
            let o_a = document.createElement('a');
            o_a.href = s_url;
            o_a.download = 'generated.scad';
            o_a.click();
            URL.revokeObjectURL(s_url);
        },

        f_delete_dxffile: async function(o_dxf) {
            let s_name_table = f_s_name_table__from_o_model(o_model__o_dxffile);
            await o_wsmsg__syncdata.f_v_sync({
                s_name_table,
                s_operation: 'delete',
                o_data: { n_id: o_dxf.n_id }
            });
            if (this.n_id__profile === o_dxf.n_id) this.n_id__profile = null;
            if (this.n_id__profile_remover === o_dxf.n_id) this.n_id__profile_remover = null;
            if (this.n_id__path === o_dxf.n_id) this.n_id__path = null;
        },
    },
};

export { o_component__dxf2scad };
