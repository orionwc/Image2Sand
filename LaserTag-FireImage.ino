/*
  ************************************************************************************
  * MIT License
  *
  * Copyright (c) 2025 Crunchlabs LLC (Laser Tag Code)

  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to deal
  * in the Software without restriction, including without limitation the rights
  * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the Software is furnished
  * to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in all
  * copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
  * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
  * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  *
  ************************************************************************************
*/
// >>>>>>>>>>>>>>>>>>>>>>>>>>>> PIN DEFINITIONS <<<<<<<<<<<<<<<<<<<<<<<<<<<<
#define IR_SEND_PIN         3
#define IR_RECEIVE_PIN      5 
#define _IR_TIMING_TEST_PIN 7

//#define LED_PIN     6
//#define LED_COUNT   6

//#define RELOAD_PIN      8
#define SERVO_PIN       9
//#define BUZZER_PIN      11 
#define TRIGGER_PIN     12

#define TEAM1_PIN       15      // A1 pin 
#define TEAM2_PIN       16      // A2 pin
#define TEAM3_PIN       17      // A3 pin

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> LIBRARIES <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
#define DECODE_NEC          // defines RIR Protocol (Apple and Onkyo)

#include <IRremote.hpp>   
//#include <Adafruit_NeoPixel.h>  
#include <Arduino.h>
#include <Servo.h>

//Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);
Servo myservo;

// >>>>>>>>>>>>>>>>>>>>>>>>>>> GAME PARAMETERS <<<<<<<<<<<<<<<<<<<<<<<<<<<<<
#define DEBOUNCE_DELAY 20

#define SERVO_INITIAL_POS 150     // how agressively to undarken goggles 
#define SERVO_READY_POS 120       // reduce aggresiveness near end of action
#define SERVO_HIT_POS 50

#define TRIGGER_COOLDOWN 500      // milliseconds  
#define HIT_TIMEOUT 10000         // milliseconds
//#define RELOAD_TIME_EACH 1000     // milliseconds

/*const bool infiniteAmmo = true;
const int maxAmmo = LED_COUNT;        
const bool deathTakesAmmo = true;*/          

int team = 1;     // default 

// >>>>>>>>>>>>>>>>>>>>>>>>>>> GAME VARIABLES <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

int lastTriggerVal = 1;                     // trigger debounce variable
unsigned long lastTDebounceTime = 0;        // trigger button debounce time
int triggerState;                           // trigger debounce result
bool buttonWasReleased = true;              // release check, no "full auto"
unsigned long previousTriggerMillis = 0;    // cooldown timestamp between shots

/*int lastReloadVal = 1;                      // reload button, debounce 
unsigned long lastRDebounceTime = 0;        // reload button debounce time 
int reloadState;                            // reload button debounce result

bool isReloading = false;                   // allows reloading sequence 
unsigned long reloadTimer;                  // time to add shots to ammo bar
int ammo = maxAmmo;                         // current ammo bootup at max
*/

// Initialize game timeout variable
unsigned long timeoutStartTime = - HIT_TIMEOUT - 1000;

// IR pulse, tracks team distinction
uint8_t sCommand;                            // IR command being sent
uint8_t rcvCommand1;                         // IR command being recieved
uint8_t rcvCommand2;                         // IR command being recieved

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SETUP <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
void setup() {

  // Move Goggles to start config
  myservo.attach(SERVO_PIN);
  myservo.write(SERVO_INITIAL_POS);
  delay(500);
  myservo.write(SERVO_READY_POS);
  delay(500);
  myservo.detach();

  pinMode(TRIGGER_PIN, INPUT_PULLUP);
//  pinMode(RELOAD_PIN, INPUT_PULLUP);
//  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(TEAM1_PIN, INPUT_PULLUP);
  pinMode(TEAM2_PIN, INPUT_PULLUP);
  pinMode(TEAM3_PIN, INPUT_PULLUP);

  if (digitalRead(TEAM1_PIN) == LOW) {
    team = 1;
  } else if (digitalRead(TEAM2_PIN) == LOW) {
    team = 2;
  } else if (digitalRead(TEAM3_PIN) == LOW) {
    team = 3;
  }

  if (team == 1) {
    sCommand = 0x34;
    rcvCommand1 = 0x35;
    rcvCommand2 = 0x36;
  } else if (team == 2) {
    sCommand = 0x35;
    rcvCommand1 = 0x34;
    rcvCommand2 = 0x36;
  } else {
    sCommand = 0x36;
    rcvCommand1 = 0x34;
    rcvCommand2 = 0x35;
  }

  Serial.begin(115200);
  IrReceiver.begin(IR_RECEIVE_PIN, ENABLE_LED_FEEDBACK);
  /*
  strip.begin();
  strip.show();
  strip.setBrightness(50);
  */
}


// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> LOOP <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
void loop() {
  unsigned long currentMillis = millis();

  handleTrigger(currentMillis);
  handleIRReception();
  //UpdateLights(currentMillis);
  /*ReadReloadButton(currentMillis);

  if (isReloading && ammo < maxAmmo) {
    UpdateAmmo(true, currentMillis);
  }*/
}

// >>>>>>>>>>>>>>>>>>>>>>>>>>>> GAMEPLAY FUNCTIONS <<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// Read Trigger ----------
void handleTrigger(unsigned long currentMillis) {
  //if (ReadTriggerButton() && buttonWasReleased && ammo > 0 && currentMillis - previousTriggerMillis >= TRIGGER_COOLDOWN) {
  if (ReadTriggerButton() && buttonWasReleased && currentMillis - previousTriggerMillis >= TRIGGER_COOLDOWN) {
    previousTriggerMillis = currentMillis;
    buttonWasReleased = false;
    //isReloading = false;

    //digitalWrite(BUZZER_PIN, HIGH);
    sendIR_Pulse();
    //UpdateAmmo(false, currentMillis);
  } else if (!ReadTriggerButton()) {
    buttonWasReleased = true;
    //digitalWrite(BUZZER_PIN, LOW);
  } else {
    //digitalWrite(BUZZER_PIN, LOW);
  }
}

// Fire "Image" ----------
void sendIR_Pulse() {
  uint8_t coords[][2] = {
    // ADD PATTERN HERE
    // Replace these patterns with your coordinates using the "Single-Byte Coordinates" option from https://orionwc.github.io/Image2Sand/
  
    // Square Test Pattern (4 points)
    {200,1},{200,64},{200,128},{200,192}

    // Mark Rober's LightBulb Logo (99 points)
    //{27,178},{25,213},{91,58},{111,53},{127,41},{69,3},{81,0},{101,9},{180,41},{128,62},{176,84},{179,87},{101,119},{86,123},{69,122},{128,85},{119,79},{100,71},{21,154},{27,178},{21,154},{100,71},{119,79},{128,85},{69,122},{86,123},{92,137},{83,152},{103,162},{104,166},{139,221},{158,218},{160,215},{187,210},{207,209},{201,203},{227,203},{238,204},{254,203},{249,195},{245,180},{226,178},{245,180},{249,195},{254,203},{238,204},{227,203},{215,179},{227,203},{201,203},{193,174},{172,170},{193,174},{201,203},{207,209},{187,210},{171,207},{153,179},{171,207},{187,210},{160,215},{158,218},{139,221},{104,166},{103,162},{83,152},{92,137},{112,132},{137,124},{216,92},{219,85},{214,67},{214,61},{219,40},{216,36},{137,4},{81,232},{100,222},{125,228},{117,232},{152,248},{167,0},{252,35},{255,39},{248,62},{255,88},{245,94},{167,128},{134,143},{117,151},{148,162},{160,215},{158,218},{139,221},{104,166},{103,162},{83,152},{92,137},{86,123}

    // Squirrel (45 points)
    //{23,3},{26,152},{65,158},{105,165},{72,139},{105,85},{153,82},{191,85},{220,90},{244,96},{255,102},{252,107},{235,112},{214,115},{185,116},{174,129},{172,140},{172,151},{170,161},{169,172},{163,182},{177,188},{182,204},{174,205},{165,204},{154,198},{145,213},{214,216},{242,223},{238,224},{227,224},{210,221},{202,221},{169,227},{175,241},{201,244},{223,249},{221,252},{204,1},{189,3},{158,7},{146,14},{131,17},{111,8},{77,255}

    // Croissant (89 points)
    //{249,174},{239,183},{219,187},{169,174},{220,169},{246,171},{249,174},{246,171},{220,169},{169,174},{153,170},{204,165},{251,167},{254,156},{234,152},{196,151},{160,154},{134,163},{110,162},{94,155},{122,135},{185,131},{232,133},{255,140},{252,150},{179,147},{110,162},{94,155},{75,155},{64,158},{68,124},{136,109},{212,108},{241,112},{250,122},{249,129},{145,125},{91,133},{75,155},{64,158},{68,124},{136,109},{120,101},{235,103},{238,86},{235,68},{228,63},{198,57},{224,54},{149,39},{95,11},{155,26},{231,37},{236,42},{224,54},{149,39},{95,11},{149,39},{224,54},{198,57},{103,35},{61,5},{103,35},{198,57},{228,63},{235,68},{238,86},{235,103},{120,101},{32,176},{61,5},{103,35},{198,57},{224,54},{236,42},{231,37},{237,31},{131,9},{167,10},{245,20},{237,31},{131,9},{167,10},{169,6},{220,251},{241,253},{248,2},{243,15},{169,6}
    
  };
  size_t numPairs = sizeof(coords) / sizeof(coords[0]);

  Serial.flush();
  IrSender.sendNEC(0x03, numPairs, 3);   // Send the number of pairs with identifier 0x03
  delay(200);

  for (size_t i = 0; i < numPairs; i++) {
    uint8_t radial = coords[i][0];
    uint8_t angular = coords[i][1];
    
    Serial.flush();
    IrSender.sendNEC(0x01, radial, 3);   // Send the radial coordinate identifier 0x01
    delay(100);
    IrSender.sendNEC(0x02, angular, 3);  // Send the angular coordinate with identifier 0x02
    delay(100);
  }
}

// Read incoming message ----------
void handleIRReception() {
  if (IrReceiver.decode()) {
    checkPlayerHit();
    IrReceiver.resume(); // Ensure IR receiver is reset
  }
}

// Check if message is a "shot" from an enemy team ----------
void checkPlayerHit() {
  if (IrReceiver.decodedIRData.command == rcvCommand1 || IrReceiver.decodedIRData.command == rcvCommand2) {
    if (millis() - timeoutStartTime > HIT_TIMEOUT + 1000) {
      markHit();
    }
  }
}

// Move goggles if hit ----------
void markHit() {
  // get current time
  timeoutStartTime = millis();

  // move goggles to darken
  myservo.attach(SERVO_PIN);
  myservo.write(SERVO_HIT_POS);
  //digitalWrite(BUZZER_PIN, HIGH);

  // flash LEDs and vibrate buzzer during timeout. !!! section is blocking !!!
  while (millis() - timeoutStartTime < HIT_TIMEOUT) {
    // Flash LEDs RED
    /*
    for (int i = 0; i < strip.numPixels(); i++) {
      strip.setPixelColor(i, strip.Color(127.5 * (1.0 + sin(millis() / 100.0)), 0, 0));
    }
    strip.show();
    */

    // In last 20% of timeout, begin to move servo towards starting position
    int timeVal = (millis() - timeoutStartTime) / 100;
    if (millis() > timeoutStartTime + (HIT_TIMEOUT * (4.0 / 5.0))) {
      myservo.write(SERVO_INITIAL_POS);
    }

    // Pulse the buzzer (uses moduluo millis)
    /*if (timeVal % 10 < 1) {
      digitalWrite(BUZZER_PIN, LOW);
    } else if (millis() < timeoutStartTime + min(HIT_TIMEOUT * (4.0 / 5.0), 3000)) {
      digitalWrite(BUZZER_PIN, HIGH);
    } else {
      digitalWrite(BUZZER_PIN, LOW);
    }*/
  }

  // after time out reset buzzer and lights 
  /*digitalWrite(BUZZER_PIN, LOW);
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, strip.Color(0, 0, 0));
  }
  strip.show();
  isReloading = false;
  if (deathTakesAmmo && !infiniteAmmo) {
    ammo = 0;
  }
  */
  myservo.detach();
}

// >>>>>>>>>>>>>>>>>>>>> RUN UI COMPONENTS <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
/*void UpdateLights(unsigned long currentMillis) {
  for (int i = 0; i < strip.numPixels(); i++) {
    if (i < ammo) {
      int green = max(20, 255 * (0.5 * (1.0 + sin(currentMillis / 1000.0 * PI + i / 6.0 * PI))));
      strip.setPixelColor(i, strip.Color(0, green, 0));
    } else {
      strip.setPixelColor(i, strip.Color(0, 0, 0));
    }
  }
  strip.show();
}*/

/*void UpdateAmmo(bool dir, unsigned long currentMillis) {
  if (ammo > maxAmmo) {
    ammo = maxAmmo;
    isReloading = false;
  }
  if (!infiniteAmmo) {
    if (!dir) {
      ammo -= 1;
    } else {
      int cVal = min(255.0, 255.0 * pow(double(currentMillis - reloadTimer) / double(RELOAD_TIME_EACH), 2.0));
      strip.setPixelColor(ammo - 1, strip.Color(cVal, cVal, cVal));
      strip.show();
      if (currentMillis - reloadTimer > RELOAD_TIME_EACH) {
        ammo += 1;
        reloadTimer = currentMillis;
      }
    }
  }
}*/

// >>>>>>>>>>>>>>>>>>>>>>> BUTTON DEBOUNCE FILTERS <<<<<<<<<<<<<<<<<<<<<<<<<
bool ReadTriggerButton() {
  int triggerVal = digitalRead(TRIGGER_PIN);
  if (triggerVal != lastTriggerVal) {
    lastTDebounceTime = millis();
  }
  if ((millis() - lastTDebounceTime) > DEBOUNCE_DELAY) {
    if (triggerVal != triggerState) {
      triggerState = triggerVal;
    }
  }
  lastTriggerVal = triggerVal;
  return triggerState == LOW;
}

/*void ReadReloadButton(unsigned long currentMillis) {
  int reloadVal = digitalRead(RELOAD_PIN);
  if (reloadVal != lastReloadVal) {
    lastRDebounceTime = currentMillis;
  }
  if ((currentMillis - lastRDebounceTime) > DEBOUNCE_DELAY) {
    if (reloadVal != reloadState) {
      reloadState = reloadVal;
    }
  }
  lastReloadVal = reloadVal;
  if (reloadState == LOW) {
    isReloading = true;
    reloadTimer = currentMillis;
  }
}*/
