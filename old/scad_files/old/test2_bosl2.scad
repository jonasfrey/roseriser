include <BOSL2/std.scad>

// If BOSL2 is missing, both of these will error out.
echo("BOSL2 loaded OK. vec_length([3,4]) =", vec_length([3,4])); // expect 5

cyl(r=10, h=20); // BOSL2 shorthand — not valid plain OpenSCAD
