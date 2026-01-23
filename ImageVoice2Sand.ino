/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
INCLUDED LIBRARIES
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


#include <Arduino.h>
#include <elapsedMillis.h>            //Creates timer objects that are more convenient for non-blocking timing than millis()
#include <AccelStepper.h>             //Controls the stepper motors
#include <FastLED.h>                  //Controls the RGB LEDs
#include <OneButtonTiny.h>            //Button management and debouncing


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CUSTOM PATTERNS/MODES

// Enable standard built-in patterns
#define ENABLE_STANDARD_PATTERNS false    // Disable to save memory when using only streaming/custom patterns

// Enable Voice2Sand - Drawing images streamed to the sand garden
#define ENABLE_STREAMING_PATTERN false   // Enable pattern_Remote (streaming coordinates via serial)

// Autostart configuration
#define AUTO_START_PATTERN false          // Set to true to autostart the pattern on power-up. Set to false for pattern selection mode.

// Note: When ENABLE_STREAMING_PATTERN is true, Serial communication is initialized at 9600 baud for receiving
// coordinate data in the format <POS:r,theta> where r is 0-1000 and theta is angle in tenths of degrees (0-3600).


// Memory limitations mean that both cannot be enabled at the same time.


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
CUSTOM PATTERN SELECTION

Uncomment the patterns below that you want to include. Each enabled pattern becomes its own numbered 
pattern in the pattern selection menu.

Pattern numbering order:
1. Streaming pattern (if ENABLE_STREAMING_PATTERN is true)
2. Custom patterns A-J (each enabled pattern gets sequential number)
3. SimpleSpiral (always enabled, cannot be disabled)
4. Other standard patterns 2-10 (if ENABLE_STANDARD_PATTERNS is true)
  
  Example 1: Streaming ON, PATTERN_A and PATTERN_C enabled, standard patterns ON:
    - Pattern 1: Streaming
    - Pattern 2: Pattern A (CrunchLabs Logo)
    - Pattern 3: Pattern C (Mountains)
    - Pattern 4: SimpleSpiral
    - Patterns 5-13: Other standard patterns (Cardioids, WavySpiral, etc.)
  
  Example 2: Streaming ON, PATTERN_A enabled, standard patterns OFF:
    - Pattern 1: Streaming
    - Pattern 2: Pattern A
    - Pattern 3: SimpleSpiral
  
  Example 3: Streaming OFF, PATTERN_A and PATTERN_B enabled, standard patterns OFF:
    - Pattern 1: Pattern A
    - Pattern 2: Pattern B
    - Pattern 3: SimpleSpiral

To add your own pattern:
1. Find an empty pattern slot (PATTERN_A through PATTERN_J)
2. Paste your coordinates from the Image2Sand tool into that pattern's data block below
3. Uncomment the #define for that pattern
4. Compile and upload
5. Your pattern will appear as a numbered pattern in the selection menu
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//=== ENABLE CUSTOM PATTERNS - Uncomment the patterns you want to include ===
//=== If you want to use your own, leave this code as it is and ===
//=== paste the pattern below the line "PASTE CUSTOM PATTERN HERE" in the section ENABLE_CUSTOM_PATTERN_A below ===
#define ENABLE_CUSTOM_PATTERN_A      // CrunchLabs Logo
#define ENABLE_CUSTOM_PATTERN_B      // Palm Tree
#define ENABLE_CUSTOM_PATTERN_C      // Mountains
#define ENABLE_CUSTOM_PATTERN_D      // Fir Tree
#define ENABLE_CUSTOM_PATTERN_E      // Iceberg
#define ENABLE_CUSTOM_PATTERN_F      // Cat
#define ENABLE_CUSTOM_PATTERN_G      // Squirrel
#define ENABLE_CUSTOM_PATTERN_H      // Taj Mahal
#define ENABLE_CUSTOM_PATTERN_I      // Rocket Ship
#define ENABLE_CUSTOM_PATTERN_J      // Intentional Butterfly

//=== POSITIONS STRUCT - Used by pattern coordinate data below ===
//Struct used for storing positions of the axes in polar coordinates (radial, angular)
struct Positions {
  short int radial;                     // the units for these values are motor steps; in pattern_Picture and pattern_Remote the units are scaled from 0-1000
  short int angular;                    // in pattern_Picture and pattern_Remote the units are degrees * 10
};

//=== CUSTOM PATTERN DATA - Paste your coordinates from Image2Sand tool below ===
// More patterns available at https://github.com/orionwc/Image2Sand/blob/main/CommunityPatterns.txt

#ifdef ENABLE_CUSTOM_PATTERN_A
// Pattern A: CrunchLabs Logo
static const Positions patternA[] PROGMEM = {

  // If you have a custom pattern from the Image2Sand Website, 
  // comment out the pattern directly below this line by inserting // in front of it, 
  // and paste the new pattern below it:
  {239,1834},{312,2560},{321,2598},{536,3239},{565,3249},{589,3242},{620,3209},{623,3106},{622,3027},{625,2934},{624,2843},{619,2767},{627,2758},{627,2642},{618,2597},{625,2581},{617,2571},{645,2513},{680,2486},{986,2410},{998,2416},{992,2484},{1000,2498},{1000,2566},{992,2634},{1000,2640},{999,2752},{999,2880},{998,2994},{998,3116},{996,3203},{997,3304},{998,3363},{999,3442},{996,3556},{999,79},{998,202},{997,300},{998,423},{997,507},{996,630},{998,754},{996,869},{996,953},{996,1048},{996,1162},{997,1272},{996,1384},{997,1483},{997,1615},{997,1719},{999,1861},{999,1982},{996,2083},{988,2086},{658,1997},{617,1934},{626,1859},{623,1767},{623,1625},{621,1471},{620,1390},{620,1275},{623,1157},{624,1073},{623,978},{622,857},{623,763},{622,680},{622,600},{621,519},{620,391},{599,361},{561,351},{320,996},{298,1072},{233,1703}

// *********** PASTE CUSTOM PATTERN HERE (and comment out line above) ********************

};
#endif

#ifdef ENABLE_CUSTOM_PATTERN_B
// Pattern B: Palm Tree
static const Positions patternB[] PROGMEM = {
  //{90,916},{180,2791},{375,2743},{385,2712},{342,2617},{376,2649},{393,2621},{416,2675},{432,2669},{498,2452},{648,2324},{880,2274},{941,2252},{986,2265},{987,2282},{928,2387},{863,2595},{888,2833},{915,2952},{998,3116},{1000,3140},{941,3148},{887,3126},{686,3095},{495,2943},{470,2992},{459,2935},{442,2937},{413,3064},{425,2917},{413,2893},{103,221},{318,923},{338,878},{350,632},{347,462},{380,433},{413,312},{442,321},{534,195},{557,255},{575,366},{581,519},{563,671},{506,839},{588,807},{677,702},{708,706},{778,668},{800,678},{890,637},{945,632},{892,758},{804,869},{726,931},{662,965},{484,1026},{639,1136},{744,1240},{789,1331},{811,1448},{796,1507},{679,1433},{651,1444},{600,1395},{540,1362},{576,1519},{587,1644},{587,1717},{573,1896},{511,1861},{462,1778},{436,1783},{383,1679},{361,2005},{358,2168},{340,2287},{228,2092},{200,2102},{168,1774},{148,1750},{201,1371},{194,1307},{282,1098},{295,1037}

// CrunchLabs Pattern-Shift Repro
{1000, 0},{1000, 1800},
{626,1859},{623,1767},{623,1625},{621,1471},{620,1390},{620,1275},{623,1157},{624,1073},{623,978},{622,857},{623,763},{622,680},{622,600},{621,519},{620,391},{599,361},{561,351},{320,996},{298,1072},{233,1703}
//,{1000, 0},{1000, 1800}


//{626,1859},{623,1767},{623,1625},{621,1471},{620,1390},{620,1275},{623,1157},{624,1073},{623,978},{622,857},
//{1000, 0},{1000, 1800},
//{623,763},{622,680},{622,600},{621,519},{620,391},{599,361},{561,351},{320,996},{298,1072},{233,1703},
//{1000, 0},{1000, 1800}
    
// Repros but small changes
//{626,1859},{623,1767},{623,1625},{621,1471},{620,1390},{620,1275},{623,1157},{624,1073}

};
#endif

#ifdef ENABLE_CUSTOM_PATTERN_C
// Pattern C: Mountains
static const Positions patternC[] PROGMEM = {
  //{156,663},{199,761},{306,968},{343,858},{262,862},{440,720},{404,531},{372,546},{333,422},{319,435},{363,628},{372,718},{307,598},{288,636},{243,624},{262,726},{187,627},{260,546},{267,374},{357,305},{385,369},{443,220},{434,298},{497,292},{521,208},{549,206},{716,2},{655,3592},{575,6},{300,261},{91,347},{127,1399},{266,1837},{319,1803},{445,1822},{589,1858},{625,1893},{567,1934},{422,2020},{382,3256},{383,2957},{428,2962},{482,3024},{692,3208},{1000,3341},{487,3041},{418,2969},{387,2967},{402,3243},{381,3269},{419,2011},{552,1934},{613,1891},{578,1863},{357,1815},{267,1853},{117,1429},{83,319},{191,217},{140,55},{151,3593},{230,139},{255,116},{317,208},{575,3598},{655,3585},{731,3599},{743,10},{506,301},{422,313},{395,371},{414,521},{456,737},{291,1080},{425,1199},{419,1280},{475,1340},{526,1502},{550,1507},{673,1640},{912,1705},{727,1671},{576,1568},{549,1582},{485,1401},{446,1322},{442,1399},{409,1193},{297,1131},{417,1649},{275,1344},{238,1317},{259,1168},{216,1168},{167,1039},{267,1105},{292,1032},{231,933},{205,948}
  {1000, 0},{1000, 1800},{1000, 0},{1000, 1800} // Line

};
#endif

#ifdef ENABLE_CUSTOM_PATTERN_D
// Pattern D: Fir Tree
static const Positions patternD[] PROGMEM = {
  //{339,3441},{344,3457},{452,3446},{491,3459},{525,3495},{523,3536},{302,383},{408,303},{431,306},{452,335},{488,710},{482,731},{496,723},{519,662},{548,650},{586,664},{743,865},{921,935},{787,994},{661,1206},{616,1228},{579,1220},{542,1182},{519,1493},{510,1525},{470,1540},{386,1491},{573,1880},{574,1918},{552,1940},{444,1924},{438,1940},{774,2108},{774,2127},{746,2146},{586,2199},{583,2212},{966,2231},{1000,2241},{991,2262},{957,2280},{761,2375},{615,2558},{774,2592},{874,2586},{941,2569},{910,2741},{935,2808},{929,2820},{860,2790},{741,2767},{650,2757},{597,2767},{643,2893},{925,3118},{983,3161},{972,3176},{728,3155},{513,3138},{515,3153},{658,3229},{725,3266},{742,3289},{732,3301}
  {1000, 0}, {1000,900}, {1000, 1800}, {1000, 2700} // Square
};
#endif

#ifdef ENABLE_CUSTOM_PATTERN_E
// Pattern E: Iceberg
static const Positions patternE[] PROGMEM = {
  {295,1046},{266,673},{382,484},{495,297},{648,261},{797,179},{960,174},{1000,196},{979,221},{817,236},{655,339},{789,594},{779,629},{666,709},{925,879},{941,902},{925,921},{770,1030},{811,1068},{809,1102},{633,1480},{672,1508},{834,1538},{974,1606},{982,1635},{944,1649},{797,1590},{605,1561},{493,1446},{333,1326},{295,1046},{266,673},{295,1046},{333,1326},{493,1446},{605,1561},{564,1630},{690,1869},{839,2618},{619,2762},{839,2618},{690,1869},{564,1630},{657,1652},{783,1869},{942,2606},{947,2634},{722,2768},{851,2858},{853,2890},{741,3542},{649,173},{564,201},{655,3530},{753,2883},{629,2796},{619,2762},{839,2618},{690,1869},{564,1630},{605,1561},{493,1446},{333,1326}
};
#endif

#ifdef ENABLE_CUSTOM_PATTERN_F
// Pattern F: Cat
static const Positions patternF[] PROGMEM = {
  {276,407},{268,649},{336,1177},{400,1188},{564,1149},{691,1156},{933,1224},{956,1234},{952,1246},{1000,1257},{910,1281},{933,1327},{935,1386},{898,1493},{807,1531},{686,1524},{640,1595},{646,1699},{639,1746},{598,1852},{538,2044},{555,2160},{752,2291},{836,2271},{868,2303},{859,2325},{898,2330},{920,2345},{893,2395},{850,2439},{806,2451},{743,2444},{707,2575},{758,2559},{796,2563},{826,2595},{832,2916},{814,2980},{791,3013},{802,3080},{800,3164},{785,3246},{751,3339},{704,3430},{651,3518},{530,337},{567,414},{646,479},{712,485},{776,464},{816,429},{835,379},{828,345},{797,313},{758,300},{682,305},{650,293},{642,242},{690,223},{776,231},{851,264},{908,317},{936,380},{921,456},{849,525},{737,577},{671,586},{603,576},{485,498},{420,370},{548,3464},{608,3373},{646,3249},{659,3162},{663,3085},{511,3224},{391,3420},{324,41},{294,221}
};
#endif

#ifdef ENABLE_CUSTOM_PATTERN_G
// Pattern G: Squirrel
static const Positions patternG[] PROGMEM = {
  {24,2284},{101,2137},{182,2174},{254,2221},{410,2320},{358,2214},{281,1953},{265,1682},{333,1306},{411,1208},{511,1164},{601,1160},{691,1179},{748,1201},{807,1233},{860,1268},{916,1314},{957,1359},{981,1392},{998,1438},{1000,1466},{986,1511},{964,1541},{920,1581},{884,1605},{836,1624},{723,1632},{683,1813},{674,1977},{672,2135},{666,2276},{659,2424},{651,2496},{635,2567},{669,2600},{689,2648},{708,2836},{709,2885},{679,2899},{642,2882},{602,2792},{584,2878},{555,2932},{563,3004},{712,3043},{752,3039},{779,3049},{833,3052},{921,3118},{944,3142},{927,3156},{884,3158},{818,3126},{786,3126},{700,3163},{659,3202},{648,3228},{660,3287},{681,3400},{782,3450},{867,3513},{873,3534},{862,3557},{795,12},{736,50},{617,107},{598,154},{568,198},{536,234},{512,246},{492,238},{432,115},{299,3596},{87,53}
};
#endif

#ifdef ENABLE_CUSTOM_PATTERN_H
// Pattern H: Taj Mahal
static const Positions patternH[] PROGMEM = {
  {261,108},{308,301},{339,433},{357,552},{414,795},{442,882},{479,883},{494,867},{507,886},{538,876},{597,898},{536,920},{505,912},{496,928},{442,913},{357,1186},{339,1328},{307,1497},{267,1659},{289,1669},{314,1623},{315,1677},{362,1755},{382,1870},{429,1904},{443,1979},{460,1978},{475,1934},{466,1850},{485,1851},{493,1890},{513,1887},{509,1809},{532,1813},{537,1881},{559,1892},{798,2260},{883,2204},{702,1912},{682,1872},{695,1862},{681,1822},{733,1755},{785,1822},{771,1835},{774,1857},{791,1864},{779,1877},{819,1992},{834,1995},{828,2009},{903,2095},{966,2163},{989,2158},{1000,2166},{1000,3234},{989,3241},{957,3230},{767,3476},{767,3533},{751,3541},{758,3578},{717,42},{698,42},{695,22},{653,3571},{667,3562},{670,3534},{655,3514},{674,3511},{716,3380},{708,3366},{725,3360},{789,3254},{875,3188},{798,3136},{552,3513},{531,3518},{530,3596},{501,3598},{507,3512},{487,3511},{484,3557},{462,3547},{471,3465},{454,3420},{437,3498},{417,3530},{396,3532},{389,9},{329,121},{336,169},{315,169},{304,124}
};
#endif

#ifdef ENABLE_CUSTOM_PATTERN_I
// Pattern I: Rocket Ship
static const Positions patternI[] PROGMEM = {
  {809,911},{666,1069},{525,1276},{422,1575},{413,1965},{745,2082},{998,2289},{972,2324},{671,2457},{698,2555},{809,2575},{822,2596},{822,2804},{809,2825},{698,2845},{679,2957},{972,3076},{1000,3096},{998,3111},{745,3318},{413,3435},{422,225},{557,580},{695,765},{791,866}
};
#endif

#ifdef ENABLE_CUSTOM_PATTERN_J
// Pattern J: Intentional Butterfly
static const Positions patternJ[] PROGMEM = {
  {103,1036},{486,1340},{659,1378},{752,1411},{885,1461},{981,1504},{999,1518},{1000,1534},{975,1553},{935,1565},{864,1565},{766,1586},{741,1610},{693,1640},{681,1678},{644,1716},{629,1761},{582,1836},{539,1850},{468,1845},{530,1896},{579,1944},{608,2007},{621,2093},{610,2139},{616,2172},{601,2217},{606,2264},{585,2316},{588,2353},{555,2410},{553,2434},{538,2455},{480,2496},{387,2550},{215,2655},{161,2695},{225,2735},{334,2821},{488,2908},{543,2952},{586,3050},{585,3092},{605,3145},{594,3185},{611,3239},{606,3272},{618,3320},{603,3406},{561,3475},{467,3553},{563,3550},{589,3567},{608,3594},{643,80},{682,120},{698,162},{769,213},{835,229},{939,234},{986,250},{1000,266},{996,281},{947,312},{815,367},{692,413},{612,435},{476,464},{114,689},{151,796},{150,848},{238,710},{367,699},{219,735},{149,865},{148,941},{248,1060},{352,1027},{268,1068},{142,967},{127,1010},{109,980}
};
#endif

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AUTOMATIC CONFIGURATION - Do not modify
// Auto-detect if any custom patterns are enabled
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#if defined(ENABLE_CUSTOM_PATTERN_A) || defined(ENABLE_CUSTOM_PATTERN_B) || defined(ENABLE_CUSTOM_PATTERN_C) || defined(ENABLE_CUSTOM_PATTERN_D) || defined(ENABLE_CUSTOM_PATTERN_E) || defined(ENABLE_CUSTOM_PATTERN_F) || defined(ENABLE_CUSTOM_PATTERN_G) || defined(ENABLE_CUSTOM_PATTERN_H) || defined(ENABLE_CUSTOM_PATTERN_I) || defined(ENABLE_CUSTOM_PATTERN_J)
  #define ENABLE_CUSTOM_PATTERN true
#else
  #define ENABLE_CUSTOM_PATTERN false
#endif


//Circular LED display - Set this to true if you have connected a circular LED display under the sand.
//You will also need to set the constants in the LED CIRCLE block below.
#define USE_LED_CIRCLE false

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
PREPROCESSOR DIRECTIVES.

Useful values and limits for defining how the sand garden will behave. In most cases, these values should not be changed.

*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// #define REVERSE_R_MOTOR               //uncomment this line to switch the direction the radial axis motor runs 
// #define REVERSE_A_MOTOR               //uncomment this line to switch the direction the angular axis motor runs

#define STEPS_PER_MOTOR_REV   2048                                    //Number of motor steps in one revolution of the output shaft of the motor. 
#define STEPS_PER_A_AXIS_REV  2 * STEPS_PER_MOTOR_REV                 //the number of steps required to move the angular axis one full revolution
#define TRAVEL_PER_PINION_REV 50.267                                  //Distance in mm the rack moves in one complete revolution of the pinion.
#define STEPS_PER_MM          81.4849                                 //Precomputed motor steps per mm of radial axis travel. 
#define MM_PER_STEP           1.0 / STEPS_PER_MM                      //Millimeters of travel per motor step on radial axis. Evaluates to 0.01227 if STEPS_PER_REV is 2048. 
#define STEPS_PER_DEG         (STEPS_PER_A_AXIS_REV) / 360            //Motor steps per degree of motion on angular axis. Should be about 11.378 steps per degree.
#define DEG_PER_STEP          1 / STEPS_PER_DEG                       //Degrees of rotation on angular axis per motor step. About .08799 degrees.
#define STEPS_PER_RAD         STEPS_PER_MOTOR_REV / PI                //Motor steps per radian of motion on angular axis. About 652. 
#define RAD_PER_STEP          1 / STEPS_PER_RAD                       //Radians travelled on angular axis per motor step. About 0.00153

#define ACTUAL_LEN_R_MM       87.967                                  //Length in mm of the radial axis (hard limits). Derived from the CAD model of the hardware.
#define ACTUAL_LEN_R_STEPS    ACTUAL_LEN_R_MM * STEPS_PER_MM          //Maximum possible length of radius in steps of motor (hard limits). Should be 7167 when 2048 steps per rev in motor.
#define MAX_R_STEPS           7000                                    //Soft limit on how far the radius can move in terms of steps of the motor. This leaves a slight buffer on each end.
#define MAX_R_MM              MAX_R_STEPS * MM_PER_STEP               //Soft limit length in mm of the radial axis. 85.91mm. 

#define HOMING_BUFFER         (ACTUAL_LEN_R_STEPS - MAX_R_STEPS) / 2  //Crash home R axis to 0, then move this many steps in positive direction to create a soft stop.
#define RELAXATION_BUFFER     STEPS_PER_DEG * 5                       //Crash homing tensions the bead chain, and backlash and flex in the gantry need to be released.

#define MAX_SPEED_R_MOTOR     550.0                                   //Maximum speed in steps per second for radius motor. Faster than this is unreliable.
#define MAX_SPEED_A_MOTOR     550.0                                   //Maximum speed in steps per second for angle motor.


//The following is used to reduce angular speed linearly with the current position on the radial axis.
//This helps the ball move at a more consistent speed through the sand regardless of how far out it is on the radial axis.
//This is just a linear function that can be fine tuned by changing the amount removed from the max speed (currently 50.0).
//Essentially what this does is drops the speed of the angular axis to 50.0 steps per second at the very outer edge of 
//the actual length of the radial axis. This point is unreachable in typical use because of the soft limits.
#define ANGULAR_SPEED_SCALAR  (MAX_SPEED_A_MOTOR  - 150.0) / (MAX_R_STEPS)    

//Pin definitions follow. 
//The #ifdef / #endif blocks are used to check to see if either REVERSE_R_MOTOR or REVERSE_A_MOTOR
//is defined at the very top of the code, and if they are, the order the pins are defined in changes.

#ifdef REVERSE_A_MOTOR
  #define MOTORA_IN1_PIN   12
  #define MOTORA_IN2_PIN   11
  #define MOTORA_IN3_PIN   10
  #define MOTORA_IN4_PIN   9
#endif

#ifndef REVERSE_A_MOTOR
  #define MOTORA_IN1_PIN   9
  #define MOTORA_IN2_PIN   10
  #define MOTORA_IN3_PIN   11
  #define MOTORA_IN4_PIN   12
#endif

#ifdef REVERSE_R_MOTOR
  #define MOTORR_IN1_PIN   5         
  #define MOTORR_IN2_PIN   6         
  #define MOTORR_IN3_PIN   7
  #define MOTORR_IN4_PIN   8
#endif

#ifndef REVERSE_R_MOTOR
  #define MOTORR_IN1_PIN   8         //The motor is flipped upside down in assembly, so pin order is reversed from other motor.
  #define MOTORR_IN2_PIN   7         
  #define MOTORR_IN3_PIN   6
  #define MOTORR_IN4_PIN   5
#endif

  
#define JOYSTICK_A_PIN   A2          //Left-right axis of joystick, associated with changing angular axis in manual mode
#define JOYSTICK_R_PIN   A3          //Up-down axis of joystick, associated with changing radial axis in manual mode
#define BUTTON_PIN       A1          //Joystick button pin
#define RANDOM_SEED_PIN  A6          //used to generate random numbers.
#define LED_DATA_PIN     A0          //The output for the LED bar.
#define NUM_LEDS         8           //Number of LEDs in the bar.
#define MAX_BRIGHTNESS   40          //Brightness values are 8-bit for a max of 255 (the range is [0-255]), this sets default maximum to 40 out of 255.
#define LED_FADE_PERIOD  1000        //Amount of time in milliseconds it takes for LEDs to fade on and off.

// ************ LED CIRCLE BLOCK - Set these paramaters if using a circle LED display ***********
#if USE_LED_CIRCLE
  #define CIRCULAR_LED_PIN 2           //The output pin for the circular LED display.
  #define NUM_CIRCULAR_LEDS 241        //Number of LEDs in the circular display.
  #define NUM_LED_CIRCLES 9            //Number of concentric circles in the LED display
  #define THETA_OFFSET_JUMP_DEG 5      //Theta offset jump in degrees with left/right joystick press

  int led_per_circle[NUM_LED_CIRCLES] = {60, 48, 40, 32, 24, 16, 12, 8, 1};   // Number of LEDs per circle on LED display (outermost to innermost)
  int thetaOffset = 0;                 // Theta offset between the Sand Image and the image on the LED display in degrees (-180 to +180) - can adjusted by joystick during drawing
  
  //Color cycle for image drawing: White, Red, Orange, Yellow, Green, Cyan, Blue, Purple, Pink
  #define NUM_IMAGE_COLORS 9
  CRGB image_led_colors[NUM_IMAGE_COLORS] = {
    CRGB::White,
    CRGB(255, 0, 0),      // Ring 0: R (Red)
    CRGB(255, 64, 0),     // Ring 1: Orange (Red + some Green)
    CRGB(255, 255, 0),    // Ring 2: RG (Red + Green = Yellow)
    CRGB(0, 255, 0),      // Ring 3: G (Green)
    CRGB(0, 255, 255),    // Ring 4: GB (Green + Blue)
    CRGB(0, 0, 255),      // Ring 4: B (Blue)
    CRGB(255, 0, 255),    // Ring 6: RB (Red + Blue)
    CRGB(255, 0, 42)      // Ring 7: Dark Purple
  };

  CRGB circularLeds[NUM_CIRCULAR_LEDS];   //Circular LED display array

#endif


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
MOTION CONTROL AND PATTERN GENERATION

The following items are for tracking the position of the gantry, reading the joystick, and defining target positions for 
the gantry through the use of pattern functions. 
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Create two objects, one for each stepper motor.
AccelStepper stepperAngle(4, MOTORA_IN1_PIN, MOTORA_IN3_PIN, MOTORA_IN2_PIN, MOTORA_IN4_PIN);     //angular axis motor
AccelStepper stepperRadius(4, MOTORR_IN1_PIN, MOTORR_IN3_PIN, MOTORR_IN2_PIN, MOTORR_IN4_PIN);    //radial axis motor

//These variables of type Positions (defined at top of file) are for storing gantry positions and joystick values
Positions currentPositions;       //store the current positions of the axes in this
Positions targetPositions;        //store the desired positions of the axes in this
Positions joystickValues;         //store the potentiometer values of the joystick in this. I didn't want to make a new struct just for the joystick.

//Function prototypes for pattern generators. Each pattern function has to return a struct of type Positions. 
//This will be used as the target position for the motion controller. Note that these are just
//function prototypes. They are put up here to let the compiler know that they will be defined later in the code.
Positions pattern_SimpleSpiral(Positions current, bool restartPattern = false);               //Simple spiral. Grows outward, then inward. (Always enabled)
#if ENABLE_STANDARD_PATTERNS
  Positions pattern_Cardioids(Positions current, bool restartPattern = false);                  //Cardioids
  Positions pattern_WavySpiral(Positions current, bool restartPattern = false);                 //Wavy spiral.
  Positions pattern_RotatingSquares(Positions current, bool restartPattern = false);            //Rotating squares
  Positions pattern_PentagonSpiral(Positions current, bool restartPattern = false);             //Pentagon spiral
  Positions pattern_HexagonVortex(Positions current, bool restartPattern = false);              //Hexagon vortex
  Positions pattern_PentagonRainbow(Positions current, bool restartPattern = false);            //Pentagon rainbow
  Positions pattern_RandomWalk1(Positions current, bool restartPattern = false);                //Random walk 1 (connected by arcs)
  Positions pattern_RandomWalk2(Positions current, bool restartPattern = false);                //Random walk 2 (connected by lines)
  Positions pattern_AccidentalButterfly(Positions current, bool restartPattern = false);        //Accidental Butterfly
#endif
#if ENABLE_STREAMING_PATTERN
  Positions pattern_Remote(Positions current, bool restartPattern = false);                     //Remote Coordinates (Streaming)
#endif

// Individual custom pattern functions - each enabled pattern becomes its own pattern number
#ifdef ENABLE_CUSTOM_PATTERN_A
  Positions pattern_PictureA(Positions current, bool restartPattern = false);                   //Custom Pattern A
#endif
#ifdef ENABLE_CUSTOM_PATTERN_B
  Positions pattern_PictureB(Positions current, bool restartPattern = false);                   //Custom Pattern B
#endif
#ifdef ENABLE_CUSTOM_PATTERN_C
  Positions pattern_PictureC(Positions current, bool restartPattern = false);                   //Custom Pattern C
#endif
#ifdef ENABLE_CUSTOM_PATTERN_D
  Positions pattern_PictureD(Positions current, bool restartPattern = false);                   //Custom Pattern D
#endif
#ifdef ENABLE_CUSTOM_PATTERN_E
  Positions pattern_PictureE(Positions current, bool restartPattern = false);                   //Custom Pattern E
#endif
#ifdef ENABLE_CUSTOM_PATTERN_F
  Positions pattern_PictureF(Positions current, bool restartPattern = false);                   //Custom Pattern F
#endif
#ifdef ENABLE_CUSTOM_PATTERN_G
  Positions pattern_PictureG(Positions current, bool restartPattern = false);                   //Custom Pattern G
#endif
#ifdef ENABLE_CUSTOM_PATTERN_H
  Positions pattern_PictureH(Positions current, bool restartPattern = false);                   //Custom Pattern H
#endif
#ifdef ENABLE_CUSTOM_PATTERN_I
  Positions pattern_PictureI(Positions current, bool restartPattern = false);                   //Custom Pattern I
#endif
#ifdef ENABLE_CUSTOM_PATTERN_J
  Positions pattern_PictureJ(Positions current, bool restartPattern = false);                   //Custom Pattern J
#endif

/**
 * @brief Typedef for storing pointers to pattern-generating functions.
 * 
 * This typedef defines a custom data type PatternFunction for storing pointers to pattern functions. 
 * It allows pattern functions to be called by passing the appropriate index number to an array of pattern function pointers, 
 * simplifying the process of switching between patterns. Each pattern function takes a Positions struct and a bool as parameters 
 * and returns the next target position as a Positions struct.
 * 
 * @typedef PatternFunction
 * 
 * This typedef enables pattern switching by indexing into an array of pattern functions, making it easy to select and execute 
 * different patterns dynamically.
 */
typedef Positions (*PatternFunction)(Positions, bool);

/**
 * @brief Array of pattern-generating functions.
 * 
 * This array stores the functions responsible for generating different patterns, defined using the PatternFunction typedef. 
 * To add a new pattern function, follow these steps:
 * 1. Declare the new pattern function prototype (e.g., Positions pattern_42(Positions current);).
 * 2. Add the new pattern function to this array.
 * 3. Define the function at the end of the code.
 * 
 * @note The array is 0-indexed, but the controller interface (joystick and LEDs) uses 1-indexing. 
 * Therefore, pattern 1 is stored at index 0, pattern 2 at index 1, and so on. This offset is handled within the code, 
 * but keep it in mind when working with the array.
 * 
 * Pattern numbering order (simplified):
 * 1. Streaming pattern (if ENABLE_STREAMING_PATTERN = true)
 * 2. Custom patterns A-J (each enabled pattern gets sequential number)
 * 3. SimpleSpiral (always enabled)
 * 4. Other standard patterns 2-10 (if ENABLE_STANDARD_PATTERNS = true)
 */
PatternFunction patterns[] = {
#if ENABLE_STREAMING_PATTERN
                              pattern_Remote,
#endif
#if ENABLE_CUSTOM_PATTERN
  #ifdef ENABLE_CUSTOM_PATTERN_A
                              pattern_PictureA,
  #endif
  #ifdef ENABLE_CUSTOM_PATTERN_B
                              pattern_PictureB,
  #endif
  #ifdef ENABLE_CUSTOM_PATTERN_C
                              pattern_PictureC,
  #endif
  #ifdef ENABLE_CUSTOM_PATTERN_D
                              pattern_PictureD,
  #endif
  #ifdef ENABLE_CUSTOM_PATTERN_E
                              pattern_PictureE,
  #endif
  #ifdef ENABLE_CUSTOM_PATTERN_F
                              pattern_PictureF,
  #endif
  #ifdef ENABLE_CUSTOM_PATTERN_G
                              pattern_PictureG,
  #endif
  #ifdef ENABLE_CUSTOM_PATTERN_H
                              pattern_PictureH,
  #endif
  #ifdef ENABLE_CUSTOM_PATTERN_I
                              pattern_PictureI,
  #endif
  #ifdef ENABLE_CUSTOM_PATTERN_J
                              pattern_PictureJ,
  #endif
#endif
                              pattern_SimpleSpiral
#if ENABLE_STANDARD_PATTERNS
                              , pattern_Cardioids, pattern_WavySpiral, pattern_RotatingSquares, pattern_PentagonSpiral, pattern_HexagonVortex, pattern_PentagonRainbow, pattern_RandomWalk1,
                              pattern_RandomWalk2, pattern_AccidentalButterfly
#endif
                              };


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
STATE MACHINE FLAGS:
This code uses simple state machine to keep track of which mode the machine is in (e.g., actively running a pattern, or in pattern selection mode).
These flags are used in that state machine.
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// AUTOSTART CONFIGURATION:
// To autostart a specific pattern on power-up:
// 1. Set AUTO_START_PATTERN to true (at top of file, near streaming configuration)
// 2. Set currentPattern to the pattern number you want to start with
// 
// Pattern numbering order (see detailed examples in CUSTOM PATTERN SELECTION section above):
// 1. Streaming (if enabled) = Pattern 1
// 2. Custom patterns A-J = Patterns 2+ (sequential)
// 3. SimpleSpiral = Next pattern number (always enabled)
// 4. Other standard patterns = Following numbers (if ENABLE_STANDARD_PATTERNS = true)
//
// Quick examples:
// - Streaming ON: currentPattern = 1; (for streaming autostart)
// - Streaming OFF, Pattern A ON: currentPattern = 1; (for Pattern A autostart)
// - Streaming ON, Pattern A ON: currentPattern = 2; (for Pattern A autostart)
// - Streaming OFF, Pattern A ON: currentPattern = 3; (for SimpleSpiral autostart)

int currentPattern = 1;           // default to pattern 1 (streaming if enabled, otherwise first custom pattern or SimpleSpiral). Change to desired pattern number for autostart.
bool runPattern = AUTO_START_PATTERN;          // Set to true to autostart the pattern on power-up. Set to false for pattern selection mode.
bool buttonShortPressed = false;  //button pressed state flag.
bool buttonLongPressed = false;   //for indicating long press
bool autoMode = true;             //tracking if we're in automatic or manual mode. Defaults to auto on startup. If you want to start in manual drawing mode, set this to false.
bool motorsEnabled = true;        //used to track if motor drivers are enabled/disabled. initializes to enabled so the homing sequence can run.
bool patternSwitched = false;     //used for properly starting patterns from beginning when a new pattern is selected
int lastPattern = currentPattern; //used with currentPattern to detect pattern switching and set the patternSwitched flag.


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
FUNCTION PROTOTYPES.

These are basically a way of telling the compiler that we will have functions with these names and parameters, which will be defined later in the code. 
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Math related functions
long convertDegreesToSteps(float degrees);                                      //for converting degrees to motor steps
float convertStepsToDegrees(int steps);                                         //for converting motor steps to degrees
long convertRadiansToSteps(float rads);                                         //For converting radians to steps on angular axis
float convertStepsToRadians(float steps);                                       //For converting steps to radians on angular axis
int convertMMToSteps(float mm);                                                 //for converting millimeters to steps on radial axis
float convertStepsToMM(float steps);                                            //for converting steps to millimeters on the radial axis
float fmap(float n, float in_min, float in_max, float out_min, float out_max);  //version of map() that works for floating point numbers
int modulus(int x, int y);                                                      //Use for wrapping values around at ends of range. like %, but no negative numbers.

//Movement related functions
int findShortestPathToPosition(int current, int target, int wrapValue);         //For finding the shortest path to the new position on the angular axis
int calcRadialChange(int angularMoveInSteps, int radialMoveInSteps);            //for figuring out the relative change on the radial axis
int calcRadialSteps(int current, int target, int angularOffsetSteps);           //For calculating actual number of steps radial motor needs to take.
int calculateDistanceBetweenPoints(Positions p1, Positions p2);                 //calculate distance between two points in polar coordinates. Not currently used, but useful
void homeRadius();                                                              //for homing the radial axis on startup
void moveToPosition(long angularSteps, long radialSteps);                       //for moving both axes to target position simultaneously.
Positions orchestrateMotion(Positions currentPositions, Positions targetPositions);                      //Encapsulates steps required to move to target position and returns the new current position.

//Miscellaneous functions
Positions readJoystick(void);                                                   //returns a struct containing the current joystick values

//Geometry generation functions
Positions drawLine(Positions point0, Positions point1, Positions current, int resolution, bool reset);             //For drawing a straight line between two points
void nGonGenerator(Positions *pointArray, int numPoints, Positions centerPoint, int radius, float rotationDeg = 0.0);   //generates a list of points that form a polygon's vertices
void translatePoints (Positions *pointArray, int numPoints, Positions translationVector);              //For moving an array of points along a vector to a new position
void scalePoints (Positions *pointArray, int numPoints, float scaleFactor);                            //NOT IMPLEMENTED - For scaling a shape represented by a point array up or down in size
void rotatePoints (Positions *pointArray, int numPoints, Positions rotationCenter, float rotationDeg); //NOT IMPLEMENTED - For rotating a point array around an arbitrary point
void reflectPoints(Positions *pointArray, int numPoints, Positions reflectionVector);                  //NOT IMPLEMENTED - For reflecting a point array across an arbitrary line


#pragma region LedDisplayClass

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
This is a class that contains all the functions and data required to handle the LED display bar.
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class LedDisplay {
private:
  CRGB leds[NUM_LEDS];        //array that holds the state of each LED

public:
  //This is the constructor. It's called when a new instance of the class is created, and handles setting things up for use.
  LedDisplay() {              
    FastLED.addLeds<WS2812B, LED_DATA_PIN, GRB>(leds, NUM_LEDS);
    FastLED.setBrightness(MAX_BRIGHTNESS);
    FastLED.clear();
  }

  //a proxy function for setting the brightness of the LEDs. This way the class can handle all the LED stuff
  //without relying on the user to sometimes call on FastLED directly.
  void setBrightness(uint8_t val) {
    FastLED.setBrightness(val);
  }

/**
 * @brief Indicates the currently selected pattern by lighting up LEDs in a specific color.
 *
 * This function uses the FastLED library to light up the LEDs in a specific pattern to indicate which pattern is selected. 
 * A solid color is shown to indicate that the machine is in pattern selection mode. If the value is 255, the manual drawing 
 * mode is indicated by lighting a single LED in DarkCyan. For other pattern values, the LEDs are lit using bitwise operations 
 * to determine which LEDs should be turned on.
 *
 * @param value The current pattern number, where 255 indicates manual drawing mode, and other values indicate specific patterns.
 * 
 * @note The .fadePixels() method can be used to make the LEDs fade, indicating that the machine is running a pattern. This function 
 * uses bitwise operations to determine the LED pattern, lighting the LEDs in MediumVioletRed for non-manual patterns.
 */
  void indicatePattern(uint8_t value) {                     //used for showing which pattern is selected
    //Clear only the LED bar, not all LEDs (to preserve circular LED display)
    for (int i = 0; i < NUM_LEDS; i++) {
      leds[i] = CRGB::Black;
    }
    if (value == 255) {                                     //pattern255 is the manual drawing mode.
      leds[0] = CRGB::DarkCyan;
    } else {                                                //all other patterns can be displayed with bitwise operations
      for (int i = 0; i < NUM_LEDS; i++) {                  //iterate through each LED in the array
        if (value & (1 << i)) {                             //bitwise AND the value of each bit in the pattern number to determine if current LED needs to be turned on. 
          leds[NUM_LEDS - 1 - i] = CRGB::MediumVioletRed;   //turn on the LED if needed
        }
      }
    }
    FastLED.show();                                         //display the LEDs
  }

  /**
 * @brief Gradually fades the LEDs on and off over time to indicate that a pattern is running.
 *
 * This function automatically controls the brightness of the LEDs, causing them to fade in and out over a specified period. 
 * It is intended to be used when the machine is running a pattern to provide a visual indication of operation.
 *
 * @param period The time in milliseconds it takes for the LEDs to fade in and out (complete cycle).
 * @param maxBrightness The maximum brightness level the LEDs will reach during the fade cycle.
 *
 * The function calculates the current brightness based on the time position in the fade cycle, applying the appropriate brightness 
 * to all LEDs using the FastLED.setBrightness() function.
 */
  void fadePixels(unsigned long period, uint8_t maxBrightness) {
    unsigned long currentTime = millis();
    unsigned long timeInCycle = currentTime % period; // Time position in current cycle
    unsigned long halfPeriod = period / 2;
    int brightness;

    // Determine phase and calculate brightness
    if (timeInCycle < halfPeriod) {
      // Fading in
      brightness = map(timeInCycle, 0, halfPeriod, 0, maxBrightness);
    } else {
      // Fading out
      brightness = map(timeInCycle, halfPeriod, period, maxBrightness, 0);
    }

    // Apply calculated brightness to all LEDs
    FastLED.setBrightness(brightness);
    FastLED.show();
  }


/**
 * @brief Animates an LED bouncing pattern during the homing process and flashes green when homing is complete.
 *
 * This function animates a bouncing light pattern on the LEDs to indicate that the gantry is in the process of homing. 
 * Once homing is complete, the LEDs flash green to signal completion. The function can block execution briefly during the 
 * flashing portion after homing is done.
 *
 * @param homingComplete A boolean flag indicating whether the homing process is complete. If set to false, the animation continues. 
 * If set to true, the LEDs flash green to indicate completion.
 *
 * The animation consists of a bouncing light pattern with a color that changes over time. When the gantry finishes homing, 
 * the LEDs flash green in a blocking manner for a brief period.
 */
  void homingSequence(bool homingComplete = false) {
    static unsigned long lastUpdate = 0;

    const byte fadeAmount = 150;
    const int ballWidth = 2;
    const int deltaHue  = 4;

    static byte hue = HUE_RED;
    static int direction = 1;
    static int position = 0;
    static int multiplier = 1;

    FastLED.setBrightness(MAX_BRIGHTNESS);

    if (!homingComplete) {                      //If the homing sequence is not complete, animate this pattern.
      if (millis() - lastUpdate >= 100) {
        hue += deltaHue;
        position += direction;

        if (position == (NUM_LEDS - ballWidth) || position == 0) direction *= -1;

        for (int i = 0; i < ballWidth; i++) {
          leds[position + i].setHue(hue);
        }

        // Randomly fade the LEDs
        for (int j = 0; j < NUM_LEDS; j++) {
          //if (random(10) > 3)
          leds[j] = leds[j].fadeToBlackBy(fadeAmount);  
        }
        FastLED.show();
        lastUpdate = millis();
      }
    } else {                                    //if the homing sequence is complete, indicate that by flashing the LEDs briefly.
      for (int i = 0; i < NUM_LEDS; i++) {
        leds[i] = CRGB::Green;
      }
      
      for (int j = 0; j < 8; j++) {
        FastLED.setBrightness(constrain(MAX_BRIGHTNESS * multiplier, 0, MAX_BRIGHTNESS));
        multiplier *= -1;
        FastLED.show();
        delay(100);
      }
    }
  }
};

#pragma endregion LedDisplayClass

//Create an instance of the LedDisplay class that controls the RGB LEDs.
LedDisplay display;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
MISC. GLOBAL VARIABLES.
Used for tracking time and button presses.
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

elapsedMillis lastJoystickUpdate;                    //used to track the last time the joystick was updated to prevent absurdly fast scrolling

//Create an object that handles the joystick button
OneButtonTiny button(BUTTON_PIN, true, true);        //set up the button (button pin, active low, enable internal pull-up resistor)


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
SETUP FUNCTION (runs once when Arduino powers on)
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void setup() {
  #if ENABLE_STREAMING_PATTERN
    Serial.begin(9600);   // Required to allow serial communication for Pattern_Remote
#endif

  //Generate a random seed. If you want to use pseudorandom numbers in a pattern, this makes them more random.
  //Make sure that RANDOM_SEED_PIN is an analog pin that's not connected to anything.
  randomSeed(analogRead(RANDOM_SEED_PIN));

  //configure the joystick and button pins
  pinMode(JOYSTICK_A_PIN, INPUT);
  pinMode(JOYSTICK_R_PIN, INPUT);

  //Set up the button.
  //Single press of button is for starting or stopping the current pattern.
  button.attachClick([]() {       //This is called a lambda function. Basically it's a nameless function that runs when the button is single pressed.
    runPattern = !runPattern;     //this flips the boolean state of the variable. If it's true, this sets to false, if false set to true.
  });

  //Attaching an event to the long press of the button. Currently, long pressing the button lets you end the homing process early.
  button.attachLongPressStart([]() {
    buttonLongPressed = true;         
  });

  //set the maximum speeds and accelerations for the stepper motors.
  stepperAngle.setMaxSpeed(MAX_SPEED_A_MOTOR);
  stepperAngle.setAcceleration(5000.0);           // Need high acceleration without losing steps. 
  stepperRadius.setMaxSpeed(MAX_SPEED_R_MOTOR);
  stepperRadius.setAcceleration(5000.0);

  FastLED.clear();            //clear the LEDs
  FastLED.show();

#if USE_LED_CIRCLE
  //Initialize circular LED display
  FastLED.addLeds<WS2812, CIRCULAR_LED_PIN, GRB>(circularLeds, NUM_CIRCULAR_LEDS);
  FastLED.clear();
  FastLED.show();
#endif

  homeRadius();               //crash home the radial axis. This is a blocking function.
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
MAIN LOOP (runs endlessly).
This manages the state machine, tracks the position of the gantry, and acquires the target positions for
the gantry from the selected pattern functions or from manual mode.
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

void loop() {
  //Check to see if the button has been pressed. This has to be called as often as possible to catch button presses.
  button.tick();

  //if the runPattern flag is set to true, we need to start updating target positions for the controller. run the appropriate pattern!
  if (runPattern) {
    #pragma region Running
    //make sure the motors are enabled, since we want to move them
    if (!motorsEnabled) {
      stepperAngle.enableOutputs();     //enable the motor
      stepperRadius.enableOutputs();
      motorsEnabled = true;             //set the state machine flag
    }

    //First we'll check the state machine flags to see if we're in manual drawing mode.
    if (!autoMode) {          //Not in autoMode, which means we're in manual drawing mode
      #pragma region ManualMode

      //Use the LEDs to indicate that we are in manual drawing mode
      display.setBrightness(MAX_BRIGHTNESS);
      display.indicatePattern(255);             //pattern 255 is used to indicate manual drawing mode on the LEDs

      joystickValues = readJoystick();          //read joystick values and store them in joystickValues struct
      //first check if an angular change is requested by joystick input
      if (joystickValues.angular < 0) {
        targetPositions.angular = currentPositions.angular - (STEPS_PER_MOTOR_REV / 100);    //add steps to the target position
      } else if (joystickValues.angular > 0) {
        targetPositions.angular = currentPositions.angular + (STEPS_PER_MOTOR_REV / 100);
      } else {
        targetPositions.angular = currentPositions.angular;   //otherwise maintain current position
      }
      //next check if a radial change is requested by joystick input
      if (joystickValues.radial < 0) {
        targetPositions.radial = currentPositions.radial - (MAX_R_STEPS / 100);
      } else if (joystickValues.radial > 0) {
        targetPositions.radial = currentPositions.radial + (MAX_R_STEPS / 100);
      } else {
        targetPositions.radial = currentPositions.radial;
      }

      //finally, take the steps necessary to move both axes to the target position in a coordinated manner and update the current position.
      currentPositions = orchestrateMotion(currentPositions, targetPositions);   

      #pragma endregion ManualMode
    

    //In this case, the state machine flags indicate that we're in automatic pattern mode, not manual mode.
    } else {                                        //automatic pattern mode
      #pragma region AutomaticMode
      //update the LED pattern display
      display.setBrightness(MAX_BRIGHTNESS);       
      display.indicatePattern(currentPattern);     
      
      //check to see if the pattern has been switched
      if (currentPattern != lastPattern) {
        patternSwitched = true;               //set the flag to indicate that the pattern has been changed
        lastPattern = currentPattern;         //now we can say that the last patten is the current pattern so that this if block will be false until pattern is changed again
      }

#if USE_LED_CIRCLE
      //Check joystick for theta offset adjustment when drawing (for streaming and custom picture patterns)
      //Streaming is pattern 1 (if enabled), custom patterns follow sequentially
      //Enable for pattern 1 (streaming) and patterns 2-11 (custom patterns, up to 10 patterns, if enabled)
      if ((ENABLE_STREAMING_PATTERN && currentPattern == 1) || (ENABLE_CUSTOM_PATTERN && currentPattern >= 2 && currentPattern <= 11)) {
        joystickValues = readJoystick();
        if (lastJoystickUpdate >= 200) {  //Debounce joystick input
          int oldThetaOffset = thetaOffset;
          if (joystickValues.angular >= 90) {  //Joystick pushed right
            thetaOffset += THETA_OFFSET_JUMP_DEG * 10;  //Add theta offset jump
            lastJoystickUpdate = 0;
          } else if (joystickValues.angular <= -90) {  //Joystick pushed left
            thetaOffset -= THETA_OFFSET_JUMP_DEG * 10;  //Subtract theta offset jump
            lastJoystickUpdate = 0;
          }
          //Sanitize theta offset to 0-3600 range
          thetaOffset = thetaOffset % 3600;
          if (thetaOffset < 0) {
            thetaOffset += 3600;
          }
          //Clear LEDs when offset actually changes
          if (thetaOffset != oldThetaOffset) {
            for (int i = 0; i < NUM_CIRCULAR_LEDS; i++) {
              circularLeds[i] = CRGB::Black;
            }
            FastLED.show();
          }
        }
      }
#endif

      //Call the function that will generate the pattern. 
      //This automatically calls the appropriate function from the patterns[] array.
      //Pass in the currentPositions as an argument, and the pattern function returns the targetPositions.
      //Note that the target positions are absolute coordinates: e.g., a pattern might say
      //to move to (radius, angle) = (1000 steps, 45 degrees (converted to steps)).
      //There is only one position on the sand tray that corresponds to those coordinates. 
      targetPositions = patterns[currentPattern - 1](currentPositions, patternSwitched);      //subtracing 1 here because I count patterns from 1, but the array that stores them is 0-indexed.

      patternSwitched = false;    //after we've called the pattern function above, we can reset this flag to false.

      //finally, take the steps necessary to move both axes to the target position in a coordinated manner and update the current position.
      currentPositions = orchestrateMotion(currentPositions, targetPositions);

      #pragma endregion AutomaticMode
    }
    #pragma endregion Running


  } else {    //In this case, runPattern is false, which means this is pattern selection mode
    #pragma region SelectionMode

    //if the motors are enabled, disable them to save power while they don't need to run
    if (motorsEnabled) {
      stepperAngle.disableOutputs();
      stepperRadius.disableOutputs();
      motorsEnabled = false;
    }

    //read the joystick state so that it can be used in the following if statements
    joystickValues = readJoystick();

    if (!autoMode) {                                        //This means we're not in automatic mode, so we are in manual drawing mode.
      display.indicatePattern(255);                         //The value 255 is used to represent manual mode on the LEDs.
      display.fadePixels(LED_FADE_PERIOD, MAX_BRIGHTNESS);  //update the brightness of the LEDs to fade them in and out over time

      if (lastJoystickUpdate >= 200 && (joystickValues.angular >= 90 || joystickValues.angular <= -90)) {  //the joystick is pushed all the way to the right or left
        autoMode = true;                                    //switch to automatic mode so that we can do pattern selection
        lastJoystickUpdate = 0;                             //reset the joystick update timer
      }
    } else {                                                //We're in automatic mode, which means it's time to select a pattern.
      display.indicatePattern(currentPattern);
      display.fadePixels(LED_FADE_PERIOD, MAX_BRIGHTNESS);  

      if (lastJoystickUpdate >= 200 && joystickValues.radial >= 90) {                              //if it's been 200ms since last joystick update and joystick is pushed all the way up
        currentPattern++;                                                                          //increment pattern number by 1
        if ((currentPattern == 255) || (currentPattern > sizeof(patterns)/sizeof(patterns[0]))) {  //if currentPattern equals 255 or the number of elements in the pattern array
          currentPattern = 1;                               //this handles wrapping back around to beginning of patterns.
        }
        lastJoystickUpdate = 0;                             //reset the timer that tracks the last time the joystick was updated
      } else if (lastJoystickUpdate >= 200 && joystickValues.radial <= -90) {                      //if it's been 200ms since last update and joystick is pushed all the way down
        currentPattern--;
        if (currentPattern < 1) {
          currentPattern = sizeof(patterns)/sizeof(patterns[0]);   //this handles wrapping up to the top end of the array that holds the patterns
        }
        lastJoystickUpdate = 0;

      } else if (lastJoystickUpdate >= 200 && (joystickValues.angular >= 90 || joystickValues.angular <= -90)) {  //if the joystick was pushed all the way to the left
        autoMode = false;                                                                                         //switch to manual mode
        lastJoystickUpdate = 0;   
      }   
    }
    #pragma endregion SelectionMode
  }
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
Miscellaneous functions. Currently this region only includes the function for reading the values of the joystick.
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#pragma region MiscFunctions

/**
 * @brief Reads the analog values from the joystick potentiometers and returns them as a Positions struct.
 *
 * This function reads the analog input values from the joystick's potentiometers on the specified pins,
 * maps the values to a range of -100 to 100 for the angular axis and 100 to -100 for the radial axis, 
 * and applies a deadband to eliminate small fluctuations around the center.
 *
 * @return Positions - a struct containing the mapped and processed values of the angular and radial joystick positions.
 * 
 * The deadband ensures that values near the center of the joystick are treated as zero to account for 
 * measurement noise and prevent unintended small movements.
 */
Positions readJoystick(void) {
  Positions values;
  values.angular = map(analogRead(JOYSTICK_A_PIN), 0, 1023, -100, 100);
  values.radial = map(analogRead(JOYSTICK_R_PIN), 0, 1023, 100, -100);

  if (values.angular <= 5 && values.angular >= -5) values.angular = 0;   //apply a deadband to account for measurement error near center.
  if (values.radial <= 5 && values.radial >= -5) values.radial = 0;
  return values;
}

#pragma endregion MiscFunctions




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
This region of code contains all the functions related to calculating and performing the motion of the gantry. 
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#pragma region Motion

/**
 * @brief Calculates the effective radial change, accounting for the motion of the angular axis.
 *
 * The radial axis movement is influenced by the angular axis movement, so this function computes the 
 * actual change in the radial axis by considering the steps taken by both the angular and radial motors.
 * 
 * @param angularMoveInSteps The number of steps the angular motor has moved.
 * @param radialMoveInSteps The number of steps the radial motor has moved.
 * 
 * @return int The effective radial change in steps, with the angular axis movement accounted for. 
 *         A positive value indicates a decrease in radius, while a negative value indicates an increase in radius.
 */
int calcRadialChange(int angularMoveInSteps, int radialMoveInSteps) {
  int actualChangeR = angularMoveInSteps - radialMoveInSteps;

  //should return the number of steps R axis has moved, with A axis motion accounted for.
  //if actualChangeR is positive, radius is decreasing. 
  //if actualChangeR is negative, radius is increasing.
  return actualChangeR;          
}


/**
 * @brief Moves both the angular and radial motors to their target positions simultaneously.
 *
 * This function performs relative movements of the motors by taking in the number of steps
 * required for each motor to reach its target. One motor will move at maximum speed, while the 
 * speed of the other motor is scaled to ensure both motors reach their target positions at the 
 * same time. Note that this is a blocking function, meaning no other code will execute while 
 * the motors are moving.
 *
 * @param angularSteps The number of steps the angular motor needs to move to reach its target.
 * @param radialSteps The number of steps the radial motor needs to move to reach its target.
 * 
 * The function adjusts the speed of the motors proportionally based on the distance each motor 
 * needs to travel, ensuring they complete their movements simultaneously. It also reduces the 
 * maximum speed of the angular motor based on the current radial position to avoid excessive 
 * speed at the outer edges.
 *
 * The function checks the state of the run/stop button during execution to allow for immediate 
 * termination of the movement if needed.
 */
void moveToPosition(long angularSteps, long radialSteps) {
  long absStepsA = abs(angularSteps), absStepsR = abs(radialSteps);           //absolute values used to compare total distance each motor travels
  float maxSpeedA = MAX_SPEED_A_MOTOR, maxSpeedR = MAX_SPEED_R_MOTOR;
  float moveTime = 0.0;
  
  // Reduce the maximum angular speed based on the radial position of the ball.
  // If you don't do this, the ball moves too fast when it's on the outer edge of the sand tray.
  float speedReducer = ANGULAR_SPEED_SCALAR * currentPositions.radial;  
  maxSpeedA = MAX_SPEED_A_MOTOR - speedReducer;                         
  
  float speedA = maxSpeedA, speedR = maxSpeedR;              //one of the motors will eventually be moved at max speed, the other will be slowed down.

  //determine which motor has a shorter move, and slow it down proportional to the ratio of the distance each motor travels.

  if ((absStepsA > absStepsR) && (absStepsA != 0)) {         //if Angle motor is moving farther. the second conditional avoids a divide by zero error.
    moveTime = (float)absStepsA / maxSpeedA;                 //how long it will take to move A axis to target at top speed.
    speedR = (float)absStepsR / moveTime;                    //recalculate speed of R motor to take same time as A motor move. Slows down R motor.

  } else if ((absStepsR > absStepsA) && (absStepsR != 0)) {
    moveTime = (float)absStepsR / maxSpeedR;                 //Radial is moving farther. Time in seconds to make that move at max speed.
    speedA = (float)absStepsA / moveTime;                    //Slow down A to complete its move in same amount of time as R.
  }

  //set up the moves for each motor
  stepperAngle.move(angularSteps);       //set up distance the motor will travel in steps. This value can be positive or negative: the sign determines the direction the motor spins.
  stepperAngle.setSpeed(speedA);         //call this to ensure that the motor moves at constant speed (no accelerations).
  stepperRadius.move(radialSteps);
  stepperRadius.setSpeed(speedR);


  //execute steps at the correct speed as long as a motor still needs to travel, and as long as the run/stop
  //button has not been pressed. If the runPattern flag is false, this loop will immediately exit,
  //leaving steps unfinished in the targeted move. There is code in the main loop after the call to moveToPosition()
  //that deals with this.

  //this is a blocking section. The only thing that can happen here is moving the motors and updatting the button state.
  //Adding more functionality inside this loop risks losing synchronization of the motors.
  while (((stepperAngle.distanceToGo() != 0) || (stepperRadius.distanceToGo() != 0)) && runPattern) {     
    stepperAngle.runSpeedToPosition();                             //constant speed move, unless the target position is reached.
    stepperRadius.runSpeedToPosition();
    button.tick();                                                 //This blocking loop can potentially last a long time, so we have to check the button state.
  }
}




/**
 * @brief Performs crash homing on the radial axis at startup.
 *
 * This function moves the radial axis to its home position by driving the motor past the known range 
 * to ensure a hard stop at the mechanical limit. It allows the homing process to be interrupted early 
 * by a long press of the joystick button if the ball reaches the center of the sand garden.
 *
 * @details The function moves the radial axis at a high speed without acceleration to reduce torque 
 * when it reaches the mechanical stop. During the homing sequence, the function updates the LED display 
 * and checks for a long press of the joystick button to potentially terminate the homing process early. 
 * After reaching the stop, the function retracts the motor slightly to create a soft stop, releases any 
 * tension in the mechanism, and sets the current motor position as the origin (0,0).
 *
 * @note This function sets the current position of both the angular and radial motors to zero after homing.
 *
 * @return void
 */
void homeRadius() {
  stepperRadius.move(1.1 * ACTUAL_LEN_R_STEPS);                       //Longer than actual length of axis to ensure that it fully crash homes.
  stepperRadius.setSpeed(600.0);                                      //move fast without accelerations so that the motor has less torque when it crashes.
  while (stepperRadius.distanceToGo() != 0 && !buttonLongPressed) {   //run the R axis toward 0 for the entire length of the axis. Crash homing.
    stepperRadius.runSpeedToPosition();                               //non-blocking move function. has to be called in while loop.
    display.homingSequence(false);                                    //display the homing sequence pattern on the LEDs
    button.tick();                                                    //poll the button to see if it was long pressed
  }
  buttonLongPressed = false;
  stepperRadius.stop();

  delay(100);                                                     //brief delay.
  
  stepperRadius.move(-1 * (HOMING_BUFFER + RELAXATION_BUFFER));   //move away from 0 to create a soft stop. RELAXATION_BUFFER releases tension in bead chain/flexible structures
  stepperRadius.runToPosition();                                  //blocking move.

  stepperRadius.setCurrentPosition(0);                            //set the current positions as 0 steps.
  stepperAngle.setCurrentPosition(0);                             //The current locations of the motors will be the origins of motion.

  currentPositions.angular = 0;                                   //set the global current position variables to 0.
  currentPositions.radial = 0;
  display.homingSequence(true);                                   //now that homing is done, display the homing complete sequence on the LEDs
}



/**
 * @brief Calculates the shortest path to the target position on the angular axis.
 *
 * This function determines the shortest distance required to move from the current position to the 
 * target position on a circular axis, considering both clockwise and counterclockwise directions. 
 * It returns the shortest distance, taking into account a wraparound value for circular motion.
 *
 * @param current The current position on the angular axis, in steps.
 * @param target The desired target position on the angular axis, in steps.
 * @param wrapValue The wraparound point for the axis (e.g., the total number of steps per revolution).
 * 
 * @return int The shortest distance, in steps, required to move to the target position. 
 *         Positive values indicate clockwise movement, while negative values indicate counterclockwise movement.
 */
int findShortestPathToPosition(int current, int target, int wrapValue) {
  int dist1 = modulus((target - current), wrapValue);       
  int dist2 = -1 * modulus((current - target), wrapValue);
  if (abs(dist1) <= abs(dist2)) {
    return dist1;
  } else {
    return dist2;
  }
}



/**
 * @brief Calculates the number of steps required for the radial axis motor to move, accounting for the angular axis motion.
 *
 * This function computes the necessary steps for the radial axis motor to move from the current position 
 * to the target position. It compensates for the fact that the angular axis motion influences the radial 
 * axis but not vice versa. The function adjusts the radial movement based on the planned angular axis movement.
 *
 * @param current The current position of the radial axis in steps.
 * @param target The desired target position of the radial axis in steps.
 * @param angularOffsetSteps The number of steps the angular axis motor will move in the next planned move.
 * 
 * @return int The total number of steps the radial axis motor needs to move, adjusted for the angular axis offset.
 */
int calcRadialSteps(int current, int target, int angularOffsetSteps) {
  return ((current - target) + angularOffsetSteps);
}


/**
 * @brief Manages the entire process of moving both the angular and radial motors to their target positions.
 *
 * This function is responsible for coordinating the motion of both motors, ensuring that the angular 
 * values wrap correctly, that the radial target stays within the defined limits, and that the radial 
 * movement compensates for any angular axis movement. It encapsulates the series of steps required to 
 * calculate the necessary movements, execute them, and update the current positions.
 *
 * @param currentPositions The current position of both the angular and radial axes, represented as a Positions struct.
 * @param targetPositions The desired target position for both the angular and radial axes, represented as a Positions struct.
 * 
 * @return Positions The updated current positions of both the angular and radial axes after the motion has been executed.
 *
 * This function wraps the angular target around the 360-degree transition point and calculates the shortest path 
 * to the target. It also ensures that the radial position stays within its limits, compensates for the mechanical 
 * relationship between the axes, and updates the current position after the move. If the move is interrupted (e.g., 
 * by a long joystick press), the current position tracking adjusts accordingly.
 */
Positions orchestrateMotion(Positions currentPositions, Positions targetPositions) {
  //First take care of making sure that the angular values wrap around correctly,
  targetPositions.angular = modulus(targetPositions.angular, STEPS_PER_A_AXIS_REV);                                                 //wrap value around the 360 degree/0 degree transition if needed
  targetPositions.angular = findShortestPathToPosition(currentPositions.angular, targetPositions.angular, STEPS_PER_A_AXIS_REV);    //Find the shortest path to the new position.

  //First make sure the radial position target won't exceed the limits of the radial axis:
  targetPositions.radial = constrain(targetPositions.radial, 0, MAX_R_STEPS);

  //Update the radial target position based on how much the angular position is going to move.
  //This compensates for the mechanical link between the two axes. This also converts the absolute radial coordinate
  //into a relative coordinate, which stores how many steps the radial motor has to spin. 
  targetPositions.radial = calcRadialSteps(currentPositions.radial, targetPositions.radial, targetPositions.angular); 

  //execute the moves. This is a blocking function: it doesn't return until the move is complete.
  //Also note that these positions are relative coordinates. The pattern function generates an 
  //absolute position as the target to move to, and then the lines of code after that calculate
  //how far the motors have to move in steps to get there. moveToPosition() takes those motor 
  //steps as its arguments. So this function just tells the motors how far they have to move.
  moveToPosition(targetPositions.angular, targetPositions.radial);    


  //Update the current position.
  //moveToPosition can be exited before the move is complete by long pressing the joystick button, so we have
  //to make sure that our position tracking system accounts for that. We also have to use the target positions
  //to update the current position.
  targetPositions.angular -= stepperAngle.distanceToGo();
  targetPositions.radial -= stepperRadius.distanceToGo();
  currentPositions.angular += targetPositions.angular;
  currentPositions.angular = modulus(currentPositions.angular, STEPS_PER_A_AXIS_REV); //wrap the anglular position around if it needs it. 
  currentPositions.radial += calcRadialChange(targetPositions.angular, targetPositions.radial);

  return currentPositions;
}

#pragma endregion Motion




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
Geometry Generation.
Functions that handle generating points and shapes for drawing. Draw straight lines, create polygons, perform the basic geometric transformations
like rotation, translation, scaling, and (eventually) reflection.
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#pragma region GeometryGeneration

/**
 * @brief Precomputes and returns points approximating a straight line between two positions in polar coordinates.
 *
 * This function precomputes an array of points that approximate a straight line by interpolating between two 
 * end points specified in cartesian coordinates, then converts them to polar coordinates. It stores these points 
 * in a static array and returns the next point on each function call, allowing efficient streaming of precomputed 
 * line points. The line is divided into a specified number of segments (resolution), with a maximum of 100 points.
 *
 * @param point0 The starting point of the line, specified in radial and angular steps.
 * @param point1 The ending point of the line, specified in radial and angular steps.
 * @param current The current position of the gantry, used to calculate relative motion if needed.
 * @param resolution The number of segments to divide the line into, defaulting to 100 and capped at 100.
 * @param reset Bool - set true to force recalculation for a new line.
 *
 * @return Positions The next point along the precomputed line, with radial and angular values in steps.
 *
 * @note The function handles vertical lines by temporarily rotating the points 90 degrees to avoid calculation 
 * issues, then rotates them back before returning. The line is broken into segments up to the maximum length of 
 * the array, and lines close to the center of the field are handled with a higher resolution to maintain accuracy.
 *
 * @details The first call to this function precomputes all points along the line, and subsequent calls return 
 * each point in sequence. The function resets for a new line after the last point is returned.
 */
Positions drawLine(Positions point0, Positions point1, Positions current, int resolution = 100, bool reset = false) {
  //this is the nested array that will store the precomputed points. has to be static so values persist between function calls.
  //it will be of the form pointArray[100][2] = {{r0, theta0}, {r1, theta1}, ... {r99, theta99}}.
  //to access the theta value for point3 (4th point in array), you would call point3.angular = pointArray[3][1];

  //Future update: make this a single layer array of type Positions instead of type Int for simplicity.
  static int pointArray[100][2];  

  static int numPoints = 0;                           //the number of points the line will be approximated with.
  static bool newLine = true;                         //used to track if the function is being called for a new line, or if it needs to provide points for an extant line
  static float x0 = 0, x1 = 0, y0 = 0, y1 = 0;        //end points of the line
  static float xtemp = 0, ytemp = 0, thetaTemp = 0.0; //temporary storage for calculations
  static float stepover = 0;                          //how far to move along x-axis for interpolating along line
  static float m = 0;                                 //the slope of the line (y = mx + b)
  static float denom = 0;                             //the denominator in the slope calculation (x1 - x0)
  static float b = 0;                                 //the y-intercept of the line (y = mx + b)
  static bool pointsRotated = false;                  //used to indicate if points have been rotated to deal with vertical lines and need to be rotated back on output.

  Positions p0 = point0, p1 = point1;                 //containers for the points (we may need to modify their values to deal with vertical lines)
  Positions outputPoint;                              //the struct we'll use for passing the target positions out of the function
  static int outNum = 0;                              //used for tracking which point to return on each call to this function
  
  if (newLine || reset) {                             //if this is a new line, or the reset flag is set
    numPoints = constrain(resolution, 0, 100);     //we can approximate the line with up to 100 points. recalculate this number for each new line.
    
    //check now to see if there will be a vertical line after the coordinate transformation from polar to rectangular coords
    int comparisonA = STEPS_PER_A_AXIS_REV - max(p0.angular, p1.angular);        //units are in steps
    int comparisonB = min(p0.angular, p1.angular);

    //this next step checks to see if the line connecting these two points is within half a degree of vertical in the rectangular coordinate system.
    //From my early testing, if the lines are more than half a degree off of vertical, they render perfectly fine without special handling.
    //It's really just a vertical line that gets weird (e.g., a line connecting two points that are 45 and 315 degrees off the origin ray at the same radius).
    if ((comparisonA - comparisonB <= convertDegreesToSteps(0.5)) && (comparisonA - comparisonB >= convertDegreesToSteps(-0.5))) {
      pointsRotated = true;   //we're going to rotate the points by 90 degrees to deal with the nearly vertical line, so set this flag.
      p0.angular += convertDegreesToSteps(90);
      p1.angular += convertDegreesToSteps(90);
    }

    //take in the points, convert them to radians for the angular unit. only need to do this one time for a new line.
    //also convert each point from polar to cartesian coordinates.
    x0 = p0.radial * cos(convertStepsToRadians(p0.angular));        //x = r*cos(theta)
    y0 = p0.radial * sin(convertStepsToRadians(p0.angular));        //y = r*sin(theta)
    x1 = p1.radial * cos(convertStepsToRadians(p1.angular));        //x = r*cos(theta)
    y1 = p1.radial * sin(convertStepsToRadians(p1.angular));        //y = r*sin(theta)

    denom = x1 - x0;

    //calculate the slope
    m = (y1 - y0) / denom;
    //calculate the y-intercept   y = mx + b, so b = y - mx. Use point0 values for y and x
    b = y0 - (m * x0);


    if (b < 100.0 && b > -100.0) {      //if the line is within 100 steps of the origin
      //This takes care of lines that come really close to intercepting the origin. First, I'm using this range of values rather 
      //than saying if (b == 0.0) because this is using floating point math, and equalities like that almost never evaluate to
      //true with floats. Lines that come really close to the origin require the gantry to flip around 180 degrees in the
      //angular axis once the ball is at the center of the field. The straight line algorithm already handles this well, but if
      //the line is broken into a small number of segments, that large rotation at the center winds up drawing a small arc 
      //around the center. I dealt with this by just having the program maximize the number of segments the lines is broken
      //into for lines which come close to the center. You can adjust the values in the condition above to change what it means
      //for a line to be close to the center to fine tune how well straight lines are drawn.
      numPoints = 100;
    } 
    //This line doesn't come really close to intersecting the origin, so we'll handle it differently.
  
    //divide one axis into the number of segments required by resolution, up to a maximum of the length of the array they'll be stored in.
    //defining all of these values as static means the value will persist between function calls, but also means I have to reset them
    //to initial values once the last point in the line is returned.
    stepover = (x1 - x0) / (float)numPoints;       //should define how far to move along x axis for interpolation along line.

    for (int i = 0; i < numPoints; i++) {
      //start by generating absolute position values for the points along the line in terms of {r, theta}.
      //We are starting with absolute values because the end points of the line are specified in absolute coordinates.

      if (i == 0) {                                             //if it's the first point in the line, put the point0 values into the list to ensure we start there
        pointArray[i][0] = p0.radial;                       //these units are already in steps as absolute coordinates
        pointArray[i][1] = p0.angular;                      //units in steps, absolute coordinates. need to be changed to relative later.
      } else if (i == numPoints - 1) {                          //If it's the last point in the line, put point1 values into the list to make sure we end there.
        pointArray[i][0] = p1.radial;
        pointArray[i][1] = p1.angular;
      } else {                                                  //We're somewhere along the line that isn't the beginning or end, so we need to generate these values.
        //Calculate the next x value in the series. Use the values of i and stepover to figure out how many line segments to increment along from the starting point.
        //I'm using (i + 1) instead of i in the calculation because I'm handling the first and last points separately,
        //so by the time we get to this code, we need to move over by at least one increment of stepover, but i starts counting from 0.
        xtemp = x0 + (i + 1) * stepover;                              
        ytemp = m * xtemp + b;                                  //y = mx + b gives next y value in the series.

        //calculate the angular position of the current point.
        //atan2f(y, x) is a special version of the arctan function that returns the angle based on y and x.
        thetaTemp = atan2f(ytemp, xtemp); 

        //ata2f() has a range of (-pi, pi), and we'll need to shift that to be (0, 2pi)
        if (thetaTemp < 0) thetaTemp = 2.0 * PI + thetaTemp;    //this is in radians, ranging from 0 to 2pi

        //now that we know the anglular position of the point in radians, we need to find the radial position in units of steps
        //using the Pythagorean theorem (square roots calculate more efficiently than trig functions on Arduino Nano).
        //Then store the r and theta points in the array.
        pointArray[i][0] = sqrt(xtemp * xtemp + ytemp * ytemp); //the radial value of the point. This is absolute coordinates from the origin. Units are steps.
        //store the angular position converted from radians to steps. This is still in absolute coordinates, not relative.
        pointArray[i][1] = convertRadiansToSteps(thetaTemp);    
      }
      
      //finally, if we rotated the points to deal with a vertical line, rotate them back.
      if (pointsRotated) {
        pointArray[i][1] -= convertDegreesToSteps(90);
      }
    }

    //we need to set the newLine flag to false so that the next time this function is called,
    //we can output the points along the line rather than recalculating the points.
    newLine = false;       //later in the program, we have to reset this to true once the last line of the point is returned.
    reset = false;
    outNum = 0;            //need to reset this to 0 so we can start outputting the points, starting from the first one.
    pointsRotated = false;
  }
  
  //now we need to output the correct point in the array.
  if (outNum < numPoints) {
    outputPoint.radial = pointArray[outNum][0];   //put the r value into the struct
    outputPoint.angular = pointArray[outNum][1];  //put the theta value into the struct
    outNum++;                                     //increment to the next point in the array
  }

  //once the last point is ready for return, reset all the variables necessary to rerun all the calculations on the next call to this function.
  if (outNum >= numPoints) {
    newLine = true;
  }

  //finally, return the value of the point to be moved to!
  return outputPoint;
}


/**
 * @brief Generates the vertices of a regular n-sided polygon (n-gon) and stores them in an array of Positions.
 *
 * This function computes the vertices of a regular polygon (n-gon) with a specified number of sides, radius, 
 * center point, and optional rotation. The vertices are generated in polar coordinates, with the first vertex 
 * starting at angle 0 (or rotated by the specified degrees) and are then translated to be centered around the 
 * specified center point. The generated points are stored in the provided pointArray.
 *
 * @param pointArray A pointer to the array of Positions to be filled with the vertices of the polygon.
 * @param numPoints The number of vertices (or sides) of the polygon.
 * @param centerPoint The center point of the polygon, specified as a Positions struct (radial and angular coordinates).
 * @param radius The radius of the polygon, which is the distance from the center to each vertex (in motor steps).
 * @param rotationDeg An optional rotation of the polygon in degrees, defaulting to 0.0. This rotates the polygon around its center.
 *
 * @return void
 *
 * @note The function first generates the vertices centered on the origin in polar coordinates, then translates 
 * them to the specified center point by converting to rectangular coordinates, performing the translation, and 
 * converting back to polar. The translatePoints() function is used to handle this translation process.
 *
 * @example
 * // Example of generating an octagon with a radius of 4000 steps centered on the origin:
 * int numberVertices = 8;
 * Positions vertices[numberVertices];
 * Position center = {0, 0};
 * nGonGenerator(vertices, numberVertices, center, 4000, 0.0);
 *
 * // Example of generating a circle with 360 points and a radius of 2000 steps, centered at {3000, 60 degrees}:
 * int numberVertices = 360;
 * Positions vertices[numberVertices];
 * Position center = {3000, convertDegreesToSteps(60)};
 * nGonGenerator(vertices, numberVertices, center, 2000, 0.0);
 */
void nGonGenerator(Positions *pointArray, int numPoints, Positions centerPoint, int radius, float rotationDeg = 0.0) {
  //*pointArry is the pointer to the array that will be built out.
  //numPoints is the length of that array (equal to number of desired vertices).
  //centerPoint is the center point of the polygon (supply as a Position struct)
  //radius is the distance from the center point to a vertex. Units are motor steps.
  //rotationDeg rotates the polygon in degrees. The first vertex will always be at angle = 0, unless you specify a rotation angle.

  //Start by generating vertices in polar coords, centered on origin. 
  int angleStep = STEPS_PER_A_AXIS_REV / numPoints;      //calculate how much to step the angle over for each point

  for (int i = 0; i < numPoints; i++) {
    //define each vertex.
    //What i have done below is the same as doing:
    //pointArray[i].radial = radius; pointArray[i].angular = i * angleStep + convertDegreesToSteps(rotationDeg);
    //This is called aggregate initialization.

    pointArray[i] = {radius, i * angleStep + (int)convertDegreesToSteps(rotationDeg)};
  }

  //Currently all the points in the array are centered on the origin. We need to shift the points to be centered on the
  //desired center point. You can do this in polar coordinates, but it's much simpler to convert to rectangular coordinates,
  //move all the points, and then convert back to polar.
  
  if (centerPoint.radial != 0) {        //if the radial coordinate of the center point is not 0, we need to translate the polygon
    translatePoints(pointArray, numPoints, centerPoint);      //This moves all points in the array to be centered on the correct point
  }
}




/**
 * @brief Translates an array of points along a given translation vector, shifting their position in polar coordinates.
 *
 * This function translates the points in the pointArray by converting both the points and the provided 
 * translation vector from polar to rectangular coordinates, performing the translation, and then converting 
 * the points back to polar coordinates. It is useful for shifting polygons or target positions by a specified 
 * offset. For example, this function can be used to shift the center of a polygon generated by nGonGenerator().
 *
 * @param pointArray A pointer to an array of points (of type Positions) representing the points to be translated.
 * @param numPoints The number of points in the array.
 * @param translationVector The translation vector to shift the points by, specified as a Positions struct.
 *
 * @return void - the array is modified directly because it is passed into this function as a pointer.
 *
 * @note The translation is performed by first converting the points and translation vector to rectangular 
 * coordinates (x, y), adding the corresponding components, and then converting the updated points back to 
 * polar coordinates (r, θ). This ensures that the points are translated accurately in both radial and angular 
 * dimensions. The function assumes the angular component of the translation vector is in steps, and the 
 * radial component is in motor steps.
 *
 * @example
 * // Example usage to shift a polygon to a new center:
 * Positions vertices[8];
 * Positions translationVector = {3500, convertDegreesToSteps(45)};
 * nGonGenerator(vertices, 8, {0, 0}, 4000, 0.0);
 * translatePoints(vertices, 8, translationVector);
 */
void translatePoints(Positions *pointArray, int numPoints, Positions translationVector) {
  if (translationVector.angular != 0 || translationVector.radial != 0) {    //desired polygon is not centered on origin, so we need to shift the points.
    for (int i = 0; i < numPoints; i++) {
      float x = pointArray[i].radial * cos(convertStepsToRadians(pointArray[i].angular));
      float y = pointArray[i].radial * sin(convertStepsToRadians(pointArray[i].angular));

      //now figure out where the center point is in rectangular coordinates
      //NOTE: at some point I want to move this calculation out of the for loop for efficiency
      float centerX = translationVector.radial * cos(convertStepsToRadians(translationVector.angular));
      float centerY = translationVector.radial * sin(convertStepsToRadians(translationVector.angular));

      //now use centerX and centerY to translate each point.
      x += centerX;      //this should shift the X coordinate appropriately
      y += centerY;     //this should shift the Y coordinate appropriately

      //now convert back into polar coordinates

      //calculate the angular position of the current point. Units are in radians.
      //atan2f(y, x) is a special version of the arctan function that returns the angle based on y and x.
      float angleTemp = atan2f(y, x); 

      //atan2f() has a range of (-pi, pi), and we'll need to shift that to be (0, 2pi)
      if (angleTemp < 0) angleTemp = 2.0 * PI + angleTemp;    //this is in radians, ranging from 0 to 2pi

      //now that we know the anglular position of the point in radians, we need to find the radial position in units of steps
      //using the Pythagorean theorem (square roots calculate more efficiently than trig functions on Arduino Nano).
      //Then store the r and theta points in the array.
      pointArray[i].radial = round(sqrt(x * x + y * y));   //the radial value of the point. This is absolute coordinates from the origin. Units are steps.
  
      //store the angular position converted from radians to steps. This is still in absolute coordinates.
      pointArray[i].angular = convertRadiansToSteps(angleTemp);  
    }  
  }
}


/*
NOT IMPLEMENTED.

The idea of this function is to take in an array of points that represent a shape, like a
hexagon generated by nGonGenerator, and use it to scale it up or down in size. I don't 
yet have a great idea of how to solve this problem, so I left it here as a suggestion for 
the hacker. Try your hand at solving this problem!
*/
void scalePoints (Positions *pointArray, int numPoints, float scaleFactor) {

}


/*
NOT IMPLEMENTED.

The idea of this is totake in an array of points, such as one created by nGonGenerator,
and rotate them around an arbitrary point within the drawing field. I had planned to implement this,
but ran out of time, and have left it here as a suggestion for the hacker. Try your hand at
solving this problem!
*/
void rotatePoints(Positions *pointArray, int numPoints, Positions rotationCenter, float rotationDeg) {

}



/*
NOT IMPLEMENTED.

The idea for this is to take in an array of points, like that generated by nGonGenerator,
and to relect it across an arbitrary line in the drawing field. I had planned to implement this,
but ran out of time, and have left it here as a suggestion for the hacker. Try your hand at
solving this problem!
*/
void reflectPoints(Positions *pointArray, int numPoints, Positions reflectionVector) {

}



#pragma endregion GeometryGeneration




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
This region of code contains useful math functions for doing things like converting between units, doing modulus math that doesn't allow negative
numbers, and finding the distance between points in polar coordinates.
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#pragma region Math


/**
 * @brief Maps a float value from one range to another.
 *
 * This function works similarly to the standard map() function but allows for floating-point inputs 
 * and outputs. It maps a float n from a specified input range (in_min to in_max) to a corresponding 
 * output range (out_min to out_max).
 *
 * @param n The float value to map.
 * @param in_min The lower bound of the input range.
 * @param in_max The upper bound of the input range.
 * @param out_min The lower bound of the output range.
 * @param out_max The upper bound of the output range.
 *
 * @return float The mapped value in the output range.
 */
float fmap(float n, float in_min, float in_max, float out_min, float out_max) {
  return (n - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


/**
 * @brief Converts an angular measurement in degrees to the corresponding number of steps for a stepper motor.
 *
 * This function converts a given angle in degrees to the number of motor steps required for the stepper motor 
 * to rotate by that angle. The conversion is based on the number of steps per full revolution of the motor.
 *
 * @param degrees The angle in degrees to convert.
 *
 * @return long The number of steps required for the motor to move the specified angle.
 */
long convertDegreesToSteps(float degrees) {
  return round(fmap(degrees, 0.0, 360.0, 0.0, 2.0 * STEPS_PER_MOTOR_REV));
}

/**
 * @brief Converts an angular measurement in radians to the corresponding number of steps for a stepper motor.
 *
 * @param rads The angle in radians to convert.
 * @return long The number of steps required for the motor to move the specified angle in radians.
 */
long convertRadiansToSteps(float rads) {
  return round(fmap(rads, 0.0, 2.0 * PI, 0.0, 2.0 * STEPS_PER_MOTOR_REV));
}

/**
 * @brief Converts a number of steps to the corresponding angle in radians.
 *
 * @param steps The number of motor steps to convert.
 * @return float The equivalent angle in radians.
 */
float convertStepsToRadians(float steps){
  return fmap(steps, 0.0, 2.0 * STEPS_PER_MOTOR_REV, 0.0, 2.0 * PI);
}

/**
 * @brief Converts a number of steps to the corresponding angle in degrees.
 *
 * @param steps The number of motor steps to convert.
 * @return float The equivalent angle in degrees.
 */
float convertStepsToDegrees(int steps) {
  return fmap(float(steps), 0.0, 2.0 * STEPS_PER_MOTOR_REV, 0.0, 360.0);
}


/**
 * @brief Converts a distance in millimeters to the corresponding number of steps for the radial axis.
 *
 * @param mm The distance in millimeters to convert.
 * @return int The equivalent number of steps.
 */
int convertMMToSteps(float mm) {               
  return round(mm * STEPS_PER_MM);
}


/**
 * @brief Converts a number of steps to the corresponding distance in millimeters for the radial axis.
 *
 * @param steps The number of motor steps to convert.
 * @return float The equivalent distance in millimeters.
 */
float convertStepsToMM(float steps) {
  return steps * MM_PER_STEP;
}


/**
 * @brief Computes the modulus of two integers, ensuring the result is non-negative.
 *
 * This function is a replacement for the % operator that prevents negative results by wrapping 
 * negative values around to the positive range. It is mainly used for handling angular values 
 * when the gantry wraps from 360 degrees to 0 degrees.
 *
 * @param x The dividend.
 * @param y The divisor.
 * 
 * @return int The modulus result, always non-negative.
 */
int modulus(int x, int y) {
  return x < 0 ? ((x + 1) % y) + y - 1 : x % y;
}


/**
 * @brief Calculates the distance between two points in polar coordinates using the law of cosines.
 *
 * This function computes the distance between two points specified in polar coordinates (radii and angles). 
 * It uses the law of cosines to perform the calculation, assuming the angles are provided in degrees 
 * and the radii in arbitrary units. The returned distance is in the same units as the radii.
 *
 * @param p1 The first point, represented as a Positions struct (with radial and angular values).
 * @param p2 The second point, represented as a Positions struct (with radial and angular values).
 * 
 * @return int The calculated distance between the two points, rounded to the nearest integer.
 */
int calculateDistanceBetweenPoints(Positions p1, Positions p2) {
    return round(sqrt(pow(p1.radial, 2) + pow(p2.radial, 2) - 2 * p1.radial * p2.radial * cos(convertStepsToRadians(p2.angular) - convertStepsToRadians(p1.angular))));
}

#pragma endregion Math




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
This region of code contains the different pattern generating functions.
*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#pragma region Patterns

/**
 * @brief Pattern: Simple Spiral. Generates the next target position for drawing a simple inward and outward spiral.
 *
 * This function calculates the next target position for a simple spiral pattern, starting from the current position. 
 * The pattern progresses by incrementally adding small values to the current angular and radial positions. The spiral 
 * moves inward more quickly than it moves outward due to the mechanical relationship between the radial and angular axes.
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows for restarting the pattern (not used in this simple version). Defaults to false.
 * 
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 * @note The pattern starts from the current position, so if the previous pattern leaves the ball in a specific position, 
 * the spiral will continue from there. The pattern adjusts the radial and angular steps incrementally and reverses 
 * direction when the radial boundaries are reached.
 * @note This pattern is always enabled and cannot be disabled.
 */
Positions pattern_SimpleSpiral(Positions current, bool restartPattern = false) {                      
  Positions target;                                        //This is where we'll store the value of the next target position.

  const float angleDivisions = 100.0;                      //Going to divide a full revolution into 100ths. "const" because this never changes.
  const int radialDivisions = 10 * (int)angleDivisions;    //Going to divide the radial axis into 1000ths. Try changing the 10 to a different number, like 20.

  //Calculate how many degrees we'll move over in the angular axis for the next step.
  const int angleStep = convertDegreesToSteps(360.0 / angleDivisions);  

  //Calculate how far along we'll move the radial axis for the next step. 
  //The "static" keyword means that this variable is defined once when the function is run for the first time.
  //This is different than "const" because this is a variable, not a constant, so we can still change the value.
  //If the following line were to omit the "static" keyword, this variable would be reset to its initial value
  //every time the function is called, meaning that we couldn't change it between positive and negative to 
  //make the spiral grow inward or outward.
  static int radialStep = MAX_R_STEPS / radialDivisions;                 

  target.angular = current.angular + angleStep;            //Set the angular position of the new point to move to (target position)
  target.radial = current.radial + radialStep;             //Set the radial target position as the current radial position plus the radialStep

  if (target.radial > MAX_R_STEPS || target.radial < 0) {  //Logic to see if the targeted radial position is out of bounds of the radial axis
    radialStep *= -1;                                      //If we're out of bounds, switch the sign of the radialStep (now we move in the opposite direction)
    target.radial += 2 * radialStep;                       //We were already out of bounds, so we undo that by moving 2 radialSteps in the new direction.
  }

  return target;                                           //Return the target position so that the motion control functions can move to it.
}


#if ENABLE_STANDARD_PATTERNS
/**
 * @brief Pattern: Cardioids. Generates the next target position for drawing repeating, slowly rotating cardioids.
 *
 * This function generates the next target position for a cardioid pattern, moving in relative coordinates by adding 43 degrees 
 * to the current angular position and adjusting the radial position by 1/8th of the total radial axis. The pattern alternates 
 * the direction of radial movement, creating a stepped approximation of a triangle wave along the radial axis.
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern, setting the angular and radial positions to 0. Defaults to false.
 *
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 * @note This pattern works best after a reset, as it always operates in relative coordinates. If started after running another pattern, 
 * the results may vary, since it builds upon the current position of the gantry.
 */
Positions pattern_Cardioids(Positions current, bool restartPattern = false) {                      
  Positions target;
  const int radialStep = ((MAX_R_STEPS) / 8);       //we're going to take huge steps radially (this defaults to 1/8th of the radial axis)
  static int direction = 1;                         //1 means counterclockwise, -1 means clockwise
  static bool firstRun = true;

  if (firstRun || restartPattern) {                 //if it's the first time we're running the pattern, or if we start it from another pattern
    target.angular = 0;
    target.radial = 0;
    firstRun = false;
  } else {
  
    target.angular = current.angular + convertDegreesToSteps(43);   //add 43 degrees to current position
    
    //this block of code moves the radial axis back and forth in increments that are 1/8th the length of the total radial axis.
    //Basically, this is a stepped approximation of a triangle wave.

    int nextRadial = current.radial + (direction * radialStep);      //calculate potential next radial position

    if ((nextRadial <= MAX_R_STEPS) && (nextRadial >= 0)) {          //If the next radial position is in bounds of the radial axis soft limits
      target.radial = nextRadial;                                    //Moves the radial axis positive direction by 1/8th the length of the axis
    } else {
      direction *= -1;                                               //switch the radial step direction
      target.radial = current.radial + (direction * radialStep);
    }
  }

  return target;
}


/**
 * @brief Pattern: Wavy Spiral. Generates the next target position for drawing a wavy spiral pattern.
 *
 * This function creates a wavy spiral pattern, which is similar to the simple spiral pattern but with an additional sine wave 
 * component added to the radial position. The result is a spiral with oscillating radial movement, creating a wavy effect. 
 * The sine wave's amplitude and frequency can be adjusted to control the wave's characteristics.
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern. Defaults to false.
 * 
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 * @note This pattern adds a sine wave to the radial position to create the wavy effect. You can modify the amplitude and frequency 
 * of the wave to achieve different variations of the pattern. The radial movement is reversed when the limits of the radial axis are reached.
 */
Positions pattern_WavySpiral(Positions current, bool restartPattern = false) {

  Positions target;                                  //This is where we'll store the value of the next target position.

  float angleDivisions = 100.0;                      //Going to divide a full revolution into 100ths. "const" because this never changes.
  int radialDivisions = 10 * (int)angleDivisions;    //Going to divide the radial axis into 1000ths. Try changing the 10 to a different number, like 20.
  
  //Add in values for the amplitude and frequency of the sine wave
  float amplitude = 200.0;
  int period = 8;

  //Calculate how many degrees we'll move over in the angular axis for the next step.
  const int angleStep = convertDegreesToSteps(360.0 / angleDivisions);  

  static int radialStep = MAX_R_STEPS / radialDivisions;                 

  target.angular = current.angular + angleStep;            //Set the angular position of the new point to move to (target position)
  target.radial = current.radial + radialStep;             //Set the radial target position as the current radial position plus the radialStep

  if (target.radial > MAX_R_STEPS || target.radial < 0) {  //Logic to see if the targeted radial position is out of bounds of the radial axis
    radialStep *= -1;                                      //If we're out of bounds, switch the sign of the radialStep (now we move in the opposite direction)
    target.radial += 2 * radialStep;                       //We were already out of bounds, so we undo that by moving 2 radialSteps in the new direction.
  }
  
  target.radial += (int)(amplitude * sin(period * convertStepsToRadians(target.angular)));

  return target;                                           //Return the target position so that the motion control functions can move to it.
}



/**
 * @brief Pattern: Rotating Squares. Generates the next target position for drawing rotating squares, each rotated by 10 degrees.
 *
 * This function draws squares of the same size by connecting four points in sequence and rotating the square by 10 degrees 
 * after completing each one. The function uses a switch-case statement to control the drawing process, ensuring each side 
 * of the square is drawn in order. Once a square is complete, the vertices are rotated for the next iteration.
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern. Defaults to false.
 *
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 * @note This pattern relies on a static variable to track the current step in the drawing process and uses the drawLine function 
 * to move between the vertices of the square. After each square is completed, the vertices are rotated by 10 degrees for the next square.
 */
Positions pattern_RotatingSquares(Positions current, bool restartPattern = false) {                
  Positions target;             
  static int step = 0;
  static int segments = 20;                         //Use  20 points to approximate a straight line
  static Positions p1, p2, p3, p4;                  //the four vertices of our square
  static bool firstRun = true;                      //used to track if this is the first time the function is called
  const int angleShift = convertDegreesToSteps(10); //how much we'll rotate the square
  if (firstRun || restartPattern) {
    p1.angular = 0;                                 //angular position of first point in absolute coordinates
    p1.radial = 7000;                               //radial position of first point in absolute coordiantes (units are steps)
    p2.angular = convertDegreesToSteps(90);
    p2.radial = 7000;
    p3.angular = convertDegreesToSteps(180);
    p3.radial = 7000;
    p4.angular = convertDegreesToSteps(270);
    p4.radial = 7000;
    firstRun = false;
  }

  switch (step) {
  case 0:                                                                   //if step == 0
    target = drawLine(p1, p2, currentPositions, segments);                  //target positions are the result of calling drawLine between points p1 and p2
    if ((target.angular == p2.angular) && (target.radial == p2.radial)) {   //If we've reached the end of the line
      step++;                                                               //Increment the value of step so we can move on to the next line
    }   
    break;                                                                  //have to include "break;" to avoid case fall through
  
  case 1:                                                                   //if step == 1
    target = drawLine(p2, p3, currentPositions, segments);
    if ((target.angular == p3.angular) && (target.radial == p3.radial)) {
      step++;
    }
    break;
  
  case 2:  
    target = drawLine(p3, p4, currentPositions, segments);
    if ((target.angular == p4.angular) && (target.radial == p4.radial)) {
      step++;
    }
    break;

  case 3:
    target = drawLine(p4, p1, currentPositions, segments);
    if ((target.angular == p1.angular) && (target.radial == p1.radial)) {
      step++;                                                               //incrementing again would take us to case 4, but we don't have that, so default gets called next
    }
    break;
  
  default:
    //assuming that the step number was out of bounds, so reset it
    step = 0;                 //start the square over
    target = current;         //set the target position to the current position just as a default for the default option in the switch statement.
    p1.angular += angleShift; //rotate all points in the square by 10 degrees
    p2.angular += angleShift;
    p3.angular += angleShift;
    p4.angular += angleShift;
    break;  
  }
  
  return target;
}




/**
 * @brief Pattern: Pentagon Spiral. Generates the next target position for drawing a growing and shrinking pentagon spiral.
 *
 * This function creates a pentagon using the nGonGenerator function to generate the vertices and then iterates through 
 * the vertices, connecting them with straight lines. After completing a pentagon, the radius of each vertex is adjusted 
 * by a radial step value (radialStepover). When the radius exceeds the maximum or falls below zero, the direction of 
 * the radial change is reversed, creating a pattern of growing and shrinking pentagons.
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern. Defaults to false.
 * 
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 * @note This pattern does not use a switch-case statement for sequencing but instead iterates over a list of precomputed points 
 * (the vertices of the pentagon) and adjusts the radial distance of each point to create a spiral effect. The vertices are 
 * recalculated when a complete pentagon is drawn.
 */

Positions pattern_PentagonSpiral(Positions current, bool restartPattern = false) {
  Positions target;                                                   //Output position will be stored here
  static int start = 0;                                               //Index to the starting point of the line in the array
  static int end = 1;                                                 //Index to the end point of the line in the array
  static bool firstRun = true;                                        //Flag for tracking if a new polygon needs to be generated
  const int vertices = 5;                                             //Change this to make a different polygon
  static Positions vertexList[vertices];                               //construct an array to store the vertices of the polygon
  static int radialStepover = 500;                                    //Amount to change the radius of the polygon each cycle

  if (firstRun || restartPattern) {                                                     //On first function call, construct the polygon vertices
    nGonGenerator(vertexList, vertices, {0,0}, 1000, 0.0);             //generate the vertices of the polygon  
    firstRun = false;                                                 //Use already generated points next time this function is called
  }   
  target = drawLine(vertexList[start], vertexList[end], current, 100);  //draw the line between the appropriate points

  if ((target.angular == vertexList[end].angular) &&                   //If the line is complete, need to move on to the next line
    (target.radial == vertexList[end].radial)) {   
    start++;                                                          //increment start and end points of the line in the array
    end++;            
    start = modulus(start, vertices);                                 //wrap around to beginning of array if needed
    end = modulus(end, vertices);           
    if (start == 0 && end == 1) {                                     //If we're onto a new iteration of the polygon
      for (int i = 0; i < vertices; i++) {                            //Increase or decrease the radius of each point
        int newR = vertexList[i].radial + radialStepover;            
        if (newR > MAX_R_STEPS || newR < 0) {                         //If the radius is getting out of bounds
          radialStepover *= -1;                                       //Switch direction of radial change
          newR += 2 * radialStepover;                                 //move the other way
        }           
        vertexList[i].radial = newR;                                   //change the radius for each point
      }           
    }           
  }           
  return target;                                                      //return the new target position
}





/**
 * @brief Pattern: Hex Vortex. Generates the next target position for drawing a series of growing, shrinking, and rotating hexagons.
 *
 * This function generates a hexagon vortex pattern, where hexagons grow and shrink over time while rotating. 
 * When the outer edge of the radial axis is reached, the ball moves along the rim before shrinking back inward. 
 * The ball also dwells at the center of the field. The pattern is controlled using a switch-case sequence that 
 * moves between the six vertices of the hexagon.
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern. Defaults to false.
 * 
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 * @note The hexagon grows and shrinks by adjusting the radius incrementally (radialStepover) and rotates 
 * by shifting the angular positions of each vertex. The pattern reverses direction when the radius exceeds 
 * the maximum limit or falls below zero.
 */
Positions pattern_HexagonVortex(Positions current, bool restartPattern = false) {                 
  Positions target;           
  static int step = 0;                                //using switch case to track steps again
  static int segments = 100;
  static Positions p1, p2, p3, p4, p5, p6;            //vertices of the hexagon
  static bool firstRun = true;
  const int angleShift = convertDegreesToSteps(5);
  static int radialStepover = 350;                    //how much we'll increase or decrease the size of the hexagon each iteration
  static int radius = 1000;                           //starting radius
  
  if (firstRun || restartPattern) {
    p1.angular = 0;
    p1.radial = radius;
    p2.angular = convertDegreesToSteps(60);
    p2.radial = radius;
    p3.angular = convertDegreesToSteps(120);
    p3.radial = radius;
    p4.angular = convertDegreesToSteps(180);
    p4.radial = radius;
    p5.angular = convertDegreesToSteps(240);
    p5.radial = radius;
    p6.angular = convertDegreesToSteps(300);
    p6.radial = radius;
    firstRun = false;
  }

  //the step sequencer works just like the rotating square example, but with more steps
  switch (step) {
  case 0:
    target = drawLine(p1, p2, currentPositions, segments);
    if ((target.angular == p2.angular) && (target.radial == p2.radial)) {
      step++;
    }
    break;
  
  case 1:
    target = drawLine(p2, p3, currentPositions, segments);
    if ((target.angular == p3.angular) && (target.radial == p3.radial)) {
      step++;
    }
    break;
  
  case 2:  
    target = drawLine(p3, p4, currentPositions, segments);
    if ((target.angular == p4.angular) && (target.radial == p4.radial)) {
      step++;
    }
    break;

  case 3:
    target = drawLine(p4, p5, currentPositions, segments);
    if ((target.angular == p5.angular) && (target.radial == p5.radial)) {
      step++;
    }
    break;
  
  case 4:
    target = drawLine(p5, p6, currentPositions, segments);
    if ((target.angular == p6.angular) && (target.radial == p6.radial)) {
      step++;
    }
    break;

  case 5:
    target = drawLine(p6, p1, currentPositions, segments);
    if ((target.angular == p1.angular) && (target.radial == p1.radial)) {
      step++;
    }
    break;

  case 6:
    //reset to the beginning
    step = 0;
    target = current;         //set the target position to the current position just as a default for the default option in the switch statement.

    p1.angular += angleShift; //rotate all points
    p2.angular += angleShift;
    p3.angular += angleShift;
    p4.angular += angleShift;
    p5.angular += angleShift;
    p6.angular += angleShift; 

    if ((radius + radialStepover >= MAX_R_STEPS + 2000) || (radius + radialStepover <= 0)) radialStepover *= -1;    //If we're too far out of bounds, switch directions
    radius += radialStepover;  //increase or decrease the radius for the points

    p1.radial = radius;
    p2.radial = radius;
    p3.radial = radius;
    p4.radial = radius;
    p5.radial = radius;
    p6.radial = radius;

    break;
  
  default:
    //assuming that the step number was out of bounds, so reset it
    step = 0;
    target = current;         //set the target position to the current position just as a default for the default option in the switch statement.
    break;  
  }
  
  return target;
}






/**
 * @brief Pattern: Pentagon Rainbow. Generates the next target position for drawing an off-center pentagon that rotates and moves.
 *
 * This function creates a pentagon pattern that is off-center, moving the center of the pentagon to a new position and 
 * rotating it slightly with each iteration. The pentagon is generated using nGonGenerator and translated to the 
 * appropriate location, while the center and orientation are adjusted progressively.
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern. Defaults to false.
 * 
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 * @note The center of the pentagon is translated and rotated slightly on each iteration, creating a "rainbow" effect 
 * as the pentagon appears in different positions. The nGonGenerator and translatePoints functions are used to 
 * generate and move the pentagon.
 */
Positions pattern_PentagonRainbow(Positions current, bool restartPattern = false) {
  Positions target;
  //target = current;               
  static int start = 0;
  static int end = 1;
  static bool firstRun = true;
  const int vertices = 5;  
  static Positions pointList[vertices];
  static int radialStepover = 500;
  const int shiftDeg = 2;
  static int angleShift = convertDegreesToSteps(shiftDeg);
  static int shiftCounter = 1;

  if (firstRun || restartPattern) {
    nGonGenerator(pointList, vertices, {0, 0}, 3000, 0.0);      //create the polygon
    translatePoints(pointList, vertices, {4000, 0});            //move the polygon to the appropriate spot
    firstRun = false;
  } 
  

  target = drawLine(pointList[start], pointList[end], current, 100);

  if ((target.angular == pointList[end].angular) && (target.radial == pointList[end].radial)) {
    start++;
    end++;
    start = modulus(start, vertices);
    end = modulus(end, vertices);
    nGonGenerator(pointList, vertices, {0, 0}, 3000, shiftCounter * shiftDeg);    //build a new polygon that is rotated relative to the previous one
    translatePoints(pointList, vertices, {4000, shiftCounter * angleShift});      //move to the correct point
    shiftCounter++;
  }
  return target;
}



/**
 * @brief Pattern: Random Walk 1. Generates random target positions, moving via the shortest path to each point.
 *
 * This function creates a random walk pattern by generating random target positions in both the radial and angular axes. 
 * The motion controller moves the gantry via the shortest path to each randomly generated point, resulting in random arcs.
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern. Defaults to false.
 * 
 * @return Positions The next randomly generated target position for the motion controller, represented as a Positions struct.
 * 
 * @note This pattern moves the gantry using the shortest path between points, leading to random arc-shaped movements.
 */
Positions pattern_RandomWalk1(Positions current, bool restartPattern = false) {
  Positions target;

  // Generate a random radial position within the bounds of your system.
  int randomRadial = random(0, MAX_R_STEPS + 1); // +1 because the upper bound is exclusive

  // Generate a random angular position within a full circle in steps.
  int randomAngular = random(0, STEPS_PER_A_AXIS_REV);

  // Set the target position to the randomly generated values.
  target.radial = randomRadial;
  target.angular = randomAngular;

  return target;
}


/**
 * @brief Pattern: Random Walk 2. Generates random target positions and moves in straight lines to each point.
 *
 * This function creates a random walk pattern by generating random target positions in both the radial and angular axes. 
 * Unlike Random Walk 1, this version moves the gantry in straight lines to each random point by connecting the current 
 * position to the random target using the drawLine function.
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern. Defaults to false.
 * 
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 * @note The function generates new random points once the gantry reaches the current random target and continues the random walk.
 */
Positions pattern_RandomWalk2(Positions current, bool restartPattern = false) {
  Positions target;
  static Positions randomPoint, lastPoint = current;
  static bool makeNewRandomPoint = true;
  
  if (makeNewRandomPoint) {
    // Generate a random radial position within the bounds of your system.
    randomPoint.radial = random(0, MAX_R_STEPS + 1); // +1 because the upper bound is exclusive

    // Generate a random angular position within a full circle in steps.
    randomPoint.angular = random(0, STEPS_PER_A_AXIS_REV);
    makeNewRandomPoint = false;
  }

  // Set the target position to the randomly generated values.
  target = drawLine(lastPoint, randomPoint, current, 100);

  if (target.angular == randomPoint. angular && target.radial == randomPoint.radial) {
    makeNewRandomPoint = true;        //next time we'll generate a new random point
    lastPoint = randomPoint;          //save this as the previous point for the next iteration
  }

  return target;
}



/**
 * @brief Pattern: Accidental Butterfly. Generates the next target position for drawing a butterfly-like pattern with oscillating radial and angular movement.
 *
 * This function creates a butterfly-shaped pattern by modifying a simple spiral pattern with sine and cosine waves that adjust both the radial 
 * and angular positions. The radial and angular positions are oscillated to create the butterfly pattern. I was actually trying to do something
 * entirely different and accidentally made this butterfly.
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern. Defaults to false.
 * 
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 * @note The pattern adds sine and cosine-based offsets to both the radial and angular positions to create oscillating movements, leading to the butterfly shape. 
 * The amplitude and frequency of the sine and cosine waves can be adjusted for different effects.
 */
Positions pattern_AccidentalButterfly(Positions current, bool restartPattern = false) {
  //This pattern starts out exactly the same as pattern_SimpleSpiral. The only difference is that after calculating the next position
  //in the spiral, it adds the sine of the current angular position to the radial axis to make a wavy line.

  Positions target;                                        //This is where we'll store the value of the next target position.

  const float angleDivisions = 100.0;                      //Going to divide a full revolution into 100ths. "const" because this never changes.
  const int radialDivisions = 10 * (int)angleDivisions;    //Going to divide the radial axis into 1000ths. Try changing the 10 to a different number, like 20.
  
  //Add in values for the amplitude and frequency of the sine wave
  const float amplitude = 200.0;
  const int frequency = 8;

  //Calculate how many degrees we'll move over in the angular axis for the next step.
  const int angleStep = convertDegreesToSteps(360.0 / angleDivisions);  

  //Calculate how far along we'll move the radial axis for the next step. 
  static int radialStep = MAX_R_STEPS / radialDivisions;                 

  target.angular = current.angular + angleStep;            //Set the angular position of the new point to move to (target position)
  target.radial = current.radial + radialStep;             //Set the radial target position as the current radial position plus the radialStep

  if (target.radial > MAX_R_STEPS || target.radial < 0) {  //Logic to see if the targeted radial position is out of bounds of the radial axis
    radialStep *= -1;                                      //If we're out of bounds, switch the sign of the radialStep (now we move in the opposite direction)
    target.radial += 2 * radialStep;                       //We were already out of bounds, so we undo that by moving 2 radialSteps in the new direction.
  }

  //Add a new component to the radial position to make it oscillate in and out as a sine wave.
  int rOffset = (int)(200.0 * sin(8 * convertStepsToRadians(target.angular)));
  int aOffset = (int)(40.0 * cos(3 * convertStepsToRadians(target.angular)));
  target.radial += rOffset;


  //Now do the same for the angular axis so we get some back and forth:
  target.angular += aOffset;

  return target;        //Return the target position so that the motion control functions can move to it.
}
#endif // ENABLE_STANDARD_PATTERNS


#if ENABLE_STREAMING_PATTERN
/**
 * @brief Receives a string from serial communication with start and end markers.
 * 
 * This helper function reads incoming serial data and extracts strings that are wrapped 
 * between start ('<') and end ('>') markers. Used by pattern_Remote to receive coordinate data.
 * 
 * @return char* Pointer to the received string if complete, nullptr if no new data.
 */
char* receivedWithStartEndMarkers() {
    const byte numCharsSerialBuffer = 32;
    static char receivedString[numCharsSerialBuffer];
    static boolean recvInProgress = false;
    static bool newData = false;
    static byte ndx = 0;

    char startMarker = '<';
    char endMarker = '>';
    char rc;
    newData = false;
    while (Serial.available() > 0 && newData == false) {
        rc = Serial.read();
        if (recvInProgress == true) {
            if (rc != endMarker) {
                receivedString[ndx] = rc;
                ndx++;
                if (ndx >= numCharsSerialBuffer) {
                    ndx = numCharsSerialBuffer - 1;
                }
            }
            else {
                receivedString[ndx] = '\0';
                recvInProgress = false;
                ndx = 0;
                newData = true;
            }
        }
        else if (rc == startMarker) {
            recvInProgress = true;       
        }
    }

    if (newData) {
      return receivedString;
    } else {
      return nullptr;
    }
}

/**
 * @brief Waits until a specific string is received via serial communication.
 * 
 * This blocking function continuously polls the serial buffer until the expected string is received.
 * Used by pattern_Remote for synchronization.
 * 
 * @param s The string to wait for.
 */
void waitUntilReceived(String s) {
  char* receivedString = nullptr;
  while ((receivedString == nullptr || s.compareTo(String(receivedString))!=0) && runPattern) {
    receivedString = receivedWithStartEndMarkers();
    button.tick();  // Allow button presses to be processed
  }
}
#endif


#if USE_LED_CIRCLE
/**
 * @brief Converts r,theta coordinates to LED index on the circular display
 * 
 * @param r Radial position (0-1000)
 * @param theta Angular position in degrees*10 (0-3599)
 * @return int LED index (0 to NUM_CIRCULAR_LEDS-1)
 */
int get_led_number(int r, int theta) {
    int ring_number = (NUM_LED_CIRCLES-1) - int((r * NUM_LED_CIRCLES) / (1001));
    
    int led_ring_start = 0;
    for (int i = 0; i < ring_number; i++) {
        led_ring_start += led_per_circle[i];
    }
    
    // Calculate position within the ring: map theta (0-3599) to LED position (0 to led_per_circle[ring_number]-1)
    // Use float to preserve precision, then round
    float theta_normalized = (float)(theta % 3600) / 3600.0;
    int position_in_ring = (int)(theta_normalized * led_per_circle[ring_number] + 0.5); // Add 0.5 for rounding
    // Ensure we don't go out of bounds
    if (position_in_ring >= led_per_circle[ring_number]) {
        position_in_ring = led_per_circle[ring_number] - 1;
    }
    // Reverse the direction to make it anticlockwise
    position_in_ring = (led_per_circle[ring_number] - 1) - position_in_ring;
    int led_number = led_ring_start + position_in_ring;
    return led_number;
}

/**
 * @brief Clears all circular LEDs and resets color state when a pattern restarts
 * 
 * @param currentColorIndex Reference to the current color index (will be reset to 0)
 * @param colorInitialized Reference to the color initialization flag (will be set to true)
 */
void clearLedCircleOnRestart(int& currentColorIndex, bool& colorInitialized) {
  //Clear all circular LEDs and reset to white when a new pattern is selected
  for (int i = 0; i < NUM_CIRCULAR_LEDS; i++) {
    circularLeds[i] = CRGB::Black;
  }
  //Reset to white when switching to a new pattern
  currentColorIndex = 0;  //Start with first color (White)
  colorInitialized = true;
  FastLED.show();
}

/**
 * @brief Updates the circular LED display based on the target position
 * 
 * Converts the target position from motor steps to r,theta format, applies theta offset,
 * and updates the corresponding LED to show the drawing path.
 * 
 * @param target The target position in motor steps
 * @param currentColorIndex Reference to the current color index to use
 * @param colorInitialized Reference to the color initialization flag (will be set to true if not already)
 */
void updateLedCircleFromTarget(Positions target, int& currentColorIndex, bool& colorInitialized) {
  //Convert target position back to r,theta format and update circular LED for pattern drawing
  //target.radial is in steps, convert back to 0-1000 range
  int r = (int)((float)target.radial * 1000.0 / MAX_R_STEPS);
  //target.angular is in steps, convert back to degrees*10 (0-3599)
  int theta = (int)(convertStepsToDegrees(target.angular) * 10.0);
  
  //Apply theta offset and sanitize to 0-3600 range
  theta = theta + thetaOffset;
  theta = theta % 3600;
  if (theta < 0) {
    theta += 3600;
  }
  
  int ledNumber = get_led_number(r, theta);
  
  //Draw the pattern: keep previous LEDs on to show the path
  if (ledNumber >= 0 && ledNumber < NUM_CIRCULAR_LEDS) {
    if (!colorInitialized) {
      currentColorIndex = 0;  //Start with first color (White)
      colorInitialized = true;
    }
    circularLeds[ledNumber] = image_led_colors[currentColorIndex];
    FastLED.show();
  }
}
#endif

/**
 * HACK BY ORION (AKA: Magicaldroid)
 *
 * @brief Generates the next target position to follow the points within pointList
 *
 * @param pointList An array of all the points in the pattern stored in a Positions struct.
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param nodes Total number of points in the pattern
 * @param restartPattern Flag to restart the pattern (clears LEDs)
 * 
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 */
Positions drawPictureStep(Positions *pointList, int nodes, Positions current, bool restartPattern = false)
{
  Positions target;
  static int start = 0;
  static int end = 1;
  static int previousStart = 0;  //Track previous start value to detect cycle completion
  static bool changePoints = true;
  static Positions readStart = {0,0};
  static Positions readEnd = {pgm_read_word(&(pointList[0].radial)), pgm_read_word(&(pointList[0].angular))};
#if USE_LED_CIRCLE
  static int currentColorIndex = 0;  //Track which color in the cycle we're using
  static bool colorInitialized = false;  //Track if color has been initialized
#endif
  
  uint16_t readValueR;
  uint16_t readValueA;

  if (changePoints) {
    readValueR = pgm_read_word(&(pointList[end].radial));
    readValueA = pgm_read_word(&(pointList[end].angular));
    readStart = readEnd;
    readEnd = {readValueR, readValueA};
    changePoints = false;
  }

  Positions startPoint = { (int)(readStart.radial * (float)MAX_R_STEPS/1000), (int)convertDegreesToSteps((float)(readStart.angular)/10) };
  Positions endPoint = { (int)(readEnd.radial * (float)MAX_R_STEPS/1000), (int)convertDegreesToSteps((float)(readEnd.angular)/10) };

  target = drawLine(startPoint, endPoint, current, 100);

#if USE_LED_CIRCLE
  //Clear all circular LEDs and reset to white when a new pattern is selected
  if (restartPattern) {
    clearLedCircleOnRestart(currentColorIndex, colorInitialized);
  }

  //Update circular LED display based on target position
  updateLedCircleFromTarget(target, currentColorIndex, colorInitialized);
#endif

  if ((target.angular == endPoint.angular) && (target.radial == endPoint.radial)) {
    changePoints = true;
    start++;
    end++;
    
#if USE_LED_CIRCLE
    //Detect when pattern completes a full cycle (start wraps back to 0 from nodes-1)
    //Before modulo: if previousStart was nodes-1 and start is now nodes, we've completed a cycle
    bool patternCompleted = (previousStart == (nodes - 1) && start >= nodes);
#endif
    
    start = start % nodes;
    end = end % nodes;
    
#if USE_LED_CIRCLE
    //Cycle to next color when pattern completes a full cycle (don't clear - trace over existing pattern)
    if (patternCompleted) {
      if (colorInitialized) {
        currentColorIndex = (currentColorIndex + 1) % NUM_IMAGE_COLORS;  //Cycle to next color
      } else {
        currentColorIndex = 0;  //Start with first color (White) on first run
        colorInitialized = true;
      }
      //Don't clear LEDs - let it trace over the existing pattern with the new color
    }
    previousStart = start;  //Update previous start value
#endif
  }
  return target;
}

#if ENABLE_CUSTOM_PATTERN
/**
 * HACK BY ORION (AKA: Magicaldroid)
 *
 * @brief Pattern: Draw A Picture. Generates the next target position for following the predefined image pattern
 *
 * This function connects the points specified in the arrays defined at the top of the code.
 * This array of points can be generated using the Image-to-Sand tool here:
 * https://github.com/orionwc/Image2Sand
 *
 * Each enabled pattern (A-J) becomes its own numbered pattern in the pattern selection (11-20 if they are all enabled)
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern. Defaults to false.
 * 
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 */

  #ifdef ENABLE_CUSTOM_PATTERN_A
  Positions pattern_PictureA(Positions current, bool restartPattern = false) {
    return drawPictureStep((Positions*)patternA, sizeof(patternA) / sizeof(Positions), current, restartPattern);
  }
  #endif

  #ifdef ENABLE_CUSTOM_PATTERN_B
  Positions pattern_PictureB(Positions current, bool restartPattern = false) {
    return drawPictureStep((Positions*)patternB, sizeof(patternB) / sizeof(Positions), current, restartPattern);
  }
  #endif

  #ifdef ENABLE_CUSTOM_PATTERN_C
  Positions pattern_PictureC(Positions current, bool restartPattern = false) {
    return drawPictureStep((Positions*)patternC, sizeof(patternC) / sizeof(Positions), current, restartPattern);
  }
  #endif

  #ifdef ENABLE_CUSTOM_PATTERN_D
  Positions pattern_PictureD(Positions current, bool restartPattern = false) {
    return drawPictureStep((Positions*)patternD, sizeof(patternD) / sizeof(Positions), current, restartPattern);
  }
  #endif

  #ifdef ENABLE_CUSTOM_PATTERN_E
  Positions pattern_PictureE(Positions current, bool restartPattern = false) {
    return drawPictureStep((Positions*)patternE, sizeof(patternE) / sizeof(Positions), current, restartPattern);
  }
  #endif

  #ifdef ENABLE_CUSTOM_PATTERN_F
  Positions pattern_PictureF(Positions current, bool restartPattern = false) {
    return drawPictureStep((Positions*)patternF, sizeof(patternF) / sizeof(Positions), current, restartPattern);
  }
  #endif

  #ifdef ENABLE_CUSTOM_PATTERN_G
  Positions pattern_PictureG(Positions current, bool restartPattern = false) {
    return drawPictureStep((Positions*)patternG, sizeof(patternG) / sizeof(Positions), current, restartPattern);
  }
  #endif

  #ifdef ENABLE_CUSTOM_PATTERN_H
  Positions pattern_PictureH(Positions current, bool restartPattern = false) {
    return drawPictureStep((Positions*)patternH, sizeof(patternH) / sizeof(Positions), current, restartPattern);
  }
  #endif

  #ifdef ENABLE_CUSTOM_PATTERN_I
  Positions pattern_PictureI(Positions current, bool restartPattern = false) {
    return drawPictureStep((Positions*)patternI, sizeof(patternI) / sizeof(Positions), current, restartPattern);
  }
  #endif

  #ifdef ENABLE_CUSTOM_PATTERN_J
  Positions pattern_PictureJ(Positions current, bool restartPattern = false) {
    return drawPictureStep((Positions*)patternJ, sizeof(patternJ) / sizeof(Positions), current, restartPattern);
  }
  #endif

#endif


#if ENABLE_STREAMING_PATTERN
/**
 * HACK BY ORION (AKA: Magicaldroid)
 *
 * @brief Pattern: Receive points to move from remote connection via Serial port.
 * Generates the next target position based on the information received via Serial port.
 * Expecting coordinates to be sent as <POS:r,theta> where r, theta are polar coordinates.
 * r is a number from 0-1000 (1000 is max distance) and theta is the angle in tenths of a degree (0 to 3600)
 *
 * @param current The current position of the gantry, represented as a Positions struct.
 * @param restartPattern A flag that allows restarting the pattern. Defaults to false.
 * 
 * @return Positions The next target position for the motion controller, represented as a Positions struct.
 * 
 */
Positions pattern_Remote(Positions current, bool restartPattern = false) {

  static bool starting = true, isMoving = false; 
  static Positions startPos = current;
  static Positions endPos = {0,0};
#if USE_LED_CIRCLE
  static int currentColorIndex = 0;  //Track which color in the cycle we're using
  static bool colorInitialized = false;  //Track if color has been initialized
#endif

  Positions target;

  // Reset state if pattern is restarted
  if (restartPattern) {
    starting = true;
    isMoving = false;
    startPos = current;
    endPos = {0,0};
#if USE_LED_CIRCLE
    //Clear all circular LEDs and reset to white when a new pattern is selected
    clearLedCircleOnRestart(currentColorIndex, colorInitialized);
#endif
  }

  if (starting) {
    Serial.println("COORDS");
    waitUntilReceived("START");
    if (!runPattern) {
      // Pattern was stopped, return current position
      return current;
    }
    Serial.println("READY");
  }

  if (!isMoving){
    int r = 0, theta = 0;
    bool done = false;
    while (!done && runPattern){
      button.tick();  // Allow button presses to be processed
      char* receivedString = receivedWithStartEndMarkers();
      if (receivedString != nullptr) {
        Serial.println(receivedString);

        // Check if receivedString contains "START" - handle restart mid-drawing
        if (strcmp(receivedString, "START") == 0) {
            Serial.println("READY");
            // Continue waiting for POS: message
        }
        // Check if receivedString contains "POS:"
        else if (strncmp(receivedString, "POS:", 4) == 0) {
            sscanf(receivedString + 4, "%d,%d", &r, &theta);
            endPos = {r, theta};
            done = true;
            isMoving = true;
        }
      }
    }
    if (!runPattern) {
      // Pattern was stopped, return current position
      return current;
    }
  }

  Positions startPoint = { (int)(startPos.radial * (float)MAX_R_STEPS/1000), (int)convertDegreesToSteps((float)(startPos.angular)/10) };
  Positions endPoint = { (int)(endPos.radial * (float)MAX_R_STEPS/1000), (int)convertDegreesToSteps((float)(endPos.angular)/10) };
  if (!starting) {
    target = drawLine(startPoint, endPoint, current, 100);
  } else {
    // If starting, return current position (no movement yet)
    target = current;
  }

#if USE_LED_CIRCLE
  //Update circular LEDs to show the drawing path (only when actually drawing, not when starting)
  if (!starting) {
    updateLedCircleFromTarget(target, currentColorIndex, colorInitialized);
  }
#endif

  if ((starting) || ((target.angular == endPoint.angular) && (target.radial == endPoint.radial))) {
    // Get Next Position
    Serial.println("DONE");
    isMoving = false;
    startPos = endPos;
    starting = false;
  }

  return target;

}
#endif


#pragma endregion Patterns








/*
NOTES:
  -the max distance the rack can travel is 87.967mm.
  -that's spread over 28 teeth of movement of the pinion.
  -that's 3.141678 mm per tooth. love how close that is to pi.
  -the pinion is 16 teeth. 
  -1 full revolution of the pinion should move the rack 50.267mm.
  -the pulley ratio is 2:1, so two revs of the motor cause one rev of the pinion
  -there are 2048 steps per rev in the motor (may need to update with exact number).
  Note that this is an approximation since the gearbox on the motor is not an integer ratio.
  -4096 steps will drive the pinion one full revolution (so 4096 steps per 50.267mm)
  -that makes 81.485 steps per mm of rack travel. 
  -or the inverse of that if needed: .01227 mm per step
  -to fully move the rack across 87.967mm, need 7167.991 steps. 
  -round down to 7000 steps total, losing about 2mm of total travel, and use 1mm on each end
  as a soft buffer on the travel to prevent crashing.



POSSIBLE IMPROVEMENTS TO MAKE:
- Add backlash compensation. The motor gearboxes have backlash, as do the drive belts and pulleys. Every time the motor
switches direction, it has to spin a bit to take up all the slack before actually moving the gantry. It works fine as it is,
but for greater precision, take direction changes into account and add extra steps to each move to take up the slack before
executing the desired movement. 

- Add functionality for the rest of the geometric transformations: I already added translation, so add rotation, scaling,
and reflection. 

- Add proportional mixing to manual drawing mode. Right now it just works like arrow keys. Mixing would make the control
more subtle and precise.

- Normalize the speed of the ball. Right now the ball travels in a range of speeds, but it would be cool to make a sytem
that would ensure that the ball always moves at the same speed. Requires more advanced path planning than what I have here.
Note that I have a hack in place for this that makes the speed of the angular motor inversely proportional to the radius.
It actually works pretty well, but isn't the same as normalized speed.
*/
