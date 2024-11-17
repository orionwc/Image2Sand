# Image2Sand
A hack for Mark Rober's Crunchlabs Sand Garden Hackpack that converts an image into a pattern that can be drawn in the sand.

This is early-stage and it's not going to work for every image -- but at this time, images that work well are ones you visibly see the outline by eye, such as a silhouette, a line drawing (it will detect the outer outline), or those with really high contrast. In all these cases, it will most likely find the outer bounds of the object and be able to draw this.

There are 2 parts to this project:

1. A javascript-based website that converts an image into a set of polar coordinates that describe how to trace a path that represents an outline of the image
2. Code for the Arduino to allow the user to paste in coordinates in the output format supported by Part (1)


1. The website is available at: https://orionwc.github.io/Image2Sand/
   This is built from index.html in the root of the project and the files referenced within.

   Steps:
   * Click the Open Image icon and select an image available on your computer.
     * Small images (< 400x400 pixels) work best
   * You will see images appear based on steps that were taken:
     * First, it detects edges (color changes) on the image
     * Second, it fits contours to the edges, and extracts a set of points to represent those contours and optimizes the path between them. You can see the points that will make up the drawing instructions
     * Third, it follows the drawing instructions and plots its path inside a circle on the page. This should align with the path the marble takes. Note that you can use the color to see the path it takes (it starts RED and works its way through the rainbow of colors to PURPLE)
     * The coordinates of the points and the sequence to visit them are output at the bottom of the page. Note that these are output as INTEGERS to reduce memory consuption when read by the Arduino code. The box includes a series of points that are at (r, theta), and we scale them so that r takes a value between 0-1000. theta represents the angle in tengths of a degree. 
    
 * 2 settings are exposed - if you change these, you would need to click the "Generate Coordinates" button to see the updated image.
   * The first is the epsilon parameter -- when it's very small (e.g. 0.1), the image representation is likely more costly because of the complexity. Small epsilon also results in the points being very close together and capturing the detail in the contours. However, the Arduino struggles to handle a large number of points and causes an out of memory error when the number of points exceeds about 130 in the current implementation. 
     * The second is a countour setting -- "External" is recommended, which will focus on getting the outline of the image. But the Tree-based approach to detect internal contours is available as an experimental option. If you select this, it may take a lot longer to process an image, especially if has a lot of contours or is very large.
  * You can try adjusting these values to get an Sand Garden plot you're happy with. Then copy the entry in the coordinates box at the bottom to the clipboard to paste in to the Arduino code to generate your pattern.


Other info:
   This runs in javascript locally on the client. There isn't much in the way of validation implemented, but things to be aware of are:
   -If the images have a lot of identified edges (which often happens for busy photos or images with a high pixel count) then it can take a long time to process.
   



2. Adds a pattern to the Aurduino code that traces a sequence of points specified as an array of polar coordinates in the units: r=radial, scaled from 0-1000, and theta = angle in tengths of a degree
* There are some small changes in the code headers you need to make - to define the addition of the pattern, and also to change the data type of the Positions struct elements from INT (4-bytes) to SHORT INT (2-bytes). Then you will need to copy the main functions at the bottom - drawPatternStep has the logic to draw the pattern, and pattern_Picture is where you will drop in your new sequence.
See https://github.com/orionwc/Image2Sand/commit/e6f938ae25ba4a1b92c95af3d917c11543c51589 for the changes to make if you're copying this manually.


Known bugs:
* Some of the pattern sequences rotate by a seemingly random but small amount each repetition.
* Sometimes the lines cross the image unexpectedlt
* Sometimes the compiler will compile successfully, but it will not draw -- this happens when the number of points is very large
* If the first and last points are the same, it will return to the center before restarting the pattern


Possible future improvements:
* Fix known bugs
* Restrict image size before processing
* Better path-finding algorithm
* Explore improvements to memory utilization so more points can be included



For more context, see the youtube video linked at the bottom of the web page.
If you found this interesting or cool, please **subscribe** to my youtube channel at https://www.youtube.com/@InspiredByOrion by clicking the link at the bottom of the page.
