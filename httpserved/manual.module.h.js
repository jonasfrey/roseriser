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
let f_o_pointwithrotation = function(
    o_vec3, 
    n_rotation_deg
){
    return {
        o_vec3, 
        n_rotation_deg
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
const O_VEC3_Z_UP = f_o_vec3(0, 0, 1);

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
        s_svg,
        n_scl_x,
        n_scl_y,
        n_scl_max
    }
}
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

    return a_o;
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

let f_o_sketch_from_a_o_entity = function(
    a_o_entity, 
    n_points_per_mm = 1
){

    let a_o_entity_connection = f_a_o_entity_connection_from_a_o_entity(
        a_o_entity
    );
    
    //end points with no connections
    let a_o_pointwithrotation_noconnection = [];

    // Collect all connected points from the connections
    let a_o_vec3_connected = a_o_entity_connection.map(
        o_conn => o_conn.o_trn_vec3_connected
    );

    for(let o_entity of a_o_entity){
        // only LINE and ARC have start/end points
        if(o_entity.s_type !== "LINE" && o_entity.s_type !== "ARC"){
            continue;
        }

        // Check start point
        let b_start_connected = a_o_vec3_connected.some(
            o_vec3 => f_b_vec3_equal(o_vec3, o_entity.o_vec3_trn_start)
        );

        if(!b_start_connected){
            // Get outward rotation at start point
            // For arc: tangent is perpendicular to radius, so +90 for CCW direction
            // At start, outward means backward (opposite of arc direction) = radius - 90
            let n_rotation_deg = (o_entity.s_type === "LINE")
                ? o_entity.n_rotation_deg_start + 180  // opposite of line direction
                : o_entity.n_ang_deg_start - 90;       // arc tangent pointing backward
            a_o_pointwithrotation_noconnection.push(
                f_o_pointwithrotation(o_entity.o_vec3_trn_start, n_rotation_deg)
            );
        }

        // Check end point
        let b_end_connected = a_o_vec3_connected.some(
            o_vec3 => f_b_vec3_equal(o_vec3, o_entity.o_vec3_trn_end)
        );

        if(!b_end_connected){
            // Get outward rotation at end point
            // For arc: tangent is perpendicular to radius
            // At end, outward means forward (continuing past the arc) = radius + 90
            let n_rotation_deg = (o_entity.s_type === "LINE")
                ? o_entity.n_rotation_deg_start  // line direction
                : o_entity.n_ang_deg_end + 90;   // arc tangent pointing forward
            a_o_pointwithrotation_noconnection.push(
                f_o_pointwithrotation(o_entity.o_vec3_trn_end, n_rotation_deg)
            );
        }
    }

    let a_o_vec3_trn = f_a_o_vec3_trn_ordered_from_params(
        a_o_entity,
        a_o_entity_connection,
        n_points_per_mm
    );
    let a_o_vec3_trn_xpositive = a_o_vec3_trn.filter(
        o_vec3 => o_vec3.n_x > 0
    );
    let o_vec3_x0ymax = a_o_vec3_trn.filter(
        o_vec3 => 
            Math.abs(o_vec3.n_x) < 0.001).sort((a, b) => b.n_y - a.n_y
    )[0];
    let o_vec3_x0ymin = a_o_vec3_trn.filter(
        o_vec3 => 
            Math.abs(o_vec3.n_x) < 0.001).sort((a, b) => a.n_y - b.n_y
    )[0];
    let a_o_vec3_trn_and_mirrored_aty_axis = [
        ...a_o_vec3_trn_xpositive,
        ...a_o_vec3_trn_xpositive.slice().reverse().map(o_vec3 => f_o_vec3(-o_vec3.n_x, o_vec3.n_y, o_vec3.n_z)),
        o_vec3_x0ymax,
        o_vec3_x0ymin
    ].filter(o => o !== undefined);

    let a_o_vec3_trn_and_mirrored_aty_axis_ordered = f_a_o_vec3_trn_orderedaroundcentroid_from_a_o_vec3_trn(
        a_o_vec3_trn_and_mirrored_aty_axis
    );

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

    return f_o_sketch(
        a_o_entity,
        a_o_entity_connection,
        a_o_pointwithrotation_noconnection,
        a_o_vec3_trn,
        a_o_vec3_trn_and_mirrored_aty_axis,
        a_o_vec3_trn_and_mirrored_aty_axis_ordered,
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
    n_scl_max
){

    let a_s_svg = [];
    let o_bbox = f_o_bbox_init();
    let n_stroke = n_scl_max *0.02;

    for (const o_line of a_o_entity.filter(o => o.s_type === "LINE")) {

        let x1 = o_line.o_vec3_trn_start.n_x;
        let y1 = o_line.o_vec3_trn_start.n_y;
        let x2 = o_line.o_vec3_trn_end.n_x;
        let y2 = o_line.o_vec3_trn_end.n_y;
        f_update_bbox(o_bbox, x1, y1);
        f_update_bbox(o_bbox, x2, y2);

        a_s_svg.push(
            `<line x1="${x1}" y1="${-y1}" x2="${x2}" y2="${-y2}" ` +
            `stroke="blue" stroke-width="${n_stroke}" fill="none" />`
        );
    }

    for (const o_circle of a_o_entity.filter(o => o.s_type === "CIRCLE")) {

        let cx = o_circle.o_vec3_trn.n_x;
        let cy = o_circle.o_vec3_trn.n_y;
        let r  = o_circle.n_radius;

        f_update_bbox(o_bbox, cx - r, cy - r);
        f_update_bbox(o_bbox, cx + r, cy + r);

        a_s_svg.push(
            `<circle cx="${cx}" cy="${-cy}" r="${r}" ` +
            `stroke="green" stroke-width="${n_stroke}" fill="none" />`
        );
    }

    for (const o_arc of a_o_entity.filter(o => o.s_type === "ARC")) {

        let p_start = f_o_point_from_arc(o_arc, o_arc.n_ang_deg_start);
        let p_end   = f_o_point_from_arc(o_arc, o_arc.n_ang_deg_end);

        f_update_bbox(o_bbox, p_start.x, p_start.y);
        f_update_bbox(o_bbox, p_end.x, p_end.y);

        let sweep_deg = o_arc.n_ang_deg_end - o_arc.n_ang_deg_start;
        if (sweep_deg < 0) sweep_deg += 360;

        let large_arc_flag = sweep_deg > 180 ? 1 : 0;
        let sweep_flag = 0; // DXF CCW → SVG sweep-flag = 0 with flipped Y

        a_s_svg.push(
            `<path d="M ${p_start.x} ${-p_start.y} ` +
            `A ${o_arc.n_radius} ${o_arc.n_radius} 0 ` +
            `${large_arc_flag} ${sweep_flag} ` +
            `${p_end.x} ${-p_end.y}" ` +
            `stroke="red" stroke-width="${n_stroke}" fill="none" />`
        );
    }

    // draw triangles at entity connection points
    let n_triangle_size = Math.max(o_bbox.max_x - o_bbox.min_x, o_bbox.max_y - o_bbox.min_y) * 0.02 || 2;
    for (const o_entity_connection of a_o_entity_connection) {
        let cx = o_entity_connection.o_trn_vec3_connected.n_x;
        let cy = -o_entity_connection.o_trn_vec3_connected.n_y; // flip Y for SVG

        // get direction vectors for both entities
        let o_vec3_dir1 = f_o_vec3_direction_at_connection(o_entity_connection.o_entity_a, o_entity_connection.o_trn_vec3_connected);
        let o_vec3_dir2 = f_o_vec3_direction_at_connection(o_entity_connection.o_entity_b, o_entity_connection.o_trn_vec3_connected);

        // average direction (bisector) - points "into" the angle between entities
        let avg_x = (o_vec3_dir1.n_x + o_vec3_dir2.n_x) / 2;
        let avg_y = (o_vec3_dir1.n_y + o_vec3_dir2.n_y) / 2;
        let avg_len = Math.sqrt(avg_x * avg_x + avg_y * avg_y);
        if (avg_len > 0.0001) {
            avg_x /= avg_len;
            avg_y /= avg_len;
        }

        // rotation angle for SVG (note: SVG Y is flipped)
        let n_rotation_deg = Math.atan2(-avg_y, avg_x) * 180 / Math.PI;

        // triangle pointing in the direction
        // base triangle points right (+x), then rotate
        let s_color = o_entity_connection.b_tangent ? "green" : "orange";
        a_s_svg.push(
            `<polygon points="${-n_triangle_size},${-n_triangle_size/2} ${-n_triangle_size},${n_triangle_size/2} ${n_triangle_size},0" ` +
            `transform="translate(${cx},${cy}) rotate(${n_rotation_deg})" ` +
            `fill="${s_color}" stroke="black" stroke-width="0.5" />`
        );
    }

    // draw blue arrows at unconnected points
    for (const o_pointwithrotation of a_o_pointwithrotation_noconnection) {
        let cx = o_pointwithrotation.o_vec3.n_x;
        let cy = -o_pointwithrotation.o_vec3.n_y; // flip Y for SVG

        // SVG rotation: negate the Y component since SVG Y is flipped
        let n_rotation_deg = -o_pointwithrotation.n_rotation_deg;

        // Arrow shape: shaft + arrowhead pointing right, then rotated
        let n_arrow_length = n_triangle_size * 2;
        let n_arrow_width = n_triangle_size * 0.3;
        let n_head_length = n_triangle_size * 0.8;
        let n_head_width = n_triangle_size * 0.6;

        a_s_svg.push(
            `<g transform="translate(${cx},${cy}) rotate(${n_rotation_deg})">` +
            `<line x1="0" y1="0" x2="${n_arrow_length - n_head_length}" y2="0" ` +
            `stroke="blue" stroke-width="${n_arrow_width}" />` +
            `<polygon points="${n_arrow_length - n_head_length},${-n_head_width} ${n_arrow_length - n_head_length},${n_head_width} ${n_arrow_length},0" ` +
            `fill="blue" />` +
            `</g>`
        );
    }

    // draw points with index numbers
    let n_font_size = n_triangle_size * 0.8;
    for(let n_idx = 0; n_idx < a_o_vec3_trn.length; n_idx++){
        let o_vec3 = a_o_vec3_trn[n_idx];
        let cx = o_vec3.n_x;
        let cy = -o_vec3.n_y; // flip Y for SVG

        f_update_bbox(o_bbox, cx, -cy);
        a_s_svg.push(
            `<circle cx="${cx}" cy="${cy}" r="${n_triangle_size * 0.3}" ` +
            `stroke="black" stroke-width="0.5" fill="yellow" />`
        );
        a_s_svg.push(
            `<text x="${cx + n_triangle_size * 0.4}" y="${cy - n_triangle_size * 0.2}" ` +
            `font-size="${n_font_size}" fill="black" stroke="white" stroke-width="${n_font_size*0.02}">${n_idx}</text>`
        );
    }   
    


    let width  = o_bbox.max_x - o_bbox.min_x;
    let height = o_bbox.max_y - o_bbox.min_y;
    let pad = Math.max(width, height) * 0.05 || 10;

    let viewBox = [
        o_bbox.min_x - pad,
        -(o_bbox.max_y + pad),
        width  + pad * 2,
        height + pad * 2
    ].join(" ");

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" ` +
        `width="100%" height="100%" ` +
        `viewBox="${viewBox}" stroke-linecap="round">` +
        a_s_svg.join("\n") +
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
            let b_pair_already_exists = a_o_entity_connection.some(o_dec =>
                (o_dec.o_entity_a === o_ent && o_dec.o_entity_b === o_ent2) ||
                (o_dec.o_entity_a === o_ent2 && o_dec.o_entity_b === o_ent)
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

let f_o_vec3_trn_from_o_entity = function(o_ent, points_per_mm = 10){
    // checks how long the distance of the entity is (line, arc, circle)
    // calculates number of points based on points_per_mm
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
        let n_num_points = Math.max(2, Math.ceil(n_len * points_per_mm));
        for(let i=0; i<n_num_points; i++){
            let t = i / (n_num_points - 1);
            a_o_vec3_trn.push(
                f_o_vec3(
                    o_ent.o_vec3_trn_start.n_x + t * (o_ent.o_vec3_trn_end.n_x - o_ent.o_vec3_trn_start
.n_x),
                    o_ent.o_vec3_trn_start.n_y + t * (o_ent.o_vec3_trn_end.n_y - o_ent.o_vec3_trn_start
.n_y),
                    o_ent.o_vec3_trn_start.n_z + t * (o_ent.o_vec3_trn_end.n_z - o_ent.o_vec3_trn_start
.n_z)
                )
            );
        }
    } else if(o_ent.s_type === "ARC"){
        let n_sweep_rad = o_ent.n_ang_rad_end - o_ent.n_ang_rad_start;
        if(n_sweep_rad < 0){
            n_sweep_rad += Math.PI * 2;
        }
        let n_arc_length = n_sweep_rad * o_ent.n_radius;
        let n_num_points = Math.max(2, Math.ceil(n_arc_length * points_per_mm));
        for(let i=0; i<n_num_points; i++){
            let t = i / (n_num_points - 1);
            let n_ang_rad = o_ent.n_ang_rad_start + t * n_sweep_rad;
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
        let n_num_points = Math.max(3, Math.ceil(n_circumference * points_per_mm));
        for(let i=0; i<n_num_points; i++){
            let t = i / n_num_points;
            let n_ang_rad = t * Math.PI * 2;
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

let f_a_o_vec3_trn_from_o_entity_directed = function(o_ent, b_reversed, points_per_mm = 1){
    let a_o_vec3_trn = [];

    if(o_ent.s_type === "LINE"){
        let n_len = f_n_len_from_o_vec3(
            f_o_vec3(
                o_ent.o_vec3_trn_end.n_x - o_ent.o_vec3_trn_start.n_x,
                o_ent.o_vec3_trn_end.n_y - o_ent.o_vec3_trn_start.n_y,
                o_ent.o_vec3_trn_end.n_z - o_ent.o_vec3_trn_start.n_z
            )
        );
        let n_num_points = Math.max(2, Math.ceil(n_len * points_per_mm));

        let o_start = b_reversed ? o_ent.o_vec3_trn_end : o_ent.o_vec3_trn_start;
        let o_end = b_reversed ? o_ent.o_vec3_trn_start : o_ent.o_vec3_trn_end;

        for(let i = 0; i < n_num_points; i++){
            let t = i / (n_num_points - 1);
            a_o_vec3_trn.push(
                f_o_vec3(
                    o_start.n_x + t * (o_end.n_x - o_start.n_x),
                    o_start.n_y + t * (o_end.n_y - o_start.n_y),
                    o_start.n_z + t * (o_end.n_z - o_start.n_z)
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
        let n_num_points = Math.max(2, Math.ceil(n_arc_length * points_per_mm));

        for(let i = 0; i < n_num_points; i++){
            let t = i / (n_num_points - 1);
            let n_ang_rad;
            if(b_reversed){
                // traverse from end to start (clockwise)
                n_ang_rad = o_ent.n_ang_rad_end - t * n_sweep_rad;
            } else {
                // traverse from start to end (counter-clockwise)
                n_ang_rad = o_ent.n_ang_rad_start + t * n_sweep_rad;
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
    points_per_mm = 1
){
    a_o_entity = a_o_entity.filter(e => e && 'o_vec3_trn_start' in e);
    let a_o_dec = a_o_entity_connection;

    if(a_o_entity.length === 0){
        return [];
    }

    // build connection count per entity to find endpoints
    let o_entity_connection_count = new Map();
    for(let o_ent of a_o_entity){
        o_entity_connection_count.set(o_ent, 0);
    }
    for(let o_dec of a_o_dec){
        o_entity_connection_count.set(o_dec.o_entity_a, o_entity_connection_count.get(o_dec.o_entity_a) + 1);
        o_entity_connection_count.set(o_dec.o_entity_b, o_entity_connection_count.get(o_dec.o_entity_b) + 1);
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
    let a_start_connections = a_o_dec.filter(d => d.o_entity_a === o_current || d.o_entity_b === o_current);
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
        let o_next_dec = null;
        for(let o_dec of a_o_dec){
            if(o_visited.has(o_dec.o_entity_a) && o_visited.has(o_dec.o_entity_b)){
                continue;
            }
            if(f_b_vec3_equal(o_dec.o_trn_vec3_connected, o_prev_endpoint)){
                o_next_dec = o_dec;
                break;
            }
        }

        if(!o_next_dec){
            break; // no more connections
        }

        // determine next entity
        let o_next = o_visited.has(o_next_dec.o_entity_a) ? o_next_dec.o_entity_b : o_next_dec.o_entity_a;

        // determine direction for next entity
        // if connected at its start, traverse forward
        // if connected at its end, traverse reversed
        let b_connected_at_start = f_b_vec3_equal(o_next_dec.o_trn_vec3_connected, o_next.o_vec3_trn_start);
        let b_reversed = !b_connected_at_start; // if connected at start, go forward; if at end, go reversed

        a_o_ordered_entities.push(o_next);
        a_b_reversed.push(b_reversed);
        o_visited.add(o_next);

        // update endpoint for next iteration
        o_prev_endpoint = b_reversed ? o_next.o_vec3_trn_start : o_next.o_vec3_trn_end;
    }

    // generate points in order
    let a_o_vec3_trn = [];
    for(let i = 0; i < a_o_ordered_entities.length; i++){
        let a_points = f_a_o_vec3_trn_from_o_entity_directed(a_o_ordered_entities[i], a_b_reversed[i], points_per_mm);
        // skip first point of subsequent entities (it's the same as last point of previous)
        if(i > 0 && a_points.length > 0){
            a_points = a_points.slice(1);
        }
        a_o_vec3_trn.push(...a_points);
    }

    return a_o_vec3_trn;
}

let f_s_scad_var_declation_sketch_entities = function(a_o_entity){
    let a_o_entity_line = a_o_entity.filter(o_ent=>o_ent.s_type === "LINE");
    let a_o_entity_arc = a_o_entity.filter(o_ent=>o_ent.s_type === "ARC");
    let a_o_entity_circle = a_o_entity.filter(o_ent=>o_ent.s_type === "CIRCLE");

    let s_scad = `
        ${a_o_entity_line.map((o, n_idx)=>{
            return `line_${n_idx} = [[${o.o_vec3_trn_start.n_x}, ${o.o_vec3_trn_start.n_y}], [${o.o_vec3_trn_end.n_x}, ${o.o_vec3_trn_end.n_y}]];`
        }).join('\n')}


        
        ${a_o_entity_arc.map((o, n_idx)=>{
            return `
                        arc_${n_idx} = [
                [${o.o_vec3_trn.n_x}, ${o.o_vec3_trn.n_y}, ${o.o_vec3_trn.n_z}],  // center
                ${o.n_radius},  // radius
                ${o.n_ang_deg_start},  // start angle (degrees)
                ${o.n_ang_deg_end}  // end angle (degrees)
            ];
`
        }).join('\n')}

        function arc_to_path(arc_def, n_segments=50) =
            let(
                center = arc_def[0],
                radius = arc_def[1],
                start_angle = arc_def[2],
                end_angle = arc_def[3],
                // Generate arc path using BOSL2
                arc_2d = arc(n=n_segments, r=radius, angle=[start_angle, end_angle])
            )
            // Translate arc to center position and add Z coordinate
            [for (p = arc_2d) [p.x + center[0], p.y + center[1], center[2]]];

        module sweep_arc(profile, arc_def, n_segments=50) {
            let(
                center = arc_def[0],
                radius = arc_def[1],
                start_angle = arc_def[2],
                end_angle = arc_def[3]
            )
            translate(center)
            path_sweep(profile, arc(n=n_segments, r=radius, angle=[start_angle, end_angle]));
        }

        ${a_o_entity_circle.map((o, n_idx)=>{
            return `
                circle_${n_idx} = [
    [${o.o_vec3_trn.n_x}, ${o.o_vec3_trn.n_y}, ${o.o_vec3_trn.n_z}],  // center
    ${o.n_radius}  // radius
];
`        }).join('\n')
    }   
        
        // Convert circle definition to a 3D path using BOSL2's circle() function
    function circle_to_path(circle_def, n_segments=50) =
        let(
            center = circle_def[0],
            radius = circle_def[1],
            // Generate 2D circle and convert to 3D path
            circle_path_3d = path3d(circle(r=radius, $fn=n_segments))
        )
        // Translate circle path to center position
        [for (p = circle_path_3d) [p.x + center[0], p.y + center[1], p.z + center[2]]];

    // Sweep a circle with a profile
    module sweep_circle(profile, circle_def, n_segments=50) {
        let(
            center = circle_def[0],
            radius = circle_def[1],
            // Create 3D circular path
            circle_path = path3d(circle(r=radius, $fn=n_segments))
        )
        translate(center)
        path_sweep(profile, circle_path,closed=true);
    }


    `
    return s_scad;
}
let f_s_scad_path_sweep_sketch = function(
    o_sketch_sweep_paths,
    s_name_sketch_sweep_paths = "profile_sweep",
    o_sketch_profile,
    s_name_sketch_profile = "profile",
    o_sketch_profile_remover, 
    s_name_sketch_profile_remover = "profile_remover",
    n_segments=50
){
    let b_run_profile_preview = false;
    let s_scad_profile_functions = f_s_scad_profile_functions_from_o_sketch(o_sketch_profile, s_name_sketch_profile, b_run_profile_preview);
    let s_scad_profile_functions_remover = f_s_scad_profile_functions_from_o_sketch(o_sketch_profile_remover, s_name_sketch_profile_remover, b_run_profile_preview);
    let s_scad_entity_defs = f_s_scad_var_declation_sketch_entities(o_sketch_sweep_paths.a_o_entity);

    // Get tangent connections and calculate rotation angles
    let a_o_entity_connection__tangent = o_sketch_sweep_paths.a_o_entity_connection.filter(o_dec => o_dec.b_tangent);
    let a_o_entity_connection__non_tangent = o_sketch_sweep_paths.a_o_entity_connection.filter(o_dec => !o_dec.b_tangent);
    
    // Deduplicate tangent points by position (within tolerance)
    let n_dedup_tolerance = 0.001;
    let a_o_tangent_unique = [];
    for(let o_dec of a_o_entity_connection__tangent){
        let b_duplicate = a_o_tangent_unique.some(o_existing =>
            Math.abs(o_existing.o_trn_vec3_connected.n_x - o_dec.o_trn_vec3_connected.n_x) < n_dedup_tolerance &&
            Math.abs(o_existing.o_trn_vec3_connected.n_y - o_dec.o_trn_vec3_connected.n_y) < n_dedup_tolerance &&
            Math.abs(o_existing.o_trn_vec3_connected.n_z - o_dec.o_trn_vec3_connected.n_z) < n_dedup_tolerance
        );
        if(!b_duplicate){
            a_o_tangent_unique.push(o_dec);
        }
    }
    console.log(`Tangent points: ${a_o_entity_connection__tangent.length} total, ${a_o_tangent_unique.length} unique`)


    let s_scad = `
     include <BOSL2/std.scad>

    ${s_scad_entity_defs}
    ${s_scad_profile_functions}
    ${s_scad_profile_functions_remover}
    
// ===== TANGENT CONNECTION POINTS =====
// Points where entities connect tangentially, with rotation angle for joint placement
${a_o_tangent_unique.map((o, idx) =>
    `${s_name_sketch_sweep_paths}_tangent_point_${idx} = [${o.o_trn_vec3_connected.n_x.toFixed(6)}, ${o.o_trn_vec3_connected.n_y.toFixed(6)}, ${o.o_trn_vec3_connected.n_z.toFixed(6)}];
${s_name_sketch_sweep_paths}_tangent_point_${idx}_angle = ${o.n_ang_deg_z_entity_a.toFixed(6)};`
).join('\n')}

// ===== UNCONNECTED ENDPOINTS =====
// Points where entities have no connection (line/arc endpoints), with outward rotation angle
${o_sketch_sweep_paths.a_o_pointwithrotation_noconnection.map((o, idx) =>
    `${s_name_sketch_sweep_paths}_endpoint_${idx} = [${o.o_vec3.n_x.toFixed(6)}, ${o.o_vec3.n_y.toFixed(6)}, ${o.o_vec3.n_z.toFixed(6)}];
${s_name_sketch_sweep_paths}_endpoint_${idx}_angle = ${o.n_rotation_deg.toFixed(6)};`
).join('\n')}

// Generic module to revolve any profile around X axis
// profile_for_revolve: 2D points array (x >= 0 for rotate_extrude)
// profile_height: height of the profile (for Y translation)
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
${o_sketch_sweep_paths.a_o_pointwithrotation_noconnection.map((o, idx) =>
    `    translate(${s_name_sketch_sweep_paths}_endpoint_${idx})
    rotate([0, 0, ${s_name_sketch_sweep_paths}_endpoint_${idx}_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);`
).join('\n')}
}

// Sweep pattern - sweeps profile along each path (lines, arcs, and circles)
module ${s_name_sketch_sweep_paths}_sweep_pattern(profile) {
    union() {
        // Sweep lines
        
        ${o_sketch_sweep_paths.a_o_entity.filter(o=> o && o.s_type === 'LINE').map((o_line, n_idx)=>{
            return `path_sweep(profile, path2d(line_${n_idx}));`;
        }).join('\n')}

        // Sweep arcs
        ${o_sketch_sweep_paths.a_o_entity.filter(o=> o && o.s_type === 'ARC').map((o_arc, n_idx)=>{
            return `sweep_arc(profile, arc_${n_idx}, n_segments=${n_segments});`;
        }).join('\n')}

        // Sweep circles
        ${o_sketch_sweep_paths.a_o_entity.filter(o=> o && o.s_type === 'CIRCLE').map((o_circle, n_idx)=>{
            return `sweep_circle(profile, circle_${n_idx}, n_segments=${n_segments});`;
        }).join('\n')}

    }
}

// Full pattern with tangent joints and endpoint joints
// sweep_profile: 2D points array for path_sweep (typically mirroredx profile)
// joint_profile_for_revolve: 2D points array for revolve joints (x >= 0, typically for_revolve profile)
// joint_profile_height: height of the joint profile (for translation in revolve)
module ${s_name_sketch_sweep_paths}_full_pattern(
    b_make_joints = true,
    b_make_endpoint_joints = true,
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
    }
}

    ${(b_run_profile_preview) ? `` : `//`}${s_name_sketch_profile}_preview();

// Render sweep pattern only
//${s_name_sketch_sweep_paths}_sweep_pattern(profile_default(scalefactor=0.2));


$fn = 4;
// $fn = 32;
module part_with_difference(s=1){
    difference(){

        color([0.,1.0, 0.5, 0.5])
        ${s_name_sketch_sweep_paths}_full_pattern(
            b_make_joints=true,
            b_make_endpoint_joints=true,
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
            sweep_profile=${s_name_sketch_profile_remover}_mirroredx_scaled(s=s)
        );
    }
}
part_with_difference(s=0.5);
    `
    return s_scad;
}

let f_s_scad_profile_functions_from_o_sketch = function(o_sketch, s_profile_name = "profile", b_run_preview = false){
    let a_o_vec3 = o_sketch.a_o_vec3_trn;

    if(a_o_vec3.length === 0){
        return "// No points in profile\n";
    }

    // calculate bounds
    let minX = Math.min(...a_o_vec3.map(p => p.n_x));
    let maxX = Math.max(...a_o_vec3.map(p => p.n_x));
    let minY = Math.min(...a_o_vec3.map(p => p.n_y));
    let maxY = Math.max(...a_o_vec3.map(p => p.n_y));
    let centerY = (minY + maxY) / 2;

    // 1. Compute xpositive points (shift so minX = 0, center on Y)
    let a_xpositive = a_o_vec3.map(p => ({
        x: p.n_x - minX,
        y: p.n_y - centerY
    }));

    // 2. Compute mirroredx points (mirror xpositive, skip duplicates at X≈0)
    let a_mirroredx = [...a_xpositive];
    let lastIdx = a_xpositive.length - 1;
    let startIdx = Math.abs(a_xpositive[lastIdx].x) < 0.0001 ? lastIdx - 1 : lastIdx;
    let endIdx = Math.abs(a_xpositive[0].x) < 0.0001 ? 1 : 0;
    for (let i = startIdx; i >= endIdx; i--) {
        a_mirroredx.push({ x: -a_xpositive[i].x, y: a_xpositive[i].y });
    }

    // 3. Compute rotatedz points (rotate 90° CW: [x, y] -> [y, -x])
    let a_rotatedz = a_mirroredx.map(p => ({ x: p.y, y: -p.x }));

    // 4. Compute for_revolve points (rotatedz shifted so min_x = 0)
    let rotatedMinX = Math.min(...a_rotatedz.map(p => p.x));
    let a_for_revolve = a_rotatedz.map(p => ({ x: p.x - rotatedMinX, y: p.y }));

    // Format point for SCAD output
    let f_s_point = (p) => `[${p.x.toFixed(6)}, ${p.y.toFixed(6)}]`;

    let s_scad = `
include <BOSL2/std.scad>

// Profile: ${s_profile_name}
// Points: ${a_o_vec3.length} (xpositive), ${a_mirroredx.length} (mirrored)
// Bounds: X[${minX.toFixed(4)}, ${maxX.toFixed(4)}] Y[${minY.toFixed(4)}, ${maxY.toFixed(4)}]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
${s_profile_name}_width = ${((maxX - minX) * 2).toFixed(6)};
${s_profile_name}_height = ${((maxY - minY) / 2).toFixed(6)};

// Original DXF position (translation applied to normalize profile)
${s_profile_name}_trn_x = ${minX.toFixed(6)};
${s_profile_name}_trn_y = ${minY.toFixed(6)};

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
${s_profile_name}_xpositive = [
${a_xpositive.map(p => "    " + f_s_point(p)).join(",\n")}
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
${s_profile_name}_mirroredx = [
${a_mirroredx.map(p => "    " + f_s_point(p)).join(",\n")}
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
${s_profile_name}_rotatedz = [
${a_rotatedz.map(p => "    " + f_s_point(p)).join(",\n")}
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
${s_profile_name}_for_revolve = [
${a_for_revolve.map(p => "    " + f_s_point(p)).join(",\n")}
];

// Scaled profile functions
function ${s_profile_name}_xpositive_scaled(s=1) = [for (p = ${s_profile_name}_xpositive) [p.x * s, p.y * s]];
function ${s_profile_name}_mirroredx_scaled(s=1) = [for (p = ${s_profile_name}_mirroredx) [p.x * s, p.y * s]];
function ${s_profile_name}_rotatedz_scaled(s=1) = [for (p = ${s_profile_name}_rotatedz) [p.x * s, p.y * s]];
function ${s_profile_name}_for_revolve_scaled(s=1) = [for (p = ${s_profile_name}_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = ${s_profile_name}_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module ${s_profile_name}_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -${s_profile_name}_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(${s_profile_name}_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module ${s_profile_name}_preview(scalefactor=1, test_length=100) {
    spacing_y = ${s_profile_name}_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(${s_profile_name}_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(${s_profile_name}_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(${s_profile_name}_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    ${s_profile_name}_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(${s_profile_name}_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(${s_profile_name}_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(${s_profile_name}_rotatedz_scaled(scalefactor));
    }
}

${(b_run_preview) ? `` : `//`}${s_profile_name}_preview();

`;
    return s_scad;
}


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
    f_s_scad_var_declation_sketch_entities,
    f_s_scad_profile_functions_from_o_sketch,
    f_s_scad_path_sweep_sketch
}