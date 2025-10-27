/**
 * Configuration Management for Image2Sand
 * Centralized configuration for UI, API, and application settings
 */

window.CONFIG = {
    // UI Configuration
    UI: {
        // Opacity settings
        OPACITY: {
            HIDDEN: 0.0,
            SHOWN: 1.0,
            FADE_IN: 1.0,
            FADE_OUT: 0.0,
            VOICE_INPUT: 0.5,
            MAGIC_ELEMENTS: 0.5,
            DISABLED: 0.5
        },
        
        // Animation timings (in milliseconds)
        ANIMATION: {
            FADE_IN_DURATION: 1000,
            FADE_OUT_DURATION: 1000,
            SHIMMER_DURATION: 2000,
            PROGRESS_UPDATE_INTERVAL: 100,
            MAGIC_CHECK_INTERVAL: 100,
            MAGIC_TIMEOUT: 5000,
            STATE_TRANSITION_DURATION: 500
        },
        
        // Canvas dimensions
        CANVAS: {
            FFT_WIDTH: 800,
            FFT_HEIGHT: 200,
            MAGIC_CONVERSION_SIZE: 200
        },
        
        // Button states
        BUTTONS: {
            DISABLED_OPACITY: 0.5,
            ENABLED_OPACITY: 1.0
        }
    },

    // Image Processing Configuration
    IMAGE_PROCESSING: {
        // Default processing parameters
        DEFAULT: {
            EPSILON: 0.1,
            CONTOUR_MODE: 'external',
            IS_LOOP: false,
            MINIMIZE_JUMPS: false,
            OUTPUT_FORMAT: 0,
            MAX_POINTS: 1000,
            PEN_UP_ENABLED: false
        },
        
        // Processing limits
        LIMITS: {
            MAX_IMAGE_SIZE: 4096,
            MIN_IMAGE_SIZE: 100,
            MAX_POINTS: 10000,
            MIN_POINTS: 10
        },
        
        // File handling
        FILES: {
            SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
            COMPRESSION_QUALITY: 0.8
        }
    },

    // API Configuration
    API: {
        // OpenAI API settings
        OPENAI: {
            ENDPOINT: 'https://api.openai.com/v1/images/generations',
            //MODEL: 'dall-e-2',
            MODEL: 'gpt-image-1-mini',
            //SIZE: '256x256',
            SIZE: '1024x1024',
            QUALITY: 'low',
            //QUALITY: 'low', // Only for dall-e-3, comment out for dall-e-2
            //STYLE: 'vivid', // Only for dall-e-3, comment out for other models
            //RESPONSE_FORMAT: 'b64_json', // 'b64_json' for dall-e-3, 'url' for dall-e-2, or null/empty to omit
            TIMEOUT: 30000,
            MAX_RETRIES: 3
        },
        
        // OpenCV.js settings
        OPENCV: {
            SCRIPT_URL: 'https://docs.opencv.org/4.5.0/opencv.js',
            LOAD_TIMEOUT: 10000
        }
    },

    // Voice Recognition Configuration
    VOICE: {
        // Speech recognition settings
        RECOGNITION: {
            LANGUAGE: 'en-US',
            CONTINUOUS: false,
            INTERIM_RESULTS: true,
            MAX_ALTERNATIVES: 1,
            TIMEOUT: 10000,
            SILENCE_TIMEOUT: 2000
        },
        
        // FFT settings
        FFT: {
            BUFFER_SIZE: 2048,
            SAMPLE_RATE: 44100,
            FREQUENCY_BINS: 1024,
            UPDATE_RATE: 60
        },
        
        // Voice commands
        COMMANDS: {
            TRIGGER_WORDS: ['draw', 'create', 'make'],
            OBJECT_KEYWORDS: ['circle', 'square', 'triangle', 'star', 'heart']
        }
    },

    // Serial Communication Configuration
    SERIAL: {
        // Connection settings
        CONNECTION: {
            BAUD_RATE: 9600,
            TIMEOUT: 5000,
            RECONNECT_ATTEMPTS: 3,
            RECONNECT_DELAY: 1000
        },
        
        // Data formatting
        FORMAT: {
            COORDINATE_PRECISION: 2,
            COMMAND_DELIMITER: '\n',
            RESPONSE_TIMEOUT: 1000
        },
        
        // Streaming settings
        STREAMING: {
            BATCH_SIZE: 10,
            SEND_DELAY: 100,
            PROGRESS_UPDATE_INTERVAL: 100
        }
    },

    // Magic Mode Configuration
    MAGIC: {
        // Magic panel settings
        PANEL: {
            AUTO_SHOW_DELAY: 100,
            STATE_TRANSITION_DURATION: 500,
            CONVERSION_BOX_COUNT: 4
        },
        
        // Magic mode behavior
        BEHAVIOR: {
            AUTO_ADVANCE: true,
            SHOW_PROGRESS: true,
            ENABLE_FFT: true,
            MIRROR_IMAGES: true
        },
        
        // Magic animations
        ANIMATIONS: {
            SHIMMER_DURATION: 2000,
            FADE_TRANSITION: 1000,
            PROGRESS_ANIMATION: 500
        }
    },

    // Development/Debug Configuration
    DEBUG: {
        // Logging levels
        LOGGING: {
            LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
            ENABLE_CONSOLE: true,
            ENABLE_MAGIC_LOGS: true
        },
        
        // Performance monitoring
        PERFORMANCE: {
            ENABLE_TIMING: true,
            LOG_SLOW_OPERATIONS: true,
            SLOW_OPERATION_THRESHOLD: 1000
        },
        
        // Error handling
        ERRORS: {
            SHOW_USER_ERRORS: true,
            LOG_ERRORS: true,
            FALLBACK_ON_ERROR: true
        }
    },

    // Responsive Configuration
    RESPONSIVE: {
        // Breakpoints
        BREAKPOINTS: {
            MOBILE: 768,
            TABLET: 1024,
            DESKTOP: 1200
        },
        
        // Mobile-specific settings
        MOBILE: {
            TOUCH_DELAY: 300,
            SWIPE_THRESHOLD: 50,
            ZOOM_ENABLED: true
        }
    }
};

// Environment-specific overrides
window.getConfig = function() {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
        return {
            ...window.CONFIG,
            DEBUG: {
                ...window.CONFIG.DEBUG,
                LOGGING: {
                    ...window.CONFIG.DEBUG.LOGGING,
                    LEVEL: 'debug'
                }
            },
            API: {
                ...window.CONFIG.API,
                OPENAI: {
                    ...window.CONFIG.API.OPENAI,
                    TIMEOUT: 10000, // Shorter timeout for development
                    // Uncomment to test with different model/format combinations:
                    // MODEL: 'dall-e-2',
                    // QUALITY: 'standard', // Only for dall-e-3
                    // STYLE: 'vivid', // Only for dall-e-3
                    // RESPONSE_FORMAT: 'url', // or null to omit
                }
            }
        };
    }
    
    return window.CONFIG;
};

/**
 * Constants for Image2Sand
 * Centralized constants to avoid duplication across files
 */

// ============================================================================
// ELEMENT IDS
// ============================================================================

// Magic Mode Element IDs
window.MAGIC_ELEMENT_IDS = {
    PANEL: 'magic-panel',
    TOGGLE: 'magic-mode-toggle',
    VOICE_STATE: 'magic-voice-state',
    FFT_CANVAS: 'magic-fft-canvas',
    TRANSCRIPTION: 'magic-transcription',
    OBJECT_HIGHLIGHT: 'magic-object-highlight',
    GO_BUTTON: 'magic-go-button',
    ORIGINAL_CANVAS: 'magic-original-canvas',
    EDGES_CANVAS: 'magic-edges-canvas',
    DOTS_CANVAS: 'magic-dots-canvas',
    PATTERN_CANVAS: 'magic-pattern-canvas',
    STREAMING_CANVAS: 'magic-streaming-canvas',
    STREAMING_OVERLAY: 'magic-streaming-overlay',
    DETAILS_BUTTON: 'magic-details-button',
    WAVEFORM: 'magic-waveform',
    IMAGE_SHIMMER: 'magic-image-shimmer',
    GENERATED_IMAGE: 'magic-generated-image',
    ORIGINAL_BOX: 'magic-original-box',
    EDGES_BOX: 'magic-edges-box',
    DOTS_BOX: 'magic-dots-box',
    PATTERN_BOX: 'magic-pattern-box',
    ARROW_1: 'magic-arrow-1',
    ARROW_2: 'magic-arrow-2',
    ARROW_3: 'magic-arrow-3'
};

// Image Processing Element IDs
window.IMAGE_ELEMENT_IDS = {
    ORIGINAL: 'original-image',
    EDGE: 'edge-image',
    DOT: 'dot-image',
    CONNECT: 'connect-image',
    ORIGINAL_PATTERN: 'original-pattern'
};

// ============================================================================
// CSS CLASSES
// ============================================================================

window.CSS_CLASSES = {
    FADE_IN: 'fade-in',
    FADE_OUT: 'fade-out',
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    VISIBLE: 'visible',
    EXPANDED: 'expanded',
    IN_USE: 'in-use',
    INITIAL_STATE: 'initial-state',
    CENTERED_STATE: 'centered-state',
    RIGHTMOST_STATE: 'rightmost-state'
};

// ============================================================================
// VOICE RECOGNITION CONSTANTS
// ============================================================================

window.VOICE_CONSTANTS = {
    LANGUAGE: 'en-US',
    TRIGGER_WORD: 'draw',
    LISTENING_STATUS: 'listening',
    PROCESSING_STATUS: 'processing',
    LISTENING_MESSAGE: 'Listening for "draw"...',
    DRAW_DETECTED_MESSAGE: 'Draw detected! Say the object name...'
};

// ============================================================================
// SERIAL COMMUNICATION CONSTANTS
// ============================================================================

window.SERIAL_CONSTANTS = {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
    COORDS: 'COORDS',
    READY: 'READY',
    DONE: 'DONE',
    CONNECTED_MESSAGE: 'Connected to Serial Port',
    DISCONNECTED_MESSAGE: 'Disconnected',
    CONNECTION_FAILED_MESSAGE: 'Connection Failed'
};

// ============================================================================
// MAGIC PANEL STATES
// ============================================================================

window.MAGIC_STATES = {
    START: 'start',
    VOICE: 'voice',
    CONVERSION: 'conversion',
    STREAMING: 'streaming'
};

// ============================================================================
// UI CONSTANTS
// ============================================================================

window.UI_CONSTANTS = {
    OPACITY: {
        HIDDEN: 0.0,
        SHOWN: 1.0,
        FADE_IN: 1.0,
        FADE_OUT: 0.0,
        VOICE_INPUT: 0.5,
        MAGIC_ELEMENTS: 0.5,
        DISABLED: 0.5
    },
    ANIMATION: {
        FADE_IN_DURATION: 1000,
        FADE_OUT_DURATION: 1000,
        SHIMMER_DURATION: 2000,
        PROGRESS_UPDATE_INTERVAL: 100,
        MAGIC_CHECK_INTERVAL: 100,
        MAGIC_TIMEOUT: 5000,
        STATE_TRANSITION_DURATION: 500,
        FADE_DELAY: 10000 // 10 seconds in milliseconds (currently set to 1 for debugging)
    }
};

/**
 * Image2Sand Namespace
 * Main namespace to avoid global pollution and organize modules
 */

// Main Image2Sand namespace
window.Image2Sand = {
    // Configuration
    config: window.getConfig(),
    
    // Modules (will be populated by respective files)
    modules: {
        VoiceRecognition: null,
        SerialCommunication: null,
        MagicPanel: null,
        ImageProcessor: null,
        UIController: null
    },
    
    // Error handling utilities
    errorHandler: {
        /**
         * Safe wrapper for magic mode operations
         * @param {Function} operation - The operation to execute
         * @param {Function} fallback - Fallback function if operation fails
         * @param {string} context - Context for error logging
         */
        safeMagicCall: function(operation, fallback = () => {}, context = 'Magic Mode') {
            try {
                // Check if magic panel is available
                if (window.magicPanel && typeof operation === 'function') {
                    return operation();
                } else {
                    console.warn(`${context}: Magic Panel not available`);
                    // Try to initialize magic panel if it's not available
                    if (!window.magicPanel && window.MagicPanel) {
                        console.log('Attempting to initialize Magic Panel...');
                        try {
                            window.magicPanel = new window.MagicPanel();
                            console.log('Magic Panel initialized on demand');
                            return operation();
                        } catch (initError) {
                            console.error('Failed to initialize Magic Panel:', initError);
                        }
                    }
                    return fallback();
                }
            } catch (error) {
                console.error(`${context} error:`, error);
                return fallback();
            }
        },
        
        /**
         * Safe wrapper for any operation with error boundary
         * @param {Function} operation - The operation to execute
         * @param {Function} fallback - Fallback function if operation fails
         * @param {string} context - Context for error logging
         */
        safeCall: function(operation, fallback = () => {}, context = 'Operation') {
            try {
                if (typeof operation === 'function') {
                    return operation();
                } else {
                    console.warn(`${context}: Invalid operation`);
                    return fallback();
                }
            } catch (error) {
                console.error(`${context} error:`, error);
                if (window.Image2Sand.config.DEBUG.ERRORS.SHOW_USER_ERRORS) {
                    this.showUserError(error.message);
                }
                return fallback();
            }
        },
        
        /**
         * Show user-friendly error message
         * @param {string} message - Error message to show
         */
        showUserError: function(message) {
            // Create or update error display
            let errorDiv = document.getElementById('error-display');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'error-display';
                errorDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #ff4444;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    z-index: 10000;
                    max-width: 300px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                `;
                document.body.appendChild(errorDiv);
            }
            
            errorDiv.textContent = `Error: ${message}`;
            errorDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                }
            }, 5000);
        },
        
        /**
         * Log performance timing
         * @param {string} operation - Operation name
         * @param {number} startTime - Start time
         */
        logPerformance: function(operation, startTime) {
            if (window.Image2Sand.config.DEBUG.PERFORMANCE.ENABLE_TIMING) {
                const duration = performance.now() - startTime;
                if (duration > window.Image2Sand.config.DEBUG.PERFORMANCE.SLOW_OPERATION_THRESHOLD) {
                    console.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
                } else {
                    console.log(`${operation} completed in ${duration.toFixed(2)}ms`);
                }
            }
        }
    },
    
    // Utility functions
    utils: {
        /**
         * Check if magic mode is available
         * @returns {boolean}
         */
        isMagicModeAvailable: function() {
            return !!(window.Image2Sand?.modules?.MagicPanel);
        },
        
        /**
         * Check if voice recognition is available
         * @returns {boolean}
         */
        isVoiceRecognitionAvailable: function() {
            return !!(window.Image2Sand?.modules?.VoiceRecognition);
        },
        
        /**
         * Check if serial communication is available
         * @returns {boolean}
         */
        isSerialCommunicationAvailable: function() {
            return !!(window.Image2Sand?.modules?.SerialCommunication);
        },
        
        /**
         * Get element safely with error handling
         * @param {string} id - Element ID
         * @returns {HTMLElement|null}
         */
        getElement: function(id) {
            try {
                const element = document.getElementById(id);
                if (!element) {
                    console.warn(`Element not found: ${id}`);
                }
                return element;
            } catch (error) {
                console.error(`Error getting element ${id}:`, error);
                return null;
            }
        },
        
        /**
         * Add event listener safely
         * @param {HTMLElement} element - Target element
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @param {string} context - Context for error logging
         */
        addEventListener: function(element, event, handler, context = 'Event') {
            if (!element) {
                console.warn(`${context}: Element not found for event listener`);
                return;
            }
            
            try {
                element.addEventListener(event, handler);
            } catch (error) {
                console.error(`${context}: Error adding event listener:`, error);
            }
        }
    },
    
    // Initialize the namespace
    init: function() {
        console.log('Image2Sand namespace initialized');
        
        // Set up global error handler
        window.addEventListener('error', (event) => {
            const errorInfo = {
                message: event.message || 'Unknown error',
                filename: event.filename || 'Unknown file',
                lineno: event.lineno || 'Unknown line',
                colno: event.colno || 'Unknown column',
                error: event.error || 'No error object'
            };
            
            console.error('Global error:', errorInfo);
            console.error('Error details:', {
                type: event.type,
                target: event.target,
                currentTarget: event.currentTarget
            });
            
            if (window.Image2Sand.config.DEBUG.ERRORS.SHOW_USER_ERRORS) {
                window.Image2Sand.errorHandler.showUserError(`Error in ${errorInfo.filename}: ${errorInfo.message}`);
            }
        });
        
        // Set up unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            const rejectionInfo = {
                reason: event.reason || 'Unknown reason',
                promise: event.promise || 'Unknown promise',
                type: event.type || 'Unknown type'
            };
            
            console.error('Unhandled promise rejection:', rejectionInfo);
            console.error('Promise rejection details:', {
                reason: event.reason,
                promise: event.promise,
                type: event.type
            });
            
            if (window.Image2Sand.config.DEBUG.ERRORS.SHOW_USER_ERRORS) {
                window.Image2Sand.errorHandler.showUserError(`Promise rejected: ${rejectionInfo.reason}`);
            }
        });
    }
};

// Initialize the namespace when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Image2Sand.init());
} else {
    window.Image2Sand.init();
}

