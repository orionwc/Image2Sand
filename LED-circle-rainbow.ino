#include <FastLED.h>

#define LED_PIN     2
#define NUM_LEDS    241

CRGB leds[NUM_LEDS];

#define NUM_LED_CIRCLES 9
int led_per_circle[NUM_LED_CIRCLES] = {60, 48, 40, 32, 24, 16, 12, 8, 1};
// Color pattern per ring: R, Orange, RG, G, GB, B, RB, RGB, R
CRGB ring_colors[NUM_LED_CIRCLES] = {
  CRGB(64, 0, 0),      // Ring 0: R (Red)
  CRGB(96, 16, 0),     // Ring 1: Orange (Red + some Green)
  CRGB(64, 64, 0),     // Ring 2: RG (Red + Green = Yellow)
  CRGB(0, 64, 0),      // Ring 3: G (Green)
  CRGB(0, 64, 64),     // Ring 4: GB (Green + Blue)
  CRGB(0, 0, 64),      // Ring 5: B (Blue)
  CRGB(64, 0, 64),     // Ring 6: RB (Red + Blue)
  CRGB(96, 0, 16),     // Ring 7: Dark Purple
  CRGB(64, 64, 64)     // Ring 8: White
};

void setup() {
  FastLED.addLeds<WS2812, LED_PIN, GRB>(leds, NUM_LEDS);
  FastLED.clear();


  int led_index = 0;

  for (int i = 0; i < NUM_LED_CIRCLES; i++) {
    for (int j = 0; j < led_per_circle[i]; j++) {
      leds[led_index] = ring_colors[i];  // Color based on ring pattern
      FastLED.show();
      delay(10);
      led_index++;
    }
  }

}

void loop() {

}