# prompt 
currently the main.js works via command line 
the goal is to make this script working with a small  webapplication in the browser. of course the script wont be able to write the files (it does currently with deno.writetextfile) 
instead it will render the output to the website (code/text) and svg. 
# roseriser 
this is a small webapplication where a file can be uploaded via a fixed positioned button at the top right corner of the screen.

after the upload the client side javascript calculates some text and shows this in a monaco code editor on the left side of the screen. 


on the right side of the screen (50%) the svg is rendered and can be panned and zoomed 

after the generation of the new data there will be a button for each generated data to be able to download it (download svg, download .scad) etc. 

do not edit/write files named '.h.js' => 'h = > humanly created' a file that has only content that was checked by a human. you can read that files but not edit.