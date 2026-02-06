
     include <BOSL2/std.scad>

    
        


        
        
                        arc_0 = [
                [8.744288993582558, -5.048517604316777, 0],  // center
                2.402964791366456,  // radius
                329.99999999999994,  // start angle (degrees)
                464.9999999999999  // end angle (degrees)
            ];


                        arc_1 = [
                [2.858251384861306, -1.650212206461298, 0],  // center
                2.402964791366455,  // radius
                14.99999999999993,  // start angle (degrees)
                150.00000000000003  // end angle (degrees)
            ];


                        arc_2 = [
                [-4.102117490294196, -6.292383709749661, 0],  // center
                2.402964791366455,  // radius
                164.99999999999997,  // start angle (degrees)
                435  // end angle (degrees)
            ];


                        arc_3 = [
                [-2.858251384861307, -1.650212206461296, 0],  // center
                2.402964791366455,  // radius
                254.99999999999994,  // start angle (degrees)
                390  // end angle (degrees)
            ];


                        arc_4 = [
                [-8.744288993582561, -5.04851760431677, 0],  // center
                2.402964791366456,  // radius
                210,  // start angle (degrees)
                345  // end angle (degrees)
            ];


                        arc_5 = [
                [7.500422888149672, -0.4063461010284119, 0],  // center
                2.402964791366455,  // radius
                285,  // start angle (degrees)
                554.9999999999999  // end angle (degrees)
            ];


                        arc_6 = [
                [0, 3.300424412922593, 0],  // center
                2.402964791366455,  // radius
                134.99999999999991,  // start angle (degrees)
                270  // end angle (degrees)
            ];


                        arc_7 = [
                [0, 6.69872981077807, 0],  // center
                5.801270189221932,  // radius
                90,  // start angle (degrees)
                300.00000000000006  // end angle (degrees)
            ];


                        arc_8 = [
                [5.801270189221934, -3.349364905389032, 0],  // center
                5.801270189221932,  // radius
                329.99999999999994,  // start angle (degrees)
                539.9999999999999  // end angle (degrees)
            ];


                        arc_9 = [
                [-5.801270189221934, -3.349364905389032, 0],  // center
                5.801270189221932,  // radius
                210,  // start angle (degrees)
                419.99999999999994  // end angle (degrees)
            ];


                        arc_10 = [
                [-3.398305397855477, 6.69872981077807, 0],  // center
                2.402964791366455,  // radius
                45,  // start angle (degrees)
                315  // end angle (degrees)
            ];


                        arc_11 = [
                [4e-16, 10.09703520863355, 0],  // center
                2.402964791366456,  // radius
                90.00000000000006,  // start angle (degrees)
                225  // end angle (degrees)
            ];


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

        
                circle_0 = [
    [2.858251384861306, -1.650212206461298, 0],  // center
    0.5615  // radius
];


                circle_1 = [
    [-2.858251384861307, -1.650212206461296, 0],  // center
    0.5615  // radius
];


                circle_2 = [
    [0, 3.300424412922593, 0],  // center
    0.5615  // radius
];


                circle_3 = [
    [0, 8e-16, 0],  // center
    12.5  // radius
];
   
        
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


    
    
include <BOSL2/std.scad>

// Profile: p_4h
// Points: 8 (xpositive), 11 (mirrored)
// Bounds: X[0.0000, 2.0000] Y[0.0000, 3.0000]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
p_4h_width = 4.000000;
p_4h_height = 1.500000;

// Original DXF position (translation applied to normalize profile)
p_4h_trn_x = 0.000000;
p_4h_trn_y = 0.000000;

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
p_4h_xpositive = [
    [0.000000, -1.500000],
    [2.000000, -1.500000],
    [1.446655, 0.020302],
    [1.046613, 0.020302],
    [0.508047, 1.500000],
    [0.000000, 1.500000],
    [0.000000, 0.000000]
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
p_4h_mirroredx = [
    [0.000000, -1.500000],
    [2.000000, -1.500000],
    [1.446655, 0.020302],
    [1.046613, 0.020302],
    [0.508047, 1.500000],
    [0.000000, 1.500000],
    [0.000000, 0.000000],
    [-0.508047, 1.500000],
    [-1.046613, 0.020302],
    [-1.446655, 0.020302],
    [-2.000000, -1.500000]
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
p_4h_rotatedz = [
    [-1.500000, 0.000000],
    [-1.500000, -2.000000],
    [0.020302, -1.446655],
    [0.020302, -1.046613],
    [1.500000, -0.508047],
    [1.500000, 0.000000],
    [0.000000, 0.000000],
    [1.500000, 0.508047],
    [0.020302, 1.046613],
    [0.020302, 1.446655],
    [-1.500000, 2.000000]
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
p_4h_for_revolve = [
    [0.000000, 0.000000],
    [0.000000, -2.000000],
    [1.520302, -1.446655],
    [1.520302, -1.046613],
    [3.000000, -0.508047],
    [3.000000, 0.000000],
    [1.500000, 0.000000],
    [3.000000, 0.508047],
    [1.520302, 1.046613],
    [1.520302, 1.446655],
    [0.000000, 2.000000]
];

// Scaled profile functions
function p_4h_xpositive_scaled(s=1) = [for (p = p_4h_xpositive) [p.x * s, p.y * s]];
function p_4h_mirroredx_scaled(s=1) = [for (p = p_4h_mirroredx) [p.x * s, p.y * s]];
function p_4h_rotatedz_scaled(s=1) = [for (p = p_4h_rotatedz) [p.x * s, p.y * s]];
function p_4h_for_revolve_scaled(s=1) = [for (p = p_4h_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = p_4h_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module p_4h_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -p_4h_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(p_4h_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module p_4h_preview(scalefactor=1, test_length=100) {
    spacing_y = p_4h_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(p_4h_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(p_4h_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(p_4h_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    p_4h_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(p_4h_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(p_4h_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(p_4h_rotatedz_scaled(scalefactor));
    }
}

//p_4h_preview();


    
include <BOSL2/std.scad>

// Profile: pr_4h
// Points: 9 (xpositive), 12 (mirrored)
// Bounds: X[0.0000, 0.2100] Y[1.0804, 4.2647]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
pr_4h_width = 0.420000;
pr_4h_height = 1.592189;

// Original DXF position (translation applied to normalize profile)
pr_4h_trn_x = 0.000000;
pr_4h_trn_y = 1.080355;

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
pr_4h_xpositive = [
    [0.000000, 1.592189],
    [0.210000, 1.592189],
    [0.210000, 0.530730],
    [0.210000, -0.530730],
    [0.210000, -1.592189],
    [0.000000, -1.592189],
    [0.000000, -0.530730],
    [0.000000, 0.530730]
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
pr_4h_mirroredx = [
    [0.000000, 1.592189],
    [0.210000, 1.592189],
    [0.210000, 0.530730],
    [0.210000, -0.530730],
    [0.210000, -1.592189],
    [0.000000, -1.592189],
    [0.000000, -0.530730],
    [0.000000, 0.530730],
    [-0.210000, -1.592189],
    [-0.210000, -0.530730],
    [-0.210000, 0.530730],
    [-0.210000, 1.592189]
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
pr_4h_rotatedz = [
    [1.592189, 0.000000],
    [1.592189, -0.210000],
    [0.530730, -0.210000],
    [-0.530730, -0.210000],
    [-1.592189, -0.210000],
    [-1.592189, 0.000000],
    [-0.530730, 0.000000],
    [0.530730, 0.000000],
    [-1.592189, 0.210000],
    [-0.530730, 0.210000],
    [0.530730, 0.210000],
    [1.592189, 0.210000]
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
pr_4h_for_revolve = [
    [3.184379, 0.000000],
    [3.184379, -0.210000],
    [2.122919, -0.210000],
    [1.061460, -0.210000],
    [0.000000, -0.210000],
    [0.000000, 0.000000],
    [1.061460, 0.000000],
    [2.122919, 0.000000],
    [0.000000, 0.210000],
    [1.061460, 0.210000],
    [2.122919, 0.210000],
    [3.184379, 0.210000]
];

// Scaled profile functions
function pr_4h_xpositive_scaled(s=1) = [for (p = pr_4h_xpositive) [p.x * s, p.y * s]];
function pr_4h_mirroredx_scaled(s=1) = [for (p = pr_4h_mirroredx) [p.x * s, p.y * s]];
function pr_4h_rotatedz_scaled(s=1) = [for (p = pr_4h_rotatedz) [p.x * s, p.y * s]];
function pr_4h_for_revolve_scaled(s=1) = [for (p = pr_4h_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = pr_4h_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module pr_4h_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -pr_4h_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(pr_4h_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module pr_4h_preview(scalefactor=1, test_length=100) {
    spacing_y = pr_4h_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(pr_4h_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(pr_4h_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(pr_4h_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    pr_4h_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(pr_4h_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(pr_4h_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(pr_4h_rotatedz_scaled(scalefactor));
    }
}

//pr_4h_preview();



// ===== TANGENT CONNECTION POINTS =====
// Points where entities connect tangentially, with rotation angle for joint placement
but_s1_v1_tangent_point_0 = [8.122356, -2.727432, 0.000000];
but_s1_v1_tangent_point_0_angle = 15.000000;
but_s1_v1_tangent_point_1 = [10.825318, -6.250000, 0.000000];
but_s1_v1_tangent_point_1_angle = 60.000000;
but_s1_v1_tangent_point_2 = [5.179337, -1.028279, 0.000000];
but_s1_v1_tangent_point_2_angle = 105.000000;
but_s1_v1_tangent_point_3 = [-3.480184, -3.971298, 0.000000];
but_s1_v1_tangent_point_3_angle = -15.000000;
but_s1_v1_tangent_point_4 = [-6.423203, -5.670451, 0.000000];
but_s1_v1_tangent_point_4_angle = -105.000000;
but_s1_v1_tangent_point_5 = [-10.825318, -6.250000, 0.000000];
but_s1_v1_tangent_point_5_angle = -60.000000;
but_s1_v1_tangent_point_6 = [-1.699153, 4.999577, 0.000000];
but_s1_v1_tangent_point_6_angle = -135.000000;
but_s1_v1_tangent_point_7 = [0.000000, 12.500000, 0.000000];
but_s1_v1_tangent_point_7_angle = 180.000000;
but_s1_v1_tangent_point_8 = [-1.699153, 8.397883, 0.000000];
but_s1_v1_tangent_point_8_angle = 135.000000;

// ===== UNCONNECTED ENDPOINTS =====
// Points where entities have no connection (line/arc endpoints), with outward rotation angle
but_s1_v1_endpoint_0 = [0.777223, -0.448730, 0.000000];
but_s1_v1_endpoint_0_angle = 240.000000;
but_s1_v1_endpoint_1 = [-0.777223, -0.448730, 0.000000];
but_s1_v1_endpoint_1_angle = 480.000000;
but_s1_v1_endpoint_2 = [-0.000000, 0.897460, 0.000000];
but_s1_v1_endpoint_2_angle = 360.000000;
but_s1_v1_endpoint_3 = [2.900635, 1.674682, 0.000000];
but_s1_v1_endpoint_3_angle = 390.000000;
but_s1_v1_endpoint_4 = [0.000000, -3.349365, 0.000000];
but_s1_v1_endpoint_4_angle = 630.000000;
but_s1_v1_endpoint_5 = [-2.900635, 1.674682, 0.000000];
but_s1_v1_endpoint_5_angle = 510.000000;

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
module but_s1_v1_place_revolve_joints_at_tangent_points(profile_for_revolve, profile_height, angle=90) {
    translate(but_s1_v1_tangent_point_0)
    rotate([0, 0, but_s1_v1_tangent_point_0_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_tangent_point_1)
    rotate([0, 0, but_s1_v1_tangent_point_1_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_tangent_point_2)
    rotate([0, 0, but_s1_v1_tangent_point_2_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_tangent_point_3)
    rotate([0, 0, but_s1_v1_tangent_point_3_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_tangent_point_4)
    rotate([0, 0, but_s1_v1_tangent_point_4_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_tangent_point_5)
    rotate([0, 0, but_s1_v1_tangent_point_5_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_tangent_point_6)
    rotate([0, 0, but_s1_v1_tangent_point_6_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_tangent_point_7)
    rotate([0, 0, but_s1_v1_tangent_point_7_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_tangent_point_8)
    rotate([0, 0, but_s1_v1_tangent_point_8_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
}

// Module to place revolve joints at unconnected endpoints
module but_s1_v1_place_revolve_joints_at_endpoints(profile_for_revolve, profile_height, angle=180) {
    translate(but_s1_v1_endpoint_0)
    rotate([0, 0, but_s1_v1_endpoint_0_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_endpoint_1)
    rotate([0, 0, but_s1_v1_endpoint_1_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_endpoint_2)
    rotate([0, 0, but_s1_v1_endpoint_2_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_endpoint_3)
    rotate([0, 0, but_s1_v1_endpoint_3_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_endpoint_4)
    rotate([0, 0, but_s1_v1_endpoint_4_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v1_endpoint_5)
    rotate([0, 0, but_s1_v1_endpoint_5_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
}

// ===== EXTENSION PARAMETERS =====
// Adjust these to control how far entities are extended for non-tangent joints
line_extension_amount = 30; // mm for lines
arc_extension_degrees = 30; // degrees for arcs

// ===== NON-TANGENT CONNECTION JOINTS =====
// For non-tangent connections, we extend both entities and take their intersection


// Module to place all non-tangent intersection joints
module but_s1_v1_place_non_tangent_joints(profile) {

}

// Sweep pattern - sweeps profile along each path (lines, arcs, and circles)
module but_s1_v1_sweep_pattern(profile) {
    union() {
        // Sweep lines

        

        // Sweep arcs
        sweep_arc(profile, arc_0, n_segments=50);
sweep_arc(profile, arc_1, n_segments=50);
sweep_arc(profile, arc_2, n_segments=50);
sweep_arc(profile, arc_3, n_segments=50);
sweep_arc(profile, arc_4, n_segments=50);
sweep_arc(profile, arc_5, n_segments=50);
sweep_arc(profile, arc_6, n_segments=50);
sweep_arc(profile, arc_7, n_segments=50);
sweep_arc(profile, arc_8, n_segments=50);
sweep_arc(profile, arc_9, n_segments=50);
sweep_arc(profile, arc_10, n_segments=50);
sweep_arc(profile, arc_11, n_segments=50);

        // Sweep circles
        sweep_circle(profile, circle_0, n_segments=50);
sweep_circle(profile, circle_1, n_segments=50);
sweep_circle(profile, circle_2, n_segments=50);
sweep_circle(profile, circle_3, n_segments=50);

    }
}

// Full pattern with tangent joints, endpoint joints, and non-tangent intersection joints
// sweep_profile: 2D points array for path_sweep (typically mirroredx profile)
// joint_profile_for_revolve: 2D points array for revolve joints (x >= 0, typically for_revolve profile)
// joint_profile_height: height of the joint profile (for translation in revolve)
module but_s1_v1_full_pattern(
    b_make_joints = true,
    b_make_endpoint_joints = true,
    b_make_non_tangent_joints = true,
    sweep_profile = p_4h_mirroredx,
    joint_profile_for_revolve = p_4h_for_revolve,
    joint_profile_height = p_4h_height,
    joint_angle = 90,
    endpoint_joint_angle = 180
    ) {
    union() {
        but_s1_v1_sweep_pattern(sweep_profile);
        if(b_make_joints){
            but_s1_v1_place_revolve_joints_at_tangent_points(joint_profile_for_revolve, joint_profile_height, joint_angle);
        }
        if(b_make_endpoint_joints){
            but_s1_v1_place_revolve_joints_at_endpoints(joint_profile_for_revolve, joint_profile_height, endpoint_joint_angle);
        }
        if(b_make_non_tangent_joints){
            but_s1_v1_place_non_tangent_joints(sweep_profile);
        }
    }
}

    //p_4h_preview();

// Render sweep pattern only
//but_s1_v1_sweep_pattern(profile_default(scalefactor=0.2));


$fn = 4;
// $fn = 32;
module part_with_difference(s=1){
    difference(){

        color([0.,1.0, 0.5, 0.5])
        but_s1_v1_full_pattern(
            b_make_joints=true,
            b_make_endpoint_joints=true,
            b_make_non_tangent_joints=true,
            sweep_profile=p_4h_mirroredx_scaled(s=s),
            joint_profile_for_revolve=p_4h_for_revolve_scaled(s=s),
            joint_profile_height=p_4h_height * s,
            joint_angle=90,
            endpoint_joint_angle=180
        );

        color([1.0,0.0, 0.0, 0.5])
        translate([0, 0, pr_4h_trn_y*s])
        but_s1_v1_full_pattern(
            b_make_joints=false,
            b_make_endpoint_joints=false,
            b_make_non_tangent_joints=true,
            sweep_profile=pr_4h_mirroredx_scaled(s=s)
        );
    }
}
part_with_difference(s=1.0);
    