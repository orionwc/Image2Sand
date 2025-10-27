/*
 * Voice2Sand - Core Voice Recognition and Serial Communication Algorithms
 * 
 * This file contains the core algorithms for voice recognition and serial communication
 * that can be used both in the UI and for future API development.
 */

// Note: Constants are now defined in constants.js and available globally

// ============================================================================
// VOICE RECOGNITION CORE FUNCTIONS
// ============================================================================
class VoiceRecognitionCore {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.drawDetected = false;
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.onStatusCallback = null;
    }

    // Initialize speech recognition
    init() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Speech recognition not supported in this browser');
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = VOICE_CONSTANTS.LANGUAGE;

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStatusCallback) {
                this.onStatusCallback(VOICE_CONSTANTS.LISTENING_STATUS, VOICE_CONSTANTS.LISTENING_MESSAGE);
            }
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            let confidence = 0;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                confidence = event.results[i][0].confidence || 0;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (this.onResultCallback) {
                this.onResultCallback({
                    interim: interimTranscript,
                    final: finalTranscript,
                    confidence: confidence,
                    drawDetected: this.drawDetected
                });
            }

            // Check for "draw" keyword in interim results (as a separate word)
            const interimText = interimTranscript.toLowerCase();
            if (this.isDrawWord(interimText) && !this.drawDetected) {
                this.drawDetected = true;
                // Only show "draw detected" status if voice processing is active
                if (this.onStatusCallback && window.isProcessingVoice) {
                    this.onStatusCallback(VOICE_CONSTANTS.PROCESSING_STATUS, VOICE_CONSTANTS.DRAW_DETECTED_MESSAGE);
                }
            }
            
            // Check if final transcript no longer contains "draw" as a separate word (revert case)
            if (finalTranscript && this.drawDetected) {
                const finalText = finalTranscript.toLowerCase();
                if (!this.isDrawWord(finalText)) {
                    this.drawDetected = false;
                    // Only show "listening" status if voice processing is active
                    if (this.onStatusCallback && window.isProcessingVoice) {
                        this.onStatusCallback(VOICE_CONSTANTS.LISTENING_STATUS, VOICE_CONSTANTS.LISTENING_MESSAGE);
                    }
                }
            }

            // If we've detected "draw" and have final text, extract object name
            if (this.drawDetected && finalTranscript) {
                const objectName = this.extractObjectName(finalTranscript);
                if (objectName && this.onResultCallback) {
                    this.onResultCallback({
                        interim: interimTranscript,
                        final: finalTranscript,
                        confidence: confidence,
                        drawDetected: this.drawDetected,
                        objectName: objectName
                    });
                    
                    // Stop listening once we've successfully extracted the object
                    this.stop();
                }
            }
        };

        this.recognition.onerror = (event) => {
            if (this.onErrorCallback) {
                this.onErrorCallback(event.error);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            console.log('Speech recognition ended, drawDetected:', this.drawDetected);
            
            // Always attempt to restart recognition if we should be listening
            // This handles both normal timeout and magic mode scenarios
            setTimeout(() => {
                // Check if we should restart based on current state
                const shouldRestart = this.drawDetected || 
                    (window.voiceButtonState === 'listening') || 
                    (window.isProcessingVoice === true);
                
                if (shouldRestart) {
                    console.log('Restarting speech recognition after timeout');
                    try {
                        this.recognition.start();
                    } catch (error) {
                        console.error('Failed to restart speech recognition:', error);
                        // If restart fails, reset the state
                        this.isListening = false;
                        this.drawDetected = false;
                        if (this.onStatusCallback) {
                            this.onStatusCallback('error', 'Speech recognition failed to restart');
                        }
                    }
                } else {
                    console.log('Not restarting speech recognition - no active listening state');
                }
            }, 100);
        };

        return true;
    }

    // Check if "draw" appears as a separate word
    isDrawWord(text) {
        // Use word boundary regex to match "draw" as a complete word
        const drawRegex = /\bdraw\b/;
        return drawRegex.test(text);
    }

    // Extract object name from transcript
    extractObjectName(transcript) {
        const text = transcript.toLowerCase();
        const drawIndex = text.indexOf('draw');
        
        if (drawIndex !== -1) {
            let objectName = text.substring(drawIndex + 4).trim();
            
            // Remove common words that might come after "draw"
            objectName = objectName.replace(/^(a|an|the|some|my|your|his|her|its|our|their)\s+/, '');
            
            // Clean up the object name
            objectName = objectName.replace(/[^\w\s]/g, '').trim();
            
            if (objectName.length > 0) {
                return objectName.charAt(0).toUpperCase() + objectName.slice(1);
            }
        }
        
        return null;
    }

    // Start listening
    start() {
        if (this.recognition) {
            this.drawDetected = false;
            this.recognition.start();
        }
    }

    // Stop listening
    stop() {
        if (this.recognition) {
            this.recognition.stop();
            this.isListening = false;
            this.drawDetected = false;
        }
    }

    // Set callbacks
    setCallbacks(onResult, onError, onStatus) {
        this.onResultCallback = onResult;
        this.onErrorCallback = onError;
        this.onStatusCallback = onStatus;
    }
}

// Serial Communication Core Functions
class SerialCommunicationCore {
    constructor() {
        this.serialPort = null;
        this.writer = null;
        this.reader = null;
        this.isConnected = false;
        this.isStreaming = false;
        this.dataListeners = [];
        this.responseBuffer = [];  // Buffer for responses when no listeners are active
        this.onStatusCallback = null;
        this.onDataCallback = null;
        this.onProgressCallback = null;
        this.endSent = false;  // Track if END signal has been sent for current pattern
    }

    // Connect to serial port
    async connect() {
        try {
            this.serialPort = await navigator.serial.requestPort();
            await this.serialPort.open({ baudRate: 9600 });
            
            this.writer = this.serialPort.writable.getWriter();
            this.reader = this.serialPort.readable.getReader();
            
            this.isConnected = true;
            
            if (this.onStatusCallback) {
                this.onStatusCallback(SERIAL_CONSTANTS.CONNECTED, SERIAL_CONSTANTS.CONNECTED_MESSAGE);
            }
            
            // Start reading from serial port
            this.readSerialData();
            
            // Send initial COORDS and wait for response (no START yet)
            await this.waitForResponse('COORDS', 0);
            
            return true;
        } catch (error) {
            if (this.onStatusCallback) {
                this.onStatusCallback(SERIAL_CONSTANTS.ERROR, `${SERIAL_CONSTANTS.CONNECTION_FAILED_MESSAGE}: ${error.message}`);
            }
            throw error;
        }
    }

    // Disconnect from serial port
    async disconnect() {
        try {
            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }
            if (this.reader) {
                this.reader.releaseLock();
                this.reader = null;
            }
            if (this.serialPort) {
                await this.serialPort.close();
                this.serialPort = null;
            }
            
            this.isConnected = false;
            this.isStreaming = false;
            
            if (this.onStatusCallback) {
                this.onStatusCallback(SERIAL_CONSTANTS.DISCONNECTED, SERIAL_CONSTANTS.DISCONNECTED_MESSAGE);
            }
        } catch (error) {
            if (this.onStatusCallback) {
                this.onStatusCallback('error', `Error disconnecting: ${error.message}`);
            }
        }
    }

    // Read data from serial port
    async readSerialData() {
        if (!this.reader) return;
        
        let buffer = '';
        
        try {
            while (this.isConnected) {
                const { value, done } = await this.reader.read();
                if (done) break;
                
                const text = new TextDecoder().decode(value);
                buffer += text;
                
                // Process complete lines
                const lines = buffer.split('\n');
                // Keep the last incomplete line in buffer
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    console.log(`Raw serial data: "${line}" -> trimmed: "${trimmedLine}"`);
                    if (trimmedLine) {
                        // If we have listeners, notify them immediately
                        if (this.dataListeners && this.dataListeners.length > 0) {
                            // Notify main callback
                            if (this.onDataCallback) {
                                this.onDataCallback(trimmedLine);
                            }
                            
                            // Notify all data listeners
                            this.dataListeners.forEach(listener => {
                                try {
                                    listener(trimmedLine);
                                } catch (error) {
                                    console.error('Error in data listener:', error);
                                }
                            });
                        } else {
                            // No listeners active - buffer the response
                            console.log(`Buffering response (no listeners): "${trimmedLine}"`);
                            this.responseBuffer.push(trimmedLine);
                            
                            // Still notify main callback for logging
                            if (this.onDataCallback) {
                                this.onDataCallback(trimmedLine);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            if (this.isConnected && this.onStatusCallback) {
                this.onStatusCallback('error', `Error reading serial data: ${error.message}`);
            }
        }
    }

    // Send data to serial port
    async sendData(data) {
        if (!this.writer) {
            throw new Error('Not connected to serial port');
        }
        
        try {
            const encoder = new TextEncoder();
            await this.writer.write(encoder.encode(data));
            
            // Log outgoing data to serial log
            if (this.onDataCallback) {
                const timestamp = new Date().toLocaleTimeString();
                this.onDataCallback(`[${timestamp}] Web App: ${data}`);
            }
            
            return true;
        } catch (error) {
            throw new Error(`Error sending data: ${error.message}`);
        }
    }

    // Wait for specific response from Arduino
    async waitForResponse(expectedResponse, timeout = 10000) {
        return new Promise((resolve, reject) => {
            console.log(`Waiting for response: "${expectedResponse}"`);
            
            // Check if response is already buffered
            const bufferedIndex = this.responseBuffer.findIndex(data => data.trim() === expectedResponse);
            if (bufferedIndex !== -1) {
                // Found it in buffer - remove and resolve immediately
                const bufferedResponse = this.responseBuffer.splice(bufferedIndex, 1)[0];
                console.log(`Found buffered response: ${expectedResponse}`);
                resolve(bufferedResponse);
                return;
            }
            
            let timeoutId = null;
            if (timeout > 0) {
                timeoutId = setTimeout(() => {
                    console.log(`Timeout waiting for response: ${expectedResponse}`);
                    reject(new Error(`Timeout waiting for response: ${expectedResponse}`));
                }, timeout);
            }
            
            const checkResponse = (data) => {
                console.log(`Received data: "${data}" (looking for: "${expectedResponse}")`);
                if (data.trim() === expectedResponse) {
                    console.log(`Found expected response: ${expectedResponse}`);
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    this.removeDataListener(checkResponse);
                    resolve(data);
                }
            };
            
            this.addDataListener(checkResponse);
        });
    }

    // Add data listener for response waiting
    addDataListener(listener) {
        if (!this.dataListeners) {
            this.dataListeners = [];
        }
        this.dataListeners.push(listener);
    }

    // Remove data listener
    removeDataListener(listener) {
        if (this.dataListeners) {
            const index = this.dataListeners.indexOf(listener);
            if (index > -1) {
                this.dataListeners.splice(index, 1);
            }
        }
    }

    // Perform handshake with Arduino
    async performHandshake() {
        // Reset END sent flag for new pattern
        this.endSent = false;
        
        // Send START command
        await this.sendData('<START>');
        
        // Wait for READY from Arduino (no timeout - wait indefinitely)
        await this.waitForResponse('READY', 0);
    }

    // Stream pattern to Arduino
    async streamPattern(pattern, onProgress) {
        if (!this.isConnected) {
            throw new Error('Not connected to serial port');
        }

        this.isStreaming = true;
        
        try {
            // Perform handshake before streaming
            await this.performHandshake();
            
            // Parse pattern
            const patternIterator = new PatternIterator(pattern);
            const totalPoints = patternIterator.getTotalPoints();
            
            // Stream each point
            for (let i = 0; i < totalPoints && this.isStreaming; i++) {
                const point = patternIterator.getNext();
                if (!point) break;
                
                const { r, theta } = point;
                
                // Update progress
                if (onProgress) {
                    onProgress(i + 1, totalPoints, r, theta);
                }
                
                // Send position command
                const msg = `POS:${r},${theta}`;
                await this.sendData(`<${msg}>`);
                
                // Wait for Arduino to confirm receipt of the coordinate (no timeout - wait indefinitely)
                await this.waitForResponse(msg, 0);
                
                // Wait for Arduino to confirm it finished moving to that position (no timeout - can take as long as needed)
                await this.waitForResponse('DONE', 0);
            }
            
            // Send END signal only if not already sent
            if (this.isStreaming && !this.endSent) {
                await this.sendData('<END>');
                this.endSent = true;  // Mark that END has been sent
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } finally {
            this.isStreaming = false;
        }
    }

    // Stop streaming
    stopStreaming() {
        this.isStreaming = false;
    }

    // Set callbacks
    setCallbacks(onStatus, onData, onProgress) {
        this.onStatusCallback = onStatus;
        this.onDataCallback = onData;
        this.onProgressCallback = onProgress;
    }
}

// Pattern Iterator Class
class PatternIterator {
    constructor(pattern) {
        // Remove the outer curly braces and split the pattern into pairs
        const cleanPattern = pattern.replace(/^\{|\}$/g, '');
        this.pairs = cleanPattern.split('},{');
        this.index = 0;
    }

    getNext() {
        if (this.index < this.pairs.length) {
            const currentPair = this.pairs[this.index];
            this.index++;
            
            const [r, theta] = currentPair.split(',').map(Number);
            return { r, theta };
        }
        return null;
    }

    getTotalPoints() {
        return this.pairs.length;
    }

    getCurrentIndex() {
        return this.index;
    }
}

// Export for use in other files
window.VoiceRecognitionCore = VoiceRecognitionCore;
window.SerialCommunicationCore = SerialCommunicationCore;
window.PatternIterator = PatternIterator;
