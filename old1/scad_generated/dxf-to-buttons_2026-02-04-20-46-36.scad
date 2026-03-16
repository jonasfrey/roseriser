
include <BOSL2/std.scad>

// ===== BUTTON GENERATION FROM ORNAMENT PATTERN =====
// Original ornament bounding box center: [0.000, 0.000]
// Original ornament radius: 12.500mm
// Entities: 3 lines, 9 arcs, 1 circles
// Hole markers: 3 (circles with diameter 1.123mm)


include <BOSL2/std.scad>

// Profile: p_4
// Points: 7 (xpositive), 12 (mirrored)
// Bounds: X[0.0000, 1.6667] Y[0.0000, 2.0000]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
p_4_width = 3.333333;
p_4_height = 1.000000;

// Original DXF position (translation applied to normalize profile)
p_4_trn_x = 0.000000;
p_4_trn_y = 0.000000;

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
p_4_xpositive = [
    [0.000000, -1.000000],
    [1.666667, -1.000000],
    [1.277887, 0.068163],
    [0.850108, 0.068163],
    [0.510947, 1.000000],
    [0.000000, 1.000000],
    [0.000000, -1.000000]
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
p_4_mirroredx = [
    [0.000000, -1.000000],
    [1.666667, -1.000000],
    [1.277887, 0.068163],
    [0.850108, 0.068163],
    [0.510947, 1.000000],
    [0.000000, 1.000000],
    [0.000000, -1.000000],
    [0.000000, 1.000000],
    [-0.510947, 1.000000],
    [-0.850108, 0.068163],
    [-1.277887, 0.068163],
    [-1.666667, -1.000000]
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
p_4_rotatedz = [
    [-1.000000, 0.000000],
    [-1.000000, -1.666667],
    [0.068163, -1.277887],
    [0.068163, -0.850108],
    [1.000000, -0.510947],
    [1.000000, 0.000000],
    [-1.000000, 0.000000],
    [1.000000, 0.000000],
    [1.000000, 0.510947],
    [0.068163, 0.850108],
    [0.068163, 1.277887],
    [-1.000000, 1.666667]
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
p_4_for_revolve = [
    [0.000000, 0.000000],
    [0.000000, -1.666667],
    [1.068163, -1.277887],
    [1.068163, -0.850108],
    [2.000000, -0.510947],
    [2.000000, 0.000000],
    [0.000000, 0.000000],
    [2.000000, 0.000000],
    [2.000000, 0.510947],
    [1.068163, 0.850108],
    [1.068163, 1.277887],
    [0.000000, 1.666667]
];

// Scaled profile functions
function p_4_xpositive_scaled(s=1) = [for (p = p_4_xpositive) [p.x * s, p.y * s]];
function p_4_mirroredx_scaled(s=1) = [for (p = p_4_mirroredx) [p.x * s, p.y * s]];
function p_4_rotatedz_scaled(s=1) = [for (p = p_4_rotatedz) [p.x * s, p.y * s]];
function p_4_for_revolve_scaled(s=1) = [for (p = p_4_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = p_4_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module p_4_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -p_4_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(p_4_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module p_4_preview(scalefactor=1, test_length=100) {
    spacing_y = p_4_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(p_4_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(p_4_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(p_4_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    p_4_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(p_4_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(p_4_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(p_4_rotatedz_scaled(scalefactor));
    }
}

//p_4_preview();



include <BOSL2/std.scad>

// Profile: pr_4
// Points: 5 (xpositive), 8 (mirrored)
// Bounds: X[0.0000, 0.2100] Y[0.4116, 2.2428]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
pr_4_width = 0.420000;
pr_4_height = 0.915617;

// Original DXF position (translation applied to normalize profile)
pr_4_trn_x = 0.000000;
pr_4_trn_y = 0.411579;

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
pr_4_xpositive = [
    [0.000000, 0.915617],
    [0.210000, 0.915617],
    [0.210000, -0.915617],
    [0.000000, -0.915617],
    [0.000000, 0.915617]
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
pr_4_mirroredx = [
    [0.000000, 0.915617],
    [0.210000, 0.915617],
    [0.210000, -0.915617],
    [0.000000, -0.915617],
    [0.000000, 0.915617],
    [0.000000, -0.915617],
    [-0.210000, -0.915617],
    [-0.210000, 0.915617]
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
pr_4_rotatedz = [
    [0.915617, 0.000000],
    [0.915617, -0.210000],
    [-0.915617, -0.210000],
    [-0.915617, 0.000000],
    [0.915617, 0.000000],
    [-0.915617, 0.000000],
    [-0.915617, 0.210000],
    [0.915617, 0.210000]
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
pr_4_for_revolve = [
    [1.831234, 0.000000],
    [1.831234, -0.210000],
    [0.000000, -0.210000],
    [0.000000, 0.000000],
    [1.831234, 0.000000],
    [0.000000, 0.000000],
    [0.000000, 0.210000],
    [1.831234, 0.210000]
];

// Scaled profile functions
function pr_4_xpositive_scaled(s=1) = [for (p = pr_4_xpositive) [p.x * s, p.y * s]];
function pr_4_mirroredx_scaled(s=1) = [for (p = pr_4_mirroredx) [p.x * s, p.y * s]];
function pr_4_rotatedz_scaled(s=1) = [for (p = pr_4_rotatedz) [p.x * s, p.y * s]];
function pr_4_for_revolve_scaled(s=1) = [for (p = pr_4_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = pr_4_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module pr_4_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -pr_4_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(pr_4_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module pr_4_preview(scalefactor=1, test_length=100) {
    spacing_y = pr_4_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(pr_4_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(pr_4_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(pr_4_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    pr_4_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(pr_4_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(pr_4_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(pr_4_rotatedz_scaled(scalefactor));
    }
}

//pr_4_preview();



// ===== ORNAMENT ENTITIES (centered at origin) =====
arc_0 = [[2.900635, 6.698730], 2.900635, 0.000000, 180.000000];
line_0 = [[-2.900635, 1.674682], [0.000000, 0.000000]];
line_1 = [[2.900635, 1.674682], [-0.000000, -0.000000]];
arc_1 = [[5.801270, -3.349365], 5.801270, 180.000000, 480.000000];
circle_0 = [[0.000000, 0.000000], 12.500000];
arc_2 = [[0.000000, 6.698730], 5.801270, 300.000000, 600.000000];
arc_3 = [[-2.900635, 6.698730], 2.900635, 0.000000, 180.000000];
arc_4 = [[-7.251588, -0.837341], 2.900635, 120.000000, 300.000000];
arc_5 = [[-4.350953, -5.861389], 2.900635, 120.000000, 300.000000];
arc_6 = [[4.350953, -5.861389], 2.900635, 240.000000, 420.000000];
arc_7 = [[7.251588, -0.837341], 2.900635, 240.000000, 420.000000];
line_2 = [[-0.000000, -3.349365], [0.000000, 0.000000]];
arc_8 = [[-5.801270, -3.349365], 5.801270, 60.000000, 360.000000];

// Original radius for scaling calculations
n_radius__original = 12.500000;

// ===== TANGENT CONNECTION POINTS (centered at origin) =====
// Points where entities connect tangentially, with rotation angle for joint placement
tangent_point_0 = [-0.000000, 6.698730, 0];
tangent_point_0_angle = 90.000000;
tangent_point_1 = [-2.900635, 1.674682, 0];
tangent_point_1_angle = -30.000000;
tangent_point_2 = [2.900635, 1.674682, 0];
tangent_point_2_angle = -150.000000;
tangent_point_3 = [0.000000, -3.349365, 0];
tangent_point_3_angle = -90.000000;
tangent_point_4 = [-5.801270, -3.349365, 0];
tangent_point_4_angle = -150.000000;
tangent_point_5 = [5.801270, -3.349365, 0];
tangent_point_5_angle = -30.000000;

// ===== UNCONNECTED ENDPOINTS (centered at origin) =====
// Points where entities have no connection, with outward rotation angle
endpoint_0 = [5.801270, 6.698730, 0];
endpoint_0_angle = -90.000000;
endpoint_1 = [-5.801270, 6.698730, 0];
endpoint_1_angle = 270.000000;
endpoint_2 = [-8.701905, 1.674682, 0];
endpoint_2_angle = 30.000000;
endpoint_3 = [-2.900635, -8.373412, 0];
endpoint_3_angle = 390.000000;
endpoint_4 = [2.900635, -8.373412, 0];
endpoint_4_angle = 150.000000;
endpoint_5 = [8.701905, 1.674682, 0];
endpoint_5_angle = 510.000000;

// ===== HOLE POSITIONS (from marker circles with diameter 1.123mm) =====
a_pos__hole = [
    [0.000000, 4.085425],
    [-3.538082, -2.042712],
    [3.538082, -2.042712]
];

// ===== ARC AND CIRCLE SWEEP FUNCTIONS =====
// Sweep profile along an arc [center, radius, start_angle, end_angle]
module sweep_arc_button_generator(profile, arc_data, n_segments=32) {
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
module sweep_circle_button_generator(profile, circle_data, n_segments=32) {
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
module but_s1_v4_place_revolve_joints_at_tangent_points(profile_for_revolve, profile_height, s=1, angle=90) {
    translate(tangent_point_0 * s)
    rotate([0, 0, tangent_point_0_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
    translate(tangent_point_1 * s)
    rotate([0, 0, tangent_point_1_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
    translate(tangent_point_2 * s)
    rotate([0, 0, tangent_point_2_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
    translate(tangent_point_3 * s)
    rotate([0, 0, tangent_point_3_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
    translate(tangent_point_4 * s)
    rotate([0, 0, tangent_point_4_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
    translate(tangent_point_5 * s)
    rotate([0, 0, tangent_point_5_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
}

// Module to place revolve joints at unconnected endpoints (with scaling)
module but_s1_v4_place_revolve_joints_at_endpoints(profile_for_revolve, profile_height, s=1, angle=180) {
    translate(endpoint_0 * s)
    rotate([0, 0, endpoint_0_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
    translate(endpoint_1 * s)
    rotate([0, 0, endpoint_1_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
    translate(endpoint_2 * s)
    rotate([0, 0, endpoint_2_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
    translate(endpoint_3 * s)
    rotate([0, 0, endpoint_3_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
    translate(endpoint_4 * s)
    rotate([0, 0, endpoint_4_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
    translate(endpoint_5 * s)
    rotate([0, 0, endpoint_5_angle])
    revolve_profile_around_x_button_generator(profile_for_revolve, profile_height, angle);
}

// ===== ORNAMENT SWEEP PATTERN =====
// Sweep all ornament entities with given profile at scale s
module but_s1_v4_sweep_pattern_button_generator(profile, s=1) {
    union() {
        // Sweep lines
        path_sweep(profile, path2d_button_generator(scale_line_button_generator(line_0, s)));
        path_sweep(profile, path2d_button_generator(scale_line_button_generator(line_1, s)));
        path_sweep(profile, path2d_button_generator(scale_line_button_generator(line_2, s)));

        // Sweep arcs
        sweep_arc_button_generator(profile, scale_arc_button_generator(arc_0, s), n_segments=32);
        sweep_arc_button_generator(profile, scale_arc_button_generator(arc_1, s), n_segments=32);
        sweep_arc_button_generator(profile, scale_arc_button_generator(arc_2, s), n_segments=32);
        sweep_arc_button_generator(profile, scale_arc_button_generator(arc_3, s), n_segments=32);
        sweep_arc_button_generator(profile, scale_arc_button_generator(arc_4, s), n_segments=32);
        sweep_arc_button_generator(profile, scale_arc_button_generator(arc_5, s), n_segments=32);
        sweep_arc_button_generator(profile, scale_arc_button_generator(arc_6, s), n_segments=32);
        sweep_arc_button_generator(profile, scale_arc_button_generator(arc_7, s), n_segments=32);
        sweep_arc_button_generator(profile, scale_arc_button_generator(arc_8, s), n_segments=32);

        // Sweep circles
        sweep_circle_button_generator(profile, scale_circle_button_generator(circle_0, s), n_segments=32);
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
    n_profile_half_width = p_4_width / 2;
    s = n_radius_outer / (n_radius__original + n_profile_half_width);

    // Profile scale matches ornament scale
    n_scl_profile = s;

    // Z offset: lift ornament by half profile height so bottom sits on base
    n_z_offset = p_4_height * n_scl_profile / 2;

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
                    but_s1_v4_sweep_pattern_button_generator(
                        p_4_mirroredx_scaled(s=n_scl_profile),
                        s=s
                    );

                    // Revolve joints at tangent connection points
                    color("gold")
                    but_s1_v4_place_revolve_joints_at_tangent_points(
                        p_4_for_revolve_scaled(s=n_scl_profile),
                        p_4_height * n_scl_profile,
                        s=s,
                        angle=90
                    );

                    // Revolve joints at unconnected endpoints
                    color("gold")
                    but_s1_v4_place_revolve_joints_at_endpoints(
                        p_4_for_revolve_scaled(s=n_scl_profile),
                        p_4_height * n_scl_profile,
                        s=s,
                        angle=180
                    );
                }

                // Remover profile
                color("red")
                translate([0, 0, pr_4_trn_y * n_scl_profile])
                but_s1_v4_sweep_pattern_button_generator(
                    pr_4_mirroredx_scaled(s=n_scl_profile),
                    s=s
                );
            }
        }

        // Button holes at positions from marker circles (scaled)
        for(pos = a_pos__hole) {
            translate([pos[0] * s, pos[1] * s, -n_thickness_base - 1])
            cylinder(h=n_thickness_base + p_4_height * n_scl_profile + n_z_offset + 10, d=n_dia_hole, $fn=24);
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
