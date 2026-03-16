
     include <BOSL2/std.scad>

    
        


        
        
                        arc_0 = [
                [-3.289246510180158, -1.899047358083551, 0],  // center
                2.900635094610966,  // radius
                210,  // start angle (degrees)
                390  // end angle (degrees)
            ];


                        arc_1 = [
                [-8.31329386826371, -4.799682452694516, 0],  // center
                2.900635094610966,  // radius
                210.0000000000001,  // start angle (degrees)
                390  // end angle (degrees)
            ];


                        arc_2 = [
                [0, 9.599364905389036, 0],  // center
                2.900635094610966,  // radius
                90.00000000000006,  // start angle (degrees)
                270  // end angle (degrees)
            ];


                        arc_3 = [
                [8.313293868263706, -4.799682452694522, 0],  // center
                2.900635094610966,  // radius
                329.99999999999994,  // start angle (degrees)
                510  // end angle (degrees)
            ];


                        arc_4 = [
                [3.289246510180157, -1.899047358083553, 0],  // center
                2.900635094610966,  // radius
                329.99999999999994,  // start angle (degrees)
                510  // end angle (degrees)
            ];


                        arc_5 = [
                [-5.801270189221934, -3.349364905389032, 0],  // center
                5.801270189221932,  // radius
                210,  // start angle (degrees)
                419.99999999999994  // end angle (degrees)
            ];


                        arc_6 = [
                [0, 6.69872981077807, 0],  // center
                5.801270189221932,  // radius
                90,  // start angle (degrees)
                300.00000000000006  // end angle (degrees)
            ];


                        arc_7 = [
                [5.801270189221934, -3.349364905389032, 0],  // center
                5.801270189221932,  // radius
                329.99999999999994,  // start angle (degrees)
                539.9999999999999  // end angle (degrees)
            ];


                        arc_8 = [
                [1.3e-15, 6.698729810778073, 0],  // center
                5.801270189221932,  // radius
                90,  // start angle (degrees)
                239.99999999999997  // end angle (degrees)
            ];


                        arc_9 = [
                [0, 6.698729810778071, 0],  // center
                5.801270189221933,  // radius
                239.99999999999997,  // start angle (degrees)
                300.00000000000006  // end angle (degrees)
            ];


                        arc_10 = [
                [5.801270189221932, -3.349364905389029, 0],  // center
                5.801270189221932,  // radius
                329.99999999999994,  // start angle (degrees)
                480.0000000000001  // end angle (degrees)
            ];


                        arc_11 = [
                [-3.2e-15, 3e-15, 0],  // center
                12.5,  // radius
                329.99999999999994,  // start angle (degrees)
                450  // end angle (degrees)
            ];


                        arc_12 = [
                [0, 3.798094716167103, 0],  // center
                2.900635094610966,  // radius
                90,  // start angle (degrees)
                270  // end angle (degrees)
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
    [0, 3.798094716167103, 0],  // center
    0.5615  // radius
];


                circle_1 = [
    [3.289246510180157, -1.899047358083553, 0],  // center
    0.5615  // radius
];


                circle_2 = [
    [-3.289246510180158, -1.899047358083551, 0],  // center
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

// Profile: p
// Points: 22 (xpositive), 44 (mirrored)
// Bounds: X[0.0000, 8.2485] Y[0.0000, 4.5148]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
p_width = 16.497058;
p_height = 2.257397;

// Original DXF position (translation applied to normalize profile)
p_trn_x = 0.000000;
p_trn_y = 0.000000;

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
p_xpositive = [
    [2.004175, 2.257397],
    [2.635323, 2.257397],
    [3.768848, 0.906515],
    [4.696101, 0.906515],
    [5.339817, 0.139364],
    [5.983533, -0.627787],
    [6.881125, -0.627787],
    [7.564827, -1.442592],
    [8.248529, -2.257397],
    [7.217463, -2.257397],
    [6.186397, -2.257397],
    [5.155331, -2.257397],
    [4.124264, -2.257397],
    [3.093198, -2.257397],
    [2.062132, -2.257397],
    [1.031066, -2.257397],
    [0.000000, -2.257397],
    [0.000000, -1.194241],
    [0.000000, -0.131086],
    [0.668058, 0.665075],
    [1.336117, 1.461236],
    [2.004175, 2.257397]
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
p_mirroredx = [
    [2.004175, 2.257397],
    [2.635323, 2.257397],
    [3.768848, 0.906515],
    [4.696101, 0.906515],
    [5.339817, 0.139364],
    [5.983533, -0.627787],
    [6.881125, -0.627787],
    [7.564827, -1.442592],
    [8.248529, -2.257397],
    [7.217463, -2.257397],
    [6.186397, -2.257397],
    [5.155331, -2.257397],
    [4.124264, -2.257397],
    [3.093198, -2.257397],
    [2.062132, -2.257397],
    [1.031066, -2.257397],
    [0.000000, -2.257397],
    [0.000000, -1.194241],
    [0.000000, -0.131086],
    [0.668058, 0.665075],
    [1.336117, 1.461236],
    [2.004175, 2.257397],
    [-2.004175, 2.257397],
    [-1.336117, 1.461236],
    [-0.668058, 0.665075],
    [0.000000, -0.131086],
    [0.000000, -1.194241],
    [0.000000, -2.257397],
    [-1.031066, -2.257397],
    [-2.062132, -2.257397],
    [-3.093198, -2.257397],
    [-4.124264, -2.257397],
    [-5.155331, -2.257397],
    [-6.186397, -2.257397],
    [-7.217463, -2.257397],
    [-8.248529, -2.257397],
    [-7.564827, -1.442592],
    [-6.881125, -0.627787],
    [-5.983533, -0.627787],
    [-5.339817, 0.139364],
    [-4.696101, 0.906515],
    [-3.768848, 0.906515],
    [-2.635323, 2.257397],
    [-2.004175, 2.257397]
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
p_rotatedz = [
    [2.257397, -2.004175],
    [2.257397, -2.635323],
    [0.906515, -3.768848],
    [0.906515, -4.696101],
    [0.139364, -5.339817],
    [-0.627787, -5.983533],
    [-0.627787, -6.881125],
    [-1.442592, -7.564827],
    [-2.257397, -8.248529],
    [-2.257397, -7.217463],
    [-2.257397, -6.186397],
    [-2.257397, -5.155331],
    [-2.257397, -4.124264],
    [-2.257397, -3.093198],
    [-2.257397, -2.062132],
    [-2.257397, -1.031066],
    [-2.257397, 0.000000],
    [-1.194241, 0.000000],
    [-0.131086, 0.000000],
    [0.665075, -0.668058],
    [1.461236, -1.336117],
    [2.257397, -2.004175],
    [2.257397, 2.004175],
    [1.461236, 1.336117],
    [0.665075, 0.668058],
    [-0.131086, 0.000000],
    [-1.194241, 0.000000],
    [-2.257397, 0.000000],
    [-2.257397, 1.031066],
    [-2.257397, 2.062132],
    [-2.257397, 3.093198],
    [-2.257397, 4.124264],
    [-2.257397, 5.155331],
    [-2.257397, 6.186397],
    [-2.257397, 7.217463],
    [-2.257397, 8.248529],
    [-1.442592, 7.564827],
    [-0.627787, 6.881125],
    [-0.627787, 5.983533],
    [0.139364, 5.339817],
    [0.906515, 4.696101],
    [0.906515, 3.768848],
    [2.257397, 2.635323],
    [2.257397, 2.004175]
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
p_for_revolve = [
    [4.514793, -2.004175],
    [4.514793, -2.635323],
    [3.163911, -3.768848],
    [3.163911, -4.696101],
    [2.396760, -5.339817],
    [1.629609, -5.983533],
    [1.629609, -6.881125],
    [0.814805, -7.564827],
    [0.000000, -8.248529],
    [0.000000, -7.217463],
    [0.000000, -6.186397],
    [0.000000, -5.155331],
    [0.000000, -4.124264],
    [0.000000, -3.093198],
    [0.000000, -2.062132],
    [0.000000, -1.031066],
    [0.000000, 0.000000],
    [1.063155, 0.000000],
    [2.126311, 0.000000],
    [2.922471, -0.668058],
    [3.718632, -1.336117],
    [4.514793, -2.004175],
    [4.514793, 2.004175],
    [3.718632, 1.336117],
    [2.922471, 0.668058],
    [2.126311, 0.000000],
    [1.063155, 0.000000],
    [0.000000, 0.000000],
    [0.000000, 1.031066],
    [0.000000, 2.062132],
    [0.000000, 3.093198],
    [0.000000, 4.124264],
    [0.000000, 5.155331],
    [0.000000, 6.186397],
    [0.000000, 7.217463],
    [0.000000, 8.248529],
    [0.814805, 7.564827],
    [1.629609, 6.881125],
    [1.629609, 5.983533],
    [2.396760, 5.339817],
    [3.163911, 4.696101],
    [3.163911, 3.768848],
    [4.514793, 2.635323],
    [4.514793, 2.004175]
];

// Scaled profile functions
function p_xpositive_scaled(s=1) = [for (p = p_xpositive) [p.x * s, p.y * s]];
function p_mirroredx_scaled(s=1) = [for (p = p_mirroredx) [p.x * s, p.y * s]];
function p_rotatedz_scaled(s=1) = [for (p = p_rotatedz) [p.x * s, p.y * s]];
function p_for_revolve_scaled(s=1) = [for (p = p_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = p_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module p_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -p_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(p_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module p_preview(scalefactor=1, test_length=100) {
    spacing_y = p_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(p_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(p_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(p_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    p_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(p_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(p_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(p_rotatedz_scaled(scalefactor));
    }
}

//p_preview();


    
include <BOSL2/std.scad>

// Profile: pr
// Points: 8 (xpositive), 16 (mirrored)
// Bounds: X[-0.0000, 2.0042] Y[2.1263, 4.5148]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
pr_width = 4.008350;
pr_height = 1.194241;

// Original DXF position (translation applied to normalize profile)
pr_trn_x = -0.000000;
pr_trn_y = 2.126311;

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
pr_xpositive = [
    [2.004175, 1.194241],
    [1.336117, 0.398080],
    [0.668058, -0.398080],
    [0.000000, -1.194241],
    [0.000000, -0.000000],
    [0.000000, 1.194241],
    [1.002087, 1.194241],
    [2.004175, 1.194241]
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
pr_mirroredx = [
    [2.004175, 1.194241],
    [1.336117, 0.398080],
    [0.668058, -0.398080],
    [0.000000, -1.194241],
    [0.000000, -0.000000],
    [0.000000, 1.194241],
    [1.002087, 1.194241],
    [2.004175, 1.194241],
    [-2.004175, 1.194241],
    [-1.002087, 1.194241],
    [-0.000000, 1.194241],
    [-0.000000, -0.000000],
    [0.000000, -1.194241],
    [-0.668058, -0.398080],
    [-1.336117, 0.398080],
    [-2.004175, 1.194241]
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
pr_rotatedz = [
    [1.194241, -2.004175],
    [0.398080, -1.336117],
    [-0.398080, -0.668058],
    [-1.194241, 0.000000],
    [-0.000000, -0.000000],
    [1.194241, -0.000000],
    [1.194241, -1.002087],
    [1.194241, -2.004175],
    [1.194241, 2.004175],
    [1.194241, 1.002087],
    [1.194241, 0.000000],
    [-0.000000, 0.000000],
    [-1.194241, 0.000000],
    [-0.398080, 0.668058],
    [0.398080, 1.336117],
    [1.194241, 2.004175]
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
pr_for_revolve = [
    [2.388482, -2.004175],
    [1.592322, -1.336117],
    [0.796161, -0.668058],
    [0.000000, 0.000000],
    [1.194241, -0.000000],
    [2.388482, -0.000000],
    [2.388482, -1.002087],
    [2.388482, -2.004175],
    [2.388482, 2.004175],
    [2.388482, 1.002087],
    [2.388482, 0.000000],
    [1.194241, 0.000000],
    [0.000000, 0.000000],
    [0.796161, 0.668058],
    [1.592322, 1.336117],
    [2.388482, 2.004175]
];

// Scaled profile functions
function pr_xpositive_scaled(s=1) = [for (p = pr_xpositive) [p.x * s, p.y * s]];
function pr_mirroredx_scaled(s=1) = [for (p = pr_mirroredx) [p.x * s, p.y * s]];
function pr_rotatedz_scaled(s=1) = [for (p = pr_rotatedz) [p.x * s, p.y * s]];
function pr_for_revolve_scaled(s=1) = [for (p = pr_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = pr_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module pr_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -pr_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(pr_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module pr_preview(scalefactor=1, test_length=100) {
    spacing_y = pr_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(pr_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(pr_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(pr_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    pr_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(pr_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(pr_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(pr_rotatedz_scaled(scalefactor));
    }
}

//pr_preview();


    
// ===== TANGENT CONNECTION POINTS =====
// Points where entities connect tangentially, with rotation angle for joint placement
but_s1_v2_tangent_point_0 = [-5.801270, -3.349365, 0.000000];
but_s1_v2_tangent_point_0_angle = -60.000000;
but_s1_v2_tangent_point_1 = [-10.825318, -6.250000, 0.000000];
but_s1_v2_tangent_point_1_angle = -60.000000;
but_s1_v2_tangent_point_2 = [-0.000000, 12.500000, 0.000000];
but_s1_v2_tangent_point_2_angle = -180.000000;
but_s1_v2_tangent_point_3 = [-0.000000, 6.698730, 0.000000];
but_s1_v2_tangent_point_3_angle = 180.000000;
but_s1_v2_tangent_point_4 = [5.801270, -3.349365, 0.000000];
but_s1_v2_tangent_point_4_angle = 60.000000;
but_s1_v2_tangent_point_5 = [10.825318, -6.250000, 0.000000];
but_s1_v2_tangent_point_5_angle = 60.000000;
but_s1_v2_tangent_point_6 = [-2.900635, 1.674682, 0.000000];
but_s1_v2_tangent_point_6_angle = -30.000000;
but_s1_v2_tangent_point_7 = [2.900635, 1.674682, 0.000000];
but_s1_v2_tangent_point_7_angle = -150.000000;

// ===== UNCONNECTED ENDPOINTS =====
// Points where entities have no connection (line/arc endpoints), with outward rotation angle
but_s1_v2_endpoint_0 = [-0.777223, -0.448730, 0.000000];
but_s1_v2_endpoint_0_angle = 480.000000;
but_s1_v2_endpoint_1 = [0.777223, -0.448730, 0.000000];
but_s1_v2_endpoint_1_angle = 600.000000;
but_s1_v2_endpoint_2 = [0.000000, -3.349365, 0.000000];
but_s1_v2_endpoint_2_angle = 630.000000;
but_s1_v2_endpoint_3 = [-0.000000, 0.897460, 0.000000];
but_s1_v2_endpoint_3_angle = 360.000000;

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
module but_s1_v2_place_revolve_joints_at_tangent_points(profile_for_revolve, profile_height, angle=90) {
    translate(but_s1_v2_tangent_point_0)
    rotate([0, 0, but_s1_v2_tangent_point_0_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v2_tangent_point_1)
    rotate([0, 0, but_s1_v2_tangent_point_1_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v2_tangent_point_2)
    rotate([0, 0, but_s1_v2_tangent_point_2_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v2_tangent_point_3)
    rotate([0, 0, but_s1_v2_tangent_point_3_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v2_tangent_point_4)
    rotate([0, 0, but_s1_v2_tangent_point_4_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v2_tangent_point_5)
    rotate([0, 0, but_s1_v2_tangent_point_5_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v2_tangent_point_6)
    rotate([0, 0, but_s1_v2_tangent_point_6_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v2_tangent_point_7)
    rotate([0, 0, but_s1_v2_tangent_point_7_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
}

// Module to place revolve joints at unconnected endpoints
module but_s1_v2_place_revolve_joints_at_endpoints(profile_for_revolve, profile_height, angle=180) {
    translate(but_s1_v2_endpoint_0)
    rotate([0, 0, but_s1_v2_endpoint_0_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v2_endpoint_1)
    rotate([0, 0, but_s1_v2_endpoint_1_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v2_endpoint_2)
    rotate([0, 0, but_s1_v2_endpoint_2_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v2_endpoint_3)
    rotate([0, 0, but_s1_v2_endpoint_3_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
}

// ===== EXTENSION PARAMETERS =====
// Adjust these to control how far entities are extended for non-tangent joints
line_extension_amount = 82.48528944915863; // mm for lines
arc_extension_degrees = 30; // degrees for arcs

// ===== NON-TANGENT CONNECTION JOINTS =====
// For non-tangent connections, we extend both entities and take their intersection


// Module to place all non-tangent intersection joints
module but_s1_v2_place_non_tangent_joints(profile) {

}

// Sweep pattern - sweeps profile along each path (lines, arcs, and circles)
module but_s1_v2_sweep_pattern(profile) {
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
sweep_arc(profile, arc_12, n_segments=50);

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
module but_s1_v2_full_pattern(
    b_make_joints = true,
    b_make_endpoint_joints = true,
    b_make_non_tangent_joints = true,
    sweep_profile = p_mirroredx,
    joint_profile_for_revolve = p_for_revolve,
    joint_profile_height = p_height,
    joint_angle = 90,
    endpoint_joint_angle = 180
    ) {
    union() {
        but_s1_v2_sweep_pattern(sweep_profile);
        if(b_make_joints){
            but_s1_v2_place_revolve_joints_at_tangent_points(joint_profile_for_revolve, joint_profile_height, joint_angle);
        }
        if(b_make_endpoint_joints){
            but_s1_v2_place_revolve_joints_at_endpoints(joint_profile_for_revolve, joint_profile_height, endpoint_joint_angle);
        }
        if(b_make_non_tangent_joints){
            but_s1_v2_place_non_tangent_joints(sweep_profile);
        }
    }
}

    //p_preview();

// Render sweep pattern only
//but_s1_v2_sweep_pattern(profile_default(scalefactor=0.2));


$fn = 4;
// $fn = 32;
module part_with_difference(s=1){
    difference(){

        color([0.,1.0, 0.5, 0.5])
        but_s1_v2_full_pattern(
            b_make_joints=true,
            b_make_endpoint_joints=true,
            b_make_non_tangent_joints=true,
            sweep_profile=p_mirroredx_scaled(s=s),
            joint_profile_for_revolve=p_for_revolve_scaled(s=s),
            joint_profile_height=p_height * s,
            joint_angle=90,
            endpoint_joint_angle=180
        );

        color([1.0,0.0, 0.0, 0.5])
        translate([0, 0, pr_trn_y*s])
        but_s1_v2_full_pattern(
            b_make_joints=false,
            b_make_endpoint_joints=false,
            b_make_non_tangent_joints=true,
            sweep_profile=pr_mirroredx_scaled(s=s)
        );
    }
}
part_with_difference(s=1.0);
    