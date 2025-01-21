# Image2Sand and Voice2Sand
Two hacks for Mark Rober's Crunchlabs Sand Garden Hackpack that allows you to:
* Image2Sand - Upload an image and convert it into points that can be drawn on the sand garden
* Voice2Sand - Simply verbally specify to your computer the image you want it to draw, and it will generate an image based off of your prompt then convert it to points and then stream those points to the sand garden. Essentially just converting your voice into a sand garden image!

# Image2Sand
A hack for Mark Rober's Crunchlabs Sand Garden Hackpack that converts an image into a pattern that can be drawn in the sand.

It's not going to work for every image -- but at this time, images that work well are ones you visibly see the outline by eye, such as a silhouette, a line drawing, and simple images like you might find in an app icon. It will find the prominent edges in the image and decide how to create a path for the marble to follow to trace those edges.

## Summary
There are 2 parts to this project:

1. A javascript-based website that converts an image into a set of polar coordinates that describe how to trace a path that represents an outline of the image
2. Code for the Arduino to allow the user to paste in coordinates in the output format supported by Part (1)

## Part 1
The website is available at: https://orionwc.github.io/Image2Sand/
   This is built from index.html in the root of the project and the files referenced within.

   ### Steps:
   * First, select an image. You have 2 options:
     * Under the Upload an Image tab, click the Open Image icon and select an image available on your computer. Simple, small images (< 400x400 pixels) work best
     * (Added for the Voice 2 Sand hack below) Under the Generate an Image tab, paste in your OpenAI API key (request one from https://platform.openai.com/), then enter a prompt for your image (e.g. "monkey on a surfboard") and click Create
   * Your image will load/generate, then appear in the top left box
   * Click Generate Coordinates - you will see additional images/plots appear based on steps that were taken:
     * First, it detects edges (color changes) on the image and shows these (top right)
     * Second, it fits contours to the edges, and extracts a set of points to represent those contours and optimizes the path between them. You can see the points that will make up the drawing instructions (bottom left).
     * Third, it follows the drawing instructions and plots its path inside a circle on the page (bottom right). This should align with the path the marble takes. Note that you can use the color to see the path it takes (it starts RED and works its way through the rainbow of colors to PURPLE)
     * The coordinates of the points and the sequence to visit them are output at the bottom of the page. Note that these are output as integerer to reduce memory consuption when read by the Arduino code. The textbox includes a series of points that are at (r, theta), and we scale them so that r takes a value between 0-1000 and theta represents the angle in tengths of a degree (0-3599). 
 * 6 settings are exposed - if you change these, you would need to click the "Generate Coordinates" button to see the updated image.
   * Starting Epsilon parameter -- epsilon is a parameter the alorithm uses to indicate the granularity at which it returns points along the contours. When it's very small (e.g. 0.1), the image representation is likely more costly because of the complexity. Small epsilon also results in the points being very close together and capturing the detail in the contours. Note that the actual epsilon used is also limited by the Contour Point Limit setting (see below). However, the Arduino struggles to handle a very large number of points and causes an out of memory error when the number of points exceeds about 1000 in the current implementation.
     * Countour setting -- "External" is the simplest which will return outer outline of the image. But the Internal+External attempts to detect internal contours too -- if you select this, it may take a lot longer to process an image, especially if has a lot of contours or the image is very large. (The UI doesn't have any progress indication right now - you just have to wait, potentially several minutes)
     * Contour Point Limit -- this caps the number of points on each contour. The algorithm increases the actual Epsilon parameter from the Starting Epsilon parameter above until the contour uses a number of points below this limit.
     * Loop Drawing - this will make sure that the last point is right next to the first point so that the images can be continuously retraced on a loop. If you check this box, it will also try to start the image at the point closest to the center so you can avoid getting a long line to the starting point
     * No Shortcuts - checking this box can add a long time to the processing time. But it can make the image look a lot better. When there are multiple contours that make up the image, without this checked, the algorithm will just move between where one contour ends and another starts arbitrarily. If you check the box, the path will try to minimize the length the marble spends on routes that aren't on contours, retracing its past steps as needed. Note that this can add a lot of points to the final path due to lots of path retracing.
     * Single-Byte Coordinates - this scales the output coordinates so that each number ranges from 0-255 (both r and theta) so that you can try using a single byte data point to represent these. There is no code shared for using this on the Arduino at this time - you'll have to come up with a way to support it if you would like to try it.
  * You can try adjusting these values and clicking Generate Coordinates again to get a Sand Garden plot you're happy with. Then copy the entry in the coordinates box at the bottom to the clipboard to paste in to the Arduino code (Step 2) to draw your pattern in the Sand Garden.


### Other info:
   This runs in javascript locally on the client. There isn't much in the way of validation implemented, but things to be aware of are:
   * If the images have a lot of identified edges (which often happens for busy photos or images with a high pixel count, and when you check the options marked 'experimental') then it might take a long time to process.

## Part 2
 Adds a pattern to the Aurduino code that traces a sequence of points specified as an array of polar coordinates in the units: r=radial, scaled from 0-1000, and theta=angle in tengths of a degree
* You can find the code in [Image2Sand.ino](https://github.com/orionwc/Image2Sand/blob/main/Image2Sand.ino). You can either copy and paste in the full code into the HackPack IDE (on Level 3), or you can see the specific changes to make [here](https://github.com/orionwc/Image2Sand/compare/6efe448...0c0b9f2#diff-66a3740d646a85d61ec29c5ebe0b76c51428f73ecc7bffa842177864070513b8) and include them individually.
   * There are some small changes in the code headers you need to make - to define the addition of the pattern, and also to change the data type of the Positions struct elements from INT (4-bytes) to SHORT INT (2-bytes). Then you will need to copy the main functions at the bottom - drawPatternStep has the logic to draw the pattern, and pattern_Picture is where you will drop in your new sequence. If you don't paste anything in, it should draw the CrunchLabs logo by default. You can try out the included patterns by commenting out the default pattern and uncommenting another one.
* To draw your own image, paste in the coordinates you copied from the website (Part 1) into the indicated location in pattern_Picture. Be sure to comment out any other patterns there by default so only one set of coordinates is used.
* See more pattern ideas in [AdditionalPatterns.txt](https://github.com/orionwc/Image2Sand/blob/main/AdditionalPatterns.txt)

## Running the Pattern
 Once you've updated the code, you will have a new pattern that draws your images. By default, this will be pattern number 11 (1011 in binary), so you'll need to select this using the pattern selector function of the joystick for it to draw the image you want.

## Known bugs:
* Some of the pattern sequences rotate by a seemingly random but small amount each repetition.
* Sometimes the lines cross the image unexpectedly
* Sometimes the compiler will compile successfully, but it will not draw -- this happens when the number of points is very large
* If the first and last points are the same, it will return to the center before restarting the pattern

## Possible future improvements:
* Fix known bugs
* Restrict image size before processing
* Better path-finding algorithm so it doesn't retrace steps as often, closes contours that are almost closed, and takes shorter hops between contours
* Explore improvements to memory utilization so more points can be included

## More info
See this video on youtube: [I hacked Mark Rober's Sand Garden to Draw Any Image](https://youtu.be/fOfYCiM7BC8)

# Voice2Sand
Builds on Image2Sand so you can talk to your Sand Garden and ask it to draw something, and it draws it

## Summary
There are 3 parts to this project:

1. An update to Image2Sand that allows the user to generate images via AI and also allows the python program to access the results programatically to use it to generate the coordinates from the prompt.
2. Code for the Arduino that will allow coordinates to be streamed one by one from the python program and, as it receives them, draws them on the sand garden.
3. A python program that listens to and transcribes you voice using the computer's microphone then determines if the word "Draw" is in your sentence then uses what comes after it as the prompt for Image2Sand. Once it has the coordinates, it will stream these to the Arduino to draw the image.

## Part 1

The Image2Sand website is updated from this github repo at https://orionwc.github.io/Image2Sand/. You're able to see the code here, but you can also just use the website to generate the images, either manually or programatically.
The update adds a tab "Generate an Image" so you can choose this instead of uploading one. For this to work, you have to enter an API key for OpenAI that has access to the Dall-E-2 and Dall-E-3 models. You can request from from https://platform.openai.com/. It's not included here as all the code is publically viewable. You can specify it either in the text box, or in the URL using https://orionwc.github.io/Image2Sand/?apikey=[insert your api key].

The website also supports these arguments:
* apikey=your OpenAI API key
* prompt=the phrase to use to generate an image
* run=1 will directly generate the coordinates for the prompt and just return them in a simplified UI

## Part 2

The [Voice2Sand.ino](https://github.com/orionwc/Image2Sand/blob/main/Voice2Sand.ino) file can be copy/pasted into Level 3 on the HackPack IDE (https://ide.crunchlabs.com/), or see [here](https://github.com/orionwc/Image2Sand/compare/ba02278..4f7f9d3) for the changes needed to the base code. It adds an additional pattern: pattern_Remote that lets the Sand Garden move the marble to the next coordinate as it receives over the Serial port. There are some changes near the top to add the pattern definition, one critical change at the start of the main loop to set up the serial communication, and the added pattern toward the bottom.

When you run this, you'll need to select the pattern using the jotstick before you can send coordinates. By default, it would be the last pattern on the list (number 11, or 1011 in binary). It's possible to combine this and the Image2Sand.ino changes and have both patterns present at the same time, then you would just need to choose the appropriate pattern number when you are running it (e.g. 12).

## Part 3

The python program Voice2Sand.py is designed to run on your computer. You will need to install Python and the dependencies for the libraries specified at the top if you don't already have them.
Make sure your Sand Garden is connected to your computer using the USB cord. There are 2 important changes you need to make to the code before running it:
1. Specify the comport for the serial connection to the Sand Garden. You can find this on the HackPack IDE page - it will be something like "COM4".
2. Enter your OpenAI Api Key. This is needed so that the image2sand website can make the request for the image to generate from the prompt.

When you run it, it will start listening for voice input. When it hears "Draw [something]" it will send a request to the Image2Sand website for the coordinates. Then when it receives them, it will make a plot of the planned image, and then send the coordinates to the sand garden one at a time, highlighting on another plot what part of the image it is drawing. When it finishes drawing, it will start listening again for the next thing to draw.

## Steps
* Get an OpenAI API key from https://platform.openai.com/ and make sure it is configured to allow access to Dall-E-2 and Dall-E-3 models.
* Deploy the code in Voice2Sand.ino to your Arduino using the HackPack IDE. You can either copy/paste the whole file contents into Level 3 on the IDE, or just make the changes to add in the additional pattern. Make a note of the port specified in the IDE that is used to connect to the Sand Garden - you'll need this in the next step.
* Download Voice2Sand.py and update the comport and apikey values using the values identified in the previous 2 steps.
* Ensure you have Python installed and that all dependency libraries in the script are installed (there are details in the code on how to install using pip)
* Leave the serial connection intact and run the Python code - it will start listening for voice input usig your computer microphone. You should see Arduino reboot and then wait for you to select a pattern. Choose number 11 (1011 in binary) using the joystick and then it will wait for input.
* Say "Draw [any prompt]" into your computer microphone (e.g. "Draw an elephant"). The Python program should take it from here, requesting the coordinates from orionwc.github.io/Image2Sand/ and then streaming them to the Arduino.

## Known Bugs / Future improvements

If you have ideas on making it better, or have ideas on how to fix the bugs below or others you find, don't hestitate to contribute to the code:
* If you ask for several images without restarting the programs, the images seem to get a little smaller each time.

## More info
See this video on youtube: [AI-Powered Voice-Activated Sand Garden](https://youtu.be/AUMiR996WdU)

# Appendix

## Videos
*    [I hacked Mark Rober's Sand Garden to Draw Any Image](https://youtu.be/fOfYCiM7BC8)
*    [AI-Powered Voice-Activated Sand Garden](https://youtu.be/AUMiR996WdU)

If you found this interesting or cool, please consider subscribing to [My Youtube Channel](https://www.youtube.com/@InspiredByOrion)
