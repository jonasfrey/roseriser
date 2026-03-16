
     include <BOSL2/std.scad>

    
        line_0 = [[0, 0], [0, 41.46421700716019]];
line_1 = [[-6.9e-15, 20.7321085035801], [22.96664513655823, 41.09481968736178]];
line_2 = [[3.33334455607094, 23.68752197680259], [14.91931360214949, -1.04e-14]];


        
        
                        arc_0 = [
                [27.37781964242458, 36.11955492044038, 0],  // center
                6.649189425950713,  // radius
                270,  // start angle (degrees)
                491.5608719349592  // end angle (degrees)
            ];


                        arc_1 = [
                [-6.939931156023794, 41.46421700716019, 0],  // center
                6.939931156023794,  // radius
                0,  // start angle (degrees)
                245.12552321637776  // end angle (degrees)
            ];


                        arc_2 = [
                [18.58472353525553, 1.792814211116895, 0],  // center
                4.080369195709523,  // radius
                206.064041676885,  // start angle (degrees)
                449.99999999999994  // end angle (degrees)
            ];


                        arc_3 = [
                [-6.546296644955873, 0, 0],  // center
                6.546296644955873,  // radius
                116.9112268397885,  // start angle (degrees)
                360  // end angle (degrees)
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

// Profile: p_classic
// Points: 9 (xpositive), 16 (mirrored)
// Bounds: X[0.0000, 2.5000] Y[0.0000, 2.2942]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
p_classic_width = 5.000000;
p_classic_height = 1.147114;

// Original DXF position (translation applied to normalize profile)
p_classic_trn_x = 0.000000;
p_classic_trn_y = 0.000000;

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
p_classic_xpositive = [
    [0.000000, -1.147114],
    [1.250000, -1.147114],
    [2.500000, -1.147114],
    [2.500000, -0.911052],
    [1.374692, 0.214256],
    [0.932858, 0.214256],
    [0.000000, 1.147114],
    [0.000000, -0.000000],
    [0.000000, -1.147114]
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
p_classic_mirroredx = [
    [0.000000, -1.147114],
    [1.250000, -1.147114],
    [2.500000, -1.147114],
    [2.500000, -0.911052],
    [1.374692, 0.214256],
    [0.932858, 0.214256],
    [0.000000, 1.147114],
    [0.000000, -0.000000],
    [0.000000, -1.147114],
    [0.000000, -0.000000],
    [-0.000000, 1.147114],
    [-0.932858, 0.214256],
    [-1.374692, 0.214256],
    [-2.500000, -0.911052],
    [-2.500000, -1.147114],
    [-1.250000, -1.147114]
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
p_classic_rotatedz = [
    [-1.147114, 0.000000],
    [-1.147114, -1.250000],
    [-1.147114, -2.500000],
    [-0.911052, -2.500000],
    [0.214256, -1.374692],
    [0.214256, -0.932858],
    [1.147114, -0.000000],
    [-0.000000, 0.000000],
    [-1.147114, 0.000000],
    [-0.000000, 0.000000],
    [1.147114, 0.000000],
    [0.214256, 0.932858],
    [0.214256, 1.374692],
    [-0.911052, 2.500000],
    [-1.147114, 2.500000],
    [-1.147114, 1.250000]
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
p_classic_for_revolve = [
    [0.000000, 0.000000],
    [0.000000, -1.250000],
    [0.000000, -2.500000],
    [0.236061, -2.500000],
    [1.361370, -1.374692],
    [1.361370, -0.932858],
    [2.294228, -0.000000],
    [1.147114, 0.000000],
    [0.000000, 0.000000],
    [1.147114, 0.000000],
    [2.294228, 0.000000],
    [1.361370, 0.932858],
    [1.361370, 1.374692],
    [0.236061, 2.500000],
    [0.000000, 2.500000],
    [0.000000, 1.250000]
];

// Scaled profile functions
function p_classic_xpositive_scaled(s=1) = [for (p = p_classic_xpositive) [p.x * s, p.y * s]];
function p_classic_mirroredx_scaled(s=1) = [for (p = p_classic_mirroredx) [p.x * s, p.y * s]];
function p_classic_rotatedz_scaled(s=1) = [for (p = p_classic_rotatedz) [p.x * s, p.y * s]];
function p_classic_for_revolve_scaled(s=1) = [for (p = p_classic_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = p_classic_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module p_classic_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -p_classic_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(p_classic_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module p_classic_preview(scalefactor=1, test_length=100) {
    spacing_y = p_classic_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(p_classic_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(p_classic_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(p_classic_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    p_classic_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(p_classic_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(p_classic_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(p_classic_rotatedz_scaled(scalefactor));
    }
}

//p_classic_preview();


    
include <BOSL2/std.scad>

// Profile: pr_classicv3
// Points: 9 (xpositive), 18 (mirrored)
// Bounds: X[0.0000, 1.3590] Y[0.4942, 3.4664]

// Profile bounding box
// Width = max X * 2 (for mirrored profile)
// Height = max Y after centering (half of total Y range)
pr_classicv3_width = 2.717961;
pr_classicv3_height = 1.486103;

// Original DXF position (translation applied to normalize profile)
pr_classicv3_trn_x = 0.000000;
pr_classicv3_trn_y = 0.494228;

// Half profile from DXF (x-positive side, right half)
// Useful for rotate_extrude which requires x >= 0
pr_classicv3_xpositive = [
    [1.358981, 1.486103],
    [0.432858, 1.486103],
    [0.000000, 1.486103],
    [0.000000, 0.000000],
    [0.000000, -1.486103],
    [0.432858, -1.486103],
    [0.432858, -0.198757],
    [1.358981, -0.198757],
    [1.358981, 1.486103]
];

// Full symmetric profile (mirrored from xpositive, pre-computed)
pr_classicv3_mirroredx = [
    [1.358981, 1.486103],
    [0.432858, 1.486103],
    [0.000000, 1.486103],
    [0.000000, 0.000000],
    [0.000000, -1.486103],
    [0.432858, -1.486103],
    [0.432858, -0.198757],
    [1.358981, -0.198757],
    [1.358981, 1.486103],
    [-1.358981, 1.486103],
    [-1.358981, -0.198757],
    [-0.432858, -0.198757],
    [-0.432858, -1.486103],
    [0.000000, -1.486103],
    [0.000000, 0.000000],
    [0.000000, 1.486103],
    [-0.432858, 1.486103],
    [-1.358981, 1.486103]
];

// Full profile rotated 90 degrees clockwise around Z axis (pre-computed)
pr_classicv3_rotatedz = [
    [1.486103, -1.358981],
    [1.486103, -0.432858],
    [1.486103, 0.000000],
    [0.000000, 0.000000],
    [-1.486103, 0.000000],
    [-1.486103, -0.432858],
    [-0.198757, -0.432858],
    [-0.198757, -1.358981],
    [1.486103, -1.358981],
    [1.486103, 1.358981],
    [-0.198757, 1.358981],
    [-0.198757, 0.432858],
    [-1.486103, 0.432858],
    [-1.486103, 0.000000],
    [0.000000, 0.000000],
    [1.486103, 0.000000],
    [1.486103, 0.432858],
    [1.486103, 1.358981]
];

// Profile prepared for rotate_extrude around X axis (pre-computed)
pr_classicv3_for_revolve = [
    [2.972207, -1.358981],
    [2.972207, -0.432858],
    [2.972207, 0.000000],
    [1.486103, 0.000000],
    [0.000000, 0.000000],
    [0.000000, -0.432858],
    [1.287346, -0.432858],
    [1.287346, -1.358981],
    [2.972207, -1.358981],
    [2.972207, 1.358981],
    [1.287346, 1.358981],
    [1.287346, 0.432858],
    [0.000000, 0.432858],
    [0.000000, 0.000000],
    [1.486103, 0.000000],
    [2.972207, 0.000000],
    [2.972207, 0.432858],
    [2.972207, 1.358981]
];

// Scaled profile functions
function pr_classicv3_xpositive_scaled(s=1) = [for (p = pr_classicv3_xpositive) [p.x * s, p.y * s]];
function pr_classicv3_mirroredx_scaled(s=1) = [for (p = pr_classicv3_mirroredx) [p.x * s, p.y * s]];
function pr_classicv3_rotatedz_scaled(s=1) = [for (p = pr_classicv3_rotatedz) [p.x * s, p.y * s]];
function pr_classicv3_for_revolve_scaled(s=1) = [for (p = pr_classicv3_for_revolve) [p.x * s, p.y * s]];

// Default profile (mirrored, for path_sweep)
function profile_default(scalefactor=1) = pr_classicv3_mirroredx_scaled(scalefactor);

// Module to revolve the profile around the X axis
module pr_classicv3_revolve_around_x(scalefactor=1, angle=90) {
    rotate([90, 0, 180])
    translate([0, -pr_classicv3_height * scalefactor, 0])
    rotate_extrude(angle=angle, convexity=10)
    polygon(pr_classicv3_for_revolve_scaled(scalefactor));
}

// Preview module - shows all profile variants
module pr_classicv3_preview(scalefactor=1, test_length=100) {
    spacing_y = pr_classicv3_height * scalefactor * 4 + 10;
    test_line = [[0, 0, 0], [test_length, 0, 0]];

    // Swept profiles
    color("red")
    path_sweep(pr_classicv3_mirroredx_scaled(scalefactor), test_line);

    translate([0, spacing_y, 0])
    color("green")
    path_sweep(pr_classicv3_xpositive_scaled(scalefactor), test_line);

    translate([0, spacing_y * 2, 0])
    color("blue")
    path_sweep(pr_classicv3_rotatedz_scaled(scalefactor), test_line);

    // Revolve around X axis (90 degree turn)
    translate([0, spacing_y * 3, 0])
    color("purple")
    pr_classicv3_revolve_around_x(scalefactor, 90);

    // 2D profiles for reference
    translate([test_length + 20, 0, 0]) {
        color("red", 0.5)
        linear_extrude(1)
        polygon(pr_classicv3_mirroredx_scaled(scalefactor));

        translate([0, spacing_y, 0])
        color("green", 0.5)
        linear_extrude(1)
        polygon(pr_classicv3_xpositive_scaled(scalefactor));

        translate([0, spacing_y * 2, 0])
        color("blue", 0.5)
        linear_extrude(1)
        polygon(pr_classicv3_rotatedz_scaled(scalefactor));
    }
}

//pr_classicv3_preview();


    
// ===== TANGENT CONNECTION POINTS =====
// Points where entities connect tangentially, with rotation angle for joint placement
k_tangent_point_0 = [22.966645, 41.094820, 0.000000];
k_tangent_point_0_angle = 41.560872;
k_tangent_point_1 = [0.000000, 41.464217, 0.000000];
k_tangent_point_1_angle = 90.000000;
k_tangent_point_2 = [0.000000, 0.000000, 0.000000];
k_tangent_point_2_angle = 90.000000;
k_tangent_point_3 = [14.919314, -0.000000, 0.000000];
k_tangent_point_3_angle = -63.935958;

// ===== UNCONNECTED ENDPOINTS =====
// Points where entities have no connection (line/arc endpoints), with outward rotation angle
k_endpoint_0 = [27.377820, 29.470365, 0.000000];
k_endpoint_0_angle = 180.000000;
k_endpoint_1 = [-9.859086, 35.168093, 0.000000];
k_endpoint_1_angle = 335.125523;
k_endpoint_2 = [18.584724, 5.873183, 0.000000];
k_endpoint_2_angle = 540.000000;
k_endpoint_3 = [-9.509212, 5.837391, 0.000000];
k_endpoint_3_angle = 26.911227;
k_endpoint_4 = [-0.000000, 20.732109, 0.000000];
k_endpoint_4_angle = 221.560872;
k_endpoint_5 = [3.333345, 23.687522, 0.000000];
k_endpoint_5_angle = 116.064042;

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
module k_place_revolve_joints_at_tangent_points(profile_for_revolve, profile_height, angle=90) {
    translate(k_tangent_point_0)
    rotate([0, 0, k_tangent_point_0_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(k_tangent_point_1)
    rotate([0, 0, k_tangent_point_1_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(k_tangent_point_2)
    rotate([0, 0, k_tangent_point_2_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(k_tangent_point_3)
    rotate([0, 0, k_tangent_point_3_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
}

// Module to place revolve joints at unconnected endpoints
module k_place_revolve_joints_at_endpoints(profile_for_revolve, profile_height, angle=180) {
    translate(k_endpoint_0)
    rotate([0, 0, k_endpoint_0_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(k_endpoint_1)
    rotate([0, 0, k_endpoint_1_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(k_endpoint_2)
    rotate([0, 0, k_endpoint_2_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(k_endpoint_3)
    rotate([0, 0, k_endpoint_3_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(k_endpoint_4)
    rotate([0, 0, k_endpoint_4_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
    translate(k_endpoint_5)
    rotate([0, 0, k_endpoint_5_angle])
    revolve_profile_around_x(profile_for_revolve, profile_height, angle);
}

// ===== EXTENSION PARAMETERS =====
// Adjust these to control how far entities are extended for non-tangent joints
line_extension_amount = 25; // mm for lines
arc_extension_degrees = 30; // degrees for arcs

// ===== NON-TANGENT CONNECTION JOINTS =====
// For non-tangent connections, we extend both entities and take their intersection


// Module to place all non-tangent intersection joints
module k_place_non_tangent_joints(profile) {

}

// Sweep pattern - sweeps profile along each path (lines, arcs, and circles)
module k_sweep_pattern(profile) {
    union() {
        // Sweep lines
        
        path_sweep(profile, path2d(line_0));
path_sweep(profile, path2d(line_1));
path_sweep(profile, path2d(line_2));

        // Sweep arcs
        sweep_arc(profile, arc_0, n_segments=50);
sweep_arc(profile, arc_1, n_segments=50);
sweep_arc(profile, arc_2, n_segments=50);
sweep_arc(profile, arc_3, n_segments=50);

        // Sweep circles
        

    }
}

// Full pattern with tangent joints, endpoint joints, and non-tangent intersection joints
// sweep_profile: 2D points array for path_sweep (typically mirroredx profile)
// joint_profile_for_revolve: 2D points array for revolve joints (x >= 0, typically for_revolve profile)
// joint_profile_height: height of the joint profile (for translation in revolve)
module k_full_pattern(
    b_make_joints = true,
    b_make_endpoint_joints = true,
    b_make_non_tangent_joints = true,
    sweep_profile = p_classic_mirroredx,
    joint_profile_for_revolve = p_classic_for_revolve,
    joint_profile_height = p_classic_height,
    joint_angle = 90,
    endpoint_joint_angle = 180
    ) {
    union() {
        k_sweep_pattern(sweep_profile);
        if(b_make_joints){
            k_place_revolve_joints_at_tangent_points(joint_profile_for_revolve, joint_profile_height, joint_angle);
        }
        if(b_make_endpoint_joints){
            k_place_revolve_joints_at_endpoints(joint_profile_for_revolve, joint_profile_height, endpoint_joint_angle);
        }
        if(b_make_non_tangent_joints){
            k_place_non_tangent_joints(sweep_profile);
        }
    }
}

    //p_classic_preview();

// Render sweep pattern only
//k_sweep_pattern(profile_default(scalefactor=0.2));


$fn = 4;
// $fn = 32;
module part_with_difference(s=1){
    difference(){

        color([0.,1.0, 0.5, 0.5])
        k_full_pattern(
            b_make_joints=true,
            b_make_endpoint_joints=true,
            b_make_non_tangent_joints=true,
            sweep_profile=p_classic_mirroredx_scaled(s=s),
            joint_profile_for_revolve=p_classic_for_revolve_scaled(s=s),
            joint_profile_height=p_classic_height * s,
            joint_angle=90,
            endpoint_joint_angle=180
        );

        color([1.0,0.0, 0.0, 0.5])
        translate([0, 0, pr_classicv3_trn_y*s])
        k_full_pattern(
            b_make_joints=false,
            b_make_endpoint_joints=false,
            b_make_non_tangent_joints=true,
            sweep_profile=pr_classicv3_mirroredx_scaled(s=s)
        );
    }
}
part_with_difference(s=1.0);
    