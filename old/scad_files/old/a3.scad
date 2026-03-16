
     include <BOSL2/std.scad>

    
        line_0 = [[8.33333333333334, 1.39e-14], [8.33333333333334, -70.86090709574582]];
line_1 = [[-8.33333333333334, 6.9e-15], [-8.33333333333334, -70.86090709574582]];
line_2 = [[-25, -70.86090709574582], [-6.9e-15, -70.86090709574582]];
line_3 = [[-6.9e-15, -70.86090709574582], [25, -70.86090709574582]];
line_4 = [[-25, -2.78e-14], [-25, -70.86090709574582]];
line_5 = [[25, -70.86090709574582], [25, -2.78e-14]];


        
        
                        arc_0 = [
                [64.1336285619358, 0, 0],  // center
                55.80029522860246,  // radius
                144.8774701986888,  // start angle (degrees)
                180  // end angle (degrees)
            ];


                        arc_1 = [
                [64.1336285619358, 0, 0],  // center
                72.46696189526914,  // radius
                138.68796394636433,  // start angle (degrees)
                180  // end angle (degrees)
            ];


                        arc_2 = [
                [-64.1336285619358, 0, 0],  // center
                72.46696189526914,  // radius
                0,  // start angle (degrees)
                41.31203605363574  // end angle (degrees)
            ];


                        arc_3 = [
                [-64.1336285619358, 0, 0],  // center
                55.80029522860246,  // radius
                0,  // start angle (degrees)
                35.12252980131125  // end angle (degrees)
            ];


                        arc_4 = [
                [57.45032484035034, -9.5e-15, 0],  // center
                82.45032484035036,  // radius
                134.1697996372008,  // start angle (degrees)
                180  // end angle (degrees)
            ];


                        arc_5 = [
                [-57.45032484035034, -6.6e-15, 0],  // center
                82.45032484035036,  // radius
                0,  // start angle (degrees)
                45.83020036279913  // end angle (degrees)
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


    
    
include <BOSL2/std.scad>

// Profile: pr3
// Points: 9 (xpositive), 16 (mirrored)
// Bounds: X[25.0000, 27.3261] Y[0.0000, 2.1526]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
pr3_width = 4.652188;
pr3_height = 1.076315;

// Original DXF position (translation applied to normalize profile)
pr3_trn_x = 25.000000;
pr3_trn_y = 0.000000;

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
pr3_xpositive = [
    [0.000000, 0.545985],
    [0.530330, 1.076315],
    [0.750000, 0.545985],
    [1.467970, 0.545985],
    [2.326094, -0.312139],
    [2.326094, -1.076315],
    [1.163047, -1.076315],
    [0.000000, -1.076315],
    [0.000000, 0.545985]
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
pr3_mirroredx = [
    [0.000000, 0.545985],
    [0.530330, 1.076315],
    [0.750000, 0.545985],
    [1.467970, 0.545985],
    [2.326094, -0.312139],
    [2.326094, -1.076315],
    [1.163047, -1.076315],
    [0.000000, -1.076315],
    [0.000000, 0.545985],
    [0.000000, -1.076315],
    [-1.163047, -1.076315],
    [-2.326094, -1.076315],
    [-2.326094, -0.312139],
    [-1.467970, 0.545985],
    [-0.750000, 0.545985],
    [-0.530330, 1.076315]
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
pr3_rotatedz = [
    [0.545985, 0.000000],
    [1.076315, -0.530330],
    [0.545985, -0.750000],
    [0.545985, -1.467970],
    [-0.312139, -2.326094],
    [-1.076315, -2.326094],
    [-1.076315, -1.163047],
    [-1.076315, 0.000000],
    [0.545985, 0.000000],
    [-1.076315, 0.000000],
    [-1.076315, 1.163047],
    [-1.076315, 2.326094],
    [-0.312139, 2.326094],
    [0.545985, 1.467970],
    [0.545985, 0.750000],
    [1.076315, 0.530330]
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
pr3_for_revolve = [
    [1.622299, 0.000000],
    [2.152630, -0.530330],
    [1.622299, -0.750000],
    [1.622299, -1.467970],
    [0.764176, -2.326094],
    [0.000000, -2.326094],
    [0.000000, -1.163047],
    [0.000000, 0.000000],
    [1.622299, 0.000000],
    [0.000000, 0.000000],
    [0.000000, 1.163047],
    [0.000000, 2.326094],
    [0.764176, 2.326094],
    [1.622299, 1.467970],
    [1.622299, 0.750000],
    [2.152630, 0.530330]
];

// Scaled profile functions
function pr3_xpositive_scaled(s=1) = [for (p = pr3_xpositive) [p.x * s, p.y * s]];
function pr3_mirroredx_scaled(s=1) = [for (p = pr3_mirroredx) [p.x * s, p.y * s]];
function pr3_rotatedz_scaled(s=1) = [for (p = pr3_rotatedz) [p.x * s, p.y * s]];
function pr3_for_revolve_scaled(s=1) = [for (p = pr3_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = pr3_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module pr3_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -pr3_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(pr3_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module pr3_preview(scalefactor=1, test_length=100) {
    spacing_y = pr3_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(pr3_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(pr3_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(pr3_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    pr3_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(pr3_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(pr3_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(pr3_rotatedz_scaled(scalefactor));
    }
}

//pr3_preview();


    
include <BOSL2/std.scad>

// Profile: prr3
// Points: 4 (xpositive), 6 (mirrored)
// Bounds: X[25.0000, 25.5303] Y[1.6223, 2.3723]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
prr3_width = 1.060660;
prr3_height = 0.375000;

// Original DXF position (translation applied to normalize profile)
prr3_trn_x = 25.000000;
prr3_trn_y = 1.622299;

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
prr3_xpositive = [
    [0.000000, -0.375000],
    [0.530330, 0.155330],
    [0.000000, 0.375000],
    [0.000000, -0.375000]
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
prr3_mirroredx = [
    [0.000000, -0.375000],
    [0.530330, 0.155330],
    [0.000000, 0.375000],
    [0.000000, -0.375000],
    [0.000000, 0.375000],
    [-0.530330, 0.155330]
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
prr3_rotatedz = [
    [-0.375000, 0.000000],
    [0.155330, -0.530330],
    [0.375000, 0.000000],
    [-0.375000, 0.000000],
    [0.375000, 0.000000],
    [0.155330, 0.530330]
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
prr3_for_revolve = [
    [0.000000, 0.000000],
    [0.530330, -0.530330],
    [0.750000, 0.000000],
    [0.000000, 0.000000],
    [0.750000, 0.000000],
    [0.530330, 0.530330]
];

// Scaled profile functions
function prr3_xpositive_scaled(s=1) = [for (p = prr3_xpositive) [p.x * s, p.y * s]];
function prr3_mirroredx_scaled(s=1) = [for (p = prr3_mirroredx) [p.x * s, p.y * s]];
function prr3_rotatedz_scaled(s=1) = [for (p = prr3_rotatedz) [p.x * s, p.y * s]];
function prr3_for_revolve_scaled(s=1) = [for (p = prr3_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = prr3_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module prr3_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -prr3_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(prr3_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module prr3_preview(scalefactor=1, test_length=100) {
    spacing_y = prr3_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(prr3_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(prr3_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(prr3_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    prr3_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(prr3_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(prr3_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(prr3_rotatedz_scaled(scalefactor));
    }
}

//prr3_preview();


    
// ===== TANGENT CONNECTION POINTS =====
// Points where entities connect tangentially, with rotation angle for joint placement
a3_tangent_point_0 = [8.333333, 0.000000, 0.000000];
a3_tangent_point_0_angle = -90.000000;
a3_tangent_point_1 = [-8.333333, 0.000000, 0.000000];
a3_tangent_point_1_angle = -90.000000;
a3_tangent_point_2 = [-0.000000, -70.860907, 0.000000];
a3_tangent_point_2_angle = -180.000000;
a3_tangent_point_3 = [-25.000000, -0.000000, 0.000000];
a3_tangent_point_3_angle = -90.000000;
a3_tangent_point_4 = [25.000000, -0.000000, 0.000000];
a3_tangent_point_4_angle = 90.000000;

// ===== UNCONNECTED ENDPOINTS =====
// Points where entities have no connection (line/arc endpoints), with outward rotation angle
a3_endpoint_0 = [8.333333, -70.860907, 0.000000];
a3_endpoint_0_angle = -90.000000;
a3_endpoint_1 = [-8.333333, -70.860907, 0.000000];
a3_endpoint_1_angle = -90.000000;
a3_endpoint_2 = [18.493253, 32.103412, 0.000000];
a3_endpoint_2_angle = 54.877470;
a3_endpoint_3 = [9.701848, 47.839751, 0.000000];
a3_endpoint_3_angle = 48.687964;
a3_endpoint_4 = [-9.701848, 47.839751, 0.000000];
a3_endpoint_4_angle = 131.312036;
a3_endpoint_5 = [-18.493253, 32.103412, 0.000000];
a3_endpoint_5_angle = 125.122530;

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
module a3_place_revolve_joints_at_tangent_points(profile_for_revolve, profile_height, angle=90) {
    translate(a3_tangent_point_0)
    rotate([0, 0, a3_tangent_point_0_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(a3_tangent_point_1)
    rotate([0, 0, a3_tangent_point_1_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(a3_tangent_point_2)
    rotate([0, 0, a3_tangent_point_2_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(a3_tangent_point_3)
    rotate([0, 0, a3_tangent_point_3_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(a3_tangent_point_4)
    rotate([0, 0, a3_tangent_point_4_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
}

// Module to place revolve joints at unconnected endpoints
module a3_place_revolve_joints_at_endpoints(profile_for_revolve, profile_height, angle=180) {
    translate(a3_endpoint_0)
    rotate([0, 0, a3_endpoint_0_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(a3_endpoint_1)
    rotate([0, 0, a3_endpoint_1_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(a3_endpoint_2)
    rotate([0, 0, a3_endpoint_2_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(a3_endpoint_3)
    rotate([0, 0, a3_endpoint_3_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(a3_endpoint_4)
    rotate([0, 0, a3_endpoint_4_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(a3_endpoint_5)
    rotate([0, 0, a3_endpoint_5_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
}

// ===== NON-TANGENT CONNECTION JOINTS =====
// For non-tangent connections, we extend both entities and take their intersection

// Non-tangent connection 0: LINE meets LINE at [-25.000000, -70.860907]
module a3_non_tangent_joint_0(profile) {
    // Local extended entity definitions
    entity_a_extended_0 = [[-30.000000, -70.860907], [-0.000000, -70.860907]];
    entity_b_extended_0 = [[-25.000000, -0.000000], [-25.000000, -75.860907]];
    intersection() {
        path_sweep(profile, path2d(entity_a_extended_0));
        path_sweep(profile, path2d(entity_b_extended_0));
    }
}

// Non-tangent connection 1: LINE meets LINE at [25.000000, -70.860907]
module a3_non_tangent_joint_1(profile) {
    // Local extended entity definitions
    entity_a_extended_1 = [[-0.000000, -70.860907], [30.000000, -70.860907]];
    entity_b_extended_1 = [[25.000000, -75.860907], [25.000000, -0.000000]];
    intersection() {
        path_sweep(profile, path2d(entity_a_extended_1));
        path_sweep(profile, path2d(entity_b_extended_1));
    }
}

// Non-tangent connection 2: ARC meets ARC at [0.000000, 59.139803]
module a3_non_tangent_joint_2(profile) {
    // Local extended entity definitions
    entity_a_extended_2 = [[57.450325, -0.000000, 0.000000], 82.450325, 119.169800, 180.000000];
    entity_b_extended_2 = [[-57.450325, -0.000000, 0.000000], 82.450325, 0.000000, 60.830200];
    intersection() {
        sweep_arc(profile, entity_a_extended_2, n_segments=50);
        sweep_arc(profile, entity_b_extended_2, n_segments=50);
    }
}

// Module to place all non-tangent intersection joints
module a3_place_non_tangent_joints(profile) {
    a3_non_tangent_joint_0(profile);
    a3_non_tangent_joint_1(profile);
    a3_non_tangent_joint_2(profile);
}

// Sweep pattern - sweeps profile along each path (lines, arcs, and circles)
module a3_sweep_pattern(profile) {
    union() {
        // Sweep lines
        
        path_sweep(profile, path2d(line_0));
path_sweep(profile, path2d(line_1));
path_sweep(profile, path2d(line_2));
path_sweep(profile, path2d(line_3));
path_sweep(profile, path2d(line_4));
path_sweep(profile, path2d(line_5));

        // Sweep arcs
        sweep_arc(profile, arc_0, n_segments=50);
sweep_arc(profile, arc_1, n_segments=50);
sweep_arc(profile, arc_2, n_segments=50);
sweep_arc(profile, arc_3, n_segments=50);
sweep_arc(profile, arc_4, n_segments=50);
sweep_arc(profile, arc_5, n_segments=50);

        // Sweep circles
        

    }
}

// Full pattern with tangent joints, endpoint joints, and non-tangent intersection joints
// sweep_profile: 2D points array for path_sweep (typically mirroredx profile)
// joint_profile_for_revolve: 2D points array for revolve joints (x >= 0, typically for_revolve profile)
// joint_profile_height: height of the joint profile (for translation in revolve)
module a3_full_pattern(
    b_make_joints = true,
    b_make_endpoint_joints = true,
    b_make_non_tangent_joints = true,
    sweep_profile = pr3_mirroredx,
    joint_profile_for_revolve = pr3_for_revolve,
    joint_profile_height = pr3_height,
    joint_angle = 90,
    endpoint_joint_angle = 180
    ) {
    union() {
        a3_sweep_pattern(sweep_profile);
        if(b_make_joints){
            a3_place_revolve_joints_at_tangent_points(joint_profile_for_revolve, joint_profile_height, joint_angle);
        }
        if(b_make_endpoint_joints){
            a3_place_revolve_joints_at_endpoints(joint_profile_for_revolve, joint_profile_height, endpoint_joint_angle);
        }
        if(b_make_non_tangent_joints){
            a3_place_non_tangent_joints(sweep_profile);
        }
    }
}

    //pr3_preview();

// Render sweep pattern only
//a3_sweep_pattern(profile_default(scalefactor=0.2));


$fn = 4;
// $fn = 32;
module part_with_difference(s=1){
    difference(){

        color([0.,1.0, 0.5, 0.5])
        a3_full_pattern(
            b_make_joints=true,
            b_make_endpoint_joints=true,
            b_make_non_tangent_joints=true,
            sweep_profile=pr3_mirroredx_scaled(s=s),
            joint_profile_for_revolve=pr3_for_revolve_scaled(s=s),
            joint_profile_height=pr3_height * s,
            joint_angle=90,
            endpoint_joint_angle=180
        );

        color([1.0,0.0, 0.0, 0.5])
        translate([0, 0, prr3_trn_y*s])
        a3_full_pattern(
            b_make_joints=false,
            b_make_endpoint_joints=false,
            b_make_non_tangent_joints=false,
            sweep_profile=prr3_mirroredx_scaled(s=s)
        );
    }
}
part_with_difference(s=0.5);
    