include <BOSL2/std.scad>   // BOSL2 library required

$fn = 64;

// Rounded block (not in vanilla OpenSCAD)
cuboid([30,20,10], rounding=3, edges="Z");

// Add a BOSL2 parametric thread on top
up(5)
metric_thread(d=12, pitch=2, length=15, internal=false);
