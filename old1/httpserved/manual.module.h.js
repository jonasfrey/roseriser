// import DxfParser from "npm:dxf-parser";

// import * as path from "https://deno.land/std/path/mod.ts";


// let f_o_pathinfo = function(s_path){
//     let p = path.parse(s_path);
//     return {
//         s_folder: p.dir,
//         s_folnorfiln: p.base,
//         s_filnnoext: p.name,
//         s_ext: p.ext
//     };
// };
import { buildSimplePolygon } from "./point_calculation.module.js";
import {
    f_s_scad_var_declation_sketch_entities,
    f_a_o_point__removed_duplicate,
    f_s_scad_profile_functions_from_o_sketch,
    f_s_scad_path_sweep_sketch,
    f_s_scad_cylindric_sweep,
    f_s_scad_button_generator
} from "./scad_generation.module.h.js";
import { f_s_svg_from_a_a_o_entity_group, f_s_svg_from_a_a_o_vec3_trn_ordered, f_s_svg_points_ordered_mirrored } from "./svg_generation.module.h.js";
let f_o_pointwithrotation = function(
    o_vec3, 
    n_rotation_deg
){
    return {
        o_vec3, 
        n_rotation_deg
    }
}

let f_o_entity_group = function(a_o_entity){
    return {
        a_o_entity
    }
}
let f_o_vec3 = function(n_x, n_y, n_z = 0){
    return { n_x, n_y, n_z };
};
let f_n_len_from_o_vec3 = function(o_vec3){
    return Math.sqrt(
        o_vec3.n_x ** 2 +
        o_vec3.n_y ** 2 +
        o_vec3.n_z ** 2
    );
}
let f_n_dot_from_o_vec3 = function(o_vec3_a, o_vec3_b){
    return (
        o_vec3_a.n_x * o_vec3_b.n_x +
        o_vec3_a.n_y * o_vec3_b.n_y +
        o_vec3_a.n_z * o_vec3_b.n_z
    );
}

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
}
let o_vec3__z_up = f_o_vec3(0, 0, 1);

let f_b_vec3_equal = function(o_vec3_a, o_vec3_b, n_tolerance = 0.0001){
    return (
        Math.abs(o_vec3_a.n_x - o_vec3_b.n_x) < n_tolerance &&
        Math.abs(o_vec3_a.n_y - o_vec3_b.n_y) < n_tolerance &&
        Math.abs(o_vec3_a.n_z - o_vec3_b.n_z) < n_tolerance
    );
}

let f_o_vec3_direction_at_connection = function(o_ent, o_vec3_conn){
    if(o_ent.s_type === "LINE"){
        // for line: direction points from start to end
        // if connected at start, direction is outward (toward end)
        // if connected at end, direction is outward (toward start, so negate)
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
        // arc tangent at a point: perpendicular to radius
        // tangent = (-sin(angle), cos(angle)) for CCW arc
        let n_ang_rad = 0;
        let b_at_start = f_b_vec3_equal(o_vec3_conn, o_ent.o_vec3_trn_start);
        if(b_at_start){
            n_ang_rad = o_ent.n_ang_rad_start;
        } else {
            n_ang_rad = o_ent.n_ang_rad_end;
        }
        // tangent direction (CCW): perpendicular to radial direction
        let dir_x = -Math.sin(n_ang_rad);
        let dir_y = Math.cos(n_ang_rad);

        // If at end, negate to get "outward" direction (pointing away from connection along the path)
        if(!b_at_start){
            dir_x = -dir_x;
            dir_y = -dir_y;
        }

        return f_o_vec3(dir_x, dir_y, 0);
    }
    return f_o_vec3(0, 0, 0);
}

let f_o_entity_connection = function(
    o_entity_a,
    o_entity_b, 
    o_vec3_dir_entity_a = null,
    o_vec3_dir_entity_b = null,
    n_ang_deg_z_entity_a = null,
    n_ang_deg_z_entity_b = null,
    o_trn_vec3_connected = null,
    b_tangent = false, 
    n_ang_rad_between_entities = null
){
    return {
        o_entity_a,
        o_entity_b,
        o_vec3_dir_entity_a,
        o_vec3_dir_entity_b,
        n_ang_deg_z_entity_a,
        n_ang_deg_z_entity_b,
        o_trn_vec3_connected,
        b_tangent, 
        n_ang_rad_between_entities
    }
}
let f_o_grouped_entity_connection = function(
    a_o_entity,
    b_closed = false
){
    return {
        a_o_entity,
        b_closed
    }
}
let f_a_a_o_entity_group_from_a_o_entity = function(
    a_o_entity
){
    // there could be more than one group
    // a entity group is an array of entities that are connected
    // the order of the entities inside a group is also important , they should not be ordered randomly but in order like they are connected

    // filter to only entities with start/end points (LINE and ARC, not CIRCLE)
    let a_o_entity__connectable = a_o_entity.filter(
        o => o && o.s_type !== "CIRCLE" && o.o_vec3_trn_start && o.o_vec3_trn_end
    );

    if(a_o_entity__connectable.length === 0){
        return [];
    }

    // build adjacency map: for each entity, store connected entities
    let o_map__adj = new Map();

    for(let o_ent of a_o_entity__connectable){
        o_map__adj.set(o_ent, []);
    }

    // find connections between entities
    for(let n_idx_a = 0; n_idx_a < a_o_entity__connectable.length; n_idx_a++){
        let o_ent_a = a_o_entity__connectable[n_idx_a];

        for(let n_idx_b = n_idx_a + 1; n_idx_b < a_o_entity__connectable.length; n_idx_b++){
            let o_ent_b = a_o_entity__connectable[n_idx_b];

            // check all 4 combinations of start/end points
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

    // find connected components using DFS
    let o_set__visited = new Set();
    let a_a_o_entity_group = [];

    for(let o_ent of a_o_entity__connectable){
        if(o_set__visited.has(o_ent)){
            continue;
        }

        // collect all entities in this connected component
        let a_o_entity__component = [];
        let a_o_stack = [o_ent];

        while(a_o_stack.length > 0){
            let o_current = a_o_stack.pop();
            if(o_set__visited.has(o_current)){
                continue;
            }
            o_set__visited.add(o_current);
            a_o_entity__component.push(o_current);

            for(let o_neighbor of o_map__adj.get(o_current)){
                if(!o_set__visited.has(o_neighbor)){
                    a_o_stack.push(o_neighbor);
                }
            }
        }

        // order entities in the component by connection chain
        let a_o_entity__ordered = f_a_o_entity__ordered_by_connection(
            a_o_entity__component,
            o_map__adj
        );
        a_a_o_entity_group.push(a_o_entity__ordered);
    }

    return a_a_o_entity_group;
}

let f_a_a_o_vec3_trn_ordered = function(
    a_a_o_entity_group,
    n_point_per_mm = 1
){
    // foreach group we want to convert the entities into points
    // the ordering and direction of the entities does matter

    let a_a_o_vec3_trn = [];

    for(let a_o_entity_group of a_a_o_entity_group){
        if(a_o_entity_group.length === 0){
            continue;
        }

        let a_o_vec3_trn__group = [];

        // single entity - just use default direction
        if(a_o_entity_group.length === 1){
            let a_o_point = f_a_o_vec3_trn_from_o_entity_directed(
                a_o_entity_group[0],
                false,
                n_point_per_mm
            );
            a_o_vec3_trn__group.push(...a_o_point);
            a_a_o_vec3_trn.push(a_o_vec3_trn__group);
            continue;
        }

        // multiple entities - determine direction based on connections
        // track the "exit point" of the previous entity to determine next entity's direction
        let o_vec3__prev_exit = null;

        for(let n_idx = 0; n_idx < a_o_entity_group.length; n_idx++){
            let o_ent = a_o_entity_group[n_idx];
            let b_reversed = false;

            if(n_idx === 0){
                // first entity: determine direction based on connection to second entity
                let o_ent_next = a_o_entity_group[1];

                // check which endpoint of first entity connects to second entity
                let b_end_connects_to_next =
                    f_b_vec3_equal(o_ent.o_vec3_trn_end, o_ent_next.o_vec3_trn_start) ||
                    f_b_vec3_equal(o_ent.o_vec3_trn_end, o_ent_next.o_vec3_trn_end);

                // if end connects to next, traverse start->end (not reversed)
                // if start connects to next, traverse end->start (reversed)
                b_reversed = !b_end_connects_to_next;

                o_vec3__prev_exit = b_reversed ? o_ent.o_vec3_trn_start : o_ent.o_vec3_trn_end;
            } else {
                // subsequent entities: entry point is where it connects to previous exit
                let b_start_is_entry = f_b_vec3_equal(o_ent.o_vec3_trn_start, o_vec3__prev_exit);

                // if start is entry, traverse start->end (not reversed)
                // if end is entry, traverse end->start (reversed)
                b_reversed = !b_start_is_entry;

                o_vec3__prev_exit = b_reversed ? o_ent.o_vec3_trn_start : o_ent.o_vec3_trn_end;
            }

            let a_o_point = f_a_o_vec3_trn_from_o_entity_directed(
                o_ent,
                b_reversed,
                n_point_per_mm
            );

            // skip first point of subsequent entities (duplicate of connection point)
            if(n_idx > 0 && a_o_point.length > 0){
                a_o_point = a_o_point.slice(1);
            }

            a_o_vec3_trn__group.push(...a_o_point);
        }

        a_a_o_vec3_trn.push(a_o_vec3_trn__group);
    }

    return a_a_o_vec3_trn;
}
let f_a_o_entity__ordered_by_connection = function(
    a_o_entity__component,
    o_map__adj
){
    if(a_o_entity__component.length <= 1){
        return a_o_entity__component;
    }

    let o_set__component = new Set(a_o_entity__component);

    // find an endpoint entity (one with only 1 connection within this component)
    // this will be our starting point for the chain
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

    // if no endpoint found (closed loop), just start from first entity
    if(!o_entity__start){
        o_entity__start = a_o_entity__component[0];
    }

    // walk through the connection chain
    let a_o_entity__ordered = [];
    let o_set__visited = new Set();
    let o_current = o_entity__start;

    while(o_current && !o_set__visited.has(o_current)){
        o_set__visited.add(o_current);
        a_o_entity__ordered.push(o_current);

        // find next unvisited neighbor in component
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
}
let f_o_entity = function(
    s_type = "LINE",
    o_vec3_trn_start = null,      // start point (LINE, computed for ARC)
    o_vec3_trn_end = null,        // end point (LINE, computed for ARC)
    n_radius = null,              // radius (ARC, CIRCLE)
    n_ang_deg_start = null,       // start angle in degrees (ARC)
    n_ang_deg_end = null,         // end angle in degrees (ARC)
    o_vec3_trn = null             // center point (ARC, CIRCLE)
){
    // Unified sketch entity: LINE, ARC, or CIRCLE
    // Properties are null when not applicable to the entity type

    let o_vec3_direction = null;
    let n_rotation_deg_start = null;
    let n_rotation_deg_end = null;
    let n_ang_rad_start = null;
    let n_ang_rad_end = null;

    if (s_type === "LINE") {
        // Compute direction and rotation for lines
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
        // Ensure start angle is smaller than end angle by adding 360° to end if needed
        // This preserves arc direction (important for arcs crossing 0°/360° boundary)
        let n_ang_deg_start_tmp = n_ang_deg_start;
        let n_ang_deg_end_tmp = n_ang_deg_end;
        if (n_ang_deg_start_tmp > n_ang_deg_end_tmp) {
            n_ang_deg_end_tmp += 360;
        }
        n_ang_deg_start = n_ang_deg_start_tmp;
        n_ang_deg_end = n_ang_deg_end_tmp;
        n_ang_rad_start = n_ang_deg_start * Math.PI / 180;
        n_ang_rad_end = n_ang_deg_end * Math.PI / 180;

        // Compute start and end points from center, radius, and angles
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
}
// let f_o_arc = function(
//     o_vec3_trn,
//     n_radius,
//     n_ang_deg_start,
//     n_ang_deg_end,
//     o_vec3_extrusion_normal = O_VEC3_Z_UP
// ){
//     // Ensure start angle is smaller than end angle by adding 360° to end if needed
//     // This preserves arc direction (important for arcs crossing 0°/360° boundary)
//     let n_ang_deg_start_tmp = n_ang_deg_start;
//     let n_ang_deg_end_tmp = n_ang_deg_end;
//     if (n_ang_deg_start_tmp > n_ang_deg_end_tmp) {
//         n_ang_deg_end_tmp += 360;
//     }
//     return {
//         s_type: "ARC",
//         o_vec3_trn,
//         n_radius,
//         n_ang_deg_start:n_ang_deg_start_tmp,
//         n_ang_deg_end:n_ang_deg_end_tmp,
//         n_ang_rad_start: n_ang_deg_start_tmp * Math.PI / 180,
//         n_ang_rad_end: n_ang_deg_end_tmp * Math.PI / 180,
//         o_vec3_trn_start: f_o_vec3(
//             o_vec3_trn.n_x + n_radius * Math.cos(n_ang_deg_start_tmp * Math.PI / 180),
//             o_vec3_trn.n_y + n_radius * Math.sin(n_ang_deg_start_tmp * Math.PI / 180),
//             o_vec3_trn.n_z
//         ),
//         o_vec3_trn_end: f_o_vec3(
//             o_vec3_trn.n_x + n_radius * Math.cos(n_ang_deg_end_tmp * Math.PI / 180),
//             o_vec3_trn.n_y + n_radius * Math.sin(n_ang_deg_end_tmp * Math.PI / 180),
//             o_vec3_trn.n_z
//         ),
//         o_vec3_extrusion_normal
//     };
// };

// f_o_circle replaced by f_o_entity
// let f_o_circle = function(
//     o_vec3_trn,
//     n_radius,
//     o_vec3_extrusion_normal = O_VEC3_Z_UP
// ){
//     return {
//         s_type: "CIRCLE",
//         o_vec3_trn,
//         n_radius,
//         o_vec3_extrusion_normal
//     };
// };

// f_o_line replaced by f_o_entity
// let f_o_line = function(
//     o_vec3_trn_start,
//     o_vec3_trn_end,
//     n_thickness = 0,
//     o_vec3_extrusion_normal = O_VEC3_Z_UP,
//
// ){
//     return {
//         s_type: "LINE",
//         o_vec3_trn_start,
//         o_vec3_trn_end,
//         n_thickness,
//         o_vec3_extrusion_normal,
//         o_vec3_direction: f_o_vec3_direction_from_o_trnvec3_start_end(
//             o_vec3_trn_start,
//             o_vec3_trn_end
//         ),
//         // the rotation that points away from the start point
//         n_rotation_deg_start: Math.atan2(
//             o_vec3_trn_end.n_y - o_vec3_trn_start.n_y,
//             o_vec3_trn_end.n_x - o_vec3_trn_start.n_x
//         ) * 180 / Math.PI,
//         n_rotation_deg_end: Math.atan2(
//             o_vec3_trn_start.n_y - o_vec3_trn_end.n_y,
//             o_vec3_trn_start.n_x - o_vec3_trn_end.n_x
//         ) * 180 / Math.PI
//     };
// };

let f_o_point = function(
    o_vec3_trn
){
    return {
        s_type: "POINT",
        o_vec3_trn
    };
};

let f_o_text = function(
    o_vec3_trn,
    s_text,
    n_height,
    n_rotation_deg = 0
){
    return {
        s_type: "TEXT",
        o_vec3_trn,
        s_text,
        n_height,
        n_rotation_deg
    };
};

let f_o_lwpoly_vertex = function(
    o_vec3_trn,
    n_bulge = 0
){
    return { o_vec3_trn, n_bulge };
};

let f_o_lwpolyline = function(
    a_o_lwpoly_vertex,
    b_closed = false
){
    return {
        s_type: "LWPOLYLINE",
        a_o_lwpoly_vertex,
        b_closed
    };
};

let f_o_ellipse = function(
    o_vec3_trn,
    o_vec3_major_axis,
    n_ratio_minor_major,
    n_ang_radians_start = 0,
    n_ang_radians_end = Math.PI * 2
){
    return {
        s_type: "ELLIPSE",
        o_vec3_trn,
        o_vec3_major_axis,
        n_ratio_minor_major,
        n_ang_radians_start,
        n_ang_radians_end
    };
};

let f_o_spline = function(
    n_degree,
    a_o_ctrl_pts,
    a_n_knots,
    a_n_weights = []
){
    return {
        s_type: "SPLINE",
        n_degree,
        a_o_ctrl_pts,
        a_n_knots,
        a_n_weights
    };
};

let f_o_insert = function(
    s_block_name,
    o_vec3_trn,
    o_vec3_scale = f_o_vec3(1, 1, 1),
    n_rotation_deg = 0
){
    return {
        s_type: "INSERT",
        s_block_name,
        o_vec3_trn,
        o_vec3_scale,
        n_rotation_deg
    };
};


let f_o_sketch = function(
    a_o_entity,
    a_o_entity_connection,
    a_o_pointwithrotation_noconnection,
    a_o_vec3_trn,
    a_o_vec3_trn_and_mirrored_aty_axis,
    a_o_vec3_trn_and_mirrored_aty_axis_ordered,
    s_svg_a_a_o_entity_group,
    s_svg_a_a_o_vec3_trn_ordered,
    s_svg_a_a_o_vec3_trn_ordered_mirrored,
    s_svg,
    n_scl_x,
    n_scl_y,
    n_scl_max = null
){
    return {
        a_o_entity,
        a_o_entity_connection,
        a_o_pointwithrotation_noconnection,
        a_o_vec3_trn,
        a_o_vec3_trn_and_mirrored_aty_axis,
        a_o_vec3_trn_and_mirrored_aty_axis_ordered,
        s_svg_a_a_o_entity_group,
        s_svg_a_a_o_vec3_trn_ordered,
        s_svg_a_a_o_vec3_trn_ordered_mirrored,
        s_svg,
        n_scl_x,
        n_scl_y,
        n_scl_max
    }
}

// helper to check if two entities are duplicates
let f_b_entity_duplicate = function(o_a, o_b, n_tolerance = 0.0001){
    if(!o_a || !o_b) return false;
    if(o_a.s_type !== o_b.s_type) return false;

    let f_b_vec3_equal = function(v1, v2){
        if(!v1 || !v2) return false;
        return Math.abs(v1.n_x - v2.n_x) < n_tolerance &&
               Math.abs(v1.n_y - v2.n_y) < n_tolerance &&
               Math.abs((v1.n_z || 0) - (v2.n_z || 0)) < n_tolerance;
    };

    if(o_a.s_type === "LINE"){
        // same direction or reversed
        let b_same = f_b_vec3_equal(o_a.o_vec3_trn_start, o_b.o_vec3_trn_start) &&
                     f_b_vec3_equal(o_a.o_vec3_trn_end, o_b.o_vec3_trn_end);
        let b_reversed = f_b_vec3_equal(o_a.o_vec3_trn_start, o_b.o_vec3_trn_end) &&
                         f_b_vec3_equal(o_a.o_vec3_trn_end, o_b.o_vec3_trn_start);
        return b_same || b_reversed;
    }

    if(o_a.s_type === "ARC"){
        let b_center = f_b_vec3_equal(o_a.o_vec3_trn_center, o_b.o_vec3_trn_center);
        let b_radius = Math.abs(o_a.n_radius - o_b.n_radius) < n_tolerance;
        let b_ang_start = Math.abs(o_a.n_ang_deg_start - o_b.n_ang_deg_start) < 0.01;
        let b_ang_end = Math.abs(o_a.n_ang_deg_end - o_b.n_ang_deg_end) < 0.01;
        return b_center && b_radius && b_ang_start && b_ang_end;
    }

    if(o_a.s_type === "CIRCLE"){
        let b_center = f_b_vec3_equal(o_a.o_vec3_trn_center, o_b.o_vec3_trn_center);
        let b_radius = Math.abs(o_a.n_radius - o_b.n_radius) < n_tolerance;
        return b_center && b_radius;
    }

    return false;
};

// filter out duplicate entities from array
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

let f_a_o_entity_from_o_dxf = function(o_dxf){
    let a_o = [];
    for (const o_ent of o_dxf.entities) {
        // console.log(o_ent)
        let o_ent2 = null;
        if (o_ent.type === "ARC") {

            o_ent2 = f_o_entity(
                "ARC",
                null,  // o_vec3_trn_start (will be computed)
                null,  // o_vec3_trn_end (will be computed)
                o_ent.radius,
                o_ent.startAngle * 180 / Math.PI,  // n_ang_deg_start (dxf-parser returns radians)
                o_ent.endAngle * 180 / Math.PI,    // n_ang_deg_end
                f_o_vec3(
                    o_ent.center.x,
                    o_ent.center.y,
                    o_ent.center.z ?? 0
                )
            );

        }

        else if (o_ent.type === "LINE") {

            o_ent2 = f_o_entity(
                "LINE",
                f_o_vec3(
                    o_ent.vertices[0].x,
                    o_ent.vertices[0].y,
                    o_ent.vertices[0].z ?? 0
                ),
                f_o_vec3(
                    o_ent.vertices[1].x,
                    o_ent.vertices[1].y,
                    o_ent.vertices[1].z ?? 0
                )
            );


        }

        else if (o_ent.type === "CIRCLE") {

            o_ent2 = f_o_entity(
                "CIRCLE",
                null,  // o_vec3_trn_start
                null,  // o_vec3_trn_end
                o_ent.radius,
                null,  // n_ang_deg_start
                null,  // n_ang_deg_end
                f_o_vec3(
                    o_ent.center.x,
                    o_ent.center.y,
                    o_ent.center.z ?? 0
                )
            );

        }
        a_o.push(o_ent2);
    }

    // filter out duplicates (common from CAD exports like Onshape)
    let a_o_deduplicated = f_a_o_entity_deduplicated(a_o);
    if(a_o.length !== a_o_deduplicated.length){
        console.log(`Removed ${a_o.length - a_o_deduplicated.length} duplicate entities`);
    }
    a_o_deduplicated = a_o_deduplicated.filter(o => o !== null);
    return a_o_deduplicated;
}


// let f_o_dxf_from_s_dxf = function(s_dxf){
//     let o_dxf_parser = new DxfParser();
//     let o_dxf = o_dxf_parser.parseSync(s_dxf);

//     return o_dxf;
// }
// let f_o_dxf_from_s_path = async function(s_path){ 
//     let s_dxf = await Deno.readTextFile(s_path);
//     return f_o_dxf_from_s_dxf(s_dxf);
//     return o_dxf;
// }

// let f_o_sketch_from_s_dxf = async function(
//     s_dxf
// ){
//     let o_dxf = await f_o_dxf_from_s_dxf(s_dxf);
//     let a_o_entity = await f_a_o_entity_from_o_dxf(o_dxf);
//     let o_sketch = f_o_sketch_from_a_o_entity(a_o_entity);


//     return o_sketch;
// }
let f_o_sketch_from_o_dxf = async function(o_dxf){
    let a_o_entity = await f_a_o_entity_from_o_dxf(o_dxf);
    
    let o_sketch = f_o_sketch_from_a_o_entity(a_o_entity);
    return o_sketch;
}
let f_o_sketch_from_s_path_dxf = async function(s_path){

    let o_dxf = await f_o_dxf_from_s_path(s_path);
    let a_o_entity = await f_a_o_entity_from_o_dxf(o_dxf);
    let o_sketch = f_o_sketch_from_a_o_entity(a_o_entity);


    return o_sketch;
}

let f_a_o_vec3_ordered_graham_scan = function(a_o_vec3){
    let points = a_o_vec3.map(p => [p.n_x, p.n_y]);
    const ordered = buildSimplePolygon(points);
    return ordered.map(p => f_o_vec3(p[0], p[1], 0));
}

let f_a_o_vec3_trn_orderedaroundcentroid_from_a_o_vec3_trn = function(a_o_vec3_trn) {
  if(!a_o_vec3_trn || a_o_vec3_trn.length === 0){
    return [];
  }
  // centroid
  const center = a_o_vec3_trn.reduce(
    (acc, p) => ({ n_x: acc.n_x + p.n_x, n_y: acc.n_y + p.n_y }),
    { n_x: 0, n_y: 0 }
  );
  center.n_x /= a_o_vec3_trn.length;
  center.n_y /= a_o_vec3_trn.length;
  // sort by angle around centroid
  return [...a_o_vec3_trn].sort((a, b) => {
    const angleA = Math.atan2(a.n_y - center.n_y, a.n_x - center.n_x);
    const angleB = Math.atan2(b.n_y - center.n_y, b.n_x - center.n_x);
    return angleA - angleB;
  });
}


let f_a_a_o_vec3_trn_ordered_mirrored_at_mostleft_axis = function(a_a_o_vec3_trn_ordered){
    // determine the leftmost axis
    // remove all points (but the top and bottom) that are on the leftmost axis,
    // mirror all points but the ones on the leftmost axis
    // all the points should be in order so that the 'outline-path' could be walked

    if(!a_a_o_vec3_trn_ordered || a_a_o_vec3_trn_ordered.length === 0){
        return [];
    }

    let a_a_o_vec3_trn_mirrored = [];
    let n_tolerance = 0.001;

    for(let a_o_vec3_trn of a_a_o_vec3_trn_ordered){
        if(a_o_vec3_trn.length === 0){
            continue;
        }

        // find leftmost x value (this is our mirror axis)
        let n_x_min = Infinity;
        for(let o_vec3 of a_o_vec3_trn){
            if(o_vec3.n_x < n_x_min){
                n_x_min = o_vec3.n_x;
            }
        }

        // separate points into on-axis and off-axis
        let a_o_vec3__on_axis = [];
        let a_o_vec3__off_axis = [];
        let a_n_idx__on_axis = []; // track indices of on-axis points

        for(let n_idx = 0; n_idx < a_o_vec3_trn.length; n_idx++){
            let o_vec3 = a_o_vec3_trn[n_idx];
            let b_on_axis = Math.abs(o_vec3.n_x - n_x_min) < n_tolerance;

            if(b_on_axis){
                a_o_vec3__on_axis.push(o_vec3);
                a_n_idx__on_axis.push(n_idx);
            } else {
                a_o_vec3__off_axis.push(o_vec3);
            }
        }

        // find top and bottom axis points (by y value)
        let o_vec3__axis_top = null;
        let o_vec3__axis_bottom = null;

        if(a_o_vec3__on_axis.length > 0){
            a_o_vec3__on_axis.sort((a, b) => a.n_y - b.n_y);
            o_vec3__axis_bottom = a_o_vec3__on_axis[0];
            o_vec3__axis_top = a_o_vec3__on_axis[a_o_vec3__on_axis.length - 1];
        }

        // create mirrored versions of off-axis points
        // mirror formula: new_x = 2 * axis_x - old_x
        let a_o_vec3__mirrored = [];
        for(let o_vec3 of a_o_vec3__off_axis){
            a_o_vec3__mirrored.push({
                n_x: 2 * n_x_min - o_vec3.n_x,
                n_y: o_vec3.n_y,
                n_z: o_vec3.n_z || 0
            });
        }

        // build the outline path:
        // the original points go from one end to the other (e.g., bottom to top on the right side)
        // to create a closed outline, we:
        // 1. keep all original points (they form one side of the outline)
        // 2. append mirrored off-axis points in reverse order (they form the other side)
        // this creates a continuous path that can be walked as a closed loop

        let a_o_vec3__outline = [];

        // add original points, but filter out intermediate axis points (keep only endpoints)
        for(let n_idx = 0; n_idx < a_o_vec3_trn.length; n_idx++){
            let o_vec3 = a_o_vec3_trn[n_idx];
            let b_on_axis = Math.abs(o_vec3.n_x - n_x_min) < n_tolerance;

            if(b_on_axis){
                // only keep if it's the top or bottom axis point
                let b_is_top = o_vec3__axis_top &&
                    Math.abs(o_vec3.n_y - o_vec3__axis_top.n_y) < n_tolerance;
                let b_is_bottom = o_vec3__axis_bottom &&
                    Math.abs(o_vec3.n_y - o_vec3__axis_bottom.n_y) < n_tolerance;

                if(b_is_top || b_is_bottom){
                    a_o_vec3__outline.push(o_vec3);
                }
                // skip intermediate axis points
            } else {
                a_o_vec3__outline.push(o_vec3);
            }
        }

        // append mirrored points in reverse order to continue the path
        a_o_vec3__mirrored.reverse();
        a_o_vec3__outline.push(...a_o_vec3__mirrored);

        /*
        reason for removing first point
        i looked at the points mirrored svg and could visually debug it. i see that the point wth the index 0 is the most bottom point on the mostleft axis and the mirrored points start with this , but they should not start with this point since when the right side of the profile is 'walked' and when the profile passes throught the leftmost axis this point is there again, so we have duplicate points in the data 
        */
        a_o_vec3__outline.shift();

        a_a_o_vec3_trn_mirrored.push(a_o_vec3__outline);
    }

    return a_a_o_vec3_trn_mirrored;
}

let f_o_sketch_from_a_o_entity = function(
    a_o_entity, 
    n_n_point_per_mm = 1
){

    let a_o_entity_connection = f_a_o_entity_connection_from_a_o_entity(
        a_o_entity
    );
    let a_a_o_entity_group = f_a_a_o_entity_group_from_a_o_entity(
        a_o_entity
    );

    let s_svg_a_a_o_entity_group = f_s_svg_from_a_a_o_entity_group(a_a_o_entity_group, 1);

    let a_a_o_vec3_trn_ordered = f_a_a_o_vec3_trn_ordered(a_a_o_entity_group);
    let s_svg_a_a_o_vec3_trn_ordered = f_s_svg_from_a_a_o_vec3_trn_ordered(a_a_o_vec3_trn_ordered);


    let a_a_o_vec3_trn_ordered__mirrored = f_a_a_o_vec3_trn_ordered_mirrored_at_mostleft_axis(
        a_a_o_vec3_trn_ordered
    );

    let s_svg_a_a_o_vec3_trn_ordered_mirrored = f_s_svg_from_a_a_o_vec3_trn_ordered(
        a_a_o_vec3_trn_ordered__mirrored
    );

    // //end points with no connections
    // let a_o_pointwithrotation_noconnection = [];

    // // Collect all connected points from the connections
    // let a_o_vec3_connected = a_o_entity_connection.map(
    //     o_conn => o_conn.o_trn_vec3_connected
    // );

    // for(let o_entity of a_o_entity){
    //     // only LINE and ARC have start/end points
    //     if(o_entity.s_type !== "LINE" && o_entity.s_type !== "ARC"){
    //         continue;
    //     }

    //     // Check start point
    //     let b_start_connected = a_o_vec3_connected.some(
    //         o_vec3 => f_b_vec3_equal(o_vec3, o_entity.o_vec3_trn_start)
    //     );

    //     if(!b_start_connected){
    //         // Get outward rotation at start point
    //         // For arc: tangent is perpendicular to radius, so +90 for CCW direction
    //         // At start, outward means backward (opposite of arc direction) = radius - 90
    //         let n_rotation_deg = (o_entity.s_type === "LINE")
    //             ? o_entity.n_rotation_deg_start + 180  // opposite of line direction
    //             : o_entity.n_ang_deg_start - 90;       // arc tangent pointing backward
    //         a_o_pointwithrotation_noconnection.push(
    //             f_o_pointwithrotation(o_entity.o_vec3_trn_start, n_rotation_deg)
    //         );
    //     }

    //     // Check end point
    //     let b_end_connected = a_o_vec3_connected.some(
    //         o_vec3 => f_b_vec3_equal(o_vec3, o_entity.o_vec3_trn_end)
    //     );

    //     if(!b_end_connected){
    //         // Get outward rotation at end point
    //         // For arc: tangent is perpendicular to radius
    //         // At end, outward means forward (continuing past the arc) = radius + 90
    //         let n_rotation_deg = (o_entity.s_type === "LINE")
    //             ? o_entity.n_rotation_deg_start  // line direction
    //             : o_entity.n_ang_deg_end + 90;   // arc tangent pointing forward
    //         a_o_pointwithrotation_noconnection.push(
    //             f_o_pointwithrotation(o_entity.o_vec3_trn_end, n_rotation_deg)
    //         );
    //     }
    // }


    // calculate the width and height of the sketch
    let o_vec3_max_x = a_o_vec3_trn.reduce((acc, o_vec3) => o_vec3.n_x > acc.n_x ? o_vec3 : acc, f_o_vec3(-Infinity, 0, 0));
    let o_vec3_min_x = a_o_vec3_trn.reduce((acc, o_vec3) => o_vec3.n_x < acc.n_x ? o_vec3 : acc, f_o_vec3(Infinity, 0, 0));
    let o_vec3_max_y = a_o_vec3_trn.reduce((acc, o_vec3) => o_vec3.n_y > acc.n_y ? o_vec3 : acc, f_o_vec3(0, -Infinity, 0));
    let o_vec3_min_y = a_o_vec3_trn.reduce((acc, o_vec3) => o_vec3.n_y < acc.n_y ? o_vec3 : acc, f_o_vec3(0, Infinity, 0));
    let n_scl_x = o_vec3_max_x.n_x - o_vec3_min_x.n_x;
    let n_scl_y = o_vec3_max_y.n_y - o_vec3_min_y.n_y;
    let n_scl_max = Math.max(n_scl_x, n_scl_y)

    let s_svg = f_s_svg_from_params(
        a_o_entity,
        a_o_entity_connection,
        a_o_pointwithrotation_noconnection,
        a_o_vec3_trn,
        n_scl_max
    );
    let a_o_vec3_ordered = f_a_o_vec3_ordered_graham_scan(a_o_vec3_trn_and_mirrored_aty_axis)

    return f_o_sketch(
        a_o_entity,
        a_o_entity_connection,
        a_o_pointwithrotation_noconnection,
        a_o_vec3_trn,
        a_o_vec3_trn_and_mirrored_aty_axis,
        a_o_vec3_trn_and_mirrored_aty_axis_ordered,
        s_svg_a_a_o_entity_group,
        s_svg_a_a_o_vec3_trn_ordered,
        s_svg_a_a_o_vec3_trn_ordered_mirrored,
        s_svg,
        n_scl_x,
        n_scl_y,
        n_scl_max
    )

}


let f_o_bbox_init = () => ({
    min_x:  Infinity,
    min_y:  Infinity,
    max_x: -Infinity,
    max_y: -Infinity
});

let f_update_bbox = (o_bbox, x, y) => {
    o_bbox.min_x = Math.min(o_bbox.min_x, x);
    o_bbox.min_y = Math.min(o_bbox.min_y, y);
    o_bbox.max_x = Math.max(o_bbox.max_x, x);
    o_bbox.max_y = Math.max(o_bbox.max_y, y);
};

let f_o_point_from_arc = function(o_arc, n_ang_deg){
    let a = n_ang_deg * Math.PI / 180;
    return {
        x: o_arc.o_vec3_trn.n_x + o_arc.n_radius * Math.cos(a),
        y: o_arc.o_vec3_trn.n_y + o_arc.n_radius * Math.sin(a)
    };
};

let f_s_svg_from_params = function(
    a_o_entity,
    a_o_entity_connection,
    a_o_pointwithrotation_noconnection,
    a_o_vec3_trn,
    n_scl_max,
    o_options = {}
){
    // options with defaults
    let b_entity = o_options.b_entity !== undefined ? o_options.b_entity : true;
    let b_point = o_options.b_point !== undefined ? o_options.b_point : true;
    let b_angle = o_options.b_angle !== undefined ? o_options.b_angle : true;
    let b_bbox = o_options.b_bbox !== undefined ? o_options.b_bbox : true;
    let b_legend = o_options.b_legend !== undefined ? o_options.b_legend : true;
    let n_base_size = o_options.n_base_size !== undefined ? o_options.n_base_size : 2;

    // color scheme with 0.8 opacity
    let s_color__entity = "rgba(0, 180, 0, 0.8)";       // green for entities
    let s_color__point = "rgba(220, 0, 0, 0.8)";        // red for points
    let s_color__angle = "rgba(0, 100, 255, 0.8)";      // blue for angles
    let s_color__angle_tangent = "rgba(0, 200, 100, 0.8)"; // lighter for tangent
    let n_font_factor = 5; // font is 5x base size

    let a_s_svg = [];
    let o_bbox = f_o_bbox_init();

    // first pass: calculate bbox
    for (const o_line of a_o_entity.filter(o => o.s_type === "LINE")) {
        f_update_bbox(o_bbox, o_line.o_vec3_trn_start.n_x, o_line.o_vec3_trn_start.n_y);
        f_update_bbox(o_bbox, o_line.o_vec3_trn_end.n_x, o_line.o_vec3_trn_end.n_y);
    }
    for (const o_circle of a_o_entity.filter(o => o.s_type === "CIRCLE")) {
        let cx = o_circle.o_vec3_trn.n_x;
        let cy = o_circle.o_vec3_trn.n_y;
        let r  = o_circle.n_radius;
        f_update_bbox(o_bbox, cx - r, cy - r);
        f_update_bbox(o_bbox, cx + r, cy + r);
    }
    for (const o_arc of a_o_entity.filter(o => o.s_type === "ARC")) {
        let p_start = f_o_point_from_arc(o_arc, o_arc.n_ang_deg_start);
        let p_end   = f_o_point_from_arc(o_arc, o_arc.n_ang_deg_end);
        f_update_bbox(o_bbox, p_start.x, p_start.y);
        f_update_bbox(o_bbox, p_end.x, p_end.y);
    }
    for (const o_vec3 of a_o_vec3_trn) {
        f_update_bbox(o_bbox, o_vec3.n_x, o_vec3.n_y);
    }

    // calculate sizes based on bbox and base_size
    let n_bbox_size = Math.max(o_bbox.max_x - o_bbox.min_x, o_bbox.max_y - o_bbox.min_y) || 100;
    let n_unit = n_bbox_size * 0.01;
    let n_stroke = n_unit * n_base_size * 0.5;
    let n_marker_size = n_unit * n_base_size * 2;
    let n_font_size = n_unit * n_base_size * n_font_factor;

    // ENTITIES (green) - lines, arcs, circles
    if (b_entity) {
        for (const o_line of a_o_entity.filter(o => o.s_type === "LINE")) {
            let x1 = o_line.o_vec3_trn_start.n_x;
            let y1 = o_line.o_vec3_trn_start.n_y;
            let x2 = o_line.o_vec3_trn_end.n_x;
            let y2 = o_line.o_vec3_trn_end.n_y;

            a_s_svg.push(
                `<line x1="${x1}" y1="${-y1}" x2="${x2}" y2="${-y2}" ` +
                `stroke="${s_color__entity}" stroke-width="${n_stroke}" fill="none" />`
            );
        }

        for (const o_circle of a_o_entity.filter(o => o.s_type === "CIRCLE")) {
            let cx = o_circle.o_vec3_trn.n_x;
            let cy = o_circle.o_vec3_trn.n_y;
            let r  = o_circle.n_radius;

            a_s_svg.push(
                `<circle cx="${cx}" cy="${-cy}" r="${r}" ` +
                `stroke="${s_color__entity}" stroke-width="${n_stroke}" fill="none" />`
            );
        }

        for (const o_arc of a_o_entity.filter(o => o.s_type === "ARC")) {
            let p_start = f_o_point_from_arc(o_arc, o_arc.n_ang_deg_start);
            let p_end   = f_o_point_from_arc(o_arc, o_arc.n_ang_deg_end);

            let n_deg__sweep = o_arc.n_ang_deg_end - o_arc.n_ang_deg_start;
            if (n_deg__sweep < 0) n_deg__sweep += 360;

            let n_flag__large_arc = n_deg__sweep > 180 ? 1 : 0;
            let n_flag__sweep = 0;

            a_s_svg.push(
                `<path d="M ${p_start.x} ${-p_start.y} ` +
                `A ${o_arc.n_radius} ${o_arc.n_radius} 0 ` +
                `${n_flag__large_arc} ${n_flag__sweep} ` +
                `${p_end.x} ${-p_end.y}" ` +
                `stroke="${s_color__entity}" stroke-width="${n_stroke}" fill="none" />`
            );
        }
    }

    // ANGLES (blue) - triangles at entity connection points
    if (b_angle) {
        for (const o_entity_connection of a_o_entity_connection) {
            let cx = o_entity_connection.o_trn_vec3_connected.n_x;
            let cy = -o_entity_connection.o_trn_vec3_connected.n_y;

            let o_vec3_dir1 = f_o_vec3_direction_at_connection(o_entity_connection.o_entity_a, o_entity_connection.o_trn_vec3_connected);
            let o_vec3_dir2 = f_o_vec3_direction_at_connection(o_entity_connection.o_entity_b, o_entity_connection.o_trn_vec3_connected);

            let avg_x = (o_vec3_dir1.n_x + o_vec3_dir2.n_x) / 2;
            let avg_y = (o_vec3_dir1.n_y + o_vec3_dir2.n_y) / 2;
            let avg_len = Math.sqrt(avg_x * avg_x + avg_y * avg_y);
            if (avg_len > 0.0001) {
                avg_x /= avg_len;
                avg_y /= avg_len;
            }

            let n_rotation_deg = Math.atan2(-avg_y, avg_x) * 180 / Math.PI;
            let s_color = o_entity_connection.b_tangent ? s_color__angle_tangent : s_color__angle;

            a_s_svg.push(
                `<polygon points="${-n_marker_size},${-n_marker_size/2} ${-n_marker_size},${n_marker_size/2} ${n_marker_size},0" ` +
                `transform="translate(${cx},${cy}) rotate(${n_rotation_deg})" ` +
                `fill="${s_color}" stroke="rgba(0,0,0,0.5)" stroke-width="${n_stroke * 0.5}" />`
            );
        }

        // ANGLES (blue) - arrows at unconnected points
        for (const o_pointwithrotation of a_o_pointwithrotation_noconnection) {
            let cx = o_pointwithrotation.o_vec3.n_x;
            let cy = -o_pointwithrotation.o_vec3.n_y;
            let n_rotation_deg = -o_pointwithrotation.n_rotation_deg;

            let n_arrow_length = n_marker_size * 2;
            let n_arrow_width = n_marker_size * 0.3;
            let n_head_length = n_marker_size * 0.8;
            let n_head_width = n_marker_size * 0.6;

            a_s_svg.push(
            `<g transform="translate(${cx},${cy}) rotate(${n_rotation_deg})">` +
            `<line x1="0" y1="0" x2="${n_arrow_length - n_head_length}" y2="0" ` +
            `stroke="${s_color__angle}" stroke-width="${n_arrow_width}" />` +
            `<polygon points="${n_arrow_length - n_head_length},${-n_head_width} ${n_arrow_length - n_head_length},${n_head_width} ${n_arrow_length},0" ` +
            `fill="${s_color__angle}" />` +
            `</g>`
            );
        }
    }

    // POINTS (red) - with index numbers
    if (b_point) {
        for(let n_idx = 0; n_idx < a_o_vec3_trn.length; n_idx++){
            let o_vec3 = a_o_vec3_trn[n_idx];
            let cx = o_vec3.n_x;
            let cy = -o_vec3.n_y;

            a_s_svg.push(
                `<circle cx="${cx}" cy="${cy}" r="${n_marker_size * 0.4}" ` +
                `stroke="rgba(0,0,0,0.5)" stroke-width="${n_stroke * 0.5}" fill="${s_color__point}" />`
            );
            a_s_svg.push(
                `<text x="${cx + n_marker_size * 0.5}" y="${cy - n_marker_size * 0.3}" ` +
                `font-size="${n_font_size}" font-family="sans-serif" font-weight="bold" ` +
                `fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.6)" stroke-width="${n_font_size*0.05}">${n_idx}</text>`
            );
        }
    }

    let n_scl_x = o_bbox.max_x - o_bbox.min_x;
    let n_scl_y = o_bbox.max_y - o_bbox.min_y;
    let n_pad = Math.max(n_scl_x, n_scl_y) * 0.05 || 5;

    // BOUNDING BOX visualization (dashed rectangle) - conditional
    let s_bbox_svg = '';
    if (b_bbox) {
        s_bbox_svg = `
            <rect x="${o_bbox.min_x}" y="${-o_bbox.max_y}"
                  width="${n_scl_x}" height="${n_scl_y}"
                  fill="none" stroke="rgba(128,128,128,0.3)" stroke-width="${n_stroke * 0.5}"
                  stroke-dasharray="${n_stroke * 2} ${n_stroke * 2}" />`;
    }

    // LEGEND - positioned to the LEFT of the bounding box - conditional
    let n_legend_spacing = n_font_size * 1.5;
    let n_legend_marker = n_font_size * 0.6;
    let n_legend_scl_x = n_font_size * 8;
    let n_legend_scl_y = n_legend_spacing * 3.5;
    let n_legend_gap = n_pad * 2;

    // legend positioned to the left of bbox
    let n_legend_x = o_bbox.min_x - n_legend_gap - n_legend_scl_x + n_legend_marker;
    let n_legend_y = -o_bbox.max_y;

    let s_legend_svg = '';
    if (b_legend) {
        s_legend_svg = `
            <g class="legend" font-family="sans-serif" font-size="${n_font_size * 0.8}">
                <rect x="${n_legend_x - n_legend_marker}" y="${n_legend_y - n_legend_marker}"
                      width="${n_legend_scl_x}" height="${n_legend_scl_y}"
                      fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.3)" stroke-width="${n_stroke * 0.5}" rx="${n_stroke}"/>
                <line x1="${n_legend_x}" y1="${n_legend_y + n_legend_spacing * 0.5}"
                      x2="${n_legend_x + n_legend_marker * 2}" y2="${n_legend_y + n_legend_spacing * 0.5}"
                      stroke="${s_color__entity}" stroke-width="${n_stroke}" />
                <text x="${n_legend_x + n_legend_marker * 2.5}" y="${n_legend_y + n_legend_spacing * 0.7}" fill="rgba(0,0,0,0.8)">Entities</text>
                <circle cx="${n_legend_x + n_legend_marker}" cy="${n_legend_y + n_legend_spacing * 1.5}" r="${n_legend_marker * 0.5}"
                        fill="${s_color__point}" stroke="rgba(0,0,0,0.5)" stroke-width="${n_stroke * 0.3}"/>
                <text x="${n_legend_x + n_legend_marker * 2.5}" y="${n_legend_y + n_legend_spacing * 1.7}" fill="rgba(0,0,0,0.8)">Points</text>
                <polygon points="${n_legend_x},${n_legend_y + n_legend_spacing * 2.3} ${n_legend_x},${n_legend_y + n_legend_spacing * 2.7} ${n_legend_x + n_legend_marker * 2},${n_legend_y + n_legend_spacing * 2.5}"
                         fill="${s_color__angle}" stroke="rgba(0,0,0,0.5)" stroke-width="${n_stroke * 0.3}"/>
                <text x="${n_legend_x + n_legend_marker * 2.5}" y="${n_legend_y + n_legend_spacing * 2.7}" fill="rgba(0,0,0,0.8)">Angles</text>
            </g>`;
    }

    // viewBox - adjust based on whether legend is shown
    let n_viewbox_x = b_legend ? (n_legend_x - n_legend_marker - n_pad) : (o_bbox.min_x - n_pad);
    let n_viewbox_y = -(o_bbox.max_y + n_pad);
    let n_viewbox_scl_x = (o_bbox.max_x + n_pad) - n_viewbox_x;
    let n_viewbox_scl_y = n_scl_y + n_pad * 2;

    let s_viewbox = `${n_viewbox_x} ${n_viewbox_y} ${n_viewbox_scl_x} ${n_viewbox_scl_y}`;

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" ` +
        `width="100%" height="100%" ` +
        `viewBox="${s_viewbox}" stroke-linecap="round" preserveAspectRatio="xMidYMid meet">` +
        s_bbox_svg +
        a_s_svg.join("\n") +
        s_legend_svg +
        `</svg>`
    );
};

let f_a_o_entity_connection_from_a_o_entity = function(
    a_o_entity
){
    let a_o_entity_connection = [];
    for(let o_ent of a_o_entity){
        // only LINE and ARC have start/end points
        if(o_ent.s_type !== "LINE" && o_ent.s_type !== "ARC"){continue;}
        for(let o_ent2 of a_o_entity){

            if(o_ent === o_ent2){continue;}

            // only LINE and ARC have start/end points
            if(o_ent2.s_type !== "LINE" && o_ent2.s_type !== "ARC"){continue;}

            // Check if this pair already has a connection recorded (in either order)
            let b_pair_already_exists = a_o_entity_connection.some(o_entity_connection =>
                (o_entity_connection.o_entity_a === o_ent && o_entity_connection.o_entity_b === o_ent2) ||
                (o_entity_connection.o_entity_a === o_ent2 && o_entity_connection.o_entity_b === o_ent)
            );
            
            if(b_pair_already_exists){continue;}

            // check if start or end point is same
            let b_connected = false;
            let o_trn_vec3_connected = null;
            let b_tangent = false; 

            let n_tolerance = 0.0001;  // or whatever precision you need

            let b_start1_eq_start2 = 
                Math.abs(o_ent.o_vec3_trn_start.n_x - o_ent2.o_vec3_trn_start.n_x) < n_tolerance &&
                Math.abs(o_ent.o_vec3_trn_start.n_y - o_ent2.o_vec3_trn_start.n_y) < n_tolerance &&
                Math.abs(o_ent.o_vec3_trn_start.n_z - o_ent2.o_vec3_trn_start.n_z) < n_tolerance;

            let b_start1_eq_end2 = 
                Math.abs(o_ent.o_vec3_trn_start.n_x - o_ent2.o_vec3_trn_end.n_x) < n_tolerance &&
                Math.abs(o_ent.o_vec3_trn_start.n_y - o_ent2.o_vec3_trn_end.n_y) < n_tolerance &&
                Math.abs(o_ent.o_vec3_trn_start.n_z - o_ent2.o_vec3_trn_end.n_z) < n_tolerance;

            let b_end1_eq_start2 = 
                Math.abs(o_ent.o_vec3_trn_end.n_x - o_ent2.o_vec3_trn_start.n_x) < n_tolerance &&
                Math.abs(o_ent.o_vec3_trn_end.n_y - o_ent2.o_vec3_trn_start.n_y) < n_tolerance &&
                Math.abs(o_ent.o_vec3_trn_end.n_z - o_ent2.o_vec3_trn_start.n_z) < n_tolerance;

            let b_end1_eq_end2 = 
                Math.abs(o_ent.o_vec3_trn_end.n_x - o_ent2.o_vec3_trn_end.n_x) < n_tolerance &&
                Math.abs(o_ent.o_vec3_trn_end.n_y - o_ent2.o_vec3_trn_end.n_y) < n_tolerance &&
                Math.abs(o_ent.o_vec3_trn_end.n_z - o_ent2.o_vec3_trn_end.n_z) < n_tolerance;

            // Then check connections
            if(b_start1_eq_start2){
                b_connected = true;
                o_trn_vec3_connected = o_ent.o_vec3_trn_start;
            }
            else if(b_start1_eq_end2){
                b_connected = true;
                o_trn_vec3_connected = o_ent.o_vec3_trn_start;
            }
            else if(b_end1_eq_start2){
                o_trn_vec3_connected = o_ent.o_vec3_trn_end;
                b_connected = true;
            }
            else if(b_end1_eq_end2){
                o_trn_vec3_connected = o_ent.o_vec3_trn_end;
                b_connected = true;
            }

            let n_ang_rad_between_entities = null;

            if(b_connected){
                // get direction vectors at connection point for both entities
                let o_vec3_dir1 = f_o_vec3_direction_at_connection(o_ent, o_trn_vec3_connected);
                let o_vec3_dir2 = f_o_vec3_direction_at_connection(o_ent2, o_trn_vec3_connected);

                let n_dot = f_n_dot_from_o_vec3(o_vec3_dir1, o_vec3_dir2);
                // clamp to [-1, 1] to avoid NaN from acos due to floating point errors
                n_dot = Math.max(-1, Math.min(1, n_dot));
                n_ang_rad_between_entities = Math.acos(n_dot);

                // tangent if angle is 0 or PI (directions same or opposite)
                if(Math.abs(n_ang_rad_between_entities) < 0.0001 || Math.abs(n_ang_rad_between_entities - Math.PI) < 0.0001){
                    b_tangent = true;
                }
                let n_ang_deg_z1 = Math.atan2(o_vec3_dir1.n_y, o_vec3_dir1.n_x) * 180 / Math.PI;
                let n_ang_deg_z2 = Math.atan2(o_vec3_dir2.n_y, o_vec3_dir2.n_x) * 180 / Math.PI;


                a_o_entity_connection.push(
                    f_o_entity_connection(
                        o_ent,
                        o_ent2,
                        o_vec3_dir1,
                        o_vec3_dir2,
                        n_ang_deg_z1,
                        n_ang_deg_z2,
                        o_trn_vec3_connected,
                        b_tangent,
                        n_ang_rad_between_entities
                    )
                );
            }
            
        }
        
    }
    return a_o_entity_connection;
}

let f_o_vec3_trn_from_o_entity = function(o_ent, n_point_per_mm = 10){
    // checks how long the distance of the entity is (line, arc, circle)
    // calculates number of points based on n_point_per_mm
    // returns array of o_vec3 points along the entity
    let a_o_vec3_trn = [];
    if(o_ent.s_type === "LINE"){
        let n_len = f_n_len_from_o_vec3(
            f_o_vec3(
                o_ent.o_vec3_trn_end.n_x - o_ent.o_vec3_trn_start.n_x,
                o_ent.o_vec3_trn_end.n_y - o_ent.o_vec3_trn_start.n_y,
                o_ent.o_vec3_trn_end.n_z - o_ent.o_vec3_trn_start.n_z
            )
        );
        let n_cnt__point = Math.max(2, Math.ceil(n_len * n_point_per_mm));
        for(let n_it = 0; n_it < n_cnt__point; n_it++){
            let n_it_nor = n_it / (n_cnt__point - 1);
            a_o_vec3_trn.push(
                f_o_vec3(
                    o_ent.o_vec3_trn_start.n_x + n_it_nor * (o_ent.o_vec3_trn_end.n_x - o_ent.o_vec3_trn_start.n_x),
                    o_ent.o_vec3_trn_start.n_y + n_it_nor * (o_ent.o_vec3_trn_end.n_y - o_ent.o_vec3_trn_start.n_y),
                    o_ent.o_vec3_trn_start.n_z + n_it_nor * (o_ent.o_vec3_trn_end.n_z - o_ent.o_vec3_trn_start.n_z)
                )
            );
        }
    } else if(o_ent.s_type === "ARC"){
        let n_sweep_rad = o_ent.n_ang_rad_end - o_ent.n_ang_rad_start;
        if(n_sweep_rad < 0){
            n_sweep_rad += Math.PI * 2;
        }
        let n_arc_length = n_sweep_rad * o_ent.n_radius;
        let n_cnt__point = Math.max(2, Math.ceil(n_arc_length * n_point_per_mm));
        for(let n_it = 0; n_it < n_cnt__point; n_it++){
            let n_it_nor = n_it / (n_cnt__point - 1);
            let n_ang_rad = o_ent.n_ang_rad_start + n_it_nor * n_sweep_rad;
            a_o_vec3_trn.push(
                f_o_vec3(
                    o_ent.o_vec3_trn.n_x + o_ent.n_radius * Math.cos(n_ang_rad),
                    o_ent.o_vec3_trn.n_y + o_ent.n_radius * Math.sin(n_ang_rad),
                    o_ent.o_vec3_trn.n_z
                )
            );
        }
    } else if(o_ent.s_type === "CIRCLE"){
        let n_circumference = 2 * Math.PI * o_ent.n_radius;
        let n_cnt__point = Math.max(3, Math.ceil(n_circumference * n_point_per_mm));
        for(let n_it = 0; n_it < n_cnt__point; n_it++){
            let n_it_nor = n_it / n_cnt__point;
            let n_ang_rad = n_it_nor * Math.PI * 2;
            a_o_vec3_trn.push(
                f_o_vec3(
                    o_ent.o_vec3_trn.n_x + o_ent.n_radius * Math.cos(n_ang_rad),
                    o_ent.o_vec3_trn.n_y + o_ent.n_radius * Math.sin(n_ang_rad),
                    o_ent.o_vec3_trn.n_z
                )
            );
        }
    }
    return a_o_vec3_trn;   
}

let f_o_vec3_trn_from_a_o_entity = function(
    a_o_entity
){
    let a_o_vec3_trn = [];
    for(let o_ent of a_o_entity){
        let a_o_vec3_trn2 = f_o_vec3_trn_from_o_entity(o_ent, 1);
        a_o_vec3_trn.push(...a_o_vec3_trn2);
    }
    return a_o_vec3_trn;
}

let f_a_o_vec3_trn_from_o_entity_directed = function(o_ent, b_reversed, n_point_per_mm = 1){
    let a_o_vec3_trn = [];

    if(o_ent.s_type === "LINE"){
        let n_len = f_n_len_from_o_vec3(
            f_o_vec3(
                o_ent.o_vec3_trn_end.n_x - o_ent.o_vec3_trn_start.n_x,
                o_ent.o_vec3_trn_end.n_y - o_ent.o_vec3_trn_start.n_y,
                o_ent.o_vec3_trn_end.n_z - o_ent.o_vec3_trn_start.n_z
            )
        );
        let n_cnt__point = Math.max(2, Math.ceil(n_len * n_point_per_mm));

        let o_start = b_reversed ? o_ent.o_vec3_trn_end : o_ent.o_vec3_trn_start;
        let o_end = b_reversed ? o_ent.o_vec3_trn_start : o_ent.o_vec3_trn_end;

        for(let n_it = 0; n_it < n_cnt__point; n_it++){
            let n_it_nor = n_it / (n_cnt__point - 1);
            a_o_vec3_trn.push(
                f_o_vec3(
                    o_start.n_x + n_it_nor * (o_end.n_x - o_start.n_x),
                    o_start.n_y + n_it_nor * (o_end.n_y - o_start.n_y),
                    o_start.n_z + n_it_nor * (o_end.n_z - o_start.n_z)
                )
            );
        }
    }
    else if(o_ent.s_type === "ARC"){
        let n_sweep_rad = o_ent.n_ang_rad_end - o_ent.n_ang_rad_start;
        if(n_sweep_rad < 0){
            n_sweep_rad += Math.PI * 2;
        }
        let n_arc_length = n_sweep_rad * o_ent.n_radius;
        let n_cnt__point = Math.max(2, Math.ceil(n_arc_length * n_point_per_mm));

        for(let n_it = 0; n_it < n_cnt__point; n_it++){
            let n_it_nor = n_it / (n_cnt__point - 1);
            let n_ang_rad;
            if(b_reversed){
                // traverse from end to start (clockwise)
                n_ang_rad = o_ent.n_ang_rad_end - n_it_nor * n_sweep_rad;
            } else {
                // traverse from start to end (counter-clockwise)
                n_ang_rad = o_ent.n_ang_rad_start + n_it_nor * n_sweep_rad;
            }
            a_o_vec3_trn.push(
                f_o_vec3(
                    o_ent.o_vec3_trn.n_x + o_ent.n_radius * Math.cos(n_ang_rad),
                    o_ent.o_vec3_trn.n_y + o_ent.n_radius * Math.sin(n_ang_rad),
                    o_ent.o_vec3_trn.n_z
                )
            );
        }
    }

    return a_o_vec3_trn;
}

let f_a_o_vec3_trn_ordered_from_params = function(
    a_o_entity, 
    a_o_entity_connection, 
    n_point_per_mm = 1
){
    a_o_entity = a_o_entity.filter(e => e && e.o_vec3_trn_start && e.o_vec3_trn_end);

    if(a_o_entity.length === 0){
        return [];
    }

    // build connection count per entity to find endpoints
    let o_entity_connection_count = new Map();
    for(let o_ent of a_o_entity){
        o_entity_connection_count.set(o_ent, 0);
    }
    for(let o_entity_connection of a_o_entity_connection){
        o_entity_connection_count.set(o_entity_connection.o_entity_a, o_entity_connection_count.get(o_entity_connection.o_entity_a) + 1);
        o_entity_connection_count.set(o_entity_connection.o_entity_b, o_entity_connection_count.get(o_entity_connection.o_entity_b) + 1);
    }

    // find starting entity (one with only 1 connection = endpoint)
    // if all have 2 connections (closed loop), just pick the first
    let o_start_entity = null;
    for(let [o_ent, n_count] of o_entity_connection_count){
        if(n_count === 1){
            o_start_entity = o_ent;
            break;
        }
    }
    if(!o_start_entity){
        o_start_entity = a_o_entity[0]; // closed loop, pick any
    }

    // walk through the chain
    let a_o_ordered_entities = [];
    let a_b_reversed = [];
    let o_visited = new Set();
    let o_current = o_start_entity;
    let o_prev_endpoint = null; // track which endpoint we came from

    // for start entity, determine initial direction
    // check which endpoint has a connection
    let a_start_connections = a_o_entity_connection.filter(d => d.o_entity_a === o_current || d.o_entity_b === o_current);
    if(a_start_connections.length > 0){
        let o_conn_point = a_start_connections[0].o_trn_vec3_connected;
        // if connected at start, traverse forward (start->end)
        // if connected at end, traverse reversed (end->start)
        let b_connected_at_start = f_b_vec3_equal(o_conn_point, o_current.o_vec3_trn_start);
        // we want to start from the unconnected end, so:
        // if connected at start, we traverse reversed (from end to start, ending at connection)
        // if connected at end, we traverse forward (from start to end, ending at connection)
        let b_reversed = b_connected_at_start;
        a_o_ordered_entities.push(o_current);
        a_b_reversed.push(b_reversed);
        o_prev_endpoint = b_reversed ? o_current.o_vec3_trn_start : o_current.o_vec3_trn_end;
    } else {
        // no connections, just add as-is
        a_o_ordered_entities.push(o_current);
        a_b_reversed.push(false);
        o_prev_endpoint = o_current.o_vec3_trn_end;
    }
    o_visited.add(o_current);

    // follow connections
    while(true){
        // find connection from current endpoint
        let o_entity_connection__next = null;
        for(let o_entity_connection of a_o_entity_connection){
            if(o_visited.has(o_entity_connection.o_entity_a) && o_visited.has(o_entity_connection.o_entity_b)){
                continue;
            }
            if(f_b_vec3_equal(o_entity_connection.o_trn_vec3_connected, o_prev_endpoint)){
                o_entity_connection__next = o_entity_connection;
                break;
            }
        }

        if(!o_entity_connection__next){
            break; // no more connections
        }

        // determine next entity
        let o_next = o_visited.has(o_entity_connection__next.o_entity_a) ? o_entity_connection__next.o_entity_b : o_entity_connection__next.o_entity_a;

        // determine direction for next entity
        // if connected at its start, traverse forward
        // if connected at its end, traverse reversed
        let b_connected_at_start = f_b_vec3_equal(o_entity_connection__next.o_trn_vec3_connected, o_next.o_vec3_trn_start);
        let b_reversed = !b_connected_at_start; // if connected at start, go forward; if at end, go reversed

        a_o_ordered_entities.push(o_next);
        a_b_reversed.push(b_reversed);
        o_visited.add(o_next);

        // update endpoint for next iteration
        o_prev_endpoint = b_reversed ? o_next.o_vec3_trn_start : o_next.o_vec3_trn_end;
    }

    // generate points in order
    let a_o_vec3_trn = [];
    for(let n_it = 0; n_it < a_o_ordered_entities.length; n_it++){
        let a_o_point = f_a_o_vec3_trn_from_o_entity_directed(a_o_ordered_entities[n_it], a_b_reversed[n_it], n_point_per_mm);
        // skip first point of subsequent entities (it's the same as last point of previous)
        if(n_it > 0 && a_o_point.length > 0){
            a_o_point = a_o_point.slice(1);
        }
        a_o_vec3_trn.push(...a_o_point);
    }

    return a_o_vec3_trn;
}

// SCAD generation functions are now in scad_generation.module.h.js
// Imported: f_s_scad_path_sweep_sketch, f_s_scad_profile_functions_from_o_sketch,
//           f_s_scad_cylindric_sweep, f_s_scad_button_generator

// Generate SVG from sketch object with options
let f_s_svg_from_o_sketch = function(o_sketch, o_options = {}) {
    return f_s_svg_from_params(
        o_sketch.a_o_entity,
        o_sketch.a_o_entity_connection,
        o_sketch.a_o_pointwithrotation_noconnection,
        o_sketch.a_o_vec3_trn,
        o_sketch.n_scl_max,
        o_options
    );
};

export {
    f_o_vec3,
    f_o_entity,
    f_o_point,
    f_o_text,
    f_o_lwpoly_vertex,
    f_o_lwpolyline,
    f_o_ellipse,
    f_o_spline,
    f_o_insert,
    f_o_sketch,
    f_o_sketch_from_s_path_dxf,
    f_o_sketch_from_a_o_entity, 
    f_o_sketch_from_o_dxf,
    f_o_entity_connection,
    f_a_o_entity_connection_from_a_o_entity,
    f_o_vec3_trn_from_o_entity,
    f_o_vec3_trn_from_a_o_entity,
    f_a_o_vec3_trn_from_o_entity_directed,
    f_a_o_vec3_trn_ordered_from_params,
    f_s_scad_profile_functions_from_o_sketch,
    f_s_scad_path_sweep_sketch,
    f_s_scad_cylindric_sweep,
    f_s_scad_button_generator,
    f_s_svg_from_o_sketch
}