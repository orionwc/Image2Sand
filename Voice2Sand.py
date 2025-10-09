import serial
import matplotlib.pyplot as plt
import numpy as np
import speech_recognition as sr
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import urllib.parse
import pyttsx3
# To use these libraries, run:
# pip install pyserial matplotlib numpy SpeechRecognition selenium webdriver-manager pyttsx3

# ------------------------------------------------------------------------------------------------------------------------------------------------------
# IMPORTANT: Insert your OpenAI API key here. It will need be to given permission for DALL-E-2 and DALL-E-3 models.
# IMPORTANT: Set the COM ports to the one connected  to the Sand Garden
# ------------------------------------------------------------------------------------------------------------------------------------------------------

#
# This program will listen for you to say a phrase containing the word "Draw" and then use what's after that as the prompt for the Image2Sand website.
# It will will send a request to the Image2Sand website, which will in turn use that prompt to generate an image using Dall-E, and then convert this
# image into coordinates for the Sand Garden to draw. This program collects those coordinates and then stream those one-by-one to the Sand Garden, which
# has to be running the pattern_Remote pattern to receive them and draw the pattern. Remember to select the pattern on the Sand Garden using the joystick.
# For this to work, you will need to obtain a valid API Key from OpenAI at https://platform.openai.com/settings/organization/api-keys
#

def say_phrase(phrase):
    engine = pyttsx3.init()
    engine.say(phrase)
    engine.runAndWait()

def waitTillReceived(n:str):
    readLine = "" if n != "" else " "
    while readLine != n:
        bs = ser.readline()
        readLine = bs.decode("utf-8").rstrip()
def printSerial(a):
    ser.write(str(a).encode('utf-8'))

class PatternIterator:
    def __init__(self, pattern):
        # Remove the curly braces and split the pattern into pairs
        self.pairs = pattern.strip('{}').split('},{')
        self.index = 0

    def get_next(self):
        if self.index < len(self.pairs):
            # Extract the current pair and increment the index
            print("Point# ", self.index+1, " / ", len(self.pairs))
            current_pair = self.pairs[self.index]
            self.index += 1
            
            # Split the pair into r and theta
            r, theta = map(int, current_pair.split(','))
            return r, theta
        else:
            return None, None  # No more pairs

def plot_complete_pattern(pattern):
    iterator = PatternIterator(pattern)

    r_values = []
    theta_values = []

    r, theta = iterator.get_next()
    while r is not None and theta is not None:
        r_values.append(r)
        theta_values.append(np.deg2rad(theta / 10.0))  # Convert to radians
        r, theta = iterator.get_next()

    # Create the color gradient and reverse it
    colors = plt.cm.rainbow(np.linspace(1, 0, len(r_values)))

    # Plot the polar coordinates
    fig, ax = plt.subplots(subplot_kw={'projection': 'polar'})
    for i in range(len(r_values) - 1):
        ax.plot([theta_values[i], theta_values[i+1]], [r_values[i], r_values[i+1]], color=colors[i])

    # Save the plot as a PNG file
    plt.savefig('pattern.png')
    plt.show(block=False)

def plot_pattern_incrementally(fig, ax, colors, r_values, theta_values):
    if len(r_values) > 1:
        ax.plot([theta_values[-2], theta_values[-1]], [r_values[-2], r_values[-1]], color=colors[len(r_values) - 2])
    plt.pause(0.01)  # Pause to update the plot

def DrawPattern(pattern, isFirst):
    if isFirst:
        waitTillReceived("COORDS")
        printSerial("<START>")
        waitTillReceived("READY")

    # Close any existing plot windows before starting a new run
    plt.close('all')

    # Plot the complete pattern in one window
    plot_complete_pattern(pattern)

    # Create another window for incremental plotting
    plt.ion()
    fig, ax = plt.subplots(subplot_kw={'projection': 'polar'})
    colors = plt.cm.rainbow(np.linspace(1, 0, len(PatternIterator(pattern).pairs)))

    iterator = PatternIterator(pattern)

    r_values = []
    theta_values = []

    # Get the next pair of numbers
    r, theta = iterator.get_next()
    while r is not None and theta is not None:
        r_values.append(r)
        theta_values.append(np.deg2rad(theta / 10.0))  # Convert to radians

        # Send the coordinate to the serial port
        print("Requesting Move to r={}, theta={}".format(r, theta))
        msg = "POS:" + str(r) + "," + str(theta)
        printSerial("<" + msg + ">")
        waitTillReceived(msg)
        print("Request confirmed.")

        # Plot the pattern incrementally (while waiting for marble to move)
        plot_pattern_incrementally(fig, ax, colors, r_values, theta_values)

        waitTillReceived("DONE")
        print("Finished Move to r={}, theta={}".format(r, theta))

        r, theta = iterator.get_next()

    # Ensure the last segment is plotted
    plot_pattern_incrementally(fig, ax, colors, r_values, theta_values)
    plt.ioff()
    
    # Send END signal to indicate pattern completion
    print("Sending END signal...")
    printSerial("<END>")
    print("Pattern complete!")

def real_time_transcription():
    recognizer = sr.Recognizer()
    microphone = sr.Microphone()

    print("Adjusting for ambient noise, please wait...")
    with microphone as source:
        recognizer.adjust_for_ambient_noise(source)
        print("Ready to transcribe. Speak into the microphone.")

    firstPattern = True

    while True:
        try:
            with microphone as source:
                print("Listening...")
                audio = recognizer.listen(source)
                print("Recognizing...")
                transcription = recognizer.recognize_google(audio)
                print(f"Transcription: {transcription}")

                # Check if transcription contains the trigger word "draw"
                if "draw" in transcription.lower():
                    # Extract and print the rest of the text
                    instructions = transcription.lower().split("draw", 1)[1].strip()
                    if instructions: 
                        print("Drawing " + instructions)
                        say_phrase("Alright. I'll draw " + instructions + ". It will take a few minutes... I hope you like it.")
                        pattern = ""

                        # Send the Prompt to the Image2Sand website along with the API Key
                        print("Requesting response from " + coord_url)
                        driver.get(coord_url)

                        try:
                            # Wait up to 60 seconds until the element with id "simple-coords" is visible
                            element = WebDriverWait(driver, 60).until(EC.visibility_of_element_located((By.ID, "simple-coords")))
                            pattern = driver.find_element(By.ID, 'simple-coords').text

                        finally:
                            driver.quit()
                        
                        if pattern != "":
                            print("Drawing Pattern: ", pattern)
                            DrawPattern(pattern, firstPattern)
                            firstPattern = False
                    else:
                        print("No instructions found after 'Draw'")

        except sr.UnknownValueError:
            print("Sorry, I could not understand the audio.")
        except sr.RequestError as e:
            print(f"Could not request results; {e}")

options = Options()
options.add_argument("--headless=new")  # Run Chrome in headless mode

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

if __name__ == "__main__":
    ser = serial.Serial(comport, 9600, timeout=0.5)
    print("Starting Speech Recognizer...")
    print()
    real_time_transcription()
    input("Press any key to close the plot windows...")  # Wait for keypress before closing
    plt.close('all')
