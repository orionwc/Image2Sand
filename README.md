# Image2Sand and Voice2Sand
Two hacks for Mark Rober's Crunchlabs Sand Garden Hackpack that allows you to:
* Image2Sand - Upload an image and convert it into points that can be drawn on the sand garden
* Voice2Sand - Simply verbally specify to your computer the image you want it to draw, and it will generate an image based off of your prompt then convert it to points and then stream those points to the sand garden. Essentially just converting your voice into a sand garden image!

# Image2Sand
A hack for Mark Rober's Crunchlabs Sand Garden Hackpack that converts an image into a pattern that can be drawn in the sand.

This is early-stage and it's not going to work for every image -- but at this time, images that work well are ones you visibly see the outline by eye, such as a silhouette, a line drawing (it will detect the outer outline), or those with really high contrast. In all these cases, it will most likely find the outer bounds of the object and be able to draw this.

## Summary
There are 2 parts to this project:

1. A javascript-based website that converts an image into a set of polar coordinates that describe how to trace a path that represents an outline of the image
2. Code for the Arduino to allow the user to paste in coordinates in the output format supported by Part (1)

## Part 1
The website is available at: https://orionwc.github.io/Image2Sand/
   This is built from index.html in the root of the project and the files referenced within.

   ### Steps:
   * Click the Open Image icon and select an image available on your computer.
     * Small images (< 400x400 pixels) work best
   * You will see images appear based on steps that were taken:
     * First, it detects edges (color changes) on the image
     * Second, it fits contours to the edges, and extracts a set of points to represent those contours and optimizes the path between them. You can see the points that will make up the drawing instructions
     * Third, it follows the drawing instructions and plots its path inside a circle on the page. This should align with the path the marble takes. Note that you can use the color to see the path it takes (it starts RED and works its way through the rainbow of colors to PURPLE)
     * The coordinates of the points and the sequence to visit them are output at the bottom of the page. Note that these are output as INTEGERS to reduce memory consuption when read by the Arduino code. The box includes a series of points that are at (r, theta), and we scale them so that r takes a value between 0-1000. theta represents the angle in tengths of a degree. 
 * 2 settings are exposed - if you change these, you would need to click the "Generate Coordinates" button to see the updated image.
   * The first is the epsilon parameter -- when it's very small (e.g. 0.1), the image representation is likely more costly because of the complexity. Small epsilon also results in the points being very close together and capturing the detail in the contours. However, the Arduino struggles to handle a large number of points and causes an out of memory error when the number of points exceeds about 130 in the current implementation. 
     * The second is a countour setting -- "External" is recommended, which will focus on getting the outline of the image. But the Tree-based approach (Internal+External) to detect internal contours is available as an experimental option. If you select this, it may take a lot longer to process an image, especially if has a lot of contours or is very large.
  * You can try adjusting these values to get an Sand Garden plot you're happy with. Then copy the entry in the coordinates box at the bottom to the clipboard to paste in to the Arduino code to generate your pattern.


### Other info:
   This runs in javascript locally on the client. There isn't much in the way of validation implemented, but things to be aware of are:
   * If the images have a lot of identified edges (which often happens for busy photos or images with a high pixel count) then it can take a long time to process.

## Part 2
 Adds a pattern to the Aurduino code that traces a sequence of points specified as an array of polar coordinates in the units: r=radial, scaled from 0-1000, and theta = angle in tengths of a degree
* There are some small changes in the code headers you need to make - to define the addition of the pattern, and also to change the data type of the Positions struct elements from INT (4-bytes) to SHORT INT (2-bytes). Then you will need to copy the main functions at the bottom - drawPatternStep has the logic to draw the pattern, and pattern_Picture is where you will drop in your new sequence.
See https://github.com/orionwc/Image2Sand/commit/e6f938ae25ba4a1b92c95af3d917c11543c51589 for the changes to make if you're copying this manually.


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
3. A python program that listens to and transcribes you voice using the computer's microphone then determines if the word "Draw" is in your sentance then uses what comes after it as the prompt for Image2Sand. Once it has the coordinates, it will stream these to the Arduino to draw the image.

## Part 1

The Image2Sand website is updated from this github repo at https://orionwc.github.io/Image2Sand/. You're able to see the code here, but you can also just use the website to generate the images, either manually or programatically.
The update adds a tab "Generate an Image" so you can choose this instead of uploading one. For this to work, you have to enter an API key for OpenAI that has access to the Dall-E-2 and Dall-E-3 models. You can request from from https://platform.openai.com/. It's not included here as all the code is publically viewable. You can specify it either in the text box, or in the URL using https://orionwc.github.io/Image2Sand/?apikey=[insert your api key].

The website also supports these arguments:
* apikey = your OpenAI API key
* prompt = the text to use to generate an image
* run = 1 will directly generate the coordinates for the prompt and just return them in a simplified UI

## Part 2

The Voice2Sand.ino file can be copy/pasted into Level 3 on the HackPack IDE (https://ide.crunchlabs.com/), or look at the first commit to see the changes needed to the base code. It adds an additional pattern: pattern_Remote that lets the Sand Garden move the marble to the next coordinate as it receives over the Serial port. There are some changes near the top to add the pattern definition, one critical change at the start of the main loop to set up the serial communication, and the added pattern toward the bottom.

When you run this, you'll need to select the pattern using the jotstick before you can send coordinates. By default, it would be the last pattern on the list (number 11). It's possible to combine this and the Image2Sand.ino changes and have both patterns present at the same time, then you would just need to choose the appropriate pattern number when you are running it.

## Part 3

The python program Voice2Sand.py is designed to run on your computer. You will need to install Python and the dependencies for the libraries specified at the top if you don't already have them.
Make sure your Sand Garden is connected to your computer using the USB cord. There are 2 important changes you need to make to the code before running it:
1. Specify the comport for the serial connection to the Sand Garden. You can find this on the HackPack IDE page - it will be something like "COM4".
2. Enter your OpenAI Api Key. This is needed so that the image2sand website can make the request for the image to generate from the prompt.

## Steps
* Get an OpenAI API key from https://platform.openai.com/ and make sure it allows access to Dall-E-2 and Dall-E-3 models.
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
