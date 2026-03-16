# dxf to openscad to .stl

this project is here to convert .dxf sketch files to .stl files. this is done by converting the .dxf files to javascript objects, storing it in db and then using this information to generate openscad scripts. those scripts then finally can be run to create .stl files. 


# migration 
this project was started and extended multiple times before. the first time it was a simple application where one could use three files to generate an object. one was the profile , the second one was a 'profile remover' and the third was the 'path'. the generated openscad script then would use the profile to sweep it along the path. there was also a mechanism for what to do if two paths are connected on the same point , so the joints were treated specially. 

then it was tried to extend the software. there was a programm that tried to convert the 2d coordinates of the path in order to wrap it around a cylinder. there was a main page with a selection of 'tools' 



# target

now i want to re-implement the basic program that lets me select 3 dxf files and then generate a open scad script that will create a 3d object with a sweeped path and correct joints. in the original the bosl2 'path_sweep()' was used, but i think the sweeped paths will generate overlapping geometry and it would be better to use 'path_sweep2d()'


when a .dxf is uploaded the file should be stored in this workspace. 


this current workspace provides much better functionalities to create a single page application. it also provides a way to sync data with the client, server and database. 

