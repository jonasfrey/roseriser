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

    // ===== ENTITY EXTENSION FUNCTIONS =====
    // Extend a line definition by a given amount at start or end
    // line_def: [[x1,y1], [x2,y2]]
    // ext_amount: extension distance
    // at_start: true to extend start point, false to extend end point
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

    // Extend an arc definition by a given angle at start or end
    // arc_def: [[cx,cy,cz], radius, start_angle, end_angle]
    // ext_deg: extension in degrees
    // at_start: true to extend start angle, false to extend end angle
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


    `
    return s_scad;
}


// ===== HELPER FUNCTIONS =====

let f_a_o_point__removed_duplicate = function(a_o_point, n_tolerance = 0.0001){
    // Remove duplicate consecutive points (including wraparound start/end)
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

    // Check if last point duplicates first point (closed path)
    if (a_o_point__cleaned.length > 1) {
        let o_point__first = a_o_point__cleaned[0];
        let o_point__last = a_o_point__cleaned[a_o_point__cleaned.length - 1];
        let n_dist = Math.sqrt((o_point__last.x - o_point__first.x)**2 + (o_point__last.y - o_point__first.y)**2);
        if (n_dist < n_tolerance) {
            a_o_point__cleaned.pop();
        }
    }

    return a_o_point__cleaned;
}

// ===== PROFILE FUNCTIONS GENERATOR =====

let f_s_scad_profile_functions_from_o_sketch = function(
    o_sketch,
    s_profile_name = "profile",
    b_run_preview = false
){
    let a_o_vec3 = o_sketch.a_o_vec3_trn;

    if(a_o_vec3.length === 0){
        return "// No points in profile\n";
    }

    // calculate bounds
    let n_x__min = Math.min(...a_o_vec3.map(p => p.n_x));
    let n_x__max = Math.max(...a_o_vec3.map(p => p.n_x));
    let n_y__min = Math.min(...a_o_vec3.map(p => p.n_y));
    let n_y__max = Math.max(...a_o_vec3.map(p => p.n_y));
    let n_y__center = (n_y__min + n_y__max) / 2;

    // 1. Filter for x >= 0 points only (right half of profile), centered on Y
    let a_o_xpositive__raw = a_o_vec3.filter(p => p.n_x >= -0.001);


    // If no x-positive points, use all points (profile might be on left side)
    if(a_o_xpositive__raw.length === 0){
        a_o_xpositive__raw = a_o_vec3;
    }

    // Shift so minX of filtered points = 0, center on Y
    let n_x__min_filtered = Math.min(...a_o_xpositive__raw.map(p => p.n_x));
    let a_o_xpositive = a_o_xpositive__raw.map(p => ({
        x: p.n_x - n_x__min_filtered,
        y: p.n_y - n_y__center
    }));
    a_o_xpositive = f_a_o_point__removed_duplicate(a_o_xpositive);


    // 2. Compute mirroredx points (mirror xpositive, skip ALL points at X≈0 to avoid duplicates)
    let a_o_mirroredx = [...a_o_xpositive];
    for (let n_it = a_o_xpositive.length - 1; n_it >= 0; n_it--) {
        // Skip points on the mirror axis (x≈0) since they would duplicate
        if (Math.abs(a_o_xpositive[n_it].x) < 0.0001) {
            continue;
        }
        a_o_mirroredx.push({ x: -a_o_xpositive[n_it].x, y: a_o_xpositive[n_it].y });
    }

    // 3. Compute rotatedz points (rotate 90° CW: [x, y] -> [y, -x])
    let a_o_rotatedz = a_o_mirroredx.map(p => ({ x: p.y, y: -p.x }));

    // 4. Compute for_revolve points (rotatedz shifted so min_x = 0)
    let n_x__min_rotated = Math.min(...a_o_rotatedz.map(p => p.x));
    let a_o_for_revolve = a_o_rotatedz.map(p => ({ x: p.x - n_x__min_rotated, y: p.y }));

    // Format point for SCAD output
    let f_s_point = (o_p) => `[${o_p.x.toFixed(6)}, ${o_p.y.toFixed(6)}]`;

    let s_scad = `
include <BOSL2/std.scad>

// Profile: ${s_profile_name}
// Points: ${a_o_vec3.length} (xpositive), ${a_o_mirroredx.length} (mirrored)
// Bounds: X[${n_x__min.toFixed(4)}, ${n_x__max.toFixed(4)}] Y[${n_y__min.toFixed(4)}, ${n_y__max.toFixed(4)}]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
${s_profile_name}_width = ${((n_x__max - n_x__min) * 2).toFixed(6)};
${s_profile_name}_height = ${((n_y__max - n_y__min) / 2).toFixed(6)};

// Original DXF position (translation applied to normalize profile)
${s_profile_name}_trn_x = ${n_x__min.toFixed(6)};
${s_profile_name}_trn_y = ${n_y__min.toFixed(6)};

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
${s_profile_name}_xpositive = [
${a_o_xpositive.map(o_p => "    " + f_s_point(o_p)).join(",\n")}
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
${s_profile_name}_mirroredx = [
${a_o_mirroredx.map(o_p => "    " + f_s_point(o_p)).join(",\n")}
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
${s_profile_name}_rotatedz = [
${a_o_rotatedz.map(o_p => "    " + f_s_point(o_p)).join(",\n")}
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
${s_profile_name}_for_revolve = [
${a_o_for_revolve.map(o_p => "    " + f_s_point(o_p)).join(",\n")}
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

// ===== PATH SWEEP SKETCH GENERATOR =====

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
    let a_o_entity_connection__tangent = o_sketch_sweep_paths.a_o_entity_connection.filter(o_entity_connection => o_entity_connection.b_tangent);
    let a_o_entity_connection__non_tangent_all = o_sketch_sweep_paths.a_o_entity_connection.filter(o_entity_connection => !o_entity_connection.b_tangent);

    // Deduplicate non-tangent connections by entity pair (in either order)
    let a_o_entity_connection__non_tangent = [];
    for(let o_entity_connection of a_o_entity_connection__non_tangent_all){
        let b_duplicate = a_o_entity_connection__non_tangent.some(o_existing =>
            (o_existing.o_entity_a === o_entity_connection.o_entity_a && o_existing.o_entity_b === o_entity_connection.o_entity_b) ||
            (o_existing.o_entity_a === o_entity_connection.o_entity_b && o_existing.o_entity_b === o_entity_connection.o_entity_a)
        );
        if(!b_duplicate){
            a_o_entity_connection__non_tangent.push(o_entity_connection);
        }
    }
    console.log(`Non-tangent connections: ${a_o_entity_connection__non_tangent_all.length} total, ${a_o_entity_connection__non_tangent.length} unique`);

    // Deduplicate tangent points by position (within tolerance)
    let n_dedup_tolerance = 0.001;
    let a_o_tangent_unique = [];
    for(let o_entity_connection of a_o_entity_connection__tangent){
        let b_duplicate = a_o_tangent_unique.some(o_existing =>
            Math.abs(o_existing.o_trn_vec3_connected.n_x - o_entity_connection.o_trn_vec3_connected.n_x) < n_dedup_tolerance &&
            Math.abs(o_existing.o_trn_vec3_connected.n_y - o_entity_connection.o_trn_vec3_connected.n_y) < n_dedup_tolerance &&
            Math.abs(o_existing.o_trn_vec3_connected.n_z - o_entity_connection.o_trn_vec3_connected.n_z) < n_dedup_tolerance
        );
        if(!b_duplicate){
            a_o_tangent_unique.push(o_entity_connection);
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

// ===== EXTENSION PARAMETERS =====
// Adjust these to control how far entities are extended for non-tangent joints
line_extension_amount = ${o_sketch_profile.n_scl_max * 10}; // mm for lines
arc_extension_degrees = 30; // degrees for arcs

// ===== NON-TANGENT CONNECTION JOINTS =====
// For non-tangent connections, we extend both entities and take their intersection
${a_o_entity_connection__non_tangent.map((o_conn, idx) => {
    // Find entity indices
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

    // Connection point
    let cx = o_conn.o_trn_vec3_connected.n_x.toFixed(6);
    let cy = o_conn.o_trn_vec3_connected.n_y.toFixed(6);

    // Determine extension direction (at_start = true means connected at start point)
    let b_a_at_start = Math.abs(o_conn.o_entity_a.o_vec3_trn_start.n_x - o_conn.o_trn_vec3_connected.n_x) < 0.001 &&
                       Math.abs(o_conn.o_entity_a.o_vec3_trn_start.n_y - o_conn.o_trn_vec3_connected.n_y) < 0.001;
    let b_b_at_start = Math.abs(o_conn.o_entity_b.o_vec3_trn_start.n_x - o_conn.o_trn_vec3_connected.n_x) < 0.001 &&
                       Math.abs(o_conn.o_entity_b.o_vec3_trn_start.n_y - o_conn.o_trn_vec3_connected.n_y) < 0.001;

    // Generate SCAD function calls for extended entities (calculation happens in SCAD)
    let s_extend_a = s_type_a === 'LINE'
        ? `extend_line(${s_entity_ref_a}, line_extension_amount, ${b_a_at_start})`
        : `extend_arc(${s_entity_ref_a}, arc_extension_degrees, ${b_a_at_start})`;

    let s_extend_b = s_type_b === 'LINE'
        ? `extend_line(${s_entity_ref_b}, line_extension_amount, ${b_b_at_start})`
        : `extend_arc(${s_entity_ref_b}, arc_extension_degrees, ${b_b_at_start})`;

    // Sweep code using the extend functions directly
    let s_sweep_a = s_type_a === 'LINE'
        ? `path_sweep(profile, path2d(${s_extend_a}))`
        : `sweep_arc(profile, ${s_extend_a}, n_segments=${n_segments})`;

    let s_sweep_b = s_type_b === 'LINE'
        ? `path_sweep(profile, path2d(${s_extend_b}))`
        : `sweep_arc(profile, ${s_extend_b}, n_segments=${n_segments})`;

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

// Full pattern with tangent joints, endpoint joints, and non-tangent intersection joints
// sweep_profile: 2D points array for path_sweep (typically mirroredx profile)
// joint_profile_for_revolve: 2D points array for revolve joints (x >= 0, typically for_revolve profile)
// joint_profile_height: height of the joint profile (for translation in revolve)
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
    `
    return s_scad;
}

// ===== CYLINDRIC SWEEP GENERATOR =====

let f_s_scad_cylindric_sweep = function(
    o_sketch_sweep_paths,
    s_name_sketch_sweep_paths = "profile_sweep",
    o_sketch_profile,
    s_name_sketch_profile = "profile",
    o_sketch_profile_remover,
    s_name_sketch_profile_remover = "profile_remover",
    n_segment_per_unit = 2,  // points per mm for sampling entities
    n_radius_offset = 0  // additional radius offset
){
    // this function will convert the sketch sweep paths to 3d points
    // the input sketch points are assumed to be 2d and have a rectangular bounding box
    // this box can be wrapped around a cylinder
    // X axis maps to angle around cylinder, Y axis maps to height (Z)
    // radius is calculated so circumference = bounding box width

    // calculate bounding box of sketch
    let a_o_entity = o_sketch_sweep_paths.a_o_entity.filter(o => o != null);
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

    let n_scl_x = n_x__max - n_x__min;  // width of bounding box
    let n_scl_y = n_y__max - n_y__min;  // height of bounding box
    let n_tau = Math.PI * 2;
    // radius so that circumference = width of bounding box
    let n_radius = n_scl_x / n_tau + n_radius_offset;

    // helper to convert 2D point to 3D cylindrical
    let f_o_vec3_cylindric = function(n_x, n_y){
        // x maps to angle (0 at x_min, 2*PI at x_max)
        let n_ang = ((n_x - n_x__min) / n_scl_x) * n_tau;
        return {
            n_x: n_radius * Math.cos(n_ang),
            n_y: n_radius * Math.sin(n_ang),
            n_z: n_y  // y becomes z (height)
        };
    };

    // sample entity to array of points
    let f_a_o_vec3_from_o_entity = function(o_entity){
        let a_o = [];
        if(o_entity.s_type === 'LINE'){
            let n_len = Math.sqrt(
                Math.pow(o_entity.o_vec3_trn_end.n_x - o_entity.o_vec3_trn_start.n_x, 2) +
                Math.pow(o_entity.o_vec3_trn_end.n_y - o_entity.o_vec3_trn_start.n_y, 2)
            );
            let n_segment = Math.max(2, Math.ceil(n_len * n_segment_per_unit));
            for(let n_it = 0; n_it <= n_segment; n_it++){
                let n_t = n_it / n_segment;
                let n_x = o_entity.o_vec3_trn_start.n_x + (o_entity.o_vec3_trn_end.n_x - o_entity.o_vec3_trn_start.n_x) * n_t;
                let n_y = o_entity.o_vec3_trn_start.n_y + (o_entity.o_vec3_trn_end.n_y - o_entity.o_vec3_trn_start.n_y) * n_t;
                a_o.push(f_o_vec3_cylindric(n_x, n_y));
            }
        } else if(o_entity.s_type === 'ARC'){
            let n_arc_len = Math.abs(o_entity.n_ang_deg_end - o_entity.n_ang_deg_start) * Math.PI / 180 * o_entity.n_radius;
            let n_segment = Math.max(3, Math.ceil(n_arc_len * n_segment_per_unit));
            let n_ang_start = o_entity.n_ang_deg_start * Math.PI / 180;
            let n_ang_end = o_entity.n_ang_deg_end * Math.PI / 180;
            for(let n_it = 0; n_it <= n_segment; n_it++){
                let n_t = n_it / n_segment;
                let n_ang = n_ang_start + (n_ang_end - n_ang_start) * n_t;
                let n_x = o_entity.o_vec3_trn.n_x + Math.cos(n_ang) * o_entity.n_radius;
                let n_y = o_entity.o_vec3_trn.n_y + Math.sin(n_ang) * o_entity.n_radius;
                a_o.push(f_o_vec3_cylindric(n_x, n_y));
            }
        } else if(o_entity.s_type === 'CIRCLE'){
            let n_circumference = n_tau * o_entity.n_radius;
            let n_segment = Math.max(12, Math.ceil(n_circumference * n_segment_per_unit));
            for(let n_it = 0; n_it <= n_segment; n_it++){
                let n_ang = (n_it / n_segment) * n_tau;
                let n_x = o_entity.o_vec3_trn.n_x + Math.cos(n_ang) * o_entity.n_radius;
                let n_y = o_entity.o_vec3_trn.n_y + Math.sin(n_ang) * o_entity.n_radius;
                a_o.push(f_o_vec3_cylindric(n_x, n_y));
            }
        }
        return a_o;
    };

    // generate profile functions
    let b_run_profile_preview = false;
    let s_scad_profile_functions = f_s_scad_profile_functions_from_o_sketch(o_sketch_profile, s_name_sketch_profile, b_run_profile_preview);
    let s_scad_profile_functions_remover = f_s_scad_profile_functions_from_o_sketch(o_sketch_profile_remover, s_name_sketch_profile_remover, b_run_profile_preview);

    // generate path arrays for each entity
    let a_s_path = [];
    let a_n_idx__valid = [];
    for(let n_idx = 0; n_idx < a_o_entity.length; n_idx++){
        let o_entity = a_o_entity[n_idx];
        let a_o_vec3 = f_a_o_vec3_from_o_entity(o_entity);
        if(a_o_vec3.length > 1){
            let s_points = a_o_vec3.map(o => `[${o.n_x.toFixed(6)}, ${o.n_y.toFixed(6)}, ${o.n_z.toFixed(6)}]`).join(',\n        ');
            a_s_path.push(`path_${n_idx} = [\n        ${s_points}\n    ];`);
            a_n_idx__valid.push(n_idx);
        }
    }

    let s_scad = `
include <BOSL2/std.scad>

// ===== CYLINDRIC SWEEP PARAMETERS =====
// Original bounding box: width=${n_scl_x.toFixed(3)}mm, height=${n_scl_y.toFixed(3)}mm
// Cylinder radius (circumference = width): ${n_radius.toFixed(3)}mm
// Entities converted to point paths: ${a_n_idx__valid.length}

${s_scad_profile_functions}
${s_scad_profile_functions_remover}

// ===== SWEEP PATHS (converted to 3D cylindric coordinates) =====
${a_s_path.join('\n')}

// Sweep all paths with profile
module ${s_name_sketch_sweep_paths}_sweep_pattern(profile) {
    union() {
${a_n_idx__valid.map(n_idx => `        path_sweep(profile, path_${n_idx});`).join('\n')}
    }
}

// Main model with profile and remover difference
module ${s_name_sketch_sweep_paths}_main() {
    difference() {
        ${s_name_sketch_sweep_paths}_sweep_pattern(${s_name_sketch_profile}_mirroredx);
        ${s_name_sketch_sweep_paths}_sweep_pattern(${s_name_sketch_profile_remover}_mirroredx);
    }
}

// Render
${s_name_sketch_sweep_paths}_main();
`;

    return s_scad;
}

// ===== BUTTON GENERATOR =====

let f_s_scad_button_generator = function(
    o_sketch_ornament,
    s_name_sketch_ornament = "ornament",
    o_sketch_profile,
    s_name_sketch_profile = "profile",
    o_sketch_profile_remover,
    s_name_sketch_profile_remover = "profile_remover",
    n_segment = 32  // segments for arc/circle sampling
){
    // Calculate bounding box to find original ornament radius
    let a_o_entity = o_sketch_ornament.a_o_entity.filter(o => o != null);
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

    // Calculate center and original radius
    let n_x__center = (n_x__min + n_x__max) / 2;
    let n_y__center = (n_y__min + n_y__max) / 2;
    let n_radius__original = Math.max(n_x__max - n_x__min, n_y__max - n_y__min) / 2;

    // Magic diameter for hole marker circles: 1.123mm (radius 0.5615mm)
    let n_radius__hole_marker = 1.123 / 2;  // 0.5615mm
    let n_tolerance__hole_marker = 0.01;    // tolerance for matching

    // Collect hole marker positions (circles with diameter 1.123mm)
    let a_o_pos__hole = [];

    // Generate entity declarations (lines, arcs, circles) - centered at origin
    let a_s_entity = [];
    let n_idx__line = 0;
    let n_idx__arc = 0;
    let n_idx__circle = 0;

    for(let o_entity of a_o_entity){
        if(o_entity.s_type === 'LINE'){
            let x1 = (o_entity.o_vec3_trn_start.n_x - n_x__center).toFixed(6);
            let y1 = (o_entity.o_vec3_trn_start.n_y - n_y__center).toFixed(6);
            let x2 = (o_entity.o_vec3_trn_end.n_x - n_x__center).toFixed(6);
            let y2 = (o_entity.o_vec3_trn_end.n_y - n_y__center).toFixed(6);
            a_s_entity.push(`line_${n_idx__line} = [[${x1}, ${y1}], [${x2}, ${y2}]];`);
            n_idx__line++;
        } else if(o_entity.s_type === 'ARC'){
            let cx = (o_entity.o_vec3_trn.n_x - n_x__center).toFixed(6);
            let cy = (o_entity.o_vec3_trn.n_y - n_y__center).toFixed(6);
            let r = o_entity.n_radius.toFixed(6);
            let a1 = o_entity.n_ang_deg_start.toFixed(6);
            let a2 = o_entity.n_ang_deg_end.toFixed(6);
            a_s_entity.push(`arc_${n_idx__arc} = [[${cx}, ${cy}], ${r}, ${a1}, ${a2}];`);
            n_idx__arc++;
        } else if(o_entity.s_type === 'CIRCLE'){
            // Check if this is a hole marker circle (diameter 1.123mm)
            let b_hole_marker = Math.abs(o_entity.n_radius - n_radius__hole_marker) < n_tolerance__hole_marker;
            if(b_hole_marker){
                // Store hole position (centered)
                a_o_pos__hole.push({
                    n_x: o_entity.o_vec3_trn.n_x - n_x__center,
                    n_y: o_entity.o_vec3_trn.n_y - n_y__center
                });
            } else {
                // Regular circle - add to entities for sweeping
                let cx = (o_entity.o_vec3_trn.n_x - n_x__center).toFixed(6);
                let cy = (o_entity.o_vec3_trn.n_y - n_y__center).toFixed(6);
                let r = o_entity.n_radius.toFixed(6);
                a_s_entity.push(`circle_${n_idx__circle} = [[${cx}, ${cy}], ${r}];`);
                n_idx__circle++;
            }
        }
    }

    // Generate hole positions array for SCAD
    let s_hole_position = a_o_pos__hole.length > 0
        ? `a_pos__hole = [\n${a_o_pos__hole.map(o => `    [${o.n_x.toFixed(6)}, ${o.n_y.toFixed(6)}]`).join(',\n')}\n];`
        : `a_pos__hole = [];  // No hole markers found (circles with diameter 1.123mm)`;
    let n_cnt__hole = a_o_pos__hole.length;

    // Get tangent connections and deduplicate (same as path sweep)
    let a_o_entity_connection__tangent = o_sketch_ornament.a_o_entity_connection.filter(o_entity_connection => o_entity_connection.b_tangent);
    let n_dedup_tolerance = 0.001;
    let a_o_tangent_unique = [];
    for(let o_entity_connection of a_o_entity_connection__tangent){
        let b_duplicate = a_o_tangent_unique.some(o_existing =>
            Math.abs(o_existing.o_trn_vec3_connected.n_x - o_entity_connection.o_trn_vec3_connected.n_x) < n_dedup_tolerance &&
            Math.abs(o_existing.o_trn_vec3_connected.n_y - o_entity_connection.o_trn_vec3_connected.n_y) < n_dedup_tolerance &&
            Math.abs(o_existing.o_trn_vec3_connected.n_z - o_entity_connection.o_trn_vec3_connected.n_z) < n_dedup_tolerance
        );
        if(!b_duplicate){
            a_o_tangent_unique.push(o_entity_connection);
        }
    }

    // Get unconnected endpoints
    let a_o_endpoint = o_sketch_ornament.a_o_pointwithrotation_noconnection || [];

    // Generate profile functions
    let b_run_profile_preview = false;
    let s_scad_profile_functions = f_s_scad_profile_functions_from_o_sketch(o_sketch_profile, s_name_sketch_profile, b_run_profile_preview);
    let s_scad_profile_functions_remover = f_s_scad_profile_functions_from_o_sketch(o_sketch_profile_remover, s_name_sketch_profile_remover, b_run_profile_preview);

    let s_scad = `
include <BOSL2/std.scad>

// ===== BUTTON GENERATION FROM ORNAMENT PATTERN =====
// Original ornament bounding box center: [${n_x__center.toFixed(3)}, ${n_y__center.toFixed(3)}]
// Original ornament radius: ${n_radius__original.toFixed(3)}mm
// Entities: ${n_idx__line} lines, ${n_idx__arc} arcs, ${n_idx__circle} circles
// Hole markers: ${n_cnt__hole} (circles with diameter 1.123mm)

${s_scad_profile_functions}
${s_scad_profile_functions_remover}

// ===== ORNAMENT ENTITIES (centered at origin) =====
${a_s_entity.join('\n')}

// Original radius for scaling calculations
n_radius__original = ${n_radius__original.toFixed(6)};

// ===== TANGENT CONNECTION POINTS (centered at origin) =====
// Points where entities connect tangentially, with rotation angle for joint placement
${a_o_tangent_unique.map((o, idx) =>
    `tangent_point_${idx} = [${(o.o_trn_vec3_connected.n_x - n_x__center).toFixed(6)}, ${(o.o_trn_vec3_connected.n_y - n_y__center).toFixed(6)}, 0];
tangent_point_${idx}_angle = ${o.n_ang_deg_z_entity_a.toFixed(6)};`
).join('\n')}

// ===== UNCONNECTED ENDPOINTS (centered at origin) =====
// Points where entities have no connection, with outward rotation angle
${a_o_endpoint.map((o, idx) =>
    `endpoint_${idx} = [${(o.o_vec3.n_x - n_x__center).toFixed(6)}, ${(o.o_vec3.n_y - n_y__center).toFixed(6)}, 0];
endpoint_${idx}_angle = ${o.n_rotation_deg.toFixed(6)};`
).join('\n')}

// ===== HOLE POSITIONS (from marker circles with diameter 1.123mm) =====
${s_hole_position}

// ===== ARC AND CIRCLE SWEEP FUNCTIONS =====
// Sweep profile along an arc [center, radius, start_angle, end_angle]
module sweep_arc_button_generator(profile, arc_data, n_segments=${n_segment}) {
    center = arc_data[0];
    r = arc_data[1];
    a_start = arc_data[2];
    a_end = arc_data[3];
    a_range = a_end - a_start;

    path = [for (i = [0:n_segments])
        let(a = a_start + (a_range * i / n_segments))
        [center.x + r * cos(a), center.y + r * sin(a), 0]
    ];
    path_sweep(profile, path);
}

// Sweep profile along a full circle [center, radius]
module sweep_circle_button_generator(profile, circle_data, n_segments=${n_segment}) {
    center = circle_data[0];
    r = circle_data[1];

    path = [for (i = [0:n_segments-1])
        let(a = 360 * i / n_segments)
        [center.x + r * cos(a), center.y + r * sin(a), 0]
    ];
    path_sweep(profile, path, closed=true);
}

// Convert 2D line to 3D path
function path2d_button_generator(line) = [[line[0].x, line[0].y, 0], [line[1].x, line[1].y, 0]];

// Scale a 2D entity by factor s
function scale_line_button_generator(line, s) = [[line[0].x*s, line[0].y*s], [line[1].x*s, line[1].y*s]];
function scale_arc_button_generator(arc, s) = [[arc[0].x*s, arc[0].y*s], arc[1]*s, arc[2], arc[3]];
function scale_circle_button_generator(circ, s) = [[circ[0].x*s, circ[0].y*s], circ[1]*s];

// ===== REVOLVE JOINT MODULES =====
// Generic module to revolve any profile around X axis
module revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle=90) {
    rotate([90, 0, 180])
    translate([0, -profile_height, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(profile_for_revolve);
}

// Module to place revolve joints at all tangent connection points (with scaling)
module ${s_name_sketch_ornament}_place_revolve_joints_at_tangent_points(profile_for_revolve, profile_height, s=1, angle=90) {
${a_o_tangent_unique.map((o, idx) =>
    `    translate(tangent_point_${idx} * s)
    rotate([0, 0, tangent_point_${idx}_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);`
).join('\n')}
}

// Module to place revolve joints at unconnected endpoints (with scaling)
module ${s_name_sketch_ornament}_place_revolve_joints_at_endpoints(profile_for_revolve, profile_height, s=1, angle=180) {
${a_o_endpoint.map((o, idx) =>
    `    translate(endpoint_${idx} * s)
    rotate([0, 0, endpoint_${idx}_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);`
).join('\n')}
}

// ===== ORNAMENT SWEEP PATTERN =====
// Sweep all ornament entities with given profile at scale s
module ${s_name_sketch_ornament}_sweep_pattern_button_generator(profile, s=1) {
    union() {
        // Sweep lines
${Array(n_idx__line).fill(0).map((_, n) =>
    `        path_sweep(profile, path2d_button_generator(scale_line_button_generator(line_${n}, s)));`
).join('\n')}

        // Sweep arcs
${Array(n_idx__arc).fill(0).map((_, n) =>
    `        sweep_arc_button_generator(profile, scale_arc_button_generator(arc_${n}, s), n_segments=${n_segment});`
).join('\n')}

        // Sweep circles
${Array(n_idx__circle).fill(0).map((_, n) =>
    `        sweep_circle_button_generator(profile, scale_circle_button_generator(circle_${n}, s), n_segments=${n_segment});`
).join('\n')}
    }
}

// ===== BUTTON MODULE =====
// n_radius_outer: target outer radius of the button (in mm)
// n_thickness_base: thickness of the flat base cylinder (mm)
// n_dia_hole: diameter of button holes (mm)
// n_chamfer: chamfer size at bottom edge (mm)
// Hole positions come from marker circles (diameter 1.123mm) in the DXF
module button_generator(
    n_radius_outer = 10,
    n_thickness_base = 2,
    n_dia_hole = 2.5,
    n_chamfer = 0.5
) {
    // Calculate scale factor accounting for profile half-width
    // The swept profile adds half its width to each side of the path
    // So: outer_edge = ornament_radius * s + profile_half_width * s
    //     n_radius_outer = s * (n_radius__original + profile_half_width)
    //     s = n_radius_outer / (n_radius__original + profile_half_width)
    n_profile_half_width = ${s_name_sketch_profile}_width / 2;
    s = n_radius_outer / (n_radius__original + n_profile_half_width);

    // Profile scale matches ornament scale
    n_scl_profile = s;

    // Z offset: lift ornament by half profile height so bottom sits on base
    n_z_offset = ${s_name_sketch_profile}_height * n_scl_profile / 2;

    difference() {
        union() {
            // Flat base cylinder with chamfer on bottom edge
            color("silver")
            translate([0, 0, -n_thickness_base/2])
            cyl(h=n_thickness_base, r=n_radius_outer, chamfer1=n_chamfer, $fn=64);

            // Ornament pattern with profile - translated up by half profile height
            translate([0, 0, n_z_offset])
            difference() {
                union() {
                    color("gold")
                    ${s_name_sketch_ornament}_sweep_pattern_button_generator(
                        ${s_name_sketch_profile}_mirroredx_scaled(s=n_scl_profile),
                        s=s
                    );

                    // Revolve joints at tangent connection points
                    color("gold")
                    ${s_name_sketch_ornament}_place_revolve_joints_at_tangent_points(
                        ${s_name_sketch_profile}_for_revolve_scaled(s=n_scl_profile),
                        ${s_name_sketch_profile}_height * n_scl_profile,
                        s=s,
                        angle=90
                    );

                    // Revolve joints at unconnected endpoints
                    color("gold")
                    ${s_name_sketch_ornament}_place_revolve_joints_at_endpoints(
                        ${s_name_sketch_profile}_for_revolve_scaled(s=n_scl_profile),
                        ${s_name_sketch_profile}_height * n_scl_profile,
                        s=s,
                        angle=180
                    );
                }

                // Remover profile
                color("red")
                translate([0, 0, ${s_name_sketch_profile_remover}_trn_y * n_scl_profile])
                ${s_name_sketch_ornament}_sweep_pattern_button_generator(
                    ${s_name_sketch_profile_remover}_mirroredx_scaled(s=n_scl_profile),
                    s=s
                );
            }
        }

        // Button holes at positions from marker circles (scaled)
        for(pos = a_pos__hole) {
            translate([pos[0] * s, pos[1] * s, -n_thickness_base - 1])
            cylinder(h=n_thickness_base + ${s_name_sketch_profile}_height * n_scl_profile + n_z_offset + 10, d=n_dia_hole, $fn=24);
        }
    }
}

// ===== GENERATE BUTTONS IN 3 SIZES =====
// Small button: 15mm diameter (radius 7.5mm)
// Medium button: 20mm diameter (radius 10mm)
// Large button: 25mm diameter (radius 12.5mm)
// Hole positions come from marker circles in DXF (diameter 1.123mm)

n_spacing_button = 35;  // spacing between button previews

// Small button (15mm / 24L - suit jacket size)
translate([-n_spacing_button, 0, 0])
button_generator(
    n_radius_outer = 7.5,
    n_thickness_base = 1.2,
    n_dia_hole = 2,
    n_chamfer = 0.4
);

// Medium button (20mm / 32L - overcoat size)
button_generator(
    n_radius_outer = 10,
    n_thickness_base = 1.8,
    n_dia_hole = 2.5,
    n_chamfer = 0.5
);

// Large button (25mm / 40L - statement size)
translate([n_spacing_button, 0, 0])
button_generator(
    n_radius_outer = 12.5,
    n_thickness_base = 2.0,
    n_dia_hole = 3,
    n_chamfer = 0.6
);
`;

    return s_scad;
}

export {
    f_s_scad_var_declation_sketch_entities,
    f_a_o_point__removed_duplicate,
    f_s_scad_profile_functions_from_o_sketch,
    f_s_scad_path_sweep_sketch,
    f_s_scad_cylindric_sweep,
    f_s_scad_button_generator
}