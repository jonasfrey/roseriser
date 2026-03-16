
     include <BOSL2/std.scad>

    
        


        
        
                        arc_0 = [
                [-3.893664422043094, 7.675180092279432, 0],  // center
                3.893664422043093,  // radius
                116.89895105227261,  // start angle (degrees)
                360  // end angle (degrees)
            ];


                        arc_1 = [
                [3.893664422043094, 7.675180092279432, 0],  // center
                3.893664422043093,  // radius
                282.6664693065142,  // start angle (degrees)
                540  // end angle (degrees)
            ];


                        arc_2 = [
                [-4.700068727513036, -7.209602349440687, 0],  // center
                3.893664422043093,  // radius
                236.89895105227254,  // start angle (degrees)
                480  // end angle (degrees)
            ];


                        arc_3 = [
                [2.187158295072709, 1.262756430420553, 0],  // center
                2.187158295072711,  // radius
                95.26438968275467,  // start angle (degrees)
                180  // end angle (degrees)
            ];


                        arc_4 = [
                [-2e-16, -2.525512860841104, 0],  // center
                2.187158295072711,  // radius
                119.99999999999999,  // start angle (degrees)
                204.7356103172453  // end angle (degrees)
            ];


                        arc_5 = [
                [-2.18715829507271, 1.262756430420551, 0],  // center
                2.187158295072711,  // radius
                215.26438968275463,  // start angle (degrees)
                300.0000000000001  // end angle (degrees)
            ];


                        arc_6 = [
                [-2e-16, -2.525512860841104, 0],  // center
                2.187158295072711,  // radius
                335.26438968275465,  // start angle (degrees)
                420.00000000000006  // end angle (degrees)
            ];


                        arc_7 = [
                [2.187158295072709, 1.262756430420553, 0],  // center
                2.187158295072711,  // radius
                239.99999999999997,  // start angle (degrees)
                324.73561031724535  // end angle (degrees)
            ];


                        arc_8 = [
                [-2.18715829507271, 1.262756430420551, 0],  // center
                2.187158295072711,  // radius
                0,  // start angle (degrees)
                84.73561031724535  // end angle (degrees)
            ];


                        arc_9 = [
                [8.593733149556128, -0.465577742838748, 0],  // center
                3.893664422043093,  // radius
                356.8989510522725,  // start angle (degrees)
                599.9999999999999  // end angle (degrees)
            ];


                        arc_10 = [
                [21.65063509461098, -12.50000000000002, 0],  // center
                21.65063509461099,  // radius
                119.99999999999999,  // start angle (degrees)
                180  // end angle (degrees)
            ];


                        arc_11 = [
                [-8.593733149556128, -0.4655777428387415, 0],  // center
                3.893664422043093,  // radius
                42.66646930651419,  // start angle (degrees)
                300.00000000000006  // end angle (degrees)
            ];


                        arc_12 = [
                [-21.65063509461099, -12.50000000000001, 0],  // center
                21.65063509461099,  // radius
                0,  // start angle (degrees)
                59.99999999999999  // end angle (degrees)
            ];


                        arc_13 = [
                [4.700068727513031, -7.209602349440692, 0],  // center
                3.893664422043093,  // radius
                162.6664693065142,  // start angle (degrees)
                420  // end angle (degrees)
            ];


                        arc_14 = [
                [-1.2e-15, 25.00000000000003, 0],  // center
                21.65063509461099,  // radius
                239.99999999999997,  // start angle (degrees)
                300.00000000000006  // end angle (degrees)
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
    [0, 0, 0],  // center
    12.5  // radius
];


                circle_1 = [
    [-2e-16, -2.525512860841104, 0],  // center
    0.5615  // radius
];


                circle_2 = [
    [-2.18715829507271, 1.262756430420551, 0],  // center
    0.5615  // radius
];


                circle_3 = [
    [2.187158295072709, 1.262756430420553, 0],  // center
    0.5615  // radius
];


                circle_4 = [
    [0, 0, 0],  // center
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
but_s1_v10_tangent_point_0 = [-0.000000, 7.675180, 0.000000];
but_s1_v10_tangent_point_0_angle = -90.000000;
but_s1_v10_tangent_point_1 = [-6.646901, -3.837590, 0.000000];
but_s1_v10_tangent_point_1_angle = 30.000000;
but_s1_v10_tangent_point_2 = [-0.000000, 1.262756, 0.000000];
but_s1_v10_tangent_point_2_angle = 90.000000;
but_s1_v10_tangent_point_3 = [-1.093579, -0.631378, 0.000000];
but_s1_v10_tangent_point_3_angle = -150.000000;
but_s1_v10_tangent_point_4 = [1.093579, -0.631378, 0.000000];
but_s1_v10_tangent_point_4_angle = -30.000000;
but_s1_v10_tangent_point_5 = [6.646901, -3.837590, 0.000000];
but_s1_v10_tangent_point_5_angle = 150.000000;
but_s1_v10_tangent_point_6 = [-0.000000, -12.500000, 0.000000];
but_s1_v10_tangent_point_6_angle = 90.000000;
but_s1_v10_tangent_point_7 = [10.825318, 6.250000, 0.000000];
but_s1_v10_tangent_point_7_angle = -150.000000;
but_s1_v10_tangent_point_8 = [-10.825318, 6.250000, 0.000000];
but_s1_v10_tangent_point_8_angle = -30.000000;

// ===== UNCONNECTED ENDPOINTS =====
// Points where entities have no connection (line/arc endpoints), with outward rotation angle
but_s1_v10_endpoint_0 = [-5.655230, 11.147573, 0.000000];
but_s1_v10_endpoint_0_angle = 26.898951;
but_s1_v10_endpoint_1 = [4.747449, 3.876276, 0.000000];
but_s1_v10_endpoint_1_angle = 192.666469;
but_s1_v10_endpoint_2 = [-6.826466, -10.471359, 0.000000];
but_s1_v10_endpoint_2_angle = 146.898951;
but_s1_v10_endpoint_3 = [1.986483, 3.440689, 0.000000];
but_s1_v10_endpoint_3_angle = 5.264390;
but_s1_v10_endpoint_4 = [-1.986483, -3.440689, 0.000000];
but_s1_v10_endpoint_4_angle = 294.735610;
but_s1_v10_endpoint_5 = [-3.972966, 0.000000, 0.000000];
but_s1_v10_endpoint_5_angle = 125.264390;
but_s1_v10_endpoint_6 = [1.986483, -3.440689, 0.000000];
but_s1_v10_endpoint_6_angle = 245.264390;
but_s1_v10_endpoint_7 = [3.972966, 0.000000, 0.000000];
but_s1_v10_endpoint_7_angle = 414.735610;
but_s1_v10_endpoint_8 = [-1.986483, 3.440689, 0.000000];
but_s1_v10_endpoint_8_angle = 174.735610;
but_s1_v10_endpoint_9 = [12.481696, -0.676214, 0.000000];
but_s1_v10_endpoint_9_angle = 266.898951;
but_s1_v10_endpoint_10 = [-5.730678, 2.173273, 0.000000];
but_s1_v10_endpoint_10_angle = -47.333531;
but_s1_v10_endpoint_11 = [0.983229, -6.049549, 0.000000];
but_s1_v10_endpoint_11_angle = 72.666469;

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
module but_s1_v10_place_revolve_joints_at_tangent_points(profile_for_revolve, profile_height, angle=90) {
    translate(but_s1_v10_tangent_point_0)
    rotate([0, 0, but_s1_v10_tangent_point_0_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_tangent_point_1)
    rotate([0, 0, but_s1_v10_tangent_point_1_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_tangent_point_2)
    rotate([0, 0, but_s1_v10_tangent_point_2_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_tangent_point_3)
    rotate([0, 0, but_s1_v10_tangent_point_3_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_tangent_point_4)
    rotate([0, 0, but_s1_v10_tangent_point_4_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_tangent_point_5)
    rotate([0, 0, but_s1_v10_tangent_point_5_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_tangent_point_6)
    rotate([0, 0, but_s1_v10_tangent_point_6_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_tangent_point_7)
    rotate([0, 0, but_s1_v10_tangent_point_7_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_tangent_point_8)
    rotate([0, 0, but_s1_v10_tangent_point_8_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
}

// Module to place revolve joints at unconnected endpoints
module but_s1_v10_place_revolve_joints_at_endpoints(profile_for_revolve, profile_height, angle=180) {
    translate(but_s1_v10_endpoint_0)
    rotate([0, 0, but_s1_v10_endpoint_0_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_1)
    rotate([0, 0, but_s1_v10_endpoint_1_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_2)
    rotate([0, 0, but_s1_v10_endpoint_2_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_3)
    rotate([0, 0, but_s1_v10_endpoint_3_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_4)
    rotate([0, 0, but_s1_v10_endpoint_4_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_5)
    rotate([0, 0, but_s1_v10_endpoint_5_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_6)
    rotate([0, 0, but_s1_v10_endpoint_6_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_7)
    rotate([0, 0, but_s1_v10_endpoint_7_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_8)
    rotate([0, 0, but_s1_v10_endpoint_8_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_9)
    rotate([0, 0, but_s1_v10_endpoint_9_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_10)
    rotate([0, 0, but_s1_v10_endpoint_10_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(but_s1_v10_endpoint_11)
    rotate([0, 0, but_s1_v10_endpoint_11_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
}

// ===== EXTENSION PARAMETERS =====
// Adjust these to control how far entities are extended for non-tangent joints
line_extension_amount = 30; // mm for lines
arc_extension_degrees = 30; // degrees for arcs

// ===== NON-TANGENT CONNECTION JOINTS =====
// For non-tangent connections, we extend both entities and take their intersection


// Module to place all non-tangent intersection joints
module but_s1_v10_place_non_tangent_joints(profile) {

}

// Sweep pattern - sweeps profile along each path (lines, arcs, and circles)
module but_s1_v10_sweep_pattern(profile) {
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
sweep_arc(profile, arc_13, n_segments=50);
sweep_arc(profile, arc_14, n_segments=50);

        // Sweep circles
        sweep_circle(profile, circle_0, n_segments=50);
sweep_circle(profile, circle_1, n_segments=50);
sweep_circle(profile, circle_2, n_segments=50);
sweep_circle(profile, circle_3, n_segments=50);
sweep_circle(profile, circle_4, n_segments=50);

    }
}

// Full pattern with tangent joints, endpoint joints, and non-tangent intersection joints
// sweep_profile: 2D points array for path_sweep (typically mirroredx profile)
// joint_profile_for_revolve: 2D points array for revolve joints (x >= 0, typically for_revolve profile)
// joint_profile_height: height of the joint profile (for translation in revolve)
module but_s1_v10_full_pattern(
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
        but_s1_v10_sweep_pattern(sweep_profile);
        if(b_make_joints){
            but_s1_v10_place_revolve_joints_at_tangent_points(joint_profile_for_revolve, joint_profile_height, joint_angle);
        }
        if(b_make_endpoint_joints){
            but_s1_v10_place_revolve_joints_at_endpoints(joint_profile_for_revolve, joint_profile_height, endpoint_joint_angle);
        }
        if(b_make_non_tangent_joints){
            but_s1_v10_place_non_tangent_joints(sweep_profile);
        }
    }
}

    //p_4h_preview();

// Render sweep pattern only
//but_s1_v10_sweep_pattern(profile_default(scalefactor=0.2));


$fn = 4;
// $fn = 32;
module part_with_difference(s=1){
    difference(){

        color([0.,1.0, 0.5, 0.5])
        but_s1_v10_full_pattern(
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
        but_s1_v10_full_pattern(
            b_make_joints=false,
            b_make_endpoint_joints=false,
            b_make_non_tangent_joints=true,
            sweep_profile=pr_4h_mirroredx_scaled(s=s)
        );
    }
}
part_with_difference(s=1.0);
    