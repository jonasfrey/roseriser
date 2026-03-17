// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// DXF parsing, entity extraction, and OpenSCAD generation
// Ported from old1/httpserved/manual.module.h.js and scad_generation.module.h.js
// Updated to use BOSL2 path_sweep2d() instead of path_sweep()

import DxfParser from "npm:dxf-parser";
import { s_root_dir, s_ds } from './runtimedata.js';

// ===== VECTOR HELPERS =====

let f_o_vec3 = function(n_x, n_y, n_z = 0){
    return { n_x, n_y, n_z };
};

let f_n_len_from_o_vec3 = function(o_vec3){
    return Math.sqrt(
        o_vec3.n_x ** 2 +
        o_vec3.n_y ** 2 +
        o_vec3.n_z ** 2
    );
};

let f_o_vec3_direction_from_o_trnvec3_start_end = function(
    o_vec3_trn_start,
    o_vec3_trn_end
){
    let n_x = o_vec3_trn_end.n_x - o_vec3_trn_start.n_x;
    let n_y = o_vec3_trn_end.n_y - o_vec3_trn_start.n_y;
    let n_z = o_vec3_trn_end.n_z - o_vec3_trn_start.n_z;
    let n_len = f_n_len_from_o_vec3(f_o_vec3(n_x, n_y, n_z));
    if(n_len === 0){
        return f_o_vec3(0, 0, 0);
    }
    return f_o_vec3(
        n_x / n_len,
        n_y / n_len,
        n_z / n_len
    );
};

let f_b_vec3_equal = function(o_vec3_a, o_vec3_b, n_tolerance = 0.0001){
    return (
        Math.abs(o_vec3_a.n_x - o_vec3_b.n_x) < n_tolerance &&
        Math.abs(o_vec3_a.n_y - o_vec3_b.n_y) < n_tolerance &&
        Math.abs(o_vec3_a.n_z - o_vec3_b.n_z) < n_tolerance
    );
};

let f_n_dot_from_o_vec3 = function(o_vec3_a, o_vec3_b){
    return (
        o_vec3_a.n_x * o_vec3_b.n_x +
        o_vec3_a.n_y * o_vec3_b.n_y +
        o_vec3_a.n_z * o_vec3_b.n_z
    );
};

// Check if a point lies ON an entity's path (not at its endpoints)
let f_b_point_on_entity = function(o_vec3_point, o_entity, n_tolerance = 0.01){
    if(o_entity.s_type === "LINE"){
        let sx = o_entity.o_vec3_trn_start.n_x, sy = o_entity.o_vec3_trn_start.n_y;
        let ex = o_entity.o_vec3_trn_end.n_x, ey = o_entity.o_vec3_trn_end.n_y;
        let px = o_vec3_point.n_x, py = o_vec3_point.n_y;
        // Skip if point is at an endpoint
        if(f_b_vec3_equal(o_vec3_point, o_entity.o_vec3_trn_start, n_tolerance) ||
           f_b_vec3_equal(o_vec3_point, o_entity.o_vec3_trn_end, n_tolerance)) return false;
        // Check if point is on the line segment: cross product ≈ 0 and within bounds
        let dx = ex - sx, dy = ey - sy;
        let cross = Math.abs((px - sx) * dy - (py - sy) * dx);
        let len = Math.sqrt(dx * dx + dy * dy);
        if(len < n_tolerance) return false;
        if(cross / len > n_tolerance) return false;
        // Check within segment bounds
        let t = ((px - sx) * dx + (py - sy) * dy) / (len * len);
        return t > 0 && t < 1;
    }
    if(o_entity.s_type === "ARC"){
        let cx = o_entity.o_vec3_trn.n_x, cy = o_entity.o_vec3_trn.n_y;
        let px = o_vec3_point.n_x, py = o_vec3_point.n_y;
        // Skip if point is at an endpoint
        if(f_b_vec3_equal(o_vec3_point, o_entity.o_vec3_trn_start, n_tolerance) ||
           f_b_vec3_equal(o_vec3_point, o_entity.o_vec3_trn_end, n_tolerance)) return false;
        // Check distance from center ≈ radius
        let dist = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
        if(Math.abs(dist - o_entity.n_radius) > n_tolerance) return false;
        // Check angle is within arc range
        let ang = Math.atan2(py - cy, px - cx) * 180 / Math.PI;
        let start = o_entity.n_ang_deg_start;
        let end = o_entity.n_ang_deg_end;
        // Normalize angle to be within start..end range
        while(ang < start) ang += 360;
        return ang <= end;
    }
    return false;
};

// ===== ENTITY FACTORY =====

let f_o_entity = function(
    s_type = "LINE",
    o_vec3_trn_start = null,
    o_vec3_trn_end = null,
    n_radius = null,
    n_ang_deg_start = null,
    n_ang_deg_end = null,
    o_vec3_trn = null
){
    let o_vec3_direction = null;
    let n_rotation_deg_start = null;
    let n_rotation_deg_end = null;
    let n_ang_rad_start = null;
    let n_ang_rad_end = null;

    if (s_type === "LINE") {
        o_vec3_direction = f_o_vec3_direction_from_o_trnvec3_start_end(
            o_vec3_trn_start,
            o_vec3_trn_end
        );
        n_rotation_deg_start = Math.atan2(
            o_vec3_trn_end.n_y - o_vec3_trn_start.n_y,
            o_vec3_trn_end.n_x - o_vec3_trn_start.n_x
        ) * 180 / Math.PI;
        n_rotation_deg_end = Math.atan2(
            o_vec3_trn_start.n_y - o_vec3_trn_end.n_y,
            o_vec3_trn_start.n_x - o_vec3_trn_end.n_x
        ) * 180 / Math.PI;
    }

    if (s_type === "ARC") {
        let n_ang_deg_start_tmp = n_ang_deg_start;
        let n_ang_deg_end_tmp = n_ang_deg_end;
        if (n_ang_deg_start_tmp > n_ang_deg_end_tmp) {
            n_ang_deg_end_tmp += 360;
        }
        n_ang_deg_start = n_ang_deg_start_tmp;
        n_ang_deg_end = n_ang_deg_end_tmp;
        n_ang_rad_start = n_ang_deg_start * Math.PI / 180;
        n_ang_rad_end = n_ang_deg_end * Math.PI / 180;

        o_vec3_trn_start = f_o_vec3(
            o_vec3_trn.n_x + n_radius * Math.cos(n_ang_rad_start),
            o_vec3_trn.n_y + n_radius * Math.sin(n_ang_rad_start),
            o_vec3_trn.n_z
        );
        o_vec3_trn_end = f_o_vec3(
            o_vec3_trn.n_x + n_radius * Math.cos(n_ang_rad_end),
            o_vec3_trn.n_y + n_radius * Math.sin(n_ang_rad_end),
            o_vec3_trn.n_z
        );
    }

    return {
        s_type,
        o_vec3_trn_start,
        o_vec3_trn_end,
        n_radius,
        n_ang_deg_start,
        n_ang_deg_end,
        n_ang_rad_start,
        n_ang_rad_end,
        o_vec3_trn,
        o_vec3_direction,
        n_rotation_deg_start,
        n_rotation_deg_end
    };
};

// ===== ENTITY DEDUPLICATION =====

let f_b_entity_duplicate = function(o_a, o_b, n_tolerance = 0.0001){
    if(!o_a || !o_b) return false;
    if(o_a.s_type !== o_b.s_type) return false;

    if(o_a.s_type === "LINE"){
        let b_same = f_b_vec3_equal(o_a.o_vec3_trn_start, o_b.o_vec3_trn_start, n_tolerance) &&
                     f_b_vec3_equal(o_a.o_vec3_trn_end, o_b.o_vec3_trn_end, n_tolerance);
        let b_reversed = f_b_vec3_equal(o_a.o_vec3_trn_start, o_b.o_vec3_trn_end, n_tolerance) &&
                         f_b_vec3_equal(o_a.o_vec3_trn_end, o_b.o_vec3_trn_start, n_tolerance);
        return b_same || b_reversed;
    }

    if(o_a.s_type === "ARC"){
        let b_center = o_a.o_vec3_trn && o_b.o_vec3_trn && f_b_vec3_equal(o_a.o_vec3_trn, o_b.o_vec3_trn, n_tolerance);
        let b_radius = Math.abs((o_a.n_radius || 0) - (o_b.n_radius || 0)) < n_tolerance;
        let b_ang_start = Math.abs((o_a.n_ang_deg_start || 0) - (o_b.n_ang_deg_start || 0)) < 0.01;
        let b_ang_end = Math.abs((o_a.n_ang_deg_end || 0) - (o_b.n_ang_deg_end || 0)) < 0.01;
        return b_center && b_radius && b_ang_start && b_ang_end;
    }

    if(o_a.s_type === "CIRCLE"){
        let b_center = o_a.o_vec3_trn && o_b.o_vec3_trn && f_b_vec3_equal(o_a.o_vec3_trn, o_b.o_vec3_trn, n_tolerance);
        let b_radius = Math.abs((o_a.n_radius || 0) - (o_b.n_radius || 0)) < n_tolerance;
        return b_center && b_radius;
    }

    return false;
};

let f_a_o_entity_deduplicated = function(a_o_entity){
    let a_o_result = [];
    for(let o_ent of a_o_entity){
        let b_duplicate = a_o_result.some(o_existing => f_b_entity_duplicate(o_existing, o_ent));
        if(!b_duplicate){
            a_o_result.push(o_ent);
        }
    }
    return a_o_result;
};

// ===== DXF PARSING =====

let f_o_dxf_from_s_dxf = function(s_dxf){
    let o_dxf_parser = new DxfParser();
    let o_dxf = o_dxf_parser.parseSync(s_dxf);
    return o_dxf;
};

let f_a_o_entity_from_o_dxf = function(o_dxf){
    let a_o = [];
    for (let o_ent of o_dxf.entities) {
        let o_ent2 = null;
        if (o_ent.type === "ARC") {
            o_ent2 = f_o_entity(
                "ARC",
                null, null,
                o_ent.radius,
                o_ent.startAngle * 180 / Math.PI,
                o_ent.endAngle * 180 / Math.PI,
                f_o_vec3(o_ent.center.x, o_ent.center.y, o_ent.center.z ?? 0)
            );
        } else if (o_ent.type === "LINE") {
            o_ent2 = f_o_entity(
                "LINE",
                f_o_vec3(o_ent.vertices[0].x, o_ent.vertices[0].y, o_ent.vertices[0].z ?? 0),
                f_o_vec3(o_ent.vertices[1].x, o_ent.vertices[1].y, o_ent.vertices[1].z ?? 0)
            );
        } else if (o_ent.type === "CIRCLE") {
            o_ent2 = f_o_entity(
                "CIRCLE",
                null, null,
                o_ent.radius,
                null, null,
                f_o_vec3(o_ent.center.x, o_ent.center.y, o_ent.center.z ?? 0)
            );
        }
        if(o_ent2) a_o.push(o_ent2);
    }

    let a_o_deduplicated = f_a_o_entity_deduplicated(a_o);
    if(a_o.length !== a_o_deduplicated.length){
        console.log(`Removed ${a_o.length - a_o_deduplicated.length} duplicate entities`);
    }
    return a_o_deduplicated;
};

let f_a_o_entity_from_s_dxf = function(s_dxf){
    let o_dxf = f_o_dxf_from_s_dxf(s_dxf);
    return f_a_o_entity_from_o_dxf(o_dxf);
};

// ===== ENTITY CONNECTION DETECTION =====

let f_o_vec3_direction_at_connection = function(o_ent, o_vec3_conn){
    if(o_ent.s_type === "LINE"){
        if(f_b_vec3_equal(o_vec3_conn, o_ent.o_vec3_trn_start)){
            return o_ent.o_vec3_direction;
        } else {
            return f_o_vec3(
                -o_ent.o_vec3_direction.n_x,
                -o_ent.o_vec3_direction.n_y,
                -o_ent.o_vec3_direction.n_z
            );
        }
    }
    if(o_ent.s_type === "ARC"){
        let n_ang_rad = 0;
        let b_at_start = f_b_vec3_equal(o_vec3_conn, o_ent.o_vec3_trn_start);
        if(b_at_start){
            n_ang_rad = o_ent.n_ang_rad_start;
        } else {
            n_ang_rad = o_ent.n_ang_rad_end;
        }
        let dir_x = -Math.sin(n_ang_rad);
        let dir_y = Math.cos(n_ang_rad);
        if(!b_at_start){
            dir_x = -dir_x;
            dir_y = -dir_y;
        }
        return f_o_vec3(dir_x, dir_y, 0);
    }
    return f_o_vec3(0, 0, 0);
};

let f_a_o_entity_connection_from_a_o_entity = function(a_o_entity){
    let a_o_result = [];
    let a_o_connectable = a_o_entity.filter(
        o => o && o.s_type !== "CIRCLE" && o.o_vec3_trn_start && o.o_vec3_trn_end
    );

    for(let n_idx_a = 0; n_idx_a < a_o_connectable.length; n_idx_a++){
        let o_ent_a = a_o_connectable[n_idx_a];
        for(let n_idx_b = n_idx_a + 1; n_idx_b < a_o_connectable.length; n_idx_b++){
            let o_ent_b = a_o_connectable[n_idx_b];

            let a_o_pair = [
                [o_ent_a.o_vec3_trn_start, o_ent_b.o_vec3_trn_start],
                [o_ent_a.o_vec3_trn_start, o_ent_b.o_vec3_trn_end],
                [o_ent_a.o_vec3_trn_end, o_ent_b.o_vec3_trn_start],
                [o_ent_a.o_vec3_trn_end, o_ent_b.o_vec3_trn_end],
            ];

            for(let [o_vec3_a, o_vec3_b] of a_o_pair){
                if(f_b_vec3_equal(o_vec3_a, o_vec3_b)){
                    let o_vec3_conn = o_vec3_a;
                    let o_vec3_dir_a = f_o_vec3_direction_at_connection(o_ent_a, o_vec3_conn);
                    let o_vec3_dir_b = f_o_vec3_direction_at_connection(o_ent_b, o_vec3_conn);

                    let n_dot = f_n_dot_from_o_vec3(o_vec3_dir_a, o_vec3_dir_b);
                    n_dot = Math.max(-1, Math.min(1, n_dot));
                    let n_ang_rad_between = Math.acos(n_dot);
                    // Directions point INTO each entity from the connection.
                    // Flowing/smooth: directions are opposite (≈180°) → tangent
                    // Non-flowing: directions are similar (≈0°) → not tangent, needs joint/revolve
                    let b_tangent = n_ang_rad_between > (165 * Math.PI / 180);

                    let n_avg_x = (o_vec3_dir_a.n_x + o_vec3_dir_b.n_x) / 2;
                    let n_avg_y = (o_vec3_dir_a.n_y + o_vec3_dir_b.n_y) / 2;
                    let n_ang_deg_z = Math.atan2(n_avg_y, n_avg_x) * 180 / Math.PI;

                    a_o_result.push({
                        o_entity_a: o_ent_a,
                        o_entity_b: o_ent_b,
                        o_vec3_dir_entity_a: o_vec3_dir_a,
                        o_vec3_dir_entity_b: o_vec3_dir_b,
                        n_ang_deg_z_entity_a: n_ang_deg_z,
                        n_ang_deg_z_entity_b: n_ang_deg_z,
                        o_trn_vec3_connected: o_vec3_conn,
                        b_tangent,
                        n_ang_rad_between_entities: n_ang_rad_between
                    });
                    break;
                }
            }
        }
    }
    return a_o_result;
};

// ===== ENTITY GROUPING =====

let f_a_o_entity__ordered_by_connection = function(a_o_entity__component, o_map__adj){
    if(a_o_entity__component.length <= 1){
        return a_o_entity__component;
    }

    let o_set__component = new Set(a_o_entity__component);
    let o_entity__start = null;

    for(let o_ent of a_o_entity__component){
        let n_cnt__connection = o_map__adj.get(o_ent).filter(
            o_neighbor => o_set__component.has(o_neighbor)
        ).length;
        if(n_cnt__connection <= 1){
            o_entity__start = o_ent;
            break;
        }
    }

    if(!o_entity__start){
        o_entity__start = a_o_entity__component[0];
    }

    let a_o_entity__ordered = [];
    let o_set__visited = new Set();
    let o_current = o_entity__start;

    while(o_current && !o_set__visited.has(o_current)){
        o_set__visited.add(o_current);
        a_o_entity__ordered.push(o_current);

        let o_next = null;
        for(let o_neighbor of o_map__adj.get(o_current)){
            if(o_set__component.has(o_neighbor) && !o_set__visited.has(o_neighbor)){
                o_next = o_neighbor;
                break;
            }
        }
        o_current = o_next;
    }

    return a_o_entity__ordered;
};

let f_a_a_o_entity_group_from_a_o_entity = function(a_o_entity){
    let a_o_entity__connectable = a_o_entity.filter(
        o => o && o.s_type !== "CIRCLE" && o.o_vec3_trn_start && o.o_vec3_trn_end
    );

    if(a_o_entity__connectable.length === 0){
        return [];
    }

    let o_map__adj = new Map();
    for(let o_ent of a_o_entity__connectable){
        o_map__adj.set(o_ent, []);
    }

    for(let n_idx_a = 0; n_idx_a < a_o_entity__connectable.length; n_idx_a++){
        let o_ent_a = a_o_entity__connectable[n_idx_a];
        for(let n_idx_b = n_idx_a + 1; n_idx_b < a_o_entity__connectable.length; n_idx_b++){
            let o_ent_b = a_o_entity__connectable[n_idx_b];
            let b_connected =
                f_b_vec3_equal(o_ent_a.o_vec3_trn_start, o_ent_b.o_vec3_trn_start) ||
                f_b_vec3_equal(o_ent_a.o_vec3_trn_start, o_ent_b.o_vec3_trn_end) ||
                f_b_vec3_equal(o_ent_a.o_vec3_trn_end, o_ent_b.o_vec3_trn_start) ||
                f_b_vec3_equal(o_ent_a.o_vec3_trn_end, o_ent_b.o_vec3_trn_end);
            if(b_connected){
                o_map__adj.get(o_ent_a).push(o_ent_b);
                o_map__adj.get(o_ent_b).push(o_ent_a);
            }
        }
    }

    let o_set__visited = new Set();
    let a_a_o_entity_group = [];

    for(let o_ent of a_o_entity__connectable){
        if(o_set__visited.has(o_ent)) continue;

        let a_o_entity__component = [];
        let a_o_stack = [o_ent];

        while(a_o_stack.length > 0){
            let o_current = a_o_stack.pop();
            if(o_set__visited.has(o_current)) continue;
            o_set__visited.add(o_current);
            a_o_entity__component.push(o_current);

            for(let o_neighbor of o_map__adj.get(o_current)){
                if(!o_set__visited.has(o_neighbor)){
                    a_o_stack.push(o_neighbor);
                }
            }
        }

        let a_o_entity__ordered = f_a_o_entity__ordered_by_connection(
            a_o_entity__component, o_map__adj
        );
        a_a_o_entity_group.push(a_o_entity__ordered);
    }

    return a_a_o_entity_group;
};

// ===== POINT EXTRACTION FROM ENTITIES =====

let f_a_o_vec3_trn_from_o_entity_directed = function(o_ent, b_reversed = false, n_point_per_mm = 1){
    let a_o = [];

    if(o_ent.s_type === "LINE"){
        let n_len = f_n_len_from_o_vec3(f_o_vec3(
            o_ent.o_vec3_trn_end.n_x - o_ent.o_vec3_trn_start.n_x,
            o_ent.o_vec3_trn_end.n_y - o_ent.o_vec3_trn_start.n_y,
            o_ent.o_vec3_trn_end.n_z - o_ent.o_vec3_trn_start.n_z
        ));
        let n_segment = Math.max(2, Math.ceil(n_len * n_point_per_mm));
        let o_start = b_reversed ? o_ent.o_vec3_trn_end : o_ent.o_vec3_trn_start;
        let o_end = b_reversed ? o_ent.o_vec3_trn_start : o_ent.o_vec3_trn_end;

        for(let n_it = 0; n_it <= n_segment; n_it++){
            let n_t = n_it / n_segment;
            a_o.push(f_o_vec3(
                o_start.n_x + (o_end.n_x - o_start.n_x) * n_t,
                o_start.n_y + (o_end.n_y - o_start.n_y) * n_t,
                o_start.n_z + (o_end.n_z - o_start.n_z) * n_t
            ));
        }
    }

    if(o_ent.s_type === "ARC"){
        let n_arc_len = Math.abs(o_ent.n_ang_rad_end - o_ent.n_ang_rad_start) * o_ent.n_radius;
        let n_segment = Math.max(3, Math.ceil(n_arc_len * n_point_per_mm));
        let n_ang_start = b_reversed ? o_ent.n_ang_rad_end : o_ent.n_ang_rad_start;
        let n_ang_end = b_reversed ? o_ent.n_ang_rad_start : o_ent.n_ang_rad_end;

        for(let n_it = 0; n_it <= n_segment; n_it++){
            let n_t = n_it / n_segment;
            let n_ang = n_ang_start + (n_ang_end - n_ang_start) * n_t;
            a_o.push(f_o_vec3(
                o_ent.o_vec3_trn.n_x + o_ent.n_radius * Math.cos(n_ang),
                o_ent.o_vec3_trn.n_y + o_ent.n_radius * Math.sin(n_ang),
                o_ent.o_vec3_trn.n_z
            ));
        }
    }

    return a_o;
};

let f_a_a_o_vec3_trn_ordered = function(a_a_o_entity_group, n_point_per_mm = 1){
    let a_a_o_vec3_trn = [];

    for(let a_o_entity_group of a_a_o_entity_group){
        if(a_o_entity_group.length === 0) continue;

        let a_o_vec3_trn__group = [];

        if(a_o_entity_group.length === 1){
            let a_o_point = f_a_o_vec3_trn_from_o_entity_directed(
                a_o_entity_group[0], false, n_point_per_mm
            );
            a_o_vec3_trn__group.push(...a_o_point);
            a_a_o_vec3_trn.push(a_o_vec3_trn__group);
            continue;
        }

        let o_vec3__prev_exit = null;

        for(let n_idx = 0; n_idx < a_o_entity_group.length; n_idx++){
            let o_ent = a_o_entity_group[n_idx];
            let b_reversed = false;

            if(n_idx === 0){
                let o_ent_next = a_o_entity_group[1];
                let b_end_connects_to_next =
                    f_b_vec3_equal(o_ent.o_vec3_trn_end, o_ent_next.o_vec3_trn_start) ||
                    f_b_vec3_equal(o_ent.o_vec3_trn_end, o_ent_next.o_vec3_trn_end);
                b_reversed = !b_end_connects_to_next;
                o_vec3__prev_exit = b_reversed ? o_ent.o_vec3_trn_start : o_ent.o_vec3_trn_end;
            } else {
                let b_start_is_entry = f_b_vec3_equal(o_ent.o_vec3_trn_start, o_vec3__prev_exit);
                b_reversed = !b_start_is_entry;
                o_vec3__prev_exit = b_reversed ? o_ent.o_vec3_trn_start : o_ent.o_vec3_trn_end;
            }

            let a_o_point = f_a_o_vec3_trn_from_o_entity_directed(
                o_ent, b_reversed, n_point_per_mm
            );

            if(n_idx > 0 && a_o_point.length > 0){
                a_o_point = a_o_point.slice(1);
            }

            a_o_vec3_trn__group.push(...a_o_point);
        }

        a_a_o_vec3_trn.push(a_o_vec3_trn__group);
    }

    return a_a_o_vec3_trn;
};

// ===== PROFILE MIRRORING =====

let f_a_a_o_vec3_trn_ordered_mirrored_at_mostleft_axis = function(a_a_o_vec3_trn_ordered){
    if(!a_a_o_vec3_trn_ordered || a_a_o_vec3_trn_ordered.length === 0){
        return [];
    }

    let a_a_o_vec3_trn_mirrored = [];
    let n_tolerance = 0.001;

    for(let a_o_vec3_trn of a_a_o_vec3_trn_ordered){
        if(a_o_vec3_trn.length === 0) continue;

        let n_x_min = Infinity;
        for(let o_vec3 of a_o_vec3_trn){
            if(o_vec3.n_x < n_x_min) n_x_min = o_vec3.n_x;
        }

        let a_o_vec3__on_axis = [];
        let a_o_vec3__off_axis = [];

        for(let o_vec3 of a_o_vec3_trn){
            let b_on_axis = Math.abs(o_vec3.n_x - n_x_min) < n_tolerance;
            if(b_on_axis){
                a_o_vec3__on_axis.push(o_vec3);
            } else {
                a_o_vec3__off_axis.push(o_vec3);
            }
        }

        let o_vec3__axis_top = null;
        let o_vec3__axis_bottom = null;

        if(a_o_vec3__on_axis.length > 0){
            a_o_vec3__on_axis.sort((a, b) => a.n_y - b.n_y);
            o_vec3__axis_bottom = a_o_vec3__on_axis[0];
            o_vec3__axis_top = a_o_vec3__on_axis[a_o_vec3__on_axis.length - 1];
        }

        let a_o_vec3__mirrored = [];
        for(let o_vec3 of a_o_vec3__off_axis){
            a_o_vec3__mirrored.push({
                n_x: 2 * n_x_min - o_vec3.n_x,
                n_y: o_vec3.n_y,
                n_z: o_vec3.n_z || 0
            });
        }

        let a_o_vec3__outline = [];

        for(let o_vec3 of a_o_vec3_trn){
            let b_on_axis = Math.abs(o_vec3.n_x - n_x_min) < n_tolerance;
            if(b_on_axis){
                let b_is_top = o_vec3__axis_top &&
                    Math.abs(o_vec3.n_y - o_vec3__axis_top.n_y) < n_tolerance;
                let b_is_bottom = o_vec3__axis_bottom &&
                    Math.abs(o_vec3.n_y - o_vec3__axis_bottom.n_y) < n_tolerance;
                if(b_is_top || b_is_bottom){
                    a_o_vec3__outline.push(o_vec3);
                }
            } else {
                a_o_vec3__outline.push(o_vec3);
            }
        }

        a_o_vec3__mirrored.reverse();
        a_o_vec3__outline.push(...a_o_vec3__mirrored);
        a_o_vec3__outline.shift();

        a_a_o_vec3_trn_mirrored.push(a_o_vec3__outline);
    }

    return a_a_o_vec3_trn_mirrored;
};

// ===== UNCONNECTED ENDPOINTS =====

let f_a_o_pointwithrotation_noconnection = function(a_o_entity, a_o_entity_connection){
    let a_o_result = [];
    let a_o_vec3_connected = a_o_entity_connection.map(o_conn => o_conn.o_trn_vec3_connected);

    for(let o_entity of a_o_entity){
        if(o_entity.s_type !== "LINE" && o_entity.s_type !== "ARC") continue;

        let b_start_connected = a_o_vec3_connected.some(
            o_vec3 => f_b_vec3_equal(o_vec3, o_entity.o_vec3_trn_start)
        );
        if(!b_start_connected){
            let n_rotation_deg = (o_entity.s_type === "LINE")
                ? o_entity.n_rotation_deg_start + 180
                : o_entity.n_ang_deg_start - 90;
            a_o_result.push({ o_vec3: o_entity.o_vec3_trn_start, n_rotation_deg });
        }

        let b_end_connected = a_o_vec3_connected.some(
            o_vec3 => f_b_vec3_equal(o_vec3, o_entity.o_vec3_trn_end)
        );
        if(!b_end_connected){
            let n_rotation_deg = (o_entity.s_type === "LINE")
                ? o_entity.n_rotation_deg_start
                : o_entity.n_ang_deg_end + 90;
            a_o_result.push({ o_vec3: o_entity.o_vec3_trn_end, n_rotation_deg });
        }
    }

    return a_o_result;
};

// ===== SKETCH BUILDER =====

let f_o_sketch_from_a_o_entity = function(a_o_entity, n_point_per_mm = 1){
    let a_o_entity_connection = f_a_o_entity_connection_from_a_o_entity(a_o_entity);
    let a_a_o_entity_group = f_a_a_o_entity_group_from_a_o_entity(a_o_entity);
    let a_a_o_vec3_trn_ordered__result = f_a_a_o_vec3_trn_ordered(a_a_o_entity_group, n_point_per_mm);
    let a_a_o_vec3_trn_ordered__mirrored = f_a_a_o_vec3_trn_ordered_mirrored_at_mostleft_axis(
        a_a_o_vec3_trn_ordered__result
    );
    let a_o_pointwithrotation_noconnection__result = f_a_o_pointwithrotation_noconnection(
        a_o_entity, a_o_entity_connection
    );

    // collect all points for bounding box
    let a_o_vec3_trn = [];
    for(let a_o of a_a_o_vec3_trn_ordered__result){
        a_o_vec3_trn.push(...a_o);
    }

    let n_scl_x = 0;
    let n_scl_y = 0;
    let n_scl_max = 0;

    if(a_o_vec3_trn.length > 0){
        let n_x_min = Math.min(...a_o_vec3_trn.map(p => p.n_x));
        let n_x_max = Math.max(...a_o_vec3_trn.map(p => p.n_x));
        let n_y_min = Math.min(...a_o_vec3_trn.map(p => p.n_y));
        let n_y_max = Math.max(...a_o_vec3_trn.map(p => p.n_y));
        n_scl_x = n_x_max - n_x_min;
        n_scl_y = n_y_max - n_y_min;
        n_scl_max = Math.max(n_scl_x, n_scl_y);
    }

    return {
        a_o_entity,
        a_o_entity_connection,
        a_a_o_entity_group,
        a_a_o_vec3_trn_ordered: a_a_o_vec3_trn_ordered__result,
        a_a_o_vec3_trn_ordered__mirrored,
        a_o_pointwithrotation_noconnection: a_o_pointwithrotation_noconnection__result,
        a_o_vec3_trn,
        n_scl_x,
        n_scl_y,
        n_scl_max
    };
};

// ===== SCAD GENERATION =====

let f_a_o_point__removed_duplicate = function(a_o_point, n_tolerance = 0.0001){
    if (a_o_point.length === 0) return a_o_point;
    let a_o_point__cleaned = [a_o_point[0]];
    for (let n_it = 1; n_it < a_o_point.length; n_it++) {
        let o_point__prev = a_o_point__cleaned[a_o_point__cleaned.length - 1];
        let o_point__curr = a_o_point[n_it];
        let n_dist = Math.sqrt((o_point__curr.x - o_point__prev.x)**2 + (o_point__curr.y - o_point__prev.y)**2);
        if (n_dist > n_tolerance) {
            a_o_point__cleaned.push(o_point__curr);
        }
    }
    if (a_o_point__cleaned.length > 1) {
        let o_point__first = a_o_point__cleaned[0];
        let o_point__last = a_o_point__cleaned[a_o_point__cleaned.length - 1];
        let n_dist = Math.sqrt((o_point__last.x - o_point__first.x)**2 + (o_point__last.y - o_point__first.y)**2);
        if (n_dist < n_tolerance) {
            a_o_point__cleaned.pop();
        }
    }
    return a_o_point__cleaned;
};

// Extract xpositive (right-half) points from ordered profile points.
// Handles both open paths (just right side) and closed contours (full loop including left edge at x≈axis).
let f_o_profile_points_from_a_o_vec3 = function(a_o_vec3){
    if(a_o_vec3.length === 0) return { a_o_xpositive: [], a_o_mirroredx: [] };

    let n_x__min = Math.min(...a_o_vec3.map(p => p.n_x));
    let n_x__max = Math.max(...a_o_vec3.map(p => p.n_x));
    let n_y__min = Math.min(...a_o_vec3.map(p => p.n_y));
    let n_y__max = Math.max(...a_o_vec3.map(p => p.n_y));
    let n_y__center = (n_y__min + n_y__max) / 2;
    let n_axis_x = n_x__min;
    let n_tol = 0.001;

    // check if contour is closed (first ≈ last point)
    let b_closed = a_o_vec3.length > 2 &&
        Math.abs(a_o_vec3[0].n_x - a_o_vec3[a_o_vec3.length - 1].n_x) < n_tol &&
        Math.abs(a_o_vec3[0].n_y - a_o_vec3[a_o_vec3.length - 1].n_y) < n_tol;

    let a_o_xpositive = [];

    if(b_closed){
        // closed contour: extract the right-side segment between the two axis endpoints
        // find indices of axis points (x ≈ axis_x)
        let a_n_idx__axis = [];
        for(let i = 0; i < a_o_vec3.length; i++){
            if(Math.abs(a_o_vec3[i].n_x - n_axis_x) < n_tol){
                a_n_idx__axis.push(i);
            }
        }

        if(a_n_idx__axis.length >= 2){
            // find bottom-most and top-most axis points
            let n_idx__bottom = a_n_idx__axis[0];
            let n_idx__top = a_n_idx__axis[0];
            for(let i of a_n_idx__axis){
                if(a_o_vec3[i].n_y < a_o_vec3[n_idx__bottom].n_y) n_idx__bottom = i;
                if(a_o_vec3[i].n_y > a_o_vec3[n_idx__top].n_y) n_idx__top = i;
            }

            // walk from bottom to top going through the non-axis (right) side
            // try both directions and pick the one that goes through higher x values
            let f_extract_segment = function(n_from, n_to){
                let a_o = [];
                let n_len = a_o_vec3.length;
                let i = n_from;
                for(let n_step = 0; n_step < n_len; n_step++){
                    a_o.push(a_o_vec3[i]);
                    if(i === n_to) break;
                    i = (i + 1) % n_len;
                }
                return a_o;
            };

            let a_o_path_a = f_extract_segment(n_idx__bottom, n_idx__top);
            let a_o_path_b = f_extract_segment(n_idx__top, n_idx__bottom);
            // reverse path_b so it also goes bottom→top
            a_o_path_b.reverse();

            // pick the path with higher average x (the right side)
            let f_n_avg_x = function(a){ return a.reduce(function(s, p){ return s + p.n_x; }, 0) / a.length; };
            let a_o_right_side = (f_n_avg_x(a_o_path_a) >= f_n_avg_x(a_o_path_b)) ? a_o_path_a : a_o_path_b;

            a_o_xpositive = a_o_right_side.map(function(p){
                return { x: p.n_x - n_axis_x, y: p.n_y - n_y__center };
            });
        } else {
            // fallback: only one axis point, use all non-axis points
            a_o_xpositive = a_o_vec3.filter(function(p){ return p.n_x > n_axis_x + n_tol; }).map(function(p){
                return { x: p.n_x - n_axis_x, y: p.n_y - n_y__center };
            });
        }
    } else {
        // open path: filter for x >= 0 (original behavior)
        let a_o_raw = a_o_vec3.filter(function(p){ return p.n_x >= n_axis_x - n_tol; });
        if(a_o_raw.length === 0) a_o_raw = a_o_vec3;
        a_o_xpositive = a_o_raw.map(function(p){
            return { x: p.n_x - n_axis_x, y: p.n_y - n_y__center };
        });
    }

    a_o_xpositive = f_a_o_point__removed_duplicate(a_o_xpositive);

    // build mirrored profile: xpositive + reversed mirrored non-axis points
    let a_o_mirroredx = [...a_o_xpositive];
    for(let i = a_o_xpositive.length - 1; i >= 0; i--){
        if(Math.abs(a_o_xpositive[i].x) < 0.0001) continue;
        a_o_mirroredx.push({ x: -a_o_xpositive[i].x, y: a_o_xpositive[i].y });
    }

    return { a_o_xpositive, a_o_mirroredx, n_x__min, n_x__max, n_y__min, n_y__max, n_y__center };
};

let f_s_scad_profile_functions_from_o_sketch = function(o_sketch, s_profile_name = "profile"){
    let a_o_vec3 = o_sketch.a_o_vec3_trn;
    if(a_o_vec3.length === 0){
        return "// No points in profile\n";
    }

    let o_prof = f_o_profile_points_from_a_o_vec3(a_o_vec3);
    let a_o_xpositive = o_prof.a_o_xpositive;
    let a_o_mirroredx = o_prof.a_o_mirroredx;
    let n_x__min = o_prof.n_x__min;
    let n_x__max = o_prof.n_x__max;
    let n_y__min = o_prof.n_y__min;
    let n_y__max = o_prof.n_y__max;

    let a_o_rotatedz = a_o_mirroredx.map(p => ({ x: p.y, y: -p.x }));

    let n_x__min_rotated = Math.min(...a_o_rotatedz.map(p => p.x));
    let a_o_for_revolve = a_o_rotatedz.map(p => ({ x: p.x - n_x__min_rotated, y: p.y }));

    let f_s_point = (o_p) => `[${o_p.x.toFixed(6)}, ${o_p.y.toFixed(6)}]`;

    let s_scad = `
// Profile: ${s_profile_name}
// Bounds: X[${n_x__min.toFixed(4)}, ${n_x__max.toFixed(4)}] Y[${n_y__min.toFixed(4)}, ${n_y__max.toFixed(4)}]

${s_profile_name}_width = ${((n_x__max - n_x__min) * 2).toFixed(6)};
${s_profile_name}_height = ${((n_y__max - n_y__min) / 2).toFixed(6)};
${s_profile_name}_trn_x = ${n_x__min.toFixed(6)};
${s_profile_name}_trn_y = ${n_y__min.toFixed(6)};

${s_profile_name}_xpositive = [
${a_o_xpositive.map(o_p => "    " + f_s_point(o_p)).join(",\n")}
];

${s_profile_name}_mirroredx = [
${a_o_mirroredx.map(o_p => "    " + f_s_point(o_p)).join(",\n")}
];

${s_profile_name}_rotatedz = [
${a_o_rotatedz.map(o_p => "    " + f_s_point(o_p)).join(",\n")}
];

${s_profile_name}_for_revolve = [
${a_o_for_revolve.map(o_p => "    " + f_s_point(o_p)).join(",\n")}
];

function ${s_profile_name}_xpositive_scaled(s=1) = [for (p = ${s_profile_name}_xpositive) [p.x * s, p.y * s]];
function ${s_profile_name}_mirroredx_scaled(s=1) = [for (p = ${s_profile_name}_mirroredx) [p.x * s, p.y * s]];
function ${s_profile_name}_rotatedz_scaled(s=1) = [for (p = ${s_profile_name}_rotatedz) [p.x * s, p.y * s]];
function ${s_profile_name}_for_revolve_scaled(s=1) = [for (p = ${s_profile_name}_for_revolve) [p.x * s, p.y * s]];

function profile_default(scalefactor=1) = ${s_profile_name}_mirroredx_scaled(scalefactor);

// DXF offset to restore original coordinates (for preview only)
${s_profile_name}_dxf_offset = [${s_profile_name}_trn_x, ${s_profile_name}_trn_y + ${s_profile_name}_height];

// Full mirroredx with y shifted by profile_height so all values >= 0 (required by rotate_extrude)
// Axes swapped to [y + height, x] for revolving around the profile's X axis
${s_profile_name}_for_x_revolve = [for (p = ${s_profile_name}_mirroredx)
    [p[1] + ${s_profile_name}_height, p[0]]
];

// Revolve profile 90° around the X axis (downward from XY plane into -Z)
// 1. rotate_extrude revolves shifted profile around Z
// 2. rotate([90,0,0]) swaps Y↔Z to map Z-revolution to X-revolution
// 3. translate undoes the y-shift so the opening matches the centered swept cross-section
module ${s_profile_name}_endpoint_cap(angle=90) {
    translate([0, 0, -${s_profile_name}_height])
    rotate([90, 0, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(${s_profile_name}_for_x_revolve);
}
`;
    return s_scad;
};

// ===== SCAD ENTITY VARIABLE DECLARATIONS =====

let f_s_scad_var_declation_sketch_entities = function(a_o_entity){
    let a_o_entity_line = a_o_entity.filter(o_ent => o_ent.s_type === "LINE");
    let a_o_entity_arc = a_o_entity.filter(o_ent => o_ent.s_type === "ARC");
    let a_o_entity_circle = a_o_entity.filter(o_ent => o_ent.s_type === "CIRCLE");

    let s_scad = `
// ===== ENTITY DEFINITIONS =====
${a_o_entity_line.map((o, n_idx) => {
    return `line_${n_idx} = [[${o.o_vec3_trn_start.n_x}, ${o.o_vec3_trn_start.n_y}], [${o.o_vec3_trn_end.n_x}, ${o.o_vec3_trn_end.n_y}]];`;
}).join('\n')}

${a_o_entity_arc.map((o, n_idx) => {
    return `arc_${n_idx} = [
    [${o.o_vec3_trn.n_x}, ${o.o_vec3_trn.n_y}, ${o.o_vec3_trn.n_z}],  // center
    ${o.n_radius},  // radius
    ${o.n_ang_deg_start},  // start angle (degrees)
    ${o.n_ang_deg_end}  // end angle (degrees)
];`;
}).join('\n')}

${a_o_entity_circle.map((o, n_idx) => {
    return `circle_${n_idx} = [
    [${o.o_vec3_trn.n_x}, ${o.o_vec3_trn.n_y}, ${o.o_vec3_trn.n_z}],  // center
    ${o.n_radius}  // radius
];`;
}).join('\n')}

// ===== ARC/CIRCLE HELPER FUNCTIONS =====
// Convert arc to 2D path for path_sweep2d
function arc_to_path_2d(arc_def, n_segments=50) =
    let(
        center = arc_def[0],
        radius = arc_def[1],
        start_angle = arc_def[2],
        end_angle = arc_def[3],
        arc_2d = arc(n=n_segments, r=radius, angle=[start_angle, end_angle])
    )
    [for (p = arc_2d) [p.x + center[0], p.y + center[1]]];

module sweep_arc_2d(profile, arc_def, n_segments=50) {
    let(
        center = arc_def[0],
        radius = arc_def[1],
        start_angle = arc_def[2],
        end_angle = arc_def[3]
    )
    translate([center[0], center[1], 0])
    path_sweep2d(profile, arc(n=n_segments, r=radius, angle=[start_angle, end_angle]));
}

function circle_to_path_2d(circle_def, n_segments=50) =
    let(
        center = circle_def[0],
        radius = circle_def[1],
        circle_pts = circle(r=radius, $fn=n_segments)
    )
    [for (p = circle_pts) [p.x + center[0], p.y + center[1]]];

module sweep_circle_2d(profile, circle_def, n_segments=50) {
    let(
        center = circle_def[0],
        radius = circle_def[1],
        circle_path = circle(r=radius, $fn=n_segments)
    )
    translate([center[0], center[1], 0])
    path_sweep2d(profile, circle_path, closed=true);
}

// ===== ENTITY EXTENSION FUNCTIONS =====
function extend_line(line_def, ext_amount, at_start=true) =
    let(
        p1 = line_def[0],
        p2 = line_def[1],
        dx = p2[0] - p1[0],
        dy = p2[1] - p1[1],
        len = sqrt(dx*dx + dy*dy),
        dir_x = dx / len,
        dir_y = dy / len
    )
    at_start
        ? [[p1[0] - dir_x * ext_amount, p1[1] - dir_y * ext_amount], p2]
        : [p1, [p2[0] + dir_x * ext_amount, p2[1] + dir_y * ext_amount]];

function extend_arc(arc_def, ext_deg, at_start=true) =
    let(
        center = arc_def[0],
        radius = arc_def[1],
        start_angle = arc_def[2],
        end_angle = arc_def[3]
    )
    at_start
        ? [center, radius, start_angle - ext_deg, end_angle]
        : [center, radius, start_angle, end_angle + ext_deg];
`;
    return s_scad;
};

// ===== MAIN SCAD GENERATION (path_sweep2d version) =====

let f_s_scad_path_sweep_sketch = function(
    o_sketch_sweep_paths,
    s_name_sketch_sweep_paths = "profile_sweep",
    o_sketch_profile,
    s_name_sketch_profile = "profile",
    o_sketch_profile_remover,
    s_name_sketch_profile_remover = "profile_remover",
    n_segments = 50
){
    let s_scad_profile_functions = f_s_scad_profile_functions_from_o_sketch(o_sketch_profile, s_name_sketch_profile);
    let s_scad_profile_functions_remover = f_s_scad_profile_functions_from_o_sketch(o_sketch_profile_remover, s_name_sketch_profile_remover);
    let s_scad_entity_defs = f_s_scad_var_declation_sketch_entities(o_sketch_sweep_paths.a_o_entity);

    // Tangent connections
    let a_o_entity_connection__tangent = o_sketch_sweep_paths.a_o_entity_connection.filter(o => o.b_tangent);
    let a_o_entity_connection__non_tangent_all = o_sketch_sweep_paths.a_o_entity_connection.filter(o => !o.b_tangent);

    // Deduplicate non-tangent connections
    let a_o_entity_connection__non_tangent = [];
    for(let o_conn of a_o_entity_connection__non_tangent_all){
        let b_duplicate = a_o_entity_connection__non_tangent.some(o_existing =>
            (o_existing.o_entity_a === o_conn.o_entity_a && o_existing.o_entity_b === o_conn.o_entity_b) ||
            (o_existing.o_entity_a === o_conn.o_entity_b && o_existing.o_entity_b === o_conn.o_entity_a)
        );
        if(!b_duplicate){
            a_o_entity_connection__non_tangent.push(o_conn);
        }
    }

    // Deduplicate tangent points by position
    let n_dedup_tolerance = 0.001;
    let a_o_tangent_unique = [];
    for(let o_conn of a_o_entity_connection__tangent){
        let b_duplicate = a_o_tangent_unique.some(o_existing =>
            Math.abs(o_existing.o_trn_vec3_connected.n_x - o_conn.o_trn_vec3_connected.n_x) < n_dedup_tolerance &&
            Math.abs(o_existing.o_trn_vec3_connected.n_y - o_conn.o_trn_vec3_connected.n_y) < n_dedup_tolerance &&
            Math.abs(o_existing.o_trn_vec3_connected.n_z - o_conn.o_trn_vec3_connected.n_z) < n_dedup_tolerance
        );
        if(!b_duplicate){
            a_o_tangent_unique.push(o_conn);
        }
    }

    let a_o_endpoint = o_sketch_sweep_paths.a_o_pointwithrotation_noconnection || [];

    let s_scad = `
include <BOSL2/std.scad>

${s_scad_entity_defs}
${s_scad_profile_functions}
${s_scad_profile_functions_remover}

// ===== TANGENT CONNECTION POINTS =====
${a_o_tangent_unique.map((o, idx) =>
    `${s_name_sketch_sweep_paths}_tangent_point_${idx} = [${o.o_trn_vec3_connected.n_x.toFixed(6)}, ${o.o_trn_vec3_connected.n_y.toFixed(6)}, ${o.o_trn_vec3_connected.n_z.toFixed(6)}];
${s_name_sketch_sweep_paths}_tangent_point_${idx}_angle = ${o.n_ang_deg_z_entity_a.toFixed(6)};`
).join('\n')}

// ===== UNCONNECTED ENDPOINTS =====
${a_o_endpoint.map((o, idx) =>
    `${s_name_sketch_sweep_paths}_endpoint_${idx} = [${o.o_vec3.n_x.toFixed(6)}, ${o.o_vec3.n_y.toFixed(6)}, ${(o.o_vec3.n_z || 0).toFixed(6)}];
${s_name_sketch_sweep_paths}_endpoint_${idx}_angle = ${o.n_rotation_deg.toFixed(6)};`
).join('\n')}

// Generic module to revolve any profile around X axis
module revolve_profile_around_x(profile_for_revolve, profile_height, angle=90) {
    rotate([90, 0, 180])
    translate([0, -profile_height, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(profile_for_revolve);
}

// Module to place revolve joints at all tangent connection points
module ${s_name_sketch_sweep_paths}_place_revolve_joints_at_tangent_points(profile_for_revolve, profile_height, angle=90) {
${a_o_tangent_unique.map((o, idx) =>
    `    translate(${s_name_sketch_sweep_paths}_tangent_point_${idx})
    rotate([0, 0, ${s_name_sketch_sweep_paths}_tangent_point_${idx}_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);`
).join('\n')}
}

// Module to place revolve joints at unconnected endpoints
module ${s_name_sketch_sweep_paths}_place_revolve_joints_at_endpoints(profile_for_revolve, profile_height, angle=180) {
${a_o_endpoint.map((o, idx) =>
    `    translate(${s_name_sketch_sweep_paths}_endpoint_${idx})
    rotate([0, 0, ${s_name_sketch_sweep_paths}_endpoint_${idx}_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);`
).join('\n')}
}

// ===== EXTENSION PARAMETERS =====
line_extension_amount = ${(o_sketch_profile.n_scl_max * 10).toFixed(6)};
arc_extension_degrees = 30;

// ===== NON-TANGENT CONNECTION JOINTS =====
${a_o_entity_connection__non_tangent.map((o_conn, idx) => {
    let a_o_lines = o_sketch_sweep_paths.a_o_entity.filter(o => o && o.s_type === 'LINE');
    let a_o_arcs = o_sketch_sweep_paths.a_o_entity.filter(o => o && o.s_type === 'ARC');

    let n_idx_a = -1, n_idx_b = -1;
    let s_type_a = o_conn.o_entity_a.s_type;
    let s_type_b = o_conn.o_entity_b.s_type;

    if(s_type_a === 'LINE') n_idx_a = a_o_lines.indexOf(o_conn.o_entity_a);
    if(s_type_a === 'ARC') n_idx_a = a_o_arcs.indexOf(o_conn.o_entity_a);
    if(s_type_b === 'LINE') n_idx_b = a_o_lines.indexOf(o_conn.o_entity_b);
    if(s_type_b === 'ARC') n_idx_b = a_o_arcs.indexOf(o_conn.o_entity_b);

    let s_entity_ref_a = s_type_a === 'LINE' ? `line_${n_idx_a}` : `arc_${n_idx_a}`;
    let s_entity_ref_b = s_type_b === 'LINE' ? `line_${n_idx_b}` : `arc_${n_idx_b}`;

    let cx = o_conn.o_trn_vec3_connected.n_x.toFixed(6);
    let cy = o_conn.o_trn_vec3_connected.n_y.toFixed(6);

    let b_a_at_start = Math.abs(o_conn.o_entity_a.o_vec3_trn_start.n_x - o_conn.o_trn_vec3_connected.n_x) < 0.001 &&
                       Math.abs(o_conn.o_entity_a.o_vec3_trn_start.n_y - o_conn.o_trn_vec3_connected.n_y) < 0.001;
    let b_b_at_start = Math.abs(o_conn.o_entity_b.o_vec3_trn_start.n_x - o_conn.o_trn_vec3_connected.n_x) < 0.001 &&
                       Math.abs(o_conn.o_entity_b.o_vec3_trn_start.n_y - o_conn.o_trn_vec3_connected.n_y) < 0.001;

    let s_extend_a = s_type_a === 'LINE'
        ? `extend_line(${s_entity_ref_a}, line_extension_amount, ${b_a_at_start})`
        : `extend_arc(${s_entity_ref_a}, arc_extension_degrees, ${b_a_at_start})`;

    let s_extend_b = s_type_b === 'LINE'
        ? `extend_line(${s_entity_ref_b}, line_extension_amount, ${b_b_at_start})`
        : `extend_arc(${s_entity_ref_b}, arc_extension_degrees, ${b_b_at_start})`;

    // Using path_sweep2d instead of path_sweep
    let s_sweep_a = s_type_a === 'LINE'
        ? `path_sweep2d(profile, ${s_extend_a})`
        : `sweep_arc_2d(profile, ${s_extend_a}, n_segments=${n_segments})`;

    let s_sweep_b = s_type_b === 'LINE'
        ? `path_sweep2d(profile, ${s_extend_b})`
        : `sweep_arc_2d(profile, ${s_extend_b}, n_segments=${n_segments})`;

    return `
// Non-tangent connection ${idx}: ${s_type_a} meets ${s_type_b} at [${cx}, ${cy}]
module ${s_name_sketch_sweep_paths}_non_tangent_joint_${idx}(profile) {
    intersection() {
        ${s_sweep_a};
        ${s_sweep_b};
    }
}`;
}).join('\n')}

// Module to place all non-tangent intersection joints
module ${s_name_sketch_sweep_paths}_place_non_tangent_joints(profile) {
${a_o_entity_connection__non_tangent.map((o, idx) =>
    `    ${s_name_sketch_sweep_paths}_non_tangent_joint_${idx}(profile);`
).join('\n')}
}

// ===== SWEEP PATTERN (using path_sweep2d) =====
module ${s_name_sketch_sweep_paths}_sweep_pattern(profile) {
    union() {
        // Sweep lines
        ${o_sketch_sweep_paths.a_o_entity.filter(o => o && o.s_type === 'LINE').map((o_line, n_idx) => {
            return `path_sweep2d(profile, line_${n_idx});`;
        }).join('\n        ')}

        // Sweep arcs
        ${o_sketch_sweep_paths.a_o_entity.filter(o => o && o.s_type === 'ARC').map((o_arc, n_idx) => {
            return `sweep_arc_2d(profile, arc_${n_idx}, n_segments=${n_segments});`;
        }).join('\n        ')}

        // Sweep circles
        ${o_sketch_sweep_paths.a_o_entity.filter(o => o && o.s_type === 'CIRCLE').map((o_circle, n_idx) => {
            return `sweep_circle_2d(profile, circle_${n_idx}, n_segments=${n_segments});`;
        }).join('\n        ')}
    }
}

// ===== FULL PATTERN =====
module ${s_name_sketch_sweep_paths}_full_pattern(
    b_make_joints = true,
    b_make_endpoint_joints = true,
    b_make_non_tangent_joints = true,
    sweep_profile = ${s_name_sketch_profile}_mirroredx,
    joint_profile_for_revolve = ${s_name_sketch_profile}_for_revolve,
    joint_profile_height = ${s_name_sketch_profile}_height,
    joint_angle = 90,
    endpoint_joint_angle = 180
    ) {
    union() {
        ${s_name_sketch_sweep_paths}_sweep_pattern(sweep_profile);
        if(b_make_joints){
            ${s_name_sketch_sweep_paths}_place_revolve_joints_at_tangent_points(joint_profile_for_revolve, joint_profile_height, joint_angle);
        }
        if(b_make_endpoint_joints){
            ${s_name_sketch_sweep_paths}_place_revolve_joints_at_endpoints(joint_profile_for_revolve, joint_profile_height, endpoint_joint_angle);
        }
        if(b_make_non_tangent_joints){
            ${s_name_sketch_sweep_paths}_place_non_tangent_joints(sweep_profile);
        }
    }
}

// ===== FINAL RENDER =====
$fn = 4;
// $fn = 32;
module part_with_difference(s=1){
    difference(){
        color([0.,1.0, 0.5, 0.5])
        ${s_name_sketch_sweep_paths}_full_pattern(
            b_make_joints=true,
            b_make_endpoint_joints=true,
            b_make_non_tangent_joints=true,
            sweep_profile=${s_name_sketch_profile}_mirroredx_scaled(s=s),
            joint_profile_for_revolve=${s_name_sketch_profile}_for_revolve_scaled(s=s),
            joint_profile_height=${s_name_sketch_profile}_height * s,
            joint_angle=90,
            endpoint_joint_angle=180
        );

        color([1.0,0.0, 0.0, 0.5])
        translate([0, 0, ${s_name_sketch_profile_remover}_trn_y*s])
        ${s_name_sketch_sweep_paths}_full_pattern(
            b_make_joints=false,
            b_make_endpoint_joints=false,
            b_make_non_tangent_joints=true,
            sweep_profile=${s_name_sketch_profile_remover}_mirroredx_scaled(s=s)
        );
    }
}
part_with_difference(s=1.0);
`;
    return s_scad;
};

// ===== SVG PREVIEW GENERATION =====

let f_s_svg_from_a_o_entity = function(a_o_entity){
    let a_o_entity_line = a_o_entity.filter(o => o.s_type === "LINE");
    let a_o_entity_arc = a_o_entity.filter(o => o.s_type === "ARC");
    let a_o_entity_circle = a_o_entity.filter(o => o.s_type === "CIRCLE");

    // calculate bounding box
    let n_x_min = Infinity, n_x_max = -Infinity;
    let n_y_min = Infinity, n_y_max = -Infinity;

    for(let o of a_o_entity_line){
        n_x_min = Math.min(n_x_min, o.o_vec3_trn_start.n_x, o.o_vec3_trn_end.n_x);
        n_x_max = Math.max(n_x_max, o.o_vec3_trn_start.n_x, o.o_vec3_trn_end.n_x);
        n_y_min = Math.min(n_y_min, o.o_vec3_trn_start.n_y, o.o_vec3_trn_end.n_y);
        n_y_max = Math.max(n_y_max, o.o_vec3_trn_start.n_y, o.o_vec3_trn_end.n_y);
    }
    for(let o of a_o_entity_arc){
        let f_p = function(n_deg){
            return {
                n_x: o.o_vec3_trn.n_x + o.n_radius * Math.cos(n_deg * Math.PI / 180),
                n_y: o.o_vec3_trn.n_y + o.n_radius * Math.sin(n_deg * Math.PI / 180),
            };
        };
        let o_s = f_p(o.n_ang_deg_start);
        let o_e = f_p(o.n_ang_deg_end);
        n_x_min = Math.min(n_x_min, o_s.n_x, o_e.n_x);
        n_x_max = Math.max(n_x_max, o_s.n_x, o_e.n_x);
        n_y_min = Math.min(n_y_min, o_s.n_y, o_e.n_y);
        n_y_max = Math.max(n_y_max, o_s.n_y, o_e.n_y);
        // check cardinal angles within arc range for tighter bbox
        for(let n_deg of [0, 90, 180, 270]){
            let n_d = n_deg;
            if(n_d < o.n_ang_deg_start) n_d += 360;
            if(n_d >= o.n_ang_deg_start && n_d <= o.n_ang_deg_end){
                let o_p = f_p(n_deg);
                n_x_min = Math.min(n_x_min, o_p.n_x);
                n_x_max = Math.max(n_x_max, o_p.n_x);
                n_y_min = Math.min(n_y_min, o_p.n_y);
                n_y_max = Math.max(n_y_max, o_p.n_y);
            }
        }
    }
    for(let o of a_o_entity_circle){
        n_x_min = Math.min(n_x_min, o.o_vec3_trn.n_x - o.n_radius);
        n_x_max = Math.max(n_x_max, o.o_vec3_trn.n_x + o.n_radius);
        n_y_min = Math.min(n_y_min, o.o_vec3_trn.n_y - o.n_radius);
        n_y_max = Math.max(n_y_max, o.o_vec3_trn.n_y + o.n_radius);
    }

    if(!isFinite(n_x_min)){
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>';
    }

    let n_padding = Math.max(n_x_max - n_x_min, n_y_max - n_y_min) * 0.1 || 1;
    let n_vb_x = n_x_min - n_padding;
    let n_vb_y = -(n_y_max + n_padding); // flip Y for SVG
    let n_vb_w = (n_x_max - n_x_min) + n_padding * 2;
    let n_vb_h = (n_y_max - n_y_min) + n_padding * 2;

    let n_stroke = Math.max(n_vb_w, n_vb_h) * 0.015;
    let n_r_point = n_stroke * 1.5;

    let a_s = [];
    a_s.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n_vb_x} ${n_vb_y} ${n_vb_w} ${n_vb_h}">`);

    // lines
    for(let o of a_o_entity_line){
        a_s.push(`<line x1="${o.o_vec3_trn_start.n_x}" y1="${-o.o_vec3_trn_start.n_y}" x2="${o.o_vec3_trn_end.n_x}" y2="${-o.o_vec3_trn_end.n_y}" stroke="#8b74ea" stroke-width="${n_stroke}" fill="none" stroke-linecap="round"/>`);
    }

    // arcs
    for(let o of a_o_entity_arc){
        let n_sx = o.o_vec3_trn.n_x + o.n_radius * Math.cos(o.n_ang_deg_start * Math.PI / 180);
        let n_sy = o.o_vec3_trn.n_y + o.n_radius * Math.sin(o.n_ang_deg_start * Math.PI / 180);
        let n_ex = o.o_vec3_trn.n_x + o.n_radius * Math.cos(o.n_ang_deg_end * Math.PI / 180);
        let n_ey = o.o_vec3_trn.n_y + o.n_radius * Math.sin(o.n_ang_deg_end * Math.PI / 180);
        let n_sweep = o.n_ang_deg_end - o.n_ang_deg_start;
        if(n_sweep < 0) n_sweep += 360;
        let n_large = n_sweep > 180 ? 1 : 0;
        a_s.push(`<path d="M ${n_sx} ${-n_sy} A ${o.n_radius} ${o.n_radius} 0 ${n_large} 0 ${n_ex} ${-n_ey}" stroke="#8b74ea" stroke-width="${n_stroke}" fill="none" stroke-linecap="round"/>`);
    }

    // circles
    for(let o of a_o_entity_circle){
        a_s.push(`<circle cx="${o.o_vec3_trn.n_x}" cy="${-o.o_vec3_trn.n_y}" r="${o.n_radius}" stroke="#8b74ea" stroke-width="${n_stroke}" fill="none"/>`);
    }

    // start/end points
    let a_o_point = [];
    for(let o of a_o_entity_line){
        a_o_point.push(o.o_vec3_trn_start);
        a_o_point.push(o.o_vec3_trn_end);
    }
    for(let o of a_o_entity_arc){
        a_o_point.push(o.o_vec3_trn_start);
        a_o_point.push(o.o_vec3_trn_end);
    }
    for(let o_p of a_o_point){
        a_s.push(`<circle cx="${o_p.n_x}" cy="${-o_p.n_y}" r="${n_r_point}" fill="#fc8181" opacity="0.7"/>`);
    }

    a_s.push('</svg>');
    return a_s.join('\n');
};

// ===== HIGH-LEVEL API =====

let f_o_result__upload_dxf = async function(s_dxf_content, s_name, s_type){
    let a_o_entity = f_a_o_entity_from_s_dxf(s_dxf_content);

    let s_dir__dxf = `${s_root_dir}${s_ds}.gitignored${s_ds}dxf_upload`;
    try { await Deno.mkdir(s_dir__dxf, { recursive: true }); } catch { /* exists */ }
    let s_path_file = `${s_dir__dxf}${s_ds}${s_name}`;
    await Deno.writeTextFile(s_path_file, s_dxf_content);

    let s_svg = f_s_svg_from_a_o_entity(a_o_entity);

    return {
        s_name,
        s_type,
        s_path_file,
        s_json_a_o_entity: JSON.stringify(a_o_entity),
        n_cnt_entity: a_o_entity.length,
        s_svg,
    };
};

// ===== PROFILE REVOLVE ONLY =====

let f_s_scad__generate_profile_revolve = function(o_dxffile__profile, n_point_per_mm = 1){
    let a_o_entity__profile = JSON.parse(o_dxffile__profile.s_json_a_o_entity);
    let o_sketch__profile = f_o_sketch_from_a_o_entity(a_o_entity__profile, n_point_per_mm);
    let s_scad_profile = f_s_scad_profile_functions_from_o_sketch(o_sketch__profile, "profile");

    let s_scad = `
include <BOSL2/std.scad>

${s_scad_profile}

// ===== AXIS HELPER =====
module axis_helper(len=10, r=0.05) {
    color("red")   cylinder(h=len, r=r);                          // Z
    color("green") rotate([0, 90, 0]) cylinder(h=len, r=r);       // X
    color("blue")  rotate([-90, 0, 0]) cylinder(h=len, r=r);      // Y
    color("white") sphere(r=r*3);                                   // origin
}

// ===== RENDER =====
$fn = 32;

axis_helper();

// restore original DXF position (undo x-shift and y-centering)
o_dxf_offset = [profile_trn_x, profile_trn_y + profile_height];

color("green")
translate(o_dxf_offset)
linear_extrude(0.01)
polygon(profile_mirroredx);

// preview revolve at DXF position
color("blue", 0.5)
translate(o_dxf_offset)
profile_endpoint_cap(angle=90);
`;
    return s_scad;
};

// ===== SIMPLE SCAD GENERATION (no joints, no remover) =====

let f_s_scad__generate_simple = function(o_dxffile__profile, o_dxffile__path, n_point_per_mm = 1, b_endpoint_caps = false, s_sweep_function = 'path_sweep2d'){
    let a_o_entity__profile = JSON.parse(o_dxffile__profile.s_json_a_o_entity);
    let a_o_entity__path = JSON.parse(o_dxffile__path.s_json_a_o_entity);

    let o_sketch__profile = f_o_sketch_from_a_o_entity(a_o_entity__profile, n_point_per_mm);
    let o_sketch__path = f_o_sketch_from_a_o_entity(a_o_entity__path, n_point_per_mm);
    let s_scad_profile = f_s_scad_profile_functions_from_o_sketch(o_sketch__profile, "profile");

    let a_o_entity_line = a_o_entity__path.filter(o => o.s_type === "LINE");
    let a_o_entity_arc = a_o_entity__path.filter(o => o.s_type === "ARC");
    let a_o_entity_circle = a_o_entity__path.filter(o => o.s_type === "CIRCLE");

    let a_o_endpoint = o_sketch__path.a_o_pointwithrotation_noconnection;

    let n_segments = 50;

    let b_3d = s_sweep_function === 'path_sweep';

    let s_scad = `
include <BOSL2/std.scad>

${s_scad_profile}

// ===== PATH ENTITY DEFINITIONS =====
${a_o_entity_line.map((o, n_idx) => {
    if(b_3d){
        return `line_${n_idx} = [[${o.o_vec3_trn_start.n_x}, ${o.o_vec3_trn_start.n_y}, 0], [${o.o_vec3_trn_end.n_x}, ${o.o_vec3_trn_end.n_y}, 0]];`;
    }
    return `line_${n_idx} = [[${o.o_vec3_trn_start.n_x}, ${o.o_vec3_trn_start.n_y}], [${o.o_vec3_trn_end.n_x}, ${o.o_vec3_trn_end.n_y}]];`;
}).join('\n')}

${a_o_entity_arc.map((o, n_idx) => {
    return `arc_${n_idx} = [
    [${o.o_vec3_trn.n_x}, ${o.o_vec3_trn.n_y}, ${o.o_vec3_trn.n_z}],
    ${o.n_radius},
    ${o.n_ang_deg_start},
    ${o.n_ang_deg_end}
];`;
}).join('\n')}

${a_o_entity_circle.map((o, n_idx) => {
    return `circle_${n_idx} = [
    [${o.o_vec3_trn.n_x}, ${o.o_vec3_trn.n_y}, ${o.o_vec3_trn.n_z}],
    ${o.n_radius}
];`;
}).join('\n')}

// ===== UNCONNECTED ENDPOINTS =====
${a_o_endpoint.map((o, idx) =>
    `endpoint_${idx} = [${o.o_vec3.n_x.toFixed(6)}, ${o.o_vec3.n_y.toFixed(6)}, ${(o.o_vec3.n_z || 0).toFixed(6)}];
endpoint_${idx}_angle = ${o.n_rotation_deg.toFixed(6)};`
).join('\n')}

// ===== SWEEP MODULES =====
${b_3d ? `
module sweep_arc(profile, arc_def, n_segments=${n_segments}) {
    center = arc_def[0];
    radius = arc_def[1];
    start_angle = arc_def[2];
    end_angle = arc_def[3];
    arc_path = [for (a = [start_angle : (end_angle - start_angle) / n_segments : end_angle])
        [center[0] + radius * cos(a), center[1] + radius * sin(a), 0]];
    path_sweep(profile, arc_path);
}

module sweep_circle(profile, circle_def, n_segments=${n_segments}) {
    center = circle_def[0];
    radius = circle_def[1];
    circle_path = [for (a = [0 : 360 / n_segments : 360 - 360 / n_segments])
        [center[0] + radius * cos(a), center[1] + radius * sin(a), 0]];
    path_sweep(profile, circle_path, closed=true);
}
` : `
module sweep_arc_2d(profile, arc_def, n_segments=${n_segments}) {
    center = arc_def[0];
    radius = arc_def[1];
    start_angle = arc_def[2];
    end_angle = arc_def[3];
    translate([center[0], center[1], 0])
    path_sweep2d(profile, arc(n=n_segments, r=radius, angle=[start_angle, end_angle]));
}

module sweep_circle_2d(profile, circle_def, n_segments=${n_segments}) {
    center = circle_def[0];
    radius = circle_def[1];
    translate([center[0], center[1], 0])
    path_sweep2d(profile, circle(r=radius, $fn=n_segments), closed=true);
}
`}

// ===== RENDER =====
$fn = 32;

union() {
    // Sweep lines
    ${a_o_entity_line.map((o, n_idx) => {
        return `${s_sweep_function}(profile_mirroredx, line_${n_idx});`;
    }).join('\n    ')}

    // Sweep arcs
    ${a_o_entity_arc.map((o, n_idx) => {
        return b_3d
            ? `sweep_arc(profile_mirroredx, arc_${n_idx});`
            : `sweep_arc_2d(profile_mirroredx, arc_${n_idx});`;
    }).join('\n    ')}

    // Sweep circles
    ${a_o_entity_circle.map((o, n_idx) => {
        return b_3d
            ? `sweep_circle(profile_mirroredx, circle_${n_idx});`
            : `sweep_circle_2d(profile_mirroredx, circle_${n_idx});`;
    }).join('\n    ')}

    // Endpoint caps (90° revolve of profile around its X axis)
    ${b_endpoint_caps ? a_o_endpoint.map((o, idx) => {
        return `translate(endpoint_${idx})
    rotate([0, 0, endpoint_${idx}_angle])
    profile_endpoint_cap();`;
    }).join('\n    ') : '// (disabled)'}
}
`;
    return s_scad;
};


// ===== SIMPLE SCAD GENERATION WITH JOINTS (endpoint revolves + connection joints, no remover) =====

let f_s_scad__generate_simple_joints = function(o_dxffile__profile, o_dxffile__path, n_point_per_mm = 1, s_sweep_function = 'path_sweep2d'){
    let a_o_entity__profile = JSON.parse(o_dxffile__profile.s_json_a_o_entity);
    let a_o_entity__path = JSON.parse(o_dxffile__path.s_json_a_o_entity);

    let o_sketch__profile = f_o_sketch_from_a_o_entity(a_o_entity__profile, n_point_per_mm);
    let o_sketch__path = f_o_sketch_from_a_o_entity(a_o_entity__path, n_point_per_mm);
    let s_scad_profile = f_s_scad_profile_functions_from_o_sketch(o_sketch__profile, "profile");

    let a_o_entity_line = a_o_entity__path.filter(o => o.s_type === "LINE");
    let a_o_entity_arc = a_o_entity__path.filter(o => o.s_type === "ARC");
    let a_o_entity_circle = a_o_entity__path.filter(o => o.s_type === "CIRCLE");

    let a_o_endpoint = o_sketch__path.a_o_pointwithrotation_noconnection;
    let a_o_connection = o_sketch__path.a_o_entity_connection;

    // Extension length for joints — must be long enough to fully overlap at any angle
    // Compute from profile dimensions (max of width and height ranges)
    let a_x = o_sketch__profile.a_o_vec3_trn.map(p => p.n_x);
    let a_y = o_sketch__profile.a_o_vec3_trn.map(p => p.n_y);
    let n_profile_width = Math.max(...a_x) - Math.min(...a_x);
    let n_profile_height = Math.max(...a_y) - Math.min(...a_y);
    let n_ext = Math.max(n_profile_width, n_profile_height) * 3;

    let n_segments = 50;

    // Helper: generate a short extension path for an entity at a connection point
    // The extension goes FROM slightly before the connection point TO well past it,
    // continuing in the entity's direction
    let f_s_extension_sweep = function(o_conn, o_entity, o_vec3_dir, n_idx_joint, s_side){
        let cp = o_conn.o_trn_vec3_connected;
        // o_vec3_dir points FROM the connection INTO the entity (the entity's travel direction from this point).
        // To extend past the connection, go in the OPPOSITE direction (continuing beyond the connection)
        let dx = -o_vec3_dir.n_x;
        let dy = -o_vec3_dir.n_y;

        // Extension line: from connection point to connection point + extension
        let x0 = cp.n_x;
        let y0 = cp.n_y;
        let x1 = cp.n_x + dx * n_ext;
        let y1 = cp.n_y + dy * n_ext;

        if(s_sweep_function === 'path_sweep'){
            return `path_sweep(profile_mirroredx, [[${x0}, ${y0}, 0], [${x1}, ${y1}, 0]]);`;
        }
        return `path_sweep2d(profile_mirroredx, [[${x0}, ${y0}], [${x1}, ${y1}]]);`;
    };

    // Count how many entities connect at each point
    let o_entity_count_by_point = {};
    for(let o_conn of a_o_connection){
        let s_key = `${o_conn.o_trn_vec3_connected.n_x.toFixed(4)},${o_conn.o_trn_vec3_connected.n_y.toFixed(4)}`;
        if(!o_entity_count_by_point[s_key]) o_entity_count_by_point[s_key] = new Set();
        o_entity_count_by_point[s_key].add(o_conn.o_entity_a);
        o_entity_count_by_point[s_key].add(o_conn.o_entity_b);
    }

    // Check if a connection point lies on any other entity's path
    let a_o_all_entities = [...a_o_entity_line, ...a_o_entity_arc];
    let f_b_point_on_other_entity = function(o_vec3_point, o_entity_a, o_entity_b){
        return a_o_all_entities.some(o_ent =>
            o_ent !== o_entity_a && o_ent !== o_entity_b &&
            f_b_point_on_entity(o_vec3_point, o_ent)
        );
    };

    // Generate joint blocks
    let s_joints = a_o_connection.map((o_conn, n_idx) => {
        if(o_conn.b_tangent) return ''; // skip smooth flowing connections

        let cp = o_conn.o_trn_vec3_connected;
        let n_ang = o_conn.n_ang_rad_between_entities;

        // Non-flowing tangent (angle ≈ 0°): entities double back — use endpoint revolves
        // Directions point INTO entities, but caps should face AWAY → add 180°
        if(n_ang < (15 * Math.PI / 180)){
            let n_ang_a = Math.atan2(o_conn.o_vec3_dir_entity_a.n_y, o_conn.o_vec3_dir_entity_a.n_x) * 180 / Math.PI + 180;
            let n_ang_b = Math.atan2(o_conn.o_vec3_dir_entity_b.n_y, o_conn.o_vec3_dir_entity_b.n_x) * 180 / Math.PI + 180;
            return `    // Non-flowing tangent revolves at [${cp.n_x.toFixed(2)}, ${cp.n_y.toFixed(2)}]
    translate([${cp.n_x.toFixed(6)}, ${cp.n_y.toFixed(6)}, 0])
    rotate([0, 0, ${n_ang_a.toFixed(6)}])
    profile_endpoint_cap();
    translate([${cp.n_x.toFixed(6)}, ${cp.n_y.toFixed(6)}, 0])
    rotate([0, 0, ${n_ang_b.toFixed(6)}])
    profile_endpoint_cap();`;
        }

        let s_key = `${cp.n_x.toFixed(4)},${cp.n_y.toFixed(4)}`;
        let n_entities_at_point = o_entity_count_by_point[s_key] ? o_entity_count_by_point[s_key].size : 2;

        if(n_entities_at_point > 2){
            // 3+ entities at this point: only generate joints for ~90° pairs
            let n_deg = n_ang * 180 / Math.PI;
            if(Math.abs(n_deg - 90) > 15) return '';
        } else {
            // Exactly 2 entities: generate joint unless point lies on another entity
            if(f_b_point_on_other_entity(cp, o_conn.o_entity_a, o_conn.o_entity_b)) return '';
        }

        // Angled connection: use intersection of extended sweeps
        let s_ext_a = f_s_extension_sweep(o_conn, o_conn.o_entity_a, o_conn.o_vec3_dir_entity_a, n_idx, 'a');
        let s_ext_b = f_s_extension_sweep(o_conn, o_conn.o_entity_b, o_conn.o_vec3_dir_entity_b, n_idx, 'b');

        return `    // Joint ${n_idx} at [${cp.n_x.toFixed(2)}, ${cp.n_y.toFixed(2)}]
    intersection() {
        ${s_ext_a}
        ${s_ext_b}
    }`;
    }).filter(s => s).join('\n\n');

    let b_3d = s_sweep_function === 'path_sweep';

    let s_scad = `
include <BOSL2/std.scad>

${s_scad_profile}

// ===== PATH ENTITY DEFINITIONS =====
${a_o_entity_line.map((o, n_idx) => {
    if(b_3d){
        return `line_${n_idx} = [[${o.o_vec3_trn_start.n_x}, ${o.o_vec3_trn_start.n_y}, 0], [${o.o_vec3_trn_end.n_x}, ${o.o_vec3_trn_end.n_y}, 0]];`;
    }
    return `line_${n_idx} = [[${o.o_vec3_trn_start.n_x}, ${o.o_vec3_trn_start.n_y}], [${o.o_vec3_trn_end.n_x}, ${o.o_vec3_trn_end.n_y}]];`;
}).join('\n')}

${a_o_entity_arc.map((o, n_idx) => {
    return `arc_${n_idx} = [
    [${o.o_vec3_trn.n_x}, ${o.o_vec3_trn.n_y}, ${o.o_vec3_trn.n_z}],
    ${o.n_radius},
    ${o.n_ang_deg_start},
    ${o.n_ang_deg_end}
];`;
}).join('\n')}

${a_o_entity_circle.map((o, n_idx) => {
    return `circle_${n_idx} = [
    [${o.o_vec3_trn.n_x}, ${o.o_vec3_trn.n_y}, ${o.o_vec3_trn.n_z}],
    ${o.n_radius}
];`;
}).join('\n')}

// ===== UNCONNECTED ENDPOINTS =====
${a_o_endpoint.map((o, idx) =>
    `endpoint_${idx} = [${o.o_vec3.n_x.toFixed(6)}, ${o.o_vec3.n_y.toFixed(6)}, ${(o.o_vec3.n_z || 0).toFixed(6)}];
endpoint_${idx}_angle = ${o.n_rotation_deg.toFixed(6)};`
).join('\n')}

// ===== SWEEP MODULES =====
${b_3d ? `
module sweep_arc(profile, arc_def, n_segments=${n_segments}) {
    center = arc_def[0];
    radius = arc_def[1];
    start_angle = arc_def[2];
    end_angle = arc_def[3];
    arc_path = [for (a = [start_angle : (end_angle - start_angle) / n_segments : end_angle])
        [center[0] + radius * cos(a), center[1] + radius * sin(a), 0]];
    path_sweep(profile, arc_path);
}

module sweep_circle(profile, circle_def, n_segments=${n_segments}) {
    center = circle_def[0];
    radius = circle_def[1];
    circle_path = [for (a = [0 : 360 / n_segments : 360 - 360 / n_segments])
        [center[0] + radius * cos(a), center[1] + radius * sin(a), 0]];
    path_sweep(profile, circle_path, closed=true);
}
` : `
module sweep_arc_2d(profile, arc_def, n_segments=${n_segments}) {
    center = arc_def[0];
    radius = arc_def[1];
    start_angle = arc_def[2];
    end_angle = arc_def[3];
    translate([center[0], center[1], 0])
    path_sweep2d(profile, arc(n=n_segments, r=radius, angle=[start_angle, end_angle]));
}

module sweep_circle_2d(profile, circle_def, n_segments=${n_segments}) {
    center = circle_def[0];
    radius = circle_def[1];
    translate([center[0], center[1], 0])
    path_sweep2d(profile, circle(r=radius, $fn=n_segments), closed=true);
}
`}

// ===== RENDER =====
$fn = 32;

union() {
    // Sweep lines
    ${a_o_entity_line.map((o, n_idx) => {
        return `${s_sweep_function}(profile_mirroredx, line_${n_idx});`;
    }).join('\n    ')}

    // Sweep arcs
    ${a_o_entity_arc.map((o, n_idx) => {
        return b_3d
            ? `sweep_arc(profile_mirroredx, arc_${n_idx});`
            : `sweep_arc_2d(profile_mirroredx, arc_${n_idx});`;
    }).join('\n    ')}

    // Sweep circles
    ${a_o_entity_circle.map((o, n_idx) => {
        return b_3d
            ? `sweep_circle(profile_mirroredx, circle_${n_idx});`
            : `sweep_circle_2d(profile_mirroredx, circle_${n_idx});`;
    }).join('\n    ')}

    // Endpoint caps (90° revolve of profile around its X axis)
    ${a_o_endpoint.map((o, idx) => {
        return `translate(endpoint_${idx})
    rotate([0, 0, endpoint_${idx}_angle])
    profile_endpoint_cap();`;
    }).join('\n    ')}

    // Connection point joints (intersection of extended sweeps)
${s_joints}
}
`;
    return s_scad;
};

// ===== SIMPLE SCAD GENERATION WITH JOINTS AND REMOVER =====

let f_s_scad__generate_simple_joints_remover = function(o_dxffile__profile, o_dxffile__profile_remover, o_dxffile__path, n_point_per_mm = 1, s_sweep_function = 'path_sweep2d'){
    let a_o_entity__profile = JSON.parse(o_dxffile__profile.s_json_a_o_entity);
    let a_o_entity__profile_remover = JSON.parse(o_dxffile__profile_remover.s_json_a_o_entity);
    let a_o_entity__path = JSON.parse(o_dxffile__path.s_json_a_o_entity);

    let o_sketch__profile = f_o_sketch_from_a_o_entity(a_o_entity__profile, n_point_per_mm);
    let o_sketch__profile_remover = f_o_sketch_from_a_o_entity(a_o_entity__profile_remover, n_point_per_mm);
    let o_sketch__path = f_o_sketch_from_a_o_entity(a_o_entity__path, n_point_per_mm);
    let s_scad_profile = f_s_scad_profile_functions_from_o_sketch(o_sketch__profile, "profile");
    let s_scad_profile_remover = f_s_scad_profile_functions_from_o_sketch(o_sketch__profile_remover, "profile_remover");

    let a_o_entity_line = a_o_entity__path.filter(o => o.s_type === "LINE");
    let a_o_entity_arc = a_o_entity__path.filter(o => o.s_type === "ARC");
    let a_o_entity_circle = a_o_entity__path.filter(o => o.s_type === "CIRCLE");

    let a_o_endpoint = o_sketch__path.a_o_pointwithrotation_noconnection;
    let a_o_connection = o_sketch__path.a_o_entity_connection;

    let a_x = o_sketch__profile.a_o_vec3_trn.map(p => p.n_x);
    let a_y = o_sketch__profile.a_o_vec3_trn.map(p => p.n_y);
    let n_profile_width = Math.max(...a_x) - Math.min(...a_x);
    let n_profile_height = Math.max(...a_y) - Math.min(...a_y);
    let n_ext = Math.max(n_profile_width, n_profile_height) * 3;

    let b_3d = s_sweep_function === 'path_sweep';
    let n_segments = 50;

    // Helper: generate extension sweep for joints using a given profile variable
    let f_s_extension_sweep = function(s_profile_var, o_conn, o_vec3_dir){
        let cp = o_conn.o_trn_vec3_connected;
        let dx = -o_vec3_dir.n_x;
        let dy = -o_vec3_dir.n_y;
        let x0 = cp.n_x, y0 = cp.n_y;
        let x1 = cp.n_x + dx * n_ext, y1 = cp.n_y + dy * n_ext;
        if(b_3d){
            return `${s_sweep_function}(${s_profile_var}, [[${x0}, ${y0}, 0], [${x1}, ${y1}, 0]]);`;
        }
        return `${s_sweep_function}(${s_profile_var}, [[${x0}, ${y0}], [${x1}, ${y1}]]);`;
    };

    // Count entities per connection point
    let o_entity_count_by_point = {};
    for(let o_conn of a_o_connection){
        let s_key = `${o_conn.o_trn_vec3_connected.n_x.toFixed(4)},${o_conn.o_trn_vec3_connected.n_y.toFixed(4)}`;
        if(!o_entity_count_by_point[s_key]) o_entity_count_by_point[s_key] = new Set();
        o_entity_count_by_point[s_key].add(o_conn.o_entity_a);
        o_entity_count_by_point[s_key].add(o_conn.o_entity_b);
    }

    let a_o_all_entities = [...a_o_entity_line, ...a_o_entity_arc];
    let f_b_point_on_other_entity = function(o_vec3_point, o_entity_a, o_entity_b){
        return a_o_all_entities.some(o_ent =>
            o_ent !== o_entity_a && o_ent !== o_entity_b &&
            f_b_point_on_entity(o_vec3_point, o_ent)
        );
    };

    // Generate joint blocks for a given profile variable and its endpoint cap module name
    let f_s_joints = function(s_profile_var, s_cap_module){
        return a_o_connection.map((o_conn, n_idx) => {
            if(o_conn.b_tangent) return '';

            let cp = o_conn.o_trn_vec3_connected;
            let n_ang = o_conn.n_ang_rad_between_entities;

            // Non-flowing tangent (angle ≈ 0°): use endpoint revolves
            // Directions point INTO entities, but caps should face AWAY → add 180°
            if(n_ang < (15 * Math.PI / 180)){
                let n_ang_a = Math.atan2(o_conn.o_vec3_dir_entity_a.n_y, o_conn.o_vec3_dir_entity_a.n_x) * 180 / Math.PI + 180;
                let n_ang_b = Math.atan2(o_conn.o_vec3_dir_entity_b.n_y, o_conn.o_vec3_dir_entity_b.n_x) * 180 / Math.PI + 180;
                return `        // Non-flowing tangent revolves at [${cp.n_x.toFixed(2)}, ${cp.n_y.toFixed(2)}]
        translate([${cp.n_x.toFixed(6)}, ${cp.n_y.toFixed(6)}, 0])
        rotate([0, 0, ${n_ang_a.toFixed(6)}])
        ${s_cap_module}();
        translate([${cp.n_x.toFixed(6)}, ${cp.n_y.toFixed(6)}, 0])
        rotate([0, 0, ${n_ang_b.toFixed(6)}])
        ${s_cap_module}();`;
            }

            let s_key = `${cp.n_x.toFixed(4)},${cp.n_y.toFixed(4)}`;
            let n_entities_at_point = o_entity_count_by_point[s_key] ? o_entity_count_by_point[s_key].size : 2;

            if(n_entities_at_point > 2){
                // 3+ entities at this point: only generate joints for ~90° pairs
                let n_deg = n_ang * 180 / Math.PI;
                if(Math.abs(n_deg - 90) > 15) return '';
            } else {
                // Exactly 2 entities: skip if point lies on another entity's path
                if(f_b_point_on_other_entity(cp, o_conn.o_entity_a, o_conn.o_entity_b)) return '';
            }

            // Angled connection: intersection of extended sweeps
            let s_ext_a = f_s_extension_sweep(s_profile_var, o_conn, o_conn.o_vec3_dir_entity_a);
            let s_ext_b = f_s_extension_sweep(s_profile_var, o_conn, o_conn.o_vec3_dir_entity_b);
            return `        // Joint ${n_idx}
        intersection() {
            ${s_ext_a}
            ${s_ext_b}
        }`;
        }).filter(s => s).join('\n\n');
    };

    // Helper: sweep block for a given profile variable
    let f_s_sweep_block = function(s_profile_var){
        return `
        // Sweep lines
        ${a_o_entity_line.map((o, n_idx) => {
            return `${s_sweep_function}(${s_profile_var}, line_${n_idx});`;
        }).join('\n        ')}

        // Sweep arcs
        ${a_o_entity_arc.map((o, n_idx) => {
            return b_3d
                ? `sweep_arc(${s_profile_var}, arc_${n_idx});`
                : `sweep_arc_2d(${s_profile_var}, arc_${n_idx});`;
        }).join('\n        ')}

        // Sweep circles
        ${a_o_entity_circle.map((o, n_idx) => {
            return b_3d
                ? `sweep_circle(${s_profile_var}, circle_${n_idx});`
                : `sweep_circle_2d(${s_profile_var}, circle_${n_idx});`;
        }).join('\n        ')}`;
    };

    let s_scad = `
include <BOSL2/std.scad>

${s_scad_profile}
${s_scad_profile_remover}

// ===== PATH ENTITY DEFINITIONS =====
${a_o_entity_line.map((o, n_idx) => {
    if(b_3d){
        return `line_${n_idx} = [[${o.o_vec3_trn_start.n_x}, ${o.o_vec3_trn_start.n_y}, 0], [${o.o_vec3_trn_end.n_x}, ${o.o_vec3_trn_end.n_y}, 0]];`;
    }
    return `line_${n_idx} = [[${o.o_vec3_trn_start.n_x}, ${o.o_vec3_trn_start.n_y}], [${o.o_vec3_trn_end.n_x}, ${o.o_vec3_trn_end.n_y}]];`;
}).join('\n')}

${a_o_entity_arc.map((o, n_idx) => {
    return `arc_${n_idx} = [
    [${o.o_vec3_trn.n_x}, ${o.o_vec3_trn.n_y}, ${o.o_vec3_trn.n_z}],
    ${o.n_radius},
    ${o.n_ang_deg_start},
    ${o.n_ang_deg_end}
];`;
}).join('\n')}

${a_o_entity_circle.map((o, n_idx) => {
    return `circle_${n_idx} = [
    [${o.o_vec3_trn.n_x}, ${o.o_vec3_trn.n_y}, ${o.o_vec3_trn.n_z}],
    ${o.n_radius}
];`;
}).join('\n')}

// ===== UNCONNECTED ENDPOINTS =====
${a_o_endpoint.map((o, idx) =>
    `endpoint_${idx} = [${o.o_vec3.n_x.toFixed(6)}, ${o.o_vec3.n_y.toFixed(6)}, ${(o.o_vec3.n_z || 0).toFixed(6)}];
endpoint_${idx}_angle = ${o.n_rotation_deg.toFixed(6)};`
).join('\n')}

// ===== SWEEP MODULES =====
${b_3d ? `
module sweep_arc(profile, arc_def, n_segments=${n_segments}) {
    center = arc_def[0];
    radius = arc_def[1];
    start_angle = arc_def[2];
    end_angle = arc_def[3];
    arc_path = [for (a = [start_angle : (end_angle - start_angle) / n_segments : end_angle])
        [center[0] + radius * cos(a), center[1] + radius * sin(a), 0]];
    path_sweep(profile, arc_path);
}

module sweep_circle(profile, circle_def, n_segments=${n_segments}) {
    center = circle_def[0];
    radius = circle_def[1];
    circle_path = [for (a = [0 : 360 / n_segments : 360 - 360 / n_segments])
        [center[0] + radius * cos(a), center[1] + radius * sin(a), 0]];
    path_sweep(profile, circle_path, closed=true);
}
` : `
module sweep_arc_2d(profile, arc_def, n_segments=${n_segments}) {
    center = arc_def[0];
    radius = arc_def[1];
    start_angle = arc_def[2];
    end_angle = arc_def[3];
    translate([center[0], center[1], 0])
    path_sweep2d(profile, arc(n=n_segments, r=radius, angle=[start_angle, end_angle]));
}

module sweep_circle_2d(profile, circle_def, n_segments=${n_segments}) {
    center = circle_def[0];
    radius = circle_def[1];
    translate([center[0], center[1], 0])
    path_sweep2d(profile, circle(r=radius, $fn=n_segments), closed=true);
}
`}

// ===== RENDER =====
$fn = 32;

difference() {
    // Main shape: sweeps + endpoint caps + joints
    union() {
${f_s_sweep_block('profile_mirroredx')}

        // Endpoint caps
        ${a_o_endpoint.map((o, idx) => {
            return `translate(endpoint_${idx})
        rotate([0, 0, endpoint_${idx}_angle])
        profile_endpoint_cap();`;
        }).join('\n        ')}

        // Connection point joints
${f_s_joints('profile_mirroredx', 'profile_endpoint_cap')}
    }

    // Remover: same geometry but with remover profile, offset to keep DXF-relative position
    translate([0, 0, profile_remover_trn_y])
    union() {
${f_s_sweep_block('profile_remover_mirroredx')}

        // Endpoint caps (remover)
        ${a_o_endpoint.map((o, idx) => {
            return `translate(endpoint_${idx})
        rotate([0, 0, endpoint_${idx}_angle])
        profile_remover_endpoint_cap();`;
        }).join('\n        ')}

        // Connection point joints (remover)
${f_s_joints('profile_remover_mirroredx', 'profile_remover_endpoint_cap')}
    }
}
`;
    return s_scad;
};

export {
    f_o_vec3,
    f_b_vec3_equal,
    f_o_entity,
    f_a_o_entity_from_s_dxf,
    f_a_o_entity_from_o_dxf,
    f_o_dxf_from_s_dxf,
    f_o_sketch_from_a_o_entity,
    f_s_scad_path_sweep_sketch,
    f_s_scad_profile_functions_from_o_sketch,
    f_o_result__upload_dxf,
    f_s_scad__generate_simple,
    f_s_scad__generate_simple_joints,
    f_s_scad__generate_simple_joints_remover,
    f_s_scad__generate_profile_revolve,
};
