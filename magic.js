/**
 * Magic Panel - Animated workflow for Magic Mode
 * Provides a magical, animated interface that guides users through the entire workflow
 */

// Note: Constants are now defined in constants.js and available globally

// ============================================================================
// MAGIC PANEL CLASS
// ============================================================================

class MagicPanel {
    constructor() {
        console.log('MagicPanel constructor called');
        this.currentState = 'start';
        this.isDetailsExpanded = false;
        this.waveformBars = [];
        this.waveformAnimation = null;
        this.streamingProgress = 0;
        this.streamingOverlay = null;
        this.pauseTimeoutId = null; // Track pause timeout for cancellation
        
        try {
            this.initializeElements();
            this.setupEventListeners();
            this.createWaveform();
            console.log('MagicPanel constructor completed successfully');
        } catch (error) {
            console.error('Error in MagicPanel constructor:', error);
        }
    }
    
    initializeElements() {
        // Main panel and states
        this.panel = document.getElementById(MAGIC_ELEMENT_IDS.PANEL);
        if (!this.panel) {
            console.error('Magic Panel element not found in DOM!');
            return;
        }
        console.log('Magic Panel element found:', this.panel);
        
        this.voiceState = document.getElementById(MAGIC_ELEMENT_IDS.VOICE_STATE);
        
        // FFT canvas
        this.fftCanvas = document.getElementById(MAGIC_ELEMENT_IDS.FFT_CANVAS);
        this.fftCtx = this.fftCanvas ? this.fftCanvas.getContext('2d') : null;
        
        
        // Voice elements
        this.waveform = document.getElementById(MAGIC_ELEMENT_IDS.WAVEFORM);
        this.transcription = document.getElementById(MAGIC_ELEMENT_IDS.TRANSCRIPTION);
        this.objectHighlight = document.getElementById(MAGIC_ELEMENT_IDS.OBJECT_HIGHLIGHT);
        
        // Image elements (safely handle missing elements)
        this.imageShimmer = document.getElementById(MAGIC_ELEMENT_IDS.IMAGE_SHIMMER);
        this.generatedImageCanvas = document.getElementById(MAGIC_ELEMENT_IDS.GENERATED_IMAGE);
        
        // Conversion elements
        this.originalBox = document.getElementById(MAGIC_ELEMENT_IDS.ORIGINAL_BOX);
        this.edgesBox = document.getElementById(MAGIC_ELEMENT_IDS.EDGES_BOX);
        this.dotsBox = document.getElementById(MAGIC_ELEMENT_IDS.DOTS_BOX);
        this.patternBox = document.getElementById(MAGIC_ELEMENT_IDS.PATTERN_BOX);
        this.arrow1 = document.getElementById(MAGIC_ELEMENT_IDS.ARROW_1);
        this.arrow2 = document.getElementById(MAGIC_ELEMENT_IDS.ARROW_2);
        this.arrow3 = document.getElementById(MAGIC_ELEMENT_IDS.ARROW_3);
        
        // Conversion canvases
        this.originalCanvas = document.getElementById(MAGIC_ELEMENT_IDS.ORIGINAL_CANVAS);
        this.edgesCanvas = document.getElementById(MAGIC_ELEMENT_IDS.EDGES_CANVAS);
        this.dotsCanvas = document.getElementById(MAGIC_ELEMENT_IDS.DOTS_CANVAS);
        this.patternCanvas = document.getElementById(MAGIC_ELEMENT_IDS.PATTERN_CANVAS);
        
        // Streaming elements (safely handle missing elements)
        this.streamingCanvas = document.getElementById(MAGIC_ELEMENT_IDS.STREAMING_CANVAS);
        this.streamingOverlay = document.getElementById(MAGIC_ELEMENT_IDS.STREAMING_OVERLAY);
        
        // Details button
        this.detailsButton = document.getElementById(MAGIC_ELEMENT_IDS.DETAILS_BUTTON);
        this.panelGrid = document.querySelector('.panel-grid');
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Start button removed - GO button handles this functionality
        console.log('Start button removed - GO button handles this functionality');
        
        if (this.detailsButton) {
            this.detailsButton.addEventListener('click', () => this.toggleDetails());
        }
        
        // FFT button (removed - element doesn't exist in HTML)
        // const fftButton = document.getElementById('magic-fft-button');
        // if (fftButton) {
        //     fftButton.addEventListener('click', () => this.toggleFFT());
        // }
    }
    
    toggleFFT() {
        if (this.isListening) {
            this.stopFFT();
            // FFT button removed - element doesn't exist in HTML
            // const fftButton = document.getElementById('magic-fft-button');
            // if (fftButton) {
            //     fftButton.textContent = 'Start Real FFT';
            // }
        } else {
            this.startRealFFT();
            // FFT button removed - element doesn't exist in HTML
            // const fftButton = document.getElementById('magic-fft-button');
            // if (fftButton) {
            //     fftButton.textContent = 'Stop FFT';
            // }
        }
    }
    
    createWaveform() {
        if (!this.waveform) {
            console.log('Waveform element not found, skipping waveform creation');
            return;
        }
        
        // Create animated waveform bars
        console.log('Creating waveform bars');
        for (let i = 0; i < 20; i++) {
            const bar = document.createElement('div');
            bar.className = 'waveform-bar';
            bar.style.animationDelay = `${i * 0.1}s`;
            this.waveformBars.push(bar);
            this.waveform.appendChild(bar);
        }
        console.log(`Created ${this.waveformBars.length} waveform bars`);
        
        // Start FFT animation
        this.startFFTAnimation();
    }
    
    startFFTAnimation() {
        if (!this.fftCtx) return;
        
        // Initialize Web Audio API for real FFT
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isListening = false;
        
        // Start with demo animation
        this.startDemoFFT();
    }
    
    startDemoFFT() {
        const animate = () => {
            // Clear canvas
            this.fftCtx.clearRect(0, 0, this.fftCanvas.width, this.fftCanvas.height);
            
            // Draw FFT bars
            const barWidth = this.fftCanvas.width / 32;
            for (let i = 0; i < 32; i++) {
                const height = Math.random() * this.fftCanvas.height * 0.8;
                const x = i * barWidth;
                const y = this.fftCanvas.height - height;
                
                // Create gradient
                const gradient = this.fftCtx.createLinearGradient(0, y, 0, this.fftCanvas.height);
                gradient.addColorStop(0, '#00bfff');
                gradient.addColorStop(1, '#ffffff');
                
                this.fftCtx.fillStyle = gradient;
                this.fftCtx.fillRect(x, y, barWidth - 1, height);
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    async startRealFFT() {
        try {
            // Use persistent microphone stream if available, otherwise create new one
            let stream;
            if (window.persistentMicrophoneStream) {
                stream = window.persistentMicrophoneStream;
                console.log('Using existing persistent microphone stream');
            } else {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                window.persistentMicrophoneStream = stream;
                console.log('Created new persistent microphone stream');
            }
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            // Configure analyser
            this.analyser.fftSize = 64; // 32 frequency bins
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Connect microphone to analyser
            this.microphone.connect(this.analyser);
            
            // Create data array for frequency data
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.isListening = true;
            
            // Start real FFT animation
            this.animateRealFFT();
            
            console.log('Real FFT started');
        } catch (error) {
            console.error('Error starting real FFT:', error);
            // Fall back to demo animation
            this.startDemoFFT();
        }
    }
    
    animateRealFFT() {
        if (!this.isListening || !this.analyser || !this.dataArray) return;
        
        // Only process audio when voice processing is active
        if (window.isProcessingVoice === false) {
            // Still animate but with no audio processing - let the animate function handle the loop
            // Don't start a new animation loop here
        }
        
        const animate = () => {
            if (!this.isListening) return;
            
            // Only process audio when voice processing is active
            if (window.isProcessingVoice !== false) {
                // Get frequency data
                this.analyser.getByteFrequencyData(this.dataArray);
            }
            
            // Clear canvas
            this.fftCtx.clearRect(0, 0, this.fftCanvas.width, this.fftCanvas.height);
            
            // Draw waveform bars
            const barCount = 50; // Number of waveform bars
            const barWidth = this.fftCanvas.width / barCount;
            const centerY = this.fftCanvas.height / 2;
            
            for (let i = 0; i < barCount; i++) {
                let height;
                
                if (window.isProcessingVoice !== false) {
                    // Map bar index to frequency data
                    const frequencyIndex = Math.floor((i / barCount) * this.dataArray.length);
                    const intensity = this.dataArray[frequencyIndex] / 255;
                    
                    // Calculate bar height with some randomness for organic feel
                    const baseHeight = intensity * this.fftCanvas.height * 0.8;
                    const randomVariation = (Math.random() - 0.5) * 20;
                    height = Math.max(2, baseHeight + randomVariation);
                } else {
                    // Show minimal static bars when paused
                    height = Math.max(2, Math.random() * 10 + 5);
                }
                
                const x = i * barWidth;
                const y = centerY - height / 2;
                
                // Create silver gradient for each bar
                const gradient = this.fftCtx.createLinearGradient(0, y, 0, y + height);
                gradient.addColorStop(0, '#e8e8e8'); // Light silver
                gradient.addColorStop(0.5, '#c0c0c0'); // Medium silver
                gradient.addColorStop(1, '#a0a0a0'); // Dark silver
                
                this.fftCtx.fillStyle = gradient;
                this.fftCtx.fillRect(x, y, barWidth - 1, height);
                
                // Add silver glow effect
                this.fftCtx.shadowColor = '#c0c0c0';
                this.fftCtx.shadowBlur = 5;
                this.fftCtx.fillRect(x, y, barWidth - 1, height);
                this.fftCtx.shadowBlur = 0;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    stopFFT() {
        this.isListening = false;
        if (this.microphone) {
            this.microphone.disconnect();
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
    
    pauseFFT() {
        // Pause FFT visualization but keep microphone and audio context alive
        // The animateRealFFT() function will handle pausing based on isProcessingVoice
        console.log('FFT visualization paused - keeping microphone stream alive');
    }
    
    show() {
        console.log('Magic Panel show() called');
        this.panel.style.display = 'block';
        console.log('Panel display set to block');
        
        // Reset GO button to enabled state when panel is shown
        const goButton = document.getElementById('magic-go-button');
        if (goButton) {
            goButton.disabled = false;
            goButton.style.opacity = ELEMENT_SHOWN_OPACITY.toString();
        }
        
        // Show voice state with elements at 20% opacity
        this.showState('voice');
        console.log('Voice state shown with 20% opacity elements');
        
        // Ensure voice state is always visible
        if (this.voiceState) {
            this.voiceState.classList.add('active');
            console.log('Voice state made active');
        }
    }
    
    hide() {
        this.panel.style.display = 'none';
        this.hideAllStates();
    }
    
    showVoiceElements() {
        const fftContainer = document.querySelector('.fft-container');
        const voiceInstructions = document.querySelector('.voice-instructions');
        const transcriptionDisplay = document.querySelector('.transcription-display');
        
        // Add fade-in class for 1-second transition
        setTimeout(() => {
            if (fftContainer) {
                fftContainer.classList.add('fade-in');
            }
            if (voiceInstructions) {
                voiceInstructions.classList.add('fade-in');
            }
            if (transcriptionDisplay) {
                transcriptionDisplay.classList.add('fade-in');
            }
        }, 100); // Small delay to ensure state is visible
    }
    
    showState(stateName) {
        // Don't hide states since we only have one voice state
        this.currentState = stateName;
        
        switch(stateName) {
            case 'voice':
                console.log('Ensuring voice state is active');
                if (this.voiceState) {
                    this.voiceState.classList.add('active');
                }
                this.startWaveform();
                console.log('Voice state activated, waveform started');
                break;
        }
    }
    
    hideAllStates() {
        // Only one state now - voice state
        if (this.voiceState) {
            this.voiceState.classList.remove('active');
        }
    }
    
    handleStart() {
        console.log('Magic Panel START button clicked');
        
        // Just trigger the exact same handler as the mic button
        if (typeof startManualVoiceListening === 'function') {
            console.log('Calling startManualVoiceListening from Magic Panel');
            startManualVoiceListening();
        } else {
            console.error('startManualVoiceListening function not found');
        }
    }
    
    // Helper functions to be called from main functions when Magic Mode is enabled
    
    updateImageDisplay(imageElement) {
        if (this.currentState !== 'voice') return;
        
        // Stop shimmer and show image (safely handle missing element)
        if (this.imageShimmer) {
            this.imageShimmer.style.display = 'none';
        }
        
        // Draw image to canvas (safely handle missing element)
        if (this.generatedImageCanvas) {
            const ctx = this.generatedImageCanvas.getContext('2d');
            this.generatedImageCanvas.width = 400;
            this.generatedImageCanvas.height = 400;
            
            ctx.drawImage(imageElement, 0, 0, 400, 400);
        }
        this.showState('image');
    }
    
    updatePatternDisplay() {
        if (this.currentState !== 'image') return;
        
        // Start conversion sequence
        setTimeout(() => {
            this.showState('conversion');
            this.copyImagesToConversion();
        }, 1000);
    }
    
    updateStreamingDisplay() {
        if (this.currentState !== 'conversion') return;
        
        this.showState('streaming');
        this.setupStreamingOverlay();
    }
    
    updateStreamingProgress(progress) {
        if (this.currentState !== 'streaming') return;
        
        this.updateStreamingProgressOverlay(progress);
    }
    
    updateStreamingProgressOverlay(progress) {
        if (!this.streamingOverlayCanvas) return;
        
        const ctx = this.streamingOverlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, 400, 400);
        
        // Get the pattern from the main canvas
        const mainCanvas = document.getElementById('connect-image');
        if (!mainCanvas) return;
        
        // Copy the pattern to our streaming canvas (safely handle missing element)
        const mainCtx = mainCanvas.getContext('2d');
        if (this.streamingCanvas) {
            this.streamingCanvas.width = 400;
            this.streamingCanvas.height = 400;
            this.streamingCanvas.getContext('2d').drawImage(mainCanvas, 0, 0, 400, 400);
        }
        
        // Draw progress overlay (black line tracing)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        // Use the same logic as the main streaming progress
        const patternText = document.getElementById('polar-coordinates-textarea').value;
        if (!patternText) return;
        
        try {
            const lines = patternText.trim().split('\n');
            const points = lines.map(line => {
                const [r, theta] = line.split(',').map(Number);
                return { r, theta };
            });
            
            const totalPoints = points.length;
            const currentPoint = Math.min(progress.current, totalPoints);
            
            // Draw progress up to current point
            let firstPoint = true;
            for (let i = 0; i < currentPoint; i++) {
                const point = points[i];
                if (!point) continue;
                
                const { r, theta } = point;
                const thetaRad = theta * Math.PI / 1800;
                const x = 200 + (r / 1000) * 150 * Math.cos(thetaRad);
                const y = 200 + (r / 1000) * 150 * Math.sin(thetaRad);
                
                if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
        } catch (error) {
            console.error('Error drawing streaming progress:', error);
        }
    }
    
    completeStreaming() {
        if (this.currentState !== 'streaming') return;
        
        // Fade out and return to start
        setTimeout(() => {
            this.showState('start');
            this.reset();
        }, 2000);
    }
    
    startWaveform() {
        // Waveform animation is handled by CSS
        this.waveformBars.forEach(bar => {
            bar.style.animationPlayState = 'running';
        });
    }
    
    startImageShimmer() {
        if (this.imageShimmer) {
            this.imageShimmer.style.display = 'block';
        }
    }
    
    startConversionSequence() {
        // Animate conversion boxes with delays
        const sequence = [
            { element: this.originalBox, delay: 0 },
            { element: this.arrow1, delay: 500 },
            { element: this.edgesBox, delay: 1000 },
            { element: this.arrow2, delay: 1500 },
            { element: this.dotsBox, delay: 2000 },
            { element: this.arrow3, delay: 2500 },
            { element: this.patternBox, delay: 3000 }
        ];
        
        sequence.forEach(({ element, delay }) => {
            setTimeout(() => {
                element.classList.add('fade-in');
            }, delay);
        });
        
        // Copy images to conversion canvases
        this.copyImagesToConversion();
    }
    
    copyImagesToConversion() {
        // Copy from main canvases to magic panel canvases
        const originalCanvas = document.getElementById('original-pattern');
        const edgesCanvas = document.getElementById('edge-image');
        const dotsCanvas = document.getElementById('dot-image');
        const patternCanvas = document.getElementById('connect-image');
        
        if (originalCanvas) {
            const ctx = this.originalCanvas.getContext('2d');
            this.originalCanvas.width = 200;
            this.originalCanvas.height = 200;
            ctx.drawImage(originalCanvas, 0, 0, 200, 200);
        }
        
        if (edgesCanvas) {
            const ctx = this.edgesCanvas.getContext('2d');
            this.edgesCanvas.width = 200;
            this.edgesCanvas.height = 200;
            ctx.drawImage(edgesCanvas, 0, 0, 200, 200);
        }
        
        if (dotsCanvas) {
            const ctx = this.dotsCanvas.getContext('2d');
            this.dotsCanvas.width = 200;
            this.dotsCanvas.height = 200;
            ctx.drawImage(dotsCanvas, 0, 0, 200, 200);
        }
        
        if (patternCanvas) {
            const ctx = this.patternCanvas.getContext('2d');
            this.patternCanvas.width = 200;
            this.patternCanvas.height = 200;
            ctx.drawImage(patternCanvas, 0, 0, 200, 200);
        }
    }
    
    setupStreamingOverlay() {
        // Copy pattern to streaming canvas (safely handle missing element)
        const patternCanvas = document.getElementById('connect-image');
        if (patternCanvas && this.streamingCanvas) {
            const ctx = this.streamingCanvas.getContext('2d');
            this.streamingCanvas.width = 400;
            this.streamingCanvas.height = 400;
            ctx.drawImage(patternCanvas, 0, 0, 400, 400);
        }
        
        // Setup streaming overlay canvas (safely handle missing element)
        this.streamingOverlayCanvas = document.createElement('canvas');
        this.streamingOverlayCanvas.width = 400;
        this.streamingOverlayCanvas.height = 400;
        this.streamingOverlayCanvas.style.position = 'absolute';
        this.streamingOverlayCanvas.style.top = '0';
        this.streamingOverlayCanvas.style.left = '0';
        this.streamingOverlayCanvas.style.width = '100%';
        this.streamingOverlayCanvas.style.height = '100%';
        if (this.streamingOverlay) {
            this.streamingOverlay.appendChild(this.streamingOverlayCanvas);
        }
    }
    
    
    toggleDetails() {
        this.isDetailsExpanded = !this.isDetailsExpanded;
        
        console.log('Toggle details clicked, expanded:', this.isDetailsExpanded);
        
        if (this.isDetailsExpanded) {
            this.panelGrid.style.display = 'grid';
            this.detailsButton.classList.add('expanded');
            // Add padding to magic panel when details are expanded
            const magicPanel = document.getElementById('magic-panel');
            if (magicPanel) {
                magicPanel.classList.add('in-use');
            }
            // Update text to "Hide Details"
            const textSpan = this.detailsButton.querySelector('span:first-child');
            if (textSpan) {
                textSpan.textContent = 'Hide Details';
            }
            console.log('Added expanded class to button');
        } else {
            this.panelGrid.style.display = 'none';
            this.detailsButton.classList.remove('expanded');
            // Remove padding from magic panel when details are collapsed
            const magicPanel = document.getElementById('magic-panel');
            if (magicPanel) {
                magicPanel.classList.remove('in-use');
            }
            // Update text back to "See Details"
            const textSpan = this.detailsButton.querySelector('span:first-child');
            if (textSpan) {
                textSpan.textContent = 'See Details';
            }
            console.log('Removed expanded class from button');
        }
    }
    
    reset() {
        console.log('=== MAGIC PANEL RESET() CALLED ===');
        console.log('Reset called at:', new Date().toISOString());
        console.log('Call stack:', new Error().stack);
        console.log('This will fade out ALL conversion boxes including the 4th one!');
        
        // Don't hide all states - keep images visible
        // this.hideAllStates(); // REMOVED - keep images visible
        this.currentState = 'start';
        
        // Stop FFT
        this.stopFFT();
        
        // Clear transcriptions
        this.transcription.textContent = '';
        this.transcription.style.opacity = '1';
        this.objectHighlight.textContent = '';
        this.objectHighlight.style.display = 'none';
        
        // Reset fade-in classes for voice elements only
        const fftContainer = document.querySelector('.fft-container');
        const voiceInstructions = document.querySelector('.voice-instructions');
        const transcriptionDisplay = document.querySelector('.transcription-display');
        
        if (fftContainer) fftContainer.classList.remove('fade-in');
        if (voiceInstructions) voiceInstructions.classList.remove('fade-in');
        if (transcriptionDisplay) transcriptionDisplay.classList.remove('fade-in');
        
        // Reset start button (now in voice state)
        // Start button removed - no need to reset
        
        // Reset conversion boxes
        const boxes = [this.originalBox, this.edgesBox, this.dotsBox, this.patternBox];
        const arrows = [this.arrow1, this.arrow2, this.arrow3];
        
        boxes.forEach((box, index) => {
            if (box) {
                box.classList.remove('fade-in');
                box.style.opacity = ELEMENT_HIDDEN_OPACITY.toString(); // Use constant instead of hardcoded '0'
            }
        });
        arrows.forEach((arrow, index) => {
            if (arrow) {
                arrow.classList.remove('fade-in');
                arrow.style.opacity = ELEMENT_HIDDEN_OPACITY.toString(); // Use constant instead of hardcoded '0'
            }
        });
        
        // Reset image elements (but don't hide them on error)
        if (this.generatedImageCanvas) {
            const ctx = this.generatedImageCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.generatedImageCanvas.width, this.generatedImageCanvas.height);
            // Don't set opacity to 0 - keep images visible until reset
            // this.generatedImageCanvas.style.opacity = '0'; // REMOVED
        }
        
        // Reset image shimmer (safely handle missing element)
        if (this.imageShimmer) {
            this.imageShimmer.style.display = 'block';
        }
        
        // Clear streaming overlay
        if (this.streamingOverlayCanvas) {
            this.streamingOverlayCanvas.remove();
            this.streamingOverlayCanvas = null;
        }
        
        // Reset conversion canvases
        if (this.originalCanvas) {
            const ctx = this.originalCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.originalCanvas.width, this.originalCanvas.height);
        }
        if (this.edgesCanvas) {
            const ctx = this.edgesCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.edgesCanvas.width, this.edgesCanvas.height);
        }
        if (this.dotsCanvas) {
            const ctx = this.dotsCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.dotsCanvas.width, this.dotsCanvas.height);
        }
        if (this.patternCanvas) {
            const ctx = this.patternCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.patternCanvas.width, this.patternCanvas.height);
        }
        
        // Don't reset voice state here - let the calling function handle it
        // this.updateVoiceState('idle'); // REMOVED - let caller set the state
    }
    
    // Update voice state in Magic Panel
    updateVoiceState(state) {
        console.log('MagicPanel updating voice state to:', state);
        
        // Clear any existing pause timeout (e.g. if resuming before 1.5s delay)
        if (this.pauseTimeoutId) {
            clearTimeout(this.pauseTimeoutId);
            this.pauseTimeoutId = null;
            console.log('Cancelled pending "Listening paused" message');
        }
        
        // Update voice state element
        if (this.voiceState) {
            // Remove all state classes
            this.voiceState.classList.remove('active', 'listening', 'paused', 'idle');
            
            // Add appropriate state class
            switch (state) {
                case 'listening':
                    this.voiceState.classList.add('active', 'listening');
                    break;
                case 'paused':
                    this.voiceState.classList.add('active', 'paused');
                    break;
                case 'idle':
                default:
                    this.voiceState.classList.add('idle');
                    break;
            }
        }
        
        // Update transcription display
        if (this.transcription) {
            switch (state) {
                case 'listening':
                    // If we're resuming from paused state, update immediately
                    this.transcription.textContent = 'Listening...';
                    break;
                case 'paused':
                    // Freeze current text for 2 seconds, then show "Listening paused"
                    // Only if still in paused state after the delay
                    this.pauseTimeoutId = setTimeout(() => {
                        // Double-check we're still paused before showing the message
                        // (don't show if resume happened within the delay)
                        const voiceButton = document.getElementById('manual-voice-button');
                        if (voiceButton && voiceButton.classList.contains('paused')) {
                            this.transcription.textContent = 'Listening paused';
                            console.log('Showing "Listening paused" after 2s delay');
                        }
                        this.pauseTimeoutId = null;
                    }, 2000);
                    // Keep current text frozen during the delay
                    break;
                case 'idle':
                default:
                    this.transcription.textContent = 'Waiting for voice input...';
                    break;
            }
        }
        
        // Note: FFT and transcription visibility is controlled by the voice-input-container
        // fade-in class, not individual element opacity. The container is managed by
        // fadeInVoiceElements() and fadeOutVoiceElements() functions in image2sand.js
    }
}

// Initialize magic panel immediately
let magicPanel;

// Try to initialize immediately if DOM is ready
if (document.readyState === 'loading') {
    // DOM is still loading, wait for it
    document.addEventListener('DOMContentLoaded', initializeMagicPanel);
} else {
    // DOM is already loaded, initialize immediately
    initializeMagicPanel();
}

function initializeMagicPanel() {
    console.log('Initializing Magic Panel...');
    try {
        magicPanel = new MagicPanel();
        window.magicPanel = magicPanel; // Make it globally accessible
        console.log('Magic Panel initialized successfully:', magicPanel);
    } catch (error) {
        console.error('Error initializing Magic Panel:', error);
        // Retry after a short delay
        setTimeout(() => {
            try {
                magicPanel = new MagicPanel();
                window.magicPanel = magicPanel;
                console.log('Magic Panel initialized on retry:', magicPanel);
            } catch (retryError) {
                console.error('Magic Panel retry failed:', retryError);
            }
        }, 100);
    }
}

// Export for use in other scripts
window.MagicPanel = MagicPanel;

// Debug functions removed - no longer needed
