/*
 * Image2Sand - UI Layer for converting images to sand table coordinates
 * 
 * This script handles the user interface and calls the image2path.js library
 * for the actual image processing algorithms, and integrates voice recognition
 * and serial communication functionality.
 */

// ============================================================================
// CONSTANTS - Defined at the top for easy maintenance
// ============================================================================

// Opacity constants for fading elements
const ELEMENT_HIDDEN_OPACITY = 0.0;  // Completely transparent when hidden
const ELEMENT_SHOWN_OPACITY = 1.0;

// Fade duration constants
const FADE_IN_DURATION = 1000; // 1 second in milliseconds
const FADE_OUT_DURATION = 1000; // 1 second in milliseconds

// Note: Constants are now defined in constants.js and available globally

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

let currentContourIndex = 0;
let isFirstClick = true;
let originalImageElement = null;
let isGeneratingImage = false;
let isGeneratingCoords = false;
let orderedContoursSave = [];

// Set CSS custom properties from constants
document.documentElement.style.setProperty('--element-hidden-opacity', ELEMENT_HIDDEN_OPACITY);
document.documentElement.style.setProperty('--element-shown-opacity', ELEMENT_SHOWN_OPACITY);
document.documentElement.style.setProperty('--fade-in-duration', FADE_IN_DURATION + 'ms');
document.documentElement.style.setProperty('--fade-out-duration', FADE_OUT_DURATION + 'ms');

// Function to update first box width CSS variable and positioning
function updateFirstBoxWidth() {
    const firstBox = document.querySelector('.conversion-box:first-child');
    const lastBox = document.querySelector('.conversion-box:last-child');
    const container = document.querySelector('.conversion-sequence');
    
    console.log('updateFirstBoxWidth called');
    console.log('First box found:', !!firstBox);
    console.log('Last box found:', !!lastBox);
    console.log('Container found:', !!container);
    
    if (firstBox && lastBox && container) {
        const firstBoxStyle = window.getComputedStyle(firstBox);
        const lastBoxStyle = window.getComputedStyle(lastBox);
        const firstWidth = parseFloat(firstBoxStyle.width);
        const lastWidth = parseFloat(lastBoxStyle.width);
        
        console.log('First box width:', firstWidth);
        console.log('Last box width:', lastWidth);
        
        // Calculate positioning values
        const initialTranslateX = -firstWidth / 2;
        // For rightmost: move by distance from container center to last box center
        // Container is 90% width, so last box is at 45% from center, minus half its width
        const containerWidth = container.offsetWidth;
        const rightmostTranslateX = (containerWidth / 2) - (lastWidth / 2);
        
        console.log('Container width:', containerWidth);
        console.log('Last box width:', lastWidth);
        console.log('Initial translateX:', initialTranslateX);
        console.log('Rightmost translateX:', rightmostTranslateX);
        
        // Store values for use in animation functions
        const wasFirstCall = !container.dataset.initialTranslateX;
        container.dataset.initialTranslateX = initialTranslateX;
        container.dataset.rightmostTranslateX = rightmostTranslateX;
        
        // Set initial transform if container is in initial state or this is first call
        if (container.classList.contains('initial-state') || wasFirstCall) {
            container.style.transform = `translateX(${initialTranslateX}px)`;
            console.log('Set initial transform to:', container.style.transform);
        }
        
        // Also set the CSS variable for consistency
        container.style.setProperty('--first-box-width', firstBoxStyle.width);
        console.log('Set --first-box-width to:', firstBoxStyle.width);
    } else {
        console.log('Missing elements - firstBox:', !!firstBox, 'lastBox:', !!lastBox, 'container:', !!container);
    }
}


// Container animation functions
function setContainerToInitialState() {
    const container = document.querySelector('.conversion-sequence');
    if (container) {
        container.classList.remove('centered-state', 'rightmost-state');
        container.classList.add('initial-state');
        
        // Use stored translateX value
        const initialTranslateX = container.dataset.initialTranslateX;
        if (initialTranslateX) {
            container.style.transform = `translateX(${initialTranslateX}px)`;
        }
        
        console.log('Container set to initial state (first box centered)');
        console.log('Container classes:', container.classList.toString());
        console.log('Container computed transform:', window.getComputedStyle(container).transform);
    } else {
        console.error('Container not found!');
    }
}

function animateContainerToCentered() {
    const container = document.querySelector('.conversion-sequence');
    if (container) {
        container.classList.remove('initial-state', 'rightmost-state');
        container.classList.add('centered-state');
        
        // Set transform to center the container (translateX(-50%))
        container.style.transform = 'translateX(-50%)';
        
        console.log('Container animating to centered state (all boxes visible)');
        console.log('Container classes:', container.classList.toString());
        console.log('Container computed transform:', window.getComputedStyle(container).transform);
    } else {
        console.error('Container not found!');
    }
}

function animateContainerToRightmost() {
    const container = document.querySelector('.conversion-sequence');
    if (container) {
        container.classList.remove('initial-state', 'centered-state');
        container.classList.add('rightmost-state');
        
        // Use stored translateX value as pixel offset from center
        const rightmostOffset = container.dataset.rightmostTranslateX;
        if (rightmostOffset) {
            container.style.transform = `translateX(calc(-50% - ${rightmostOffset}px))`;
        }
        
        console.log('Container animating to rightmost state');
        console.log('Container classes:', container.classList.toString());
        console.log('Container computed transform:', window.getComputedStyle(container).transform);
    } else {
        console.error('Container not found!');
    }
}

function clearAllImageBoxes() {
    const canvases = document.querySelectorAll('.magic-conversion-canvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    console.log('All image boxes cleared');
}

function resetMagicMode() {
    console.log('=== RESET MAGIC MODE CALLED ===');
    
    // Always clear error display and indicators (if they exist)
    const errorDisplay = document.getElementById('magic-error-display');
    if (errorDisplay) {
        errorDisplay.remove();
    }
    
    // Clear error indicators
    const stages = ['listen', 'generate', 'convert', 'stream'];
    stages.forEach(stage => {
        const indicator = document.getElementById(`magic-${stage}-stage`);
        if (indicator) {
            indicator.classList.remove('error');
        }
    });
    
    // Fade out the rightmost (last) image box
    console.log('=== FADING OUT CONVERSION BOXES ===');
    console.log('This should ONLY happen on successful draw completion, not on errors');
    const lastBox = document.querySelector('.conversion-box:last-child');
    if (lastBox) {
        console.log('Fading out last conversion box:', lastBox);
        lastBox.classList.remove('fade-in');
        lastBox.style.opacity = ELEMENT_HIDDEN_OPACITY.toString();
    } else {
        console.log('No last conversion box found to fade out');
    }
    
    // Wait for fade out, then reset everything
    setTimeout(() => {
        console.log('=== CLEARING ALL IMAGE BOXES ===');
        console.log('This happens 1 second after fade out starts');
        // Clear all image boxes
        clearAllImageBoxes();
        
        // Reset all box opacities to hidden
        console.log('=== RESETTING ALL BOX OPACITIES ===');
        const allBoxes = document.querySelectorAll('.conversion-box');
        console.log('Found', allBoxes.length, 'conversion boxes to reset');
        allBoxes.forEach((box, index) => {
            box.classList.remove('fade-in');
            box.style.opacity = ELEMENT_HIDDEN_OPACITY.toString();
            console.log(`Reset box ${index + 1}:`, box);
        });
        
        // Reset container to initial state
        setContainerToInitialState();
        
        // Reset voice elements
        fadeOutVoiceElements();
        
        // Reset streaming progress bar opacity
        const streamingContainer = document.querySelector('.streaming-progress-container');
        if (streamingContainer) {
            streamingContainer.style.opacity = ELEMENT_HIDDEN_OPACITY.toString();
        }
        const progressFill = document.getElementById('streaming-progress-fill');
        const progressText = document.getElementById('streaming-progress-text');
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';
        
        // Clear the prompt input field (object name)
        console.log('=== CLEARING PROMPT INPUT FIELD ===');
        const promptInput = document.getElementById('prompt');
        if (promptInput) {
            console.log('Prompt input found, current value:', promptInput.value);
            console.log('Prompt input classes before:', promptInput.classList.toString());
            promptInput.value = '';
            promptInput.classList.remove('voice-prompt-input', 'auto-populated');
            console.log('Prompt input value after clearing:', promptInput.value);
            console.log('Prompt input classes after:', promptInput.classList.toString());
            console.log('Prompt input field cleared successfully');
        } else {
            console.log('ERROR: Prompt input field not found!');
        }
        
        // Clear the Magic Mode object highlight as well
        console.log('=== CLEARING MAGIC MODE OBJECT HIGHLIGHT ===');
        const objectHighlight = document.getElementById('magic-object-highlight');
        if (objectHighlight) {
            console.log('Magic object highlight found, current text:', objectHighlight.textContent);
            objectHighlight.textContent = '';
            objectHighlight.style.display = 'none';
            console.log('Magic object highlight cleared successfully');
        } else {
            console.log('ERROR: Magic object highlight not found!');
        }
        
        // Always start voice listening after reset (this will call launchMagicMode if needed)
        setTimeout(() => {
            console.log('=== STARTING VOICE LISTENING AFTER RESET ===');
            console.log('This happens 2 seconds after fade out starts');
            startVoiceListening();
        }, 1000);
        
    }, 1000); // Wait 1 second for fade out
    console.log('=== RESET MAGIC MODE SETUP COMPLETE ===');
}



// Voice and Serial instances
let voiceRecognition = null;
let serialCommunication = null;
let currentTab = 'introduction';
let isAutoMode = true;
let isMagicMode = false;
window.isMagicMode = false; // Make globally accessible for unified callbacks
let currentStreamingPattern = null;
let streamingProgress = { current: 0, total: 0, r: 0, theta: 0 };

// Voice recognition state management
let isStreaming = false;

// Persistent microphone state management
let isProcessingVoice = false;
let persistentMicrophoneStream = null;

// Voice button state tracking
let voiceButtonState = 'idle'; // 'idle', 'listening', 'paused'

// Voice state preservation
let voiceState = {
    detectedObject: null,
    liveTranscript: '',
    confidence: 0,
    isListening: false,
    hasDetectedObject: false
};

// Set voice processing state (enables/disables audio processing)
function setVoiceProcessingState(active) {
    isProcessingVoice = active;
    console.log('Voice processing state:', active ? 'ACTIVE' : 'PAUSED');
}

// Voice button state machine
function setVoiceButtonState(newState) {
    const voiceButton = document.getElementById('manual-voice-button');
    if (!voiceButton) return;
    
    const buttonText = voiceButton.querySelector('.button-text');
    if (!buttonText) return;
    
    // Remove all state classes
    voiceButton.classList.remove('idle', 'listening', 'paused');
    
    // Set new state
    voiceButtonState = newState;
    voiceButton.classList.add(newState);
    
    // Update button text and behavior based on state
    switch (newState) {
        case 'idle':
            buttonText.textContent = 'Ask by Voice';
            voiceButton.disabled = false;
            // Stop health check when idle
            stopVoiceRecognitionHealthCheck();
            break;
        case 'listening':
            buttonText.textContent = 'Listening...';
            voiceButton.disabled = false;
            // Start health check when actively listening
            startVoiceRecognitionHealthCheck();
            break;
        case 'paused':
            buttonText.textContent = 'Listening paused';
            voiceButton.disabled = false;
            // Keep health check running when paused (in case of timeout)
            startVoiceRecognitionHealthCheck();
            break;
    }
    
    // Update Magic Panel voice state if in Magic Mode
    if (isMagicMode && window.magicPanel && window.magicPanel.updateVoiceState) {
        window.magicPanel.updateVoiceState(newState);
    }
    
    console.log('Voice button state changed to:', newState);
}

// Tab Management
function switchToTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to selected tab button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Show/hide magic mode button based on tab
    const magicModeToggle = document.querySelector('.magic-mode-toggle');
    if (tabName === 'guided') {
        magicModeToggle.classList.add('visible');
    } else {
        magicModeToggle.classList.remove('visible');
    }
    
    currentTab = tabName;
    
    // Initialize tab-specific functionality
    if (tabName === 'magic') {
        initializeMagicMode();
    } else if (tabName === 'guided') {
        initializeGuidedMode();
    } else if (tabName === 'introduction') {
        // Hide all panels when on introduction tab
        hidePanel('patternification-panel');
        hidePanel('intended-image-panel');
        hidePanel('output-coordinates-panel');
        hidePanel('stream-panel');
    }
}


// Guided Mode Initialization
function initializeGuidedMode() {
    console.log('=== INITIALIZING GUIDED MODE ===');
    
    // Set up guided mode UI
    updateVoiceStatusIndicators('voice');
    
    // Initialize in Normal Mode by default
    switchToNormalMode();
    
    // Use smart panel visibility management instead of hiding all panels
    console.log('About to call updateGuidedModePanelVisibility()');
    updateGuidedModePanelVisibility();
    console.log('Finished calling updateGuidedModePanelVisibility()');
    
    // Set default input mode to text in guided mode
    const textModeRadio = document.getElementById('text-prompt-mode');
    const voiceModeRadio = document.getElementById('voice-prompt-mode');
    
    if (textModeRadio) textModeRadio.checked = true;
    if (voiceModeRadio) voiceModeRadio.checked = false;
    
    // Show text input and hide voice input
    document.getElementById('text-prompt-input').style.display = 'block';
    document.getElementById('voice-prompt-input').style.display = 'none';
    
    console.log('Text mode checked:', textModeRadio ? textModeRadio.checked : 'NOT FOUND');
    console.log('Voice mode checked:', voiceModeRadio ? voiceModeRadio.checked : 'NOT FOUND');
    
    // Force a visual update by triggering a change event
    if (textModeRadio) {
        textModeRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Use smart panel visibility management
    updateGuidedModePanelVisibility();
    
    // Ensure stream panel content is closed in Guided Mode
    const streamContent = document.getElementById('stream-content');
    if (streamContent) {
        streamContent.style.display = 'none';
    }
    const streamToggle = document.querySelector('.stream-toggle');
    if (streamToggle) {
        streamToggle.classList.remove('active');
    }
    
    console.log('Guided mode initialized - Text mode set as default');
}

// Mode switching within Guided Mode
function switchToNormalMode() {
    console.log('=== SWITCHING TO NORMAL MODE ===');
    // Set Magic Mode flag
    isMagicMode = false;
    window.isMagicMode = false;
    
    // Update toggle state
    const toggle = document.getElementById('magic-mode-toggle');
    if (toggle) toggle.checked = false;
    
    // Hide magic mode elements
    document.getElementById('magic-stage-indicators').classList.add('hidden');
    document.getElementById('magic-stage-indicators').style.display = 'none';
    
    // Hide magic panel and show other panels
    if (window.magicPanel) {
        window.magicPanel.hide();
        window.magicPanel.panelGrid.style.display = 'grid';
    }
    
    // Stop persistent microphone stream when leaving Magic Mode
    if (persistentMicrophoneStream) {
        console.log('Stopping persistent microphone stream');
        persistentMicrophoneStream.getTracks().forEach(track => track.stop());
        persistentMicrophoneStream = null;
    }
    
    // Reset voice processing state
    setVoiceProcessingState(false);
    
    // Update panel visibility to hide image panel when no valid image
    updateGuidedModePanelVisibility();
    
    // Update all UI state for Guided Mode
    updateAllUIState();
    
    // Don't reset input mode settings - preserve Magic Mode settings
    
    // Enable all input mode options
    document.getElementById('upload-mode').disabled = false;
    document.getElementById('generate-mode').disabled = false;
    document.getElementById('coordinates-mode').disabled = false;
    
    // Enable prompt input mode selection
    document.getElementById('text-prompt-mode').disabled = false;
    document.getElementById('voice-prompt-mode').disabled = false;
    
    // Update visual state to match the selected input mode
    const selectedInputMode = document.querySelector('input[name="input-mode"]:checked');
    console.log('Selected input mode:', selectedInputMode ? selectedInputMode.value : 'none');
    if (selectedInputMode) {
        console.log('Calling switchInputMode with:', selectedInputMode.value);
        switchInputMode(selectedInputMode.value);
    }
    
    // Update prompt mode display to match the selected prompt mode
    const selectedPromptMode = document.querySelector('input[name="prompt-input-mode"]:checked');
    console.log('Selected prompt mode:', selectedPromptMode ? selectedPromptMode.value : 'none');
    if (selectedPromptMode) {
        console.log('Calling switchPromptMode with:', selectedPromptMode.value);
        switchPromptMode(selectedPromptMode.value);
    }
    
    // Make prompt input editable
    const promptInput = document.getElementById('prompt');
    if (promptInput) {
        promptInput.readOnly = false;
    }
    
    
    // Debug: Check final panel states
    console.log('=== FINAL PANEL STATES ===');
    const panels = ['patternification-panel', 'intended-image-panel', 'output-coordinates-panel', 'stream-panel'];
    panels.forEach(panelId => {
        const panel = document.querySelector(`.${panelId}`);
        if (panel) {
            console.log(`${panelId}:`, {
                styleDisplay: panel.style.display,
                computedDisplay: getComputedStyle(panel).display,
                visible: getComputedStyle(panel).display !== 'none'
            });
        } else {
            console.log(`${panelId}: element not found`);
        }
    });
}

// Toggle Magic Mode function for the new toggle switch
function toggleMagicMode() {
    return window.Image2Sand?.errorHandler?.safeCall(() => {
        const toggle = document.getElementById(MAGIC_ELEMENT_IDS.TOGGLE);
        
        if (!toggle) {
            console.warn('Magic mode toggle not found');
            return;
        }
        
        if (toggle.checked) {
            switchToMagicMode();
        } else {
            switchToNormalMode(); // Don't clear anything when switching FROM Magic Mode
        }
    }, () => {
        console.error('Failed to toggle magic mode');
    }, 'Toggle Magic Mode');
}

function switchToMagicMode() {
    console.log('switchToMagicMode called');
    
    // Set Magic Mode flag
    isMagicMode = true;
    window.isMagicMode = true;
    console.log('isMagicMode set to:', isMagicMode);
    
    // Pause microphone when switching to Magic Mode to prevent interference
    if (window.voiceRecognition && window.voiceRecognition.isListening) {
        console.log('Pausing microphone when switching to Magic Mode');
        stopVoiceListening();
    }
    
    // Update toggle state
    const toggle = document.getElementById('magic-mode-toggle');
    if (toggle) toggle.checked = true;
    
    // Keep magic mode elements hidden (as requested)
    // document.getElementById('magic-stage-indicators').classList.remove('hidden');
    // document.getElementById('magic-stage-indicators').style.display = 'flex';
    
    // Check if Magic Panel element exists in DOM
    const magicPanelElement = document.getElementById('magic-panel');
    console.log('Magic Panel element in DOM:', magicPanelElement);
    
    // Show magic panel and hide other panels by default
    if (window.magicPanel) {
        console.log('Magic Panel found, showing...');
        window.magicPanel.show();
        // Only hide panelGrid if details are not expanded
        if (!window.magicPanel.isDetailsExpanded) {
            window.magicPanel.panelGrid.style.display = 'none';
        }
        
    } else {
        console.log('Magic Panel not found! Waiting for it to load...');
        // Wait for magic panel to be available
        const checkMagicPanel = setInterval(() => {
            if (window.magicPanel) {
                console.log('Magic Panel now available, showing...');
                window.magicPanel.show();
                // Only hide panelGrid if details are not expanded
                if (!window.magicPanel.isDetailsExpanded) {
                    window.magicPanel.panelGrid.style.display = 'none';
                }
                
                clearInterval(checkMagicPanel);
            }
        }, 100);
        
        // Stop checking after 5 seconds
        setTimeout(() => {
            clearInterval(checkMagicPanel);
            if (!window.magicPanel) {
                console.error('Magic Panel failed to load after 5 seconds');
                // Fallback: manually show the Magic Panel element
                if (magicPanelElement) {
                    console.log('Fallback: manually showing Magic Panel element');
                    magicPanelElement.style.display = 'block';
                }
            }
        }, 5000);
    }
    
    // Pre-configure Magic Mode settings - lock to Generate + Voice
    document.getElementById('generate-mode').checked = true;
    document.getElementById('voice-prompt-mode').checked = true;
    
    // Disable other input mode options
    document.getElementById('upload-mode').disabled = true;
    document.getElementById('generate-mode').disabled = true;
    document.getElementById('coordinates-mode').disabled = true;
    
    // Disable prompt input mode selection
    document.getElementById('text-prompt-mode').disabled = true;
    document.getElementById('voice-prompt-mode').disabled = true;
    
    // Show the generate input and voice prompt input
    document.getElementById('generate-input').style.display = 'block';
    document.getElementById('voice-prompt-input').style.display = 'block';
    document.getElementById('text-prompt-input').style.display = 'none';
    document.getElementById('upload-input').style.display = 'none';
    document.getElementById('coordinates-input').style.display = 'none';
    
    // Make the prompt input readonly for Magic mode
    const promptInput = document.getElementById('prompt');
    if (promptInput) {
        promptInput.readOnly = true;
    }
    
    // Show all panels for Magic Mode (including streaming panel)
    showPanel('image-panel');
    showPanel('patternification-panel');
    showPanel('intended-image-panel');
    showPanel('output-coordinates-panel');
    showPanel('stream-panel');
    
    // Open the stream panel by default in Magic Mode
    const streamContent = document.getElementById('stream-content');
    const streamToggle = document.querySelector('.stream-toggle');
    if (streamContent && streamToggle) {
        streamContent.style.display = 'block';
        streamToggle.classList.add('active');
    }
    
    // Update first box width after magic mode is initialized
    setTimeout(updateFirstBoxWidth, 100);
    
    // Initialize voice recognition for magic mode
    if (!window.voiceRecognition) {
        window.voiceRecognition = new VoiceRecognitionCore();
        window.voiceRecognition.init();
        window.voiceRecognition.setCallbacks(
            handleUnifiedVoiceResult,
            handleUnifiedVoiceError,
            handleUnifiedVoiceStatus
        );
    }
    
    // Update stage indicators
    updateMagicStatusIndicators('listen');
    
    // Update all UI state for Magic Mode
    updateAllUIState();
}

// Update all UI state based on prerequisites and current mode
function updateAllUIState() {
    const apiKey = 'not-needed'; // Using Netlify function with secure API key
    const connectBtn = document.getElementById('connect-serial');
    const voiceButton = document.getElementById('manual-voice-button');
    const warningDiv = document.getElementById('prerequisites-warning');
    const warningMessage = document.getElementById('warning-message');
    const prerequisitesConnectBtn = document.getElementById('prerequisites-connect-serial');
    
    // Check if we're in Magic Mode
    const magicModeToggle = document.getElementById('magic-mode-toggle');
    const isMagicMode = magicModeToggle && magicModeToggle.checked;
    
    let missingPrerequisites = [];
    
    // Only check API key in Magic Mode
    if (isMagicMode && !apiKey) {
        missingPrerequisites.push('provide OpenAI API key');
    }
    
    // Only check serial connection in Magic Mode
    if (isMagicMode && (!connectBtn || !connectBtn.disabled)) {
        missingPrerequisites.push('connect to serial port');
    }
    
    if (missingPrerequisites.length > 0) {
        // Show warning (only in Magic Mode)
        if (warningDiv && isMagicMode) {
            warningDiv.style.display = 'block';
            if (warningMessage) {
                // Create dynamic warning message with clickable link for API key
                let messageText = `Please `;
                const needsApiKey = missingPrerequisites.includes('provide OpenAI API key');
                const needsSerial = missingPrerequisites.includes('connect to serial port');
                
                if (needsApiKey) {
                    messageText += `<a href="#" id="api-key-link">click here to add your OpenAI API key</a>`;
                    if (needsSerial) {
                        messageText += ` and connect to serial port`;
                    }
                } else if (needsSerial) {
                    messageText += `connect to serial port`;
                }
                
                messageText += ` before launching Magic Mode.`;
                
                warningMessage.innerHTML = messageText;
                
                // Add click handler for API key link
                const apiKeyLink = document.getElementById('api-key-link');
                if (apiKeyLink) {
                    apiKeyLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Switch to Guided Mode and open Generate tab
                        switchToNormalMode();
                        // Switch to generate mode
                        document.getElementById('generate-mode').checked = true;
                        // Show generate input
                        document.getElementById('generate-input').style.display = 'block';
                        document.getElementById('upload-input').style.display = 'none';
                        document.getElementById('coordinates-input').style.display = 'none';
                        // Focus on API key input
                        const apiKeyInput = document.getElementById('api-key');
                        if (apiKeyInput) {
                            apiKeyInput.focus();
                        }
                    });
                }
            }
            
            // Show/hide prerequisites connect button based on serial connection status
            if (prerequisitesConnectBtn) {
                const isSerialConnected = connectBtn && connectBtn.disabled;
                if (isSerialConnected) {
                    // Serial is connected, hide the button
                    prerequisitesConnectBtn.style.display = 'none';
                } else {
                    // Serial is not connected, show the button
                    prerequisitesConnectBtn.style.display = 'block';
                }
            }
        } else if (warningDiv) {
            // Hide warning in Guided Mode
            warningDiv.style.display = 'none';
        }
        
        if (voiceButton) {
            // In Magic Mode, keep button enabled but show warning tooltip
            // In Guided Mode, disable button if API key missing
            if (isMagicMode) {
                voiceButton.disabled = false;
                voiceButton.style.opacity = '1';
                voiceButton.style.cursor = 'pointer';
                
                // Set tooltip explaining prerequisites but keep button enabled
                const tooltipText = `Note: Please ${missingPrerequisites.join(' and ')} before using voice recognition.`;
                voiceButton.title = tooltipText;
            } else {
                // In Guided Mode, only disable if API key is missing (but we already check this above)
                const isListening = voiceButton.classList.contains('listening');
                if (!isListening) {
                    voiceButton.disabled = true;
                    voiceButton.style.opacity = '0.5';
                    voiceButton.style.cursor = 'not-allowed';
                    
                    const tooltipText = `Disabled: Please ${missingPrerequisites.join(' and ')} before using voice recognition.`;
                    voiceButton.title = tooltipText;
                }
            }
        }
    } else {
        // Hide warning and enable voice button
        if (warningDiv) {
            warningDiv.style.display = 'none';
        }
        
        if (voiceButton) {
            voiceButton.disabled = false;
            voiceButton.style.opacity = '1';
            voiceButton.style.cursor = 'pointer';
            
            // Clear tooltip when enabled
            voiceButton.title = '';
        }
    }
}

// API Error Display Functions
function showApiError(errorMessage) {
    const errorDiv = document.getElementById('api-error-warning');
    const errorMessageSpan = document.getElementById('api-error-message');
    
    if (errorDiv && errorMessageSpan) {
        // Format the error message for better readability
        let displayMessage = errorMessage;
        if (errorMessage.includes('API Error (429)') || errorMessage.includes('billing')) {
            displayMessage = 'API billing limit reached. Please check your OpenAI account or try again later.';
        } else if (errorMessage.includes('API Error (401)')) {
            displayMessage = 'Invalid API key. Please check your OpenAI API key.';
        } else if (errorMessage.includes('API Error (400)')) {
            displayMessage = 'Invalid request. Please try a different prompt.';
        } else if (errorMessage.includes('API Error (500)')) {
            displayMessage = 'Server error. Please try again later.';
        }
        
        errorMessageSpan.textContent = displayMessage;
        errorDiv.style.display = 'block';
    }
}

function hideApiError() {
    const errorDiv = document.getElementById('api-error-warning');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Update voice recognition UI based on streaming state
function updateVoiceRecognitionUI(state) {
    const voiceButton = document.getElementById('manual-voice-button');
    const buttonText = voiceButton?.querySelector('.button-text');
    const speechDot = document.getElementById('manual-speech-dot');
    const speechStatus = document.getElementById('manual-speech-status');
    
    if (state === 'paused') {
        // Show paused state during streaming
        if (buttonText) buttonText.textContent = 'Paused - Drawing...';
        if (voiceButton) {
            voiceButton.disabled = true;
            voiceButton.style.opacity = '0.6';
            voiceButton.style.cursor = 'not-allowed';
        }
        if (speechDot) {
            speechDot.className = 'status-dot';
            speechDot.classList.add('paused');
        }
        if (speechStatus) speechStatus.textContent = 'Paused - Drawing in progress';
    } else if (state === 'active') {
        // Show active state when ready for voice input
        if (buttonText) buttonText.textContent = 'Ask by Voice';
        if (voiceButton) {
            voiceButton.disabled = false;
            voiceButton.style.opacity = '1';
            voiceButton.style.cursor = 'pointer';
        }
        if (speechDot) {
            speechDot.className = 'status-dot';
        }
        if (speechStatus) speechStatus.textContent = 'Not listening';
    }
}


// Voice Recognition UI Functions
function handleVoiceResult(result) {
    const liveTranscript = document.getElementById('live-transcript');
    const confidenceFill = document.getElementById('confidence-fill');
    const confidenceText = document.getElementById('confidence-text');
    const detectedObject = document.getElementById('detected-object');
    
    // Update transcript display
    const displayText = result.interim || result.final || 'Listening...';
    if (liveTranscript) liveTranscript.textContent = displayText;
    
    // Save state
    voiceState.liveTranscript = displayText;
    
    // Update confidence visualization
    const confidencePercent = Math.round(result.confidence * 100);
    if (confidenceFill) confidenceFill.style.width = `${confidencePercent}%`;
    if (confidenceText) confidenceText.textContent = `${confidencePercent}%`;
    
    // Save state
    voiceState.confidence = confidencePercent;
    
    // Handle object detection
    if (result.objectName) {
        console.log('Object detected:', result.objectName);
        if (detectedObject) detectedObject.textContent = result.objectName;
        
        // Save state
        voiceState.detectedObject = result.objectName;
        voiceState.hasDetectedObject = true;
        
        updateVoiceStatusIndicators('ai');
        
        // Show input panel and auto-populate prompt in voice mode
        if (currentTab === 'voice2sand') {
            console.log('Showing input panel for voice mode');
            showVoicePanel('input-panel');
            
            const voicePrompt = document.getElementById('voice-prompt');
            const voiceGenButton = document.getElementById('voice-gen-image-button');
            
            if (voicePrompt) {
                voicePrompt.value = result.objectName;
                console.log('Set voice prompt to:', result.objectName);
            }
            if (voiceGenButton) {
                voiceGenButton.disabled = false;
                console.log('Enabled voice gen button');
            }
        }
        
        // If in auto mode, proceed automatically
        if (isAutoMode && currentTab === 'voice2sand') {
            console.log('Auto mode - proceeding to generate image');
            setTimeout(() => {
                generateVoiceImage();
            }, 1000);
        }
    }
}

function handleVoiceError(error) {
    console.error('Voice recognition error:', error);
    updateVoiceStatusIndicators('voice');
}

function handleVoiceStatus(status, message) {
    const speechDot = document.getElementById('speech-dot');
    const speechStatus = document.getElementById('speech-status');
    
    if (speechStatus) speechStatus.textContent = message;
    
    // Save state
    voiceState.isListening = (status === 'listening');
    
    // Update status dot
    if (speechDot) {
        speechDot.className = 'status-dot';
        if (status === 'listening') {
            speechDot.classList.add('listening');
        } else if (status === 'processing') {
            speechDot.classList.add('processing');
        } else if (status === 'error') {
            speechDot.classList.add('error');
        }
    }
}

function updateVoiceStatusIndicators(activeStatus) {
    const statuses = ['voice', 'ai', 'stream'];
    statuses.forEach(status => {
        const indicator = document.getElementById(`${status}-stage`);
        if (indicator) {
            // Remove all status classes
            indicator.classList.remove('active', 'completed');
            
            if (status === activeStatus) {
                indicator.classList.add('active');
            } else {
                // Mark previous stages as completed
                const currentIndex = statuses.indexOf(activeStatus);
                const stageIndex = statuses.indexOf(status);
                if (stageIndex < currentIndex) {
                    indicator.classList.add('completed');
                }
            }
        }
    });
}

// Unified Voice Result Handler
function handleVoiceResult(result, isMagicMode = false) {
    // Ignore voice results when processing is paused
    if (!isProcessingVoice) {
        console.log('Voice processing paused - ignoring audio input');
        return;
    }
    
    const liveTranscript = document.getElementById('manual-live-transcript');
    const confidenceFill = document.getElementById('manual-confidence-fill');
    const confidenceText = document.getElementById('manual-confidence-text');
    const promptInput = document.getElementById('prompt');
    
    // Update transcript display
    const displayText = result.interim || result.final || 'Listening...';
    if (liveTranscript) liveTranscript.textContent = displayText;
    
    // Mirror to Magic Panel if in Magic Mode
    if (isMagicMode) {
        console.log('Magic Mode detected, mirroring voice to Magic Panel');
        mirrorVoiceRecoToMagic(displayText, result);
    } else {
        console.log('Not in Magic Mode, skipping Magic Panel update');
    }
    
    // Update confidence visualization
    const confidencePercent = Math.round(result.confidence * 100);
    if (confidenceFill) confidenceFill.style.width = `${confidencePercent}%`;
    if (confidenceText) confidenceText.textContent = `${confidencePercent}%`;
    
    // Handle object detection - populate the prompt input directly
    if (result.objectName) {
        console.log(`${isMagicMode ? 'Magic' : 'Manual'} voice - Object detected:`, result.objectName);
        
        // If currently streaming, ignore the command
        if (isStreaming) {
            console.log('Currently streaming - ignoring voice command:', result.objectName);
            return;
        }
        
        // Update status to show success
        const speechDot = document.getElementById('manual-speech-dot');
        const speechStatus = document.getElementById('manual-speech-status');
        if (speechDot) {
            speechDot.className = 'status-dot';
            speechDot.classList.add('success');
        }
        if (speechStatus) {
            speechStatus.textContent = 'Object detected!';
        }
        
        // Populate the single prompt input with visual feedback
        if (promptInput) {
            promptInput.value = result.objectName;
            promptInput.classList.add('voice-prompt-input');
            
            // Add animation class for visual feedback
            promptInput.classList.add('auto-populated');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                promptInput.classList.remove('auto-populated');
            }, 500);
            
            // Focus the input to show it's been populated
            promptInput.focus();
            
            // Manually mirror to Magic Panel since input event won't fire for programmatic changes
            if (isMagicMode) {
                mirrorPromptToMagic(result.objectName);
            }
            
            console.log(`Auto-populated ${isMagicMode ? 'magic' : ''} prompt input with:`, result.objectName);
        }
        
        // Unified behavior: Pause microphone after object detection in both modes
        stopVoiceListening();
        console.log('Microphone paused after object detection - will auto-resume for continued listening');
        
        // Auto-resume listening after a short delay to allow for continued voice commands
        // Only auto-resume in Normal Mode - Magic Mode users can manually resume if needed
        if (!isMagicMode) {
            setTimeout(() => {
                autoResumeVoiceAfterObjectDetection();
            }, 2000); // 2 second delay to allow user to see the detected object
        } else {
            console.log('Magic Mode - auto-resume disabled, user can manually resume if needed');
        }
        
        // Magic Mode: Auto-advance to next steps
        if (isMagicMode) {
            console.log('Magic Mode detected, proceeding with image generation');
            const apiKey = 'not-needed'; // Placeholder for compatibility
            console.log('Using Netlify function for secure API key');
            
            // Auto-advance to next step - generate image
            console.log('Updating status indicators to generate');
            updateMagicStatusIndicators('generate');
            setTimeout(async () => {
                console.log('Starting image generation timeout');
                // Show image panel
                showPanel('image-panel');
                
                // Fade in first conversion box and start shimmer before image generation
                if (isMagicMode) {
                    const firstConversionBox = document.querySelector('.conversion-box:first-child');
                    if (firstConversionBox) {
                        firstConversionBox.classList.add('fade-in');
                        firstConversionBox.style.opacity = ELEMENT_SHOWN_OPACITY.toString();
                        firstConversionBox.style.animation = 'silverShimmer 2s ease-in-out infinite';
                        console.log('First conversion box faded in and shimmer started before image generation');
                        
                    }
                }
                
                // Generate image
                console.log('Calling generateImage with:', { apiKey: !!apiKey, prompt: promptInput.value });
                await generateImage(apiKey, promptInput.value, false);
                console.log('generateImage completed');
                
                // Auto-advance to patternification
                setTimeout(() => {
                    updateMagicStatusIndicators('convert');
                    convertImage();
                    
                    // Auto-advance to streaming after patternification
                    setTimeout(() => {
                        updateMagicStatusIndicators('stream');
                        
                        // Auto-start streaming if serial is connected
                        const connectBtn = document.getElementById('connect-serial');
                        const startBtn = document.getElementById('start-streaming');
                        
                        if (connectBtn && connectBtn.disabled && startBtn && !startBtn.disabled) {
                            // Serial is connected, auto-start streaming
                            startStreaming();
                        } else {
                            // Serial not connected - show error and reset
                            console.log('Magic Mode: Serial port not connected');
                            handleMagicModeError(
                                new Error('Serial port not connected'), 
                                'stream', 
                                'Serial port not connected. Please connect to your device and try again.'
                            );
                        }
                    }, 2000);
                }, 1000);
            }, 1000);
        }
    }
}

// Unified Voice Recognition Handlers (work for both Magic and Normal modes)
function handleUnifiedVoiceResult(result) {
    console.log('Voice result received:', result);
    handleVoiceResult(result, window.isMagicMode || false);
}

function handleUnifiedVoiceError(error) {
    console.error('Voice recognition error:', error);
    handleVoiceError(error, window.isMagicMode || false);
}

function handleUnifiedVoiceStatus(status, message) {
    handleVoiceStatus(status, message, window.isMagicMode || false);
}

// Unified Voice Error Handler
function handleVoiceError(error, isMagicMode = false) {
    console.error(`${isMagicMode ? 'Magic' : 'Manual'} voice recognition error:`, error);
    if (isMagicMode) {
        updateMagicStatusIndicators('voice');
    }
}

// Unified Voice Status Handler
function handleVoiceStatus(status, message, isMagicMode = false) {
    const speechDot = document.getElementById('manual-speech-dot');
    const speechStatus = document.getElementById('manual-speech-status');
    
    if (speechStatus) speechStatus.textContent = message;
    
    // Update status dot
    if (speechDot) {
        speechDot.className = 'status-dot';
        if (status === 'listening') {
            speechDot.classList.add('listening');
        } else if (status === 'processing') {
            speechDot.classList.add('processing');
        } else if (status === 'error') {
            speechDot.classList.add('error');
        }
    }
}

function updateMagicStatusIndicators(activeStatus) {
    const statuses = ['listen', 'generate', 'convert', 'stream'];
    statuses.forEach(status => {
        const indicator = document.getElementById(`magic-${status}-stage`);
        if (indicator) {
            // Remove all status classes
            indicator.classList.remove('active', 'completed', 'error');
            
            if (status === activeStatus) {
                indicator.classList.add('active');
            } else {
                // Mark previous stages as completed
                const currentIndex = statuses.indexOf(activeStatus);
                const stageIndex = statuses.indexOf(status);
                if (stageIndex < currentIndex) {
                    indicator.classList.add('completed');
                }
            }
        }
    });
}

// Magic Mode Error Handling and Reset Functions
function handleMagicModeError(error, stage, errorMessage) {
    console.error(`Magic Mode ${stage} error:`, error);
    
    // Stop microphone and voice processing
    stopMicrophoneOnError();
    
    // Step 3: Show error message with RESET button
    showMagicModeError(errorMessage);
    
    // Step 4: Mark the failed stage as error
    const indicator = document.getElementById(`magic-${stage}-stage`);
    if (indicator) {
        indicator.classList.add('error');
    }
}

function stopMicrophoneOnError() {
    console.log('Stopping microphone due to error...');
    
    // Stop voice processing and reset to idle for proper error recovery
    setVoiceProcessingState(false);
    setVoiceButtonState('idle');
    
    // Stop FFT visualizer
    try {
        stopMagicFFT();
    } catch (error) {
        console.warn('Failed to stop FFT visualizer:', error);
    }
    
    // Clear any ongoing processes
    isGeneratingImage = false;
    isStreaming = false;
    
    console.log('Microphone stopped due to error - state set to idle for recovery');
}


function showMagicModeError(message) {
    // Create or update error message display
    let errorDisplay = document.getElementById('magic-error-display');
    if (!errorDisplay) {
        errorDisplay = document.createElement('div');
        errorDisplay.id = 'magic-error-display';
        errorDisplay.className = 'magic-error-warning';
        errorDisplay.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #f8d7da;
            color: #721c24;
            padding: 20px;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            z-index: 10000;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        document.body.appendChild(errorDisplay);
    }
    
    errorDisplay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">⚠️</span>
                <div>
                    <strong style="font-size: 18px;">Magic Mode Error</strong><br>
                    <span style="font-size: 14px;">${message}</span>
                </div>
            </div>
            <button onclick="resetMagicMode()" 
                    style="background-color: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px;">
                Reset
            </button>
        </div>
    `;
    
    // Don't auto-hide - let user decide when to reset
}


// Voice Control Functions


// Clear voice state (useful for starting fresh)
function clearVoiceState() {
    voiceState = {
        detectedObject: null,
        liveTranscript: '',
        confidence: 0,
        isListening: false,
        hasDetectedObject: false
    };
    console.log('Voice state cleared');
}

// Mirror prompt input text to Magic Panel
function mirrorPromptToMagic(promptText) {
    if (!isMagicMode) return;
    
    console.log('Mirroring prompt text to Magic Panel:', promptText);
    
    const objectHighlight = document.getElementById('magic-object-highlight');
    if (objectHighlight) {
        if (promptText.trim()) {
            objectHighlight.textContent = promptText.trim();
            objectHighlight.style.display = 'block';
            console.log('Updated Magic Panel object highlight with prompt text:', promptText.trim());
        } else {
            objectHighlight.textContent = '';
            objectHighlight.style.display = 'none'; // Hide when no content
            console.log('Reset Magic Panel object highlight to blank and hidden');
        }
    } else {
        console.log('Magic Panel object highlight element not found');
    }
}

// Mirror voice recognition to Magic Panel
function mirrorVoiceRecoToMagic(transcript, result) {
    if (!isMagicMode) return;
    
    console.log('Mirroring voice to Magic Panel:', transcript);
    
    // Update Magic Panel transcription
    const magicTranscript = document.getElementById('magic-transcription');
    if (magicTranscript) {
        magicTranscript.textContent = transcript;
        console.log('Updated Magic Panel transcription');
    } else {
        console.log('Magic Panel transcription element not found');
    }
    
    // Check for "draw" command and highlight object
    const drawMatch = transcript.toLowerCase().match(/draw\s+(.+)/);
    if (drawMatch) {
        const objectHighlight = document.getElementById('magic-object-highlight');
        const mainObjectDisplay = document.getElementById('manual-detected-object');
        
        if (objectHighlight && mainObjectDisplay) {
            // Use the new mirroring function to keep everything in sync
            mirrorPromptToMagic(mainObjectDisplay.textContent);
            
            // Fade in object highlight, voice elements will fade out after delay
            fadeInObjectHighlight();
            
            // Fade out voice elements after object highlight appears
            setTimeout(() => {
                fadeOutVoiceElements();
            }, 500); // Small delay to let object highlight appear first
        }
    }
    
    // Clear any existing timeout
    clearTimeout(window.voiceFadeTimeout);
}

// Fade in voice elements when mic is enabled
function fadeOutGoButton() {
    console.log('=== FADE OUT GO BUTTON CALLED ===');
    
    const goButton = document.getElementById('magic-go-button');
    if (goButton) {
        console.log('GO Button before:', goButton.style.opacity, 'classList:', goButton.classList.toString());
        goButton.classList.remove('fade-in');
        goButton.style.opacity = ELEMENT_HIDDEN_OPACITY.toString();
        goButton.disabled = true; // Disable the button when faded out
        console.log('GO Button after:', goButton.style.opacity, 'classList:', goButton.classList.toString(), 'disabled:', goButton.disabled);
        console.log('GO Button faded out and disabled');
    } else {
        console.log('GO Button not found!');
    }
    
    console.log('=== GO BUTTON FADE OUT COMPLETE ===');
}

function fadeInVoiceElements() {
    console.log('=== FADE IN VOICE ELEMENTS CALLED ===');
    
    // Fade out the GO button when voice elements fade in
    fadeOutGoButton();
    
    // Control the parent voice-input-container opacity instead of individual elements
    const voiceInputContainer = document.querySelector('.voice-input-container');
    const fftCanvas = document.getElementById('magic-fft-canvas');
    const transcription = document.getElementById('magic-transcription');
    
    console.log('Voice input container found:', !!voiceInputContainer);
    
    if (voiceInputContainer) {
        console.log('Voice input container before:', voiceInputContainer.style.opacity, 'classList:', voiceInputContainer.classList.toString());
        voiceInputContainer.classList.add('fade-in');
        console.log('Voice input container after:', voiceInputContainer.style.opacity, 'classList:', voiceInputContainer.classList.toString());
        console.log('Voice input container faded in');
    } else {
        console.log('Voice input container not found!');
    }
    
    // Update titles for debugging
    if (fftCanvas) {
        fftCanvas.title = `FFT Canvas - Opacity: ${ELEMENT_SHOWN_OPACITY}`;
    }
    
    if (transcription) {
        transcription.title = `Transcription - Opacity: ${ELEMENT_SHOWN_OPACITY}`;
    }
    
    console.log('=== VOICE ELEMENTS FADE IN COMPLETE ===');
}

// Fade out voice elements (except object highlight)
function fadeOutVoiceElements() {
    console.log('=== FADE OUT VOICE ELEMENTS CALLED ===');
    
    // Control the parent voice-input-container opacity instead of individual elements
    const voiceInputContainer = document.querySelector('.voice-input-container');
    const fftCanvas = document.getElementById('magic-fft-canvas');
    const transcription = document.getElementById('magic-transcription');
    
    if (voiceInputContainer) {
        console.log('Voice input container before fade out:', voiceInputContainer.style.opacity, 'classList:', voiceInputContainer.classList.toString());
        voiceInputContainer.classList.remove('fade-in');
        console.log('Voice input container after fade out:', voiceInputContainer.style.opacity, 'classList:', voiceInputContainer.classList.toString());
        console.log('Voice input container faded out');
    }
    
    // Update titles for debugging
    if (fftCanvas) {
        fftCanvas.title = `FFT Canvas - Opacity: ${ELEMENT_HIDDEN_OPACITY}`;
    }
    
    if (transcription) {
        transcription.title = `Transcription - Opacity: ${ELEMENT_HIDDEN_OPACITY}`;
    }
    
    console.log('=== VOICE ELEMENTS FADE OUT COMPLETE ===');
}

// Fade in object highlight only (never fades out)
function fadeInObjectHighlight() {
    const objectHighlight = document.getElementById('magic-object-highlight');
    if (objectHighlight) {
        // Only fade in if there's actual content
        if (objectHighlight.textContent.trim()) {
            objectHighlight.classList.add('fade-in');
            objectHighlight.title = `Object Highlight - Opacity: ${ELEMENT_SHOWN_OPACITY}`;
            console.log('Object highlight faded in permanently');
        } else {
            console.log('Object highlight not faded in - no content');
        }
    }
}

// Fade in streaming progress indicator
function fadeInStreamingText() {
    const streamingContainer = document.querySelector('.streaming-progress-container');
    if (streamingContainer) {
        streamingContainer.classList.add('active');
        // Remove inline style setting - let CSS custom properties handle opacity
        console.log('Streaming progress indicator faded in');
    }
}

// Update streaming progress
function updateStreamingProgress(current, total) {
    const progressFill = document.getElementById('streaming-progress-fill');
    const progressText = document.getElementById('streaming-progress-text');
    
    if (progressFill && progressText) {
        const percentage = Math.round((current / total) * 100);
        progressFill.style.width = percentage + '%';
        progressText.textContent = `${percentage}%`;
        console.log(`Streaming progress: ${current}/${total} (${percentage}%)`);
    }
}

// Unified function to launch Magic Mode (microphone + FFT + fade-in + positioning)
function launchMagicMode() {
    console.log('=== LAUNCHING MAGIC MODE ===');
    
    // Move image locations to their start positions
    try {
        updateFirstBoxWidth();
        console.log('Image positions reset to start positions');
    } catch (error) {
        console.warn('Failed to reset image positions:', error);
    }
    
    // Hide all conversion elements at start (set to hidden opacity)
    try {
        const allBoxes = document.querySelectorAll('.conversion-box');
        const allArrows = document.querySelectorAll('.conversion-arrow');
        
        allBoxes.forEach(box => {
            box.classList.remove('fade-in');
            box.style.opacity = ELEMENT_HIDDEN_OPACITY.toString();
        });
        
        allArrows.forEach(arrow => {
            arrow.classList.remove('fade-in');
            arrow.style.opacity = ELEMENT_HIDDEN_OPACITY.toString();
        });
        
        console.log('All conversion elements hidden at start');
    } catch (error) {
        console.warn('Failed to hide conversion elements:', error);
    }
    
    // Start FFT visualization for Magic Mode
    handleFFTForMode('start');
    
    // Fade in voice elements (FFT and transcription) and hide GO button
        fadeInVoiceElements();
    console.log('Magic Mode voice elements faded in - GO button hidden, voice panel visible');
    
    console.log('Magic Mode setup complete - UI elements positioned, FFT started, and voice panel visible');
}

// Start real FFT when voice recognition begins
function startMagicFFT() {
    return window.Image2Sand?.errorHandler?.safeMagicCall(() => {
        if (isMagicMode && window.magicPanel) {
            console.log('Starting real FFT for Magic Panel');
            window.magicPanel.startRealFFT();
        }
    }, () => {
        console.warn('Magic FFT not available');
    }, 'Start Magic FFT');
}

// Stop FFT when voice recognition ends
function stopMagicFFT() {
    return window.Image2Sand?.errorHandler?.safeMagicCall(() => {
        if (isMagicMode && window.magicPanel) {
            console.log('Stopping FFT for Magic Panel');
            window.magicPanel.stopFFT();
        }
    }, () => {
        console.warn('Magic FFT not available');
    }, 'Stop Magic FFT');
}

// Pause FFT when voice processing is paused (keeps microphone alive)
function pauseMagicFFT() {
    return window.Image2Sand?.errorHandler?.safeMagicCall(() => {
        if (isMagicMode && window.magicPanel) {
            console.log('Pausing FFT for Magic Panel');
            window.magicPanel.pauseFFT();
        }
    }, () => {
        console.warn('Magic FFT not available');
    }, 'Pause Magic FFT');
}

// Check if voice recognition is properly initialized and working
function isVoiceRecognitionInitialized() {
    return window.voiceRecognition && 
           window.voiceRecognition.recognition && 
           typeof window.voiceRecognition.start === 'function';
}

// Check if FFT is properly initialized and working
function isFFTInitialized() {
    return window.magicPanel && 
           window.magicPanel.audioContext && 
           window.magicPanel.analyser && 
           window.magicPanel.microphone &&
           window.magicPanel.audioContext.state !== 'closed';
}

// Ensure voice recognition is initialized and working
function ensureVoiceRecognitionInitialized() {
    if (!isVoiceRecognitionInitialized()) {
        console.log('Voice recognition not properly initialized, reinitializing...');
        if (window.voiceRecognition) {
            // Clean up existing instance
            try {
                window.voiceRecognition.stop();
            } catch (e) {
                // Ignore errors when stopping
            }
        }
        
        // Create new instance
        window.voiceRecognition = new VoiceRecognitionCore();
        window.voiceRecognition.init();
        window.voiceRecognition.setCallbacks(
            handleUnifiedVoiceResult,
            handleUnifiedVoiceError,
            handleUnifiedVoiceStatus
        );
        console.log('Voice recognition reinitialized');
        return true;
    }
    return false;
}

// Ensure FFT is initialized and working
function ensureFFTInitialized() {
    if (!isFFTInitialized()) {
        console.log('FFT not properly initialized, reinitializing...');
        startMagicFFT();
        return true;
    }
    return false;
}

// Wait for Magic Panel to be available
function waitForMagicPanel(callback, timeout = 5000) {
    const startTime = Date.now();
    
    function checkMagicPanel() {
        if (window.magicPanel) {
            callback();
        } else if (Date.now() - startTime < timeout) {
            setTimeout(checkMagicPanel, 100);
        } else {
            console.warn('Magic Panel not available after timeout');
        }
    }
    
    checkMagicPanel();
}

// Mirror image to Magic Panel
function mirrorImageToMagic(imageElement) {
    return window.Image2Sand?.errorHandler?.safeMagicCall(() => {
        if (!isMagicMode || !window.magicPanel) return;
        
        console.log('Mirroring image to Magic Panel:', imageElement);
    
    // Mirror the source image to the first conversion box
    const originalCanvas = document.getElementById('magic-original-canvas');
    const firstConversionBox = document.querySelector('.conversion-box:first-child');
    if (originalCanvas) {
        const ctx = originalCanvas.getContext('2d');
        originalCanvas.width = 200;
        originalCanvas.height = 200;
        ctx.drawImage(imageElement, 0, 0, 200, 200);
        console.log('Source image mirrored to Magic Panel first conversion box');
        
        // Stop the shimmer effect on the first conversion box
        if (firstConversionBox) {
            firstConversionBox.style.animation = 'none';
            console.log('Stopped shimmer effect on first conversion box');
        }
        
        // Animate container to centered (all boxes visible) immediately after image is added
        animateContainerToCentered();
    }
    
    console.log('Source image ready for conversion mirroring');
    }, () => {
        console.warn('Failed to mirror image to Magic Panel');
    }, 'Mirror Image to Magic');
}

// Start fade-out timer for first 3 conversion boxes
function startFadeOutTimerForFirstThreeBoxes() {
    console.log('Starting 10-second fade-out timer for first 3 conversion boxes');
    
    const conversionBoxes = document.querySelectorAll('.conversion-box');
    conversionBoxes.forEach((box, index) => {
        // Only fade out the first 3 boxes (index 0, 1, 2), keep the last one (index 3) visible
        if (index < conversionBoxes.length - 1) {
            setTimeout(() => {
                box.classList.remove('fade-in');
                box.style.opacity = ELEMENT_HIDDEN_OPACITY.toString();
                console.log(`Conversion box ${index + 1} faded out after 10 seconds`);
            }, window.UI_CONSTANTS.ANIMATION.FADE_DELAY); // 10 seconds from when the rightmost box is rendered
        }
    });
}

// Mirror conversion images to Magic Panel
function mirrorConversionImagesToMagic(originalImage, edgeImage, orderedPoints, processedContours, penUpEnabled) {
    return window.Image2Sand?.errorHandler?.safeMagicCall(() => {
        if (!isMagicMode || !window.magicPanel) return;
        
        console.log('Mirroring conversion images to Magic Panel');
    
    // Note: Original image is already mirrored in mirrorImageToMagic
    
    // Mirror edge image by copying from the main panel's edge canvas and inverting it
    const edgesCanvas = document.getElementById('magic-edges-canvas');
    const mainEdgeCanvas = document.getElementById('edge-image');
    if (edgesCanvas && mainEdgeCanvas) {
        const ctx = edgesCanvas.getContext('2d');
        edgesCanvas.width = 200;
        edgesCanvas.height = 200;
        
        // Draw the original image
        ctx.drawImage(mainEdgeCanvas, 0, 0, 200, 200);
        
        // Invert the colors
        const imageData = ctx.getImageData(0, 0, 200, 200);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];     // Red
            data[i + 1] = 255 - data[i + 1]; // Green
            data[i + 2] = 255 - data[i + 2]; // Blue
            // Alpha stays the same
        }
        ctx.putImageData(imageData, 0, 0);
        
        console.log('Edge image mirrored and inverted to Magic Panel');
    } else {
        console.log('Edge canvas or main edge canvas not found');
    }
    
    // Mirror dots image by copying from the main panel's dots canvas and inverting it
    const dotsCanvas = document.getElementById('magic-dots-canvas');
    const mainDotsCanvas = document.getElementById('dot-image');
    if (dotsCanvas && mainDotsCanvas) {
        const ctx = dotsCanvas.getContext('2d');
        dotsCanvas.width = 200;
        dotsCanvas.height = 200;
        
        // Draw the original image
        ctx.drawImage(mainDotsCanvas, 0, 0, 200, 200);
        
        // Invert the colors
        const imageData = ctx.getImageData(0, 0, 200, 200);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];     // Red
            data[i + 1] = 255 - data[i + 1]; // Green
            data[i + 2] = 255 - data[i + 2]; // Blue
            // Alpha stays the same
        }
        ctx.putImageData(imageData, 0, 0);
        
        console.log('Dots image mirrored and inverted to Magic Panel');
    } else {
        console.log('Dots canvas or main dots canvas not found');
    }
    
    // Mirror pattern preview by copying from the main panel's pattern canvas and changing to grey
    const patternCanvas = document.getElementById('magic-pattern-canvas');
    const mainPatternCanvas = document.getElementById('connect-image');
    if (patternCanvas && mainPatternCanvas) {
        const ctx = patternCanvas.getContext('2d');
        patternCanvas.width = 350;
        patternCanvas.height = 350;
        
        // Clear the canvas first
        ctx.clearRect(0, 0, 350, 350);
        
        // Calculate the source and destination dimensions to maintain square aspect ratio
        const sourceWidth = mainPatternCanvas.width;
        const sourceHeight = mainPatternCanvas.height;
        const destSize = 350;
        
        // Calculate the center position for square rendering
        const sourceSize = Math.min(sourceWidth, sourceHeight);
        const sourceX = (sourceWidth - sourceSize) / 2;
        const sourceY = (sourceHeight - sourceSize) / 2;
        
        // Draw the original pattern with square aspect ratio
        ctx.drawImage(mainPatternCanvas, 
            sourceX, sourceY, sourceSize, sourceSize,
            0, 0, destSize, destSize
        );
        
        // Change black lines to grey
        const imageData = ctx.getImageData(0, 0, 350, 350);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // If it's a black pixel (or very dark), change to grey
            if (data[i] < 50 && data[i + 1] < 50 && data[i + 2] < 50) {
                data[i] = 128;     // Red
                data[i + 1] = 128; // Green
                data[i + 2] = 128; // Blue
            }
        }
        ctx.putImageData(imageData, 0, 0);
        
         console.log('Pattern preview mirrored and converted to grey in Magic Panel with square aspect ratio');
         
         // Initialize streaming variables for this pattern
         window.lastMagicStreamingPoint = null;
         window.magicPatternCtx = ctx;
         window.magicPatternCanvas = patternCanvas;
         
         // Start 10-second timer to fade out the first 3 boxes now that the rightmost box is rendered
         startFadeOutTimerForFirstThreeBoxes();
    } else {
        console.log('Pattern canvas or main pattern canvas not found');
    }
    
    // Fade in conversion boxes with individual timers
    const conversionBoxes = document.querySelectorAll('.conversion-box');
    console.log('Found', conversionBoxes.length, 'conversion boxes');
    conversionBoxes.forEach((box, index) => {
        console.log(`Box ${index + 1}:`, box);
        
        // First box is already visible, others fade in with stagger
        if (index === 0) {
            console.log(`Conversion box ${index + 1} already visible`);
        } else {
            setTimeout(() => {
                box.classList.add('fade-in');
                box.style.opacity = ELEMENT_SHOWN_OPACITY.toString();
                console.log(`Conversion box ${index + 1} faded in`);
            }, index * 500); // Stagger the fade-in with 0.5 second delay between each box
        }
        
    });
    
    // Animate container to center the rightmost box (pattern) after all images are rendered
    setTimeout(() => {
        animateContainerToRightmost();
    }, 2000); // Wait for all boxes to fade in (4 boxes * 500ms = 2 seconds)
    }, () => {
        console.warn('Failed to mirror conversion images to Magic Panel');
    }, 'Mirror Conversion Images to Magic');
}

// Mirror pattern to Magic Panel
function mirrorPatternToMagic() {
    return window.Image2Sand?.errorHandler?.safeMagicCall(() => {
        if (!isMagicMode || !window.magicPanel) return;
    
    // Switch to conversion state and copy images
    if (window.magicPanel) {
        window.magicPanel.showState('conversion');
        window.magicPanel.copyImagesToConversion();
    }
    }, () => {
        console.warn('Failed to mirror pattern to Magic Panel');
    }, 'Mirror Pattern to Magic');
}

// Mirror streaming to Magic Panel
function mirrorStreamingToMagic() {
    return window.Image2Sand?.errorHandler?.safeMagicCall(() => {
        if (!isMagicMode || !window.magicPanel) return;
    
    console.log('Starting streaming in Magic Panel - using 4th conversion box');
    
    // Fade in streaming text
    fadeInStreamingText();
    
    // The 4th conversion box is already showing the grey pattern preview
    // We'll draw the streaming progress on top of it
    const patternCanvas = document.getElementById('magic-pattern-canvas');
    if (patternCanvas) {
        // Store the original grey pattern for reference
        const ctx = patternCanvas.getContext('2d');
        window.magicPatternCtx = ctx;
        window.magicPatternCanvas = patternCanvas;
        console.log('Streaming setup complete - using pattern canvas for progress');
    }
    }, () => {
        console.warn('Failed to mirror streaming to Magic Panel');
    }, 'Mirror Streaming to Magic');
}

// Shared function to draw pattern segments with customizable styling
function drawPatternSegments(ctx, patternIterator, totalPoints, scale, options = {}) {
    const {
        maxPoints = totalPoints,
        strokeStyle = 'black',
        lineWidth = 2,
        lineCap = 'round',
        lineJoin = 'round',
        colorCallback = null, // Function to determine color for each segment
        tolerance = 0.1,
        useSinglePath = false // If true, accumulates path in single stroke
    } = options;
    
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = lineCap;
    ctx.lineJoin = lineJoin;
    
    let previousPoint = null;
    let firstPoint = true;
    const pointsToDraw = Math.min(maxPoints, totalPoints);
    
    if (useSinglePath) {
        ctx.beginPath();
    }
    
    for (let i = 0; i < pointsToDraw; i++) {
        const point = patternIterator.getNext();
        if (!point) break;
        
        const { r, theta } = point;
        const thetaRad = theta * Math.PI / 1800;
        const x = r * Math.cos(thetaRad) * scale;
        const y = -r * Math.sin(thetaRad) * scale;
        
        if (previousPoint) {
            // Check if this is a pen-lift point (same as previous point)
            const isPenLift = Math.abs(r - previousPoint.r) < tolerance && 
                            Math.abs(theta - previousPoint.theta) < tolerance;
            
            if (!isPenLift) {
                // Set color if callback provided
                if (colorCallback && !useSinglePath) {
                    ctx.strokeStyle = colorCallback(i, pointsToDraw);
                }
                
                if (useSinglePath) {
                    if (firstPoint) {
                        ctx.moveTo(previousPoint.x, previousPoint.y);
                        firstPoint = false;
                    }
                    ctx.lineTo(x, y);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(previousPoint.x, previousPoint.y);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            } else {
                // Pen lift - just move to the point without drawing
                if (useSinglePath) {
                    ctx.moveTo(x, y);
                }
            }
        }
        
        previousPoint = { x, y, r, theta };
    }
    
    if (useSinglePath) {
        ctx.stroke();
    }
}

// Mirror streaming progress to Magic Panel
function mirrorStreamingProgressToMagic(progress) {
    return window.Image2Sand?.errorHandler?.safeMagicCall(() => {
        if (!isMagicMode || !window.magicPanel) return;
    
    // Update progress indicator
    if (progress.current !== undefined && progress.total !== undefined) {
        updateStreamingProgress(progress.current, progress.total);
    }
    
    // Draw streaming progress on the 4th conversion box (pattern canvas)
    if (window.magicPatternCtx && window.magicPatternCanvas) {
        const ctx = window.magicPatternCtx;
        const canvas = window.magicPatternCanvas;
        
        // Clear the canvas first to remove previous streaming progress
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up transformation matrix for drawing
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(175, 175); // Center of 350x350 canvas
        const patternScale = 350 / 2000; // Same scale as traced drawing
        
        // Draw the complete pattern with color gradient
        if (currentStreamingPattern) {
            try {
                // Create iterator for colored background
                const colorIterator = new PatternIterator(currentStreamingPattern);
                const totalPoints = colorIterator.getTotalPoints();
                
                // Color callback for rainbow gradient
                const colorCallback = (i, total) => {
                    const progress = i / total;
                    const hue = progress * 300; // 0-300 degrees (red to purple)
                    return `hsl(${hue}, 100%, 50%)`;
                };
                
                drawPatternSegments(ctx, colorIterator, totalPoints, patternScale, {
                    strokeStyle: 'black', // Will be overridden by colorCallback
                    lineWidth: 2,
                    lineCap: 'round',
                    lineJoin: 'round',
                    colorCallback: colorCallback,
                    tolerance: 0.1
                });
            } catch (error) {
                console.error('Error redrawing colored pattern:', error);
            }
        }
        
        // Draw white overlay showing current progress
        if (currentStreamingPattern) {
            try {
                // Create a separate iterator for white overlay
                const overlayIterator = new PatternIterator(currentStreamingPattern);
                const totalPoints = overlayIterator.getTotalPoints();
                
                // Draw white overlay showing progress up to current point
                drawPatternSegments(ctx, overlayIterator, totalPoints, patternScale, {
                    maxPoints: progress.current,
                    strokeStyle: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white for black background
                    lineWidth: 4, // Thicker than the original lines
                    lineCap: 'round',
                    lineJoin: 'round',
                    tolerance: 0.1,
                    useSinglePath: true // Use single path for better performance
                });
            } catch (error) {
                console.error('Error drawing streaming progress on Magic Panel:', error);
            }
        }
        
        console.log(`Streaming progress: ${progress.current}/${progress.total} - thick black line drawn`);
    }
    }, () => {
        console.warn('Failed to mirror streaming progress to Magic Panel');
    }, 'Mirror Streaming Progress to Magic');
}

// Mirror streaming completion to Magic Panel
function mirrorStreamingCompleteToMagic() {
    return window.Image2Sand?.errorHandler?.safeMagicCall(() => {
        if (!isMagicMode || !window.magicPanel) return;
    
    console.log('Streaming completed in Magic Panel');
    
    // Reset progress indicator
    const progressFill = document.getElementById('streaming-progress-fill');
    const progressText = document.getElementById('streaming-progress-text');
    
    if (progressFill && progressText) {
        progressFill.style.width = '100%';
        progressText.textContent = '100%';
        
        // Fade out after a moment
        setTimeout(() => {
            const streamingContainer = document.querySelector('.streaming-progress-container');
            if (streamingContainer) {
                // Remove inline style setting - let CSS custom properties handle opacity
                streamingContainer.classList.remove('active');
                progressFill.style.width = '0%';
                progressText.textContent = '0%';
            }
        }, 2000);
    }
    
    // Clear the streaming variables
    window.lastMagicStreamingPoint = null;
    window.magicPatternCtx = null;
    window.magicPatternCanvas = null;
    
    // The 4th box now shows the completed pattern with black lines over grey
    console.log('Magic Panel streaming complete - pattern fully traced');
    }, () => {
        console.warn('Failed to mirror streaming completion to Magic Panel');
    }, 'Mirror Streaming Complete to Magic');
}

// Debug function to manually show Magic Panel
function showMagicPanel() {
    console.log('Manually showing Magic Panel');
    const magicPanelElement = document.getElementById('magic-panel');
    if (magicPanelElement) {
        magicPanelElement.style.display = 'block';
        console.log('Magic Panel element shown');
    } else {
        console.log('Magic Panel element not found');
    }
}



// Make debug functions globally available
window.showMagicPanel = showMagicPanel;
window.resetVoiceRecognitionState = resetVoiceRecognitionState;


// Manual Voice Recognition Handlers

// Manual Voice Control Functions
function startVoiceListening() {
    // If in Magic Mode, launch Magic Mode setup first
    if (isMagicMode) {
        console.log('Magic Mode detected - launching Magic Mode setup');
        launchMagicMode();
    }
    
    // Ensure voice recognition is properly initialized
    ensureVoiceRecognitionInitialized();
    
    // Check current state to prevent restart errors
    if (voiceButtonState === 'listening') {
        console.log('Voice recognition already listening, ignoring start request');
        return;
    }
    
    // Ensure microphone access is available before starting voice recognition
    try {
        // Request microphone permissions if not already available
        if (!persistentMicrophoneStream) {
            console.log('Requesting microphone access for voice recognition...');
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    persistentMicrophoneStream = stream;
                    console.log('Microphone access granted, starting voice recognition...');
                    startVoiceRecognitionAndProcessing();
                })
                .catch(error => {
                    console.error('Failed to get microphone access:', error);
                    alert('Microphone access is required for voice recognition. Please allow microphone access and try again.');
                });
            return; // Exit early, will continue in the .then() callback
    } else {
            console.log('Microphone stream already available, starting voice recognition...');
            startVoiceRecognitionAndProcessing();
        }
        } catch (error) {
        console.error('Error setting up microphone access:', error);
        startVoiceRecognitionAndProcessing(); // Try anyway
    }
}

// Unified FFT handling for both Magic and Normal modes
function handleFFTForMode(action) {
    // action: 'start', 'pause', 'stop', 'resume'
    
    if (!isMagicMode) {
        console.log('Normal Mode - FFT not applicable');
        return;
    }
    
    console.log(`Magic Mode - ${action}ing FFT visualization`);
    
    switch (action) {
        case 'start':
        case 'resume':
            ensureFFTInitialized();
            break;
        case 'pause':
            pauseMagicFFT();
            break;
        case 'stop':
            stopMagicFFT();
            break;
        default:
            console.warn(`Unknown FFT action: ${action}`);
    }
}

// Helper function to resume voice processing from paused state
function resumeVoiceProcessing() {
    console.log('Resuming voice processing from paused state');
    
    // If in Magic Mode, launch Magic Mode setup first
    if (isMagicMode) {
        console.log('Magic Mode detected - launching Magic Mode setup on resume');
        launchMagicMode();
    }
    
    // Ensure voice recognition is properly initialized
    ensureVoiceRecognitionInitialized();
    
    setVoiceProcessingState(true);
    setVoiceButtonState('listening');
    
    // Start FFT visualization only if in Magic Mode
    handleFFTForMode('resume');
    
    // Update Magic Panel voice state if available
    if (window.magicPanel && window.magicPanel.updateVoiceState) {
        window.magicPanel.updateVoiceState('listening');
    }
    
    console.log('Voice processing resumed - transcription and waves should be active');
}

// Helper function to start voice recognition and processing
function startVoiceRecognitionAndProcessing() {
        // Set voice processing to active
        setVoiceProcessingState(true);
        
        // Start or restart voice recognition
        try {
            // If recognition is not running, start it
            if (!window.voiceRecognition.isListening) {
                window.voiceRecognition.start();
                console.log('Voice recognition started');
            } else {
                console.log('Voice recognition already running, resuming processing');
            }
            setVoiceButtonState('listening');
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            // If start fails, try to reset and restart
            console.log('Attempting to reset and restart voice recognition...');
            try {
                resetVoiceRecognitionState();
                // Wait a moment for reset to complete
                setTimeout(() => {
                    window.voiceRecognition.start();
                    setVoiceButtonState('listening');
                    console.log('Voice recognition restarted after reset');
                }, 100);
            } catch (retryError) {
                console.error('Failed to restart voice recognition:', retryError);
                setVoiceButtonState('idle');
            }
        }
    
        
        // Update Listen stage indicator to active (yellow)
        updateMagicStatusIndicators('listen');
}

function stopVoiceListening() {
    if (window.voiceRecognition) {
        // Pause voice processing but keep recognition running
        setVoiceProcessingState(false);
        
        // Don't stop the recognition - just pause processing
        // Keep stream alive to avoid permission re-prompts
        setVoiceButtonState('paused');
        
        // Pause FFT if in Magic Mode (keeps microphone stream alive)
        handleFFTForMode('pause');
        
        console.log('Voice processing paused - microphone will auto-resume for continued listening');
    }
}


function updateVoiceButton(listening) {
    const voiceButton = document.getElementById('voice-button');
    const cancelButton = document.getElementById('cancel-voice');
    
    if (listening) {
        voiceButton.classList.add('listening');
        voiceButton.textContent = '🎤 Listening...';
        voiceButton.disabled = true;
        cancelButton.disabled = false;
        cancelButton.style.display = 'inline-block';
    } else {
        voiceButton.classList.remove('listening');
        voiceButton.textContent = '🎤 Ask by Voice';
        voiceButton.disabled = false;
        cancelButton.disabled = true;
        cancelButton.style.display = 'none';
    }
    
    // Update all UI state after voice button state changes
    updateAllUIState();
}

// Serial Communication UI Functions
function initializeSerialCommunication() {
    if (!serialCommunication) {
        serialCommunication = new SerialCommunicationCore();
        serialCommunication.setCallbacks(
            handleSerialStatus,
            handleSerialData,
            handleSerialProgress
        );
    }
}

function handleSerialStatus(status, message) {
    const connectionStatus = document.getElementById('connection-status');
    const statusDot = document.querySelector('#stream-panel .status-dot');
    
    if (connectionStatus) {
        connectionStatus.textContent = message;
    }
    
    if (statusDot) {
        statusDot.className = 'status-dot';
    }
    
    if (status === 'connected') {
        if (statusDot) {
            statusDot.classList.add('connected');
        }
        
        const connectBtn = document.getElementById('connect-serial');
        const disconnectBtn = document.getElementById('disconnect-serial');
        const startBtn = document.getElementById('start-streaming');
        
        if (connectBtn) connectBtn.disabled = true;
        if (disconnectBtn) disconnectBtn.disabled = false;
        if (startBtn) startBtn.disabled = false;
        
        // Update all UI state based on prerequisites
        updateAllUIState();
        
    } else if (status === 'disconnected') {
        if (statusDot) {
            statusDot.className = 'status-dot';
        }
        
        const connectBtn = document.getElementById('connect-serial');
        const disconnectBtn = document.getElementById('disconnect-serial');
        const startBtn = document.getElementById('start-streaming');
        const stopBtn = document.getElementById('stop-streaming');
        
        if (connectBtn) connectBtn.disabled = false;
        if (disconnectBtn) disconnectBtn.disabled = true;
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = true;
        
        // Update all UI state based on prerequisites
        updateAllUIState();
        
    } else if (status === 'error') {
        if (statusDot) {
            statusDot.classList.add('error');
        }
    }
}

function handleSerialData(data) {
    const serialLog = document.getElementById('serial-log');
    if (serialLog) {
        const timestamp = new Date().toLocaleTimeString();
        serialLog.textContent += `[${timestamp}] Arduino: ${data}\n`;
        serialLog.scrollTop = serialLog.scrollHeight;
    }
}

function handleSerialProgress(current, total, r, theta) {
    streamingProgress = { current, total, r, theta };
    
    // Update progress display
    const currentR = document.getElementById('current-r');
    const currentTheta = document.getElementById('current-theta');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (currentR) currentR.textContent = r;
    if (currentTheta) currentTheta.textContent = theta;
    if (progressFill) progressFill.style.width = `${(current / total) * 100}%`;
    if (progressText) progressText.textContent = `${current} / ${total} points`;
    
    // Update progress on canvas
    updateStreamingProgressOnCanvas(current, total);
    
    // Mirror to Magic Panel if in Magic Mode
    if (isMagicMode) {
        mirrorStreamingProgressToMagic({ current, total, r, theta });
    }
    
    // Update Magic mode status if active
    if (currentTab === 'magic') {
        updateMagicStatusIndicators('stream');
    }
}

function updateStreamingProgressOnCanvas(current, total) {
    // Get the canvas that shows the intended image
    const canvas = document.getElementById('connect-image');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Save the current canvas state
    ctx.save();
    
    // Set up transformation matrix (same as in drawConnections)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(width / 2, height / 2);
    
    const scaleX = width / 2000;
    const scaleY = height / 2000;
    const scale = Math.min(scaleX, scaleY);
    
    // Get the current pattern points
    if (!currentStreamingPattern) return;
    
    try {
        const patternIterator = new PatternIterator(currentStreamingPattern);
        const totalPoints = patternIterator.getTotalPoints();
        
        // Draw progress up to current point, skipping pen-lift areas
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; // Semi-transparent black
        ctx.lineWidth = 4; // Thicker than the original lines
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        let firstPoint = true;
        let previousPoint = null;
        const tolerance = 0.1; // Tolerance for detecting pen-lift (repeated coordinates)
        
        for (let i = 0; i < Math.min(current, totalPoints); i++) {
            const point = patternIterator.getNext();
            if (!point) break;
            
            const { r, theta } = point;
            const thetaRad = theta * Math.PI / 1800;
            const x = r * Math.cos(thetaRad) * scale;
            const y = -r * Math.sin(thetaRad) * scale;
            
            // Check if this is a pen-lift point (same as previous point)
            const isPenLift = previousPoint && 
                Math.abs(r - previousPoint.r) < tolerance && 
                Math.abs(theta - previousPoint.theta) < tolerance;
            
            if (isPenLift) {
                // Skip drawing over pen-lift areas - leave them transparent
                // Just move to the point without drawing
                ctx.moveTo(x, y);
            } else {
                // Normal drawing
                if (firstPoint) {
                    ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            previousPoint = { r, theta };
        }
        
        ctx.stroke();
        
    } catch (error) {
        console.error('Error drawing streaming progress:', error);
    }
    
    // Restore canvas state
    ctx.restore();
}

// Serial Control Functions
async function connectSerial() {
    try {
        initializeSerialCommunication();
        await serialCommunication.connect();
        // Update button states after successful connection
        handleSerialStatus('connected', 'Serial port connected');
    } catch (error) {
        console.error('Serial connection error:', error);
        // Update button states on error
        handleSerialStatus('error', 'Connection failed');
    }
}

async function disconnectSerial() {
    if (serialCommunication) {
        await serialCommunication.disconnect();
        // Update button states after disconnection
        handleSerialStatus('disconnected', 'Serial port disconnected');
    }
}

async function startStreaming() {
    const patternText = document.getElementById('polar-coordinates-textarea').value;
    if (!patternText || !serialCommunication) return;
    
    try {
        // Clear and redraw the canvas with the final pattern before streaming
        const canvas = document.getElementById('connect-image');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            
            // Clear the canvas
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Parse the pattern and redraw it
            try {
                const patternIterator = new PatternIterator(patternText);
                const polarPoints = [];
                
                // Convert pattern to polar points
                let point = patternIterator.getNext();
                while (point) {
                    polarPoints.push({ r: point.r, theta: point.theta });
                    point = patternIterator.getNext();
                }
                
                // Redraw the pattern
                drawConnections(polarPoints);
            } catch (error) {
                console.error('Error parsing pattern for canvas redraw:', error);
            }
        }
        
        // Mirror to Magic Panel if in Magic Mode
        if (isMagicMode) {
            mirrorStreamingToMagic();
            
            // Animate container to rightmost box before streaming
            animateContainerToRightmost();
        }
        
        // Set streaming state
        isStreaming = true;
        
        // Pause voice processing during streaming (keep stream alive)
        stopVoiceListening();
        
        document.getElementById('start-streaming').disabled = true;
        document.getElementById('stop-streaming').disabled = false;
        
        currentStreamingPattern = patternText;
        await serialCommunication.streamPattern(patternText, handleSerialProgress);
        
        // Mark streaming as completed in Magic Mode
        const magicStreamStage = document.getElementById('magic-stream-stage');
        if (magicStreamStage) {
            magicStreamStage.classList.add('completed');
        }
        
        // Reset streaming state
        isStreaming = false;
        
        document.getElementById('start-streaming').disabled = false;
        document.getElementById('stop-streaming').disabled = true;
        
        // Start Magic loop reset after SUCCESSFUL streaming completion only
        // This will handle voice processing resume via launchMagicMode()
        if (isMagicMode) {
            resetMagicMode();
        } else {
            // Normal Mode: Don't auto-resume - user must click microphone button
            console.log('Normal Mode: Voice processing not auto-resumed - user must click microphone button');
        }
    } catch (error) {
        console.error('Streaming error:', error);
        isStreaming = false;
        
        // Handle error based on mode
        if (isMagicMode) {
            // Magic Mode: Show error and reset to initial state
            handleMagicModeError(
                error, 
                'stream', 
                'Streaming failed. Please check your serial connection and try again.'
            );
        }
    }
}

function stopStreaming() {
    if (serialCommunication) {
        serialCommunication.stopStreaming();
        
        // Reset streaming state
        isStreaming = false;
        
        // Mirror to Magic Panel if in Magic Mode
        if (isMagicMode) {
            mirrorStreamingCompleteToMagic();
        }
        
        document.getElementById('start-streaming').disabled = false;
        document.getElementById('stop-streaming').disabled = true;
    }
}

// Reset voice recognition state completely
function resetVoiceRecognitionState() {
    console.log('Resetting voice recognition state...');
    

    console.log('Keeping voice recognition running to avoid permission re-prompts');
    setVoiceProcessingState(false);
    
    // Reset all voice-related states
    setVoiceProcessingState(false);
    setVoiceButtonState('idle');
    voiceButtonState = 'idle';
    
    // Reset voice state
    voiceState = {
        detectedObject: null,
        liveTranscript: '',
        confidence: 0,
        isListening: false,
        hasDetectedObject: false
    };
    
    // Clear any persistent microphone streams
    if (persistentMicrophoneStream) {
        persistentMicrophoneStream.getTracks().forEach(track => track.stop());
        persistentMicrophoneStream = null;
    }
    
    
    console.log('Voice recognition state reset complete');
}

// Enhanced voice recognition restart function
function restartVoiceRecognitionIfNeeded() {
    if (window.voiceRecognition && !window.voiceRecognition.isListening) {
        console.log('Voice recognition not listening, attempting to restart...');
        try {
            window.voiceRecognition.start();
            console.log('Voice recognition restarted successfully');
            return true;
        } catch (error) {
            console.error('Failed to restart voice recognition:', error);
            return false;
        }
    }
    return true; // Already listening or no recognition instance
}

// Periodic voice recognition health check
let voiceRecognitionHealthCheck = null;

function startVoiceRecognitionHealthCheck() {
    if (voiceRecognitionHealthCheck) {
        clearInterval(voiceRecognitionHealthCheck);
    }
    
    voiceRecognitionHealthCheck = setInterval(() => {
        // Only check if we should be listening
        if (voiceButtonState === 'listening' || isProcessingVoice) {
            if (window.voiceRecognition && !window.voiceRecognition.isListening) {
                console.log('Voice recognition health check: restarting inactive recognition');
                restartVoiceRecognitionIfNeeded();
            }
        }
    }, 5000); // Check every 5 seconds
}

function stopVoiceRecognitionHealthCheck() {
    if (voiceRecognitionHealthCheck) {
        clearInterval(voiceRecognitionHealthCheck);
        voiceRecognitionHealthCheck = null;
    }
}

// Auto-resume voice recognition after object detection
function autoResumeVoiceAfterObjectDetection() {
    console.log('Auto-resuming microphone for continued listening...');
    
    // Ensure voice recognition is running
    if (window.voiceRecognition && !window.voiceRecognition.isListening) {
        try {
            window.voiceRecognition.start();
            console.log('Voice recognition restarted for continued listening');
        } catch (error) {
            console.error('Failed to restart voice recognition for continued listening:', error);
            return false;
        }
    }
    
    // Ensure voice recognition is properly initialized
    ensureVoiceRecognitionInitialized();
    
    // Resume voice processing
    setVoiceProcessingState(true);
    setVoiceButtonState('listening');
    
    // Start FFT visualization only if in Magic Mode
    handleFFTForMode('start');
    
    console.log('Microphone resumed for continued listening');
    return true;
}

// Image Processing Functions (preserved from original)
function drawAndPrepImage(imgElement) {
    const canvas = document.getElementById('original-image');
    const ctx = canvas.getContext('2d');
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    ctx.drawImage(imgElement, 0, 0);

    // Set originalImageElement to the current image
    originalImageElement = imgElement;

    // Mirror image to Magic Panel if in Magic Mode
    if (isMagicMode) {
        waitForMagicPanel(() => {
            mirrorImageToMagic(imgElement);
        });
    }

    // Stop shimmer animation and fade in the image
    const imageContainer = document.querySelector('.image-container');
    if (imageContainer) {
        imageContainer.classList.remove('shimmer');
        
        // Remove floating particles
        const particles = imageContainer.querySelectorAll('.particle');
        particles.forEach(particle => particle.remove());
        
        // Add a fade-in effect
        imageContainer.style.opacity = '0';
        imageContainer.style.transition = 'opacity 0.5s ease-in-out';
        setTimeout(() => {
            imageContainer.style.opacity = ELEMENT_SHOWN_OPACITY.toString();
        }, 100);
    }

    // Show generate button and hide placeholder
    const generateButton = document.getElementById('generate-button');
    const placeholder = document.getElementById('image-placeholder');
    if (generateButton) generateButton.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    
    // Show image panel in Guided Mode when image is generated
    if (currentTab === 'guided') {
        updateGuidedModePanelVisibility();
    }
}

async function generateImage(apiKey, prompt, autoprocess) {
    console.log('generateImage called with:', { apiKey: !!apiKey, prompt, autoprocess, isGeneratingImage });
    // Note: apiKey parameter is ignored - using Netlify function with secure API key
    if (isGeneratingImage) {
        console.log('Image generation already in progress, skipping');
        document.getElementById('generation-status').textContent = "Image is still generating - please don't press the button."; 
    } else {
        console.log('Starting image generation');
        isGeneratingImage = true;
        const genButton = document.getElementById('gen-image-button');
        const status = document.getElementById('generation-status');
        
        if (genButton) genButton.disabled = true;
        if (status) status.style.display = 'block';
        
        try {
            console.log('Making API request to Netlify function...');
            console.log('Request details:', {
                url: 'https://image2sand.netlify.app/.netlify/functions/generate-image',
                method: 'POST',
                prompt: prompt
            });
            
            const response = await fetch('https://image2sand.netlify.app/.netlify/functions/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt
                })
            });

            console.log('API response status:', response.status);
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            if ('error' in data) {
                throw new Error(data.error.message);
            }
            const imageData = data.data[0].b64_json;

            const imgElement = new Image();
            imgElement.onload = function() {
                drawAndPrepImage(imgElement);
                
                // Mirror to Magic Panel if in Magic Mode
                if (isMagicMode) {
                    waitForMagicPanel(() => {
                        mirrorImageToMagic(imgElement);
                    });
                }
                
                if (autoprocess) {
                    convertImage();
                }
            };
            imgElement.src = `data:image/png;base64,${imageData}`;

        } catch (error) {
            console.error('Image generation error:', error);
            
            // Handle error based on mode
            if (isMagicMode) {
                // Magic Mode: Show error and reset to initial state
                let errorMessage = 'Image generation failed. ';
                if (error.message.includes('API Error (429)') || error.message.includes('billing')) {
                    errorMessage += 'API billing limit reached. Please check your OpenAI account or try again later.';
                } else if (error.message.includes('API Error (401)')) {
                    errorMessage += 'Invalid API key. Please check your OpenAI API key.';
                } else if (error.message.includes('API Error (400)')) {
                    errorMessage += 'Invalid request. Please try a different prompt.';
                } else {
                    errorMessage += error.message;
                }
                
                handleMagicModeError(error, 'generate', errorMessage);
            } else {
                // Normal Mode: Show API error warning box
                showApiError(error.message);
            }
            
            // Stop shimmer animation on error
            const imageContainer = document.querySelector('.image-container');
            if (imageContainer) {
                imageContainer.classList.remove('shimmer');
                
                // Remove floating particles
                const particles = imageContainer.querySelectorAll('.particle');
                particles.forEach(particle => particle.remove());
            }
        }
        
        isGeneratingImage = false;
        if (status) status.style.display = 'none';
        if (genButton) genButton.disabled = false;
    }
}



function convertVoiceImage() {
    // This will be similar to convertImage but for voice mode
    // For now, just call the regular convertImage
    convertImage();
}

// Continue from coordinates mode to show intended image
function continueFromCoordinates() {
    const coordinatesText = document.getElementById('coordinates-text').value.trim();
    
    if (!coordinatesText) {
        alert('Please paste coordinates first');
        return;
    }
    
    try {
        // Parse the coordinates
        const polarPoints = parseCoordinates(coordinatesText);
        
        if (polarPoints.length === 0) {
            alert('No valid coordinates found. Please check the format.');
            return;
        }
        
        // Update the coordinates textarea
        document.getElementById('polar-coordinates-textarea').value = coordinatesText;
        
        // Draw the connections on the intended image canvas
        drawConnections(polarPoints);
        
        // Mirror to Magic Panel if in Magic Mode
        if (isMagicMode) {
            mirrorPatternToMagic();
        }
        
        // Update total points display
        document.getElementById('total-points').innerText = `(${polarPoints.length} Points)`;
        
        // Show intended image panel (skip patternification for coordinates)
        if (currentTab === 'voice2sand') {
            showVoicePanel('intended-image-panel');
            showVoicePanel('output-coordinates-panel');
            showVoicePanel('stream-panel');
        } else if (currentTab === 'guided') {
            // Use smart panel visibility management for guided mode
            updateGuidedModePanelVisibility();
            
            // In Guided Mode, show stream panel but keep it closed
            const streamContent = document.getElementById('stream-content');
            const streamToggle = document.querySelector('.stream-toggle');
            if (streamContent && streamToggle) {
                streamContent.style.display = 'none';
                streamToggle.classList.remove('active');
            }
        } else {
            showPanel('intended-image-panel');
            showPanel('output-coordinates-panel');
            showPanel('stream-panel');
        }
        
    } catch (error) {
        console.error('Error processing coordinates:', error);
        alert('Error parsing coordinates. Please check the format.');
    }
}

// Parse coordinates from text
function parseCoordinates(text) {
    const points = [];
    
    // Remove outer braces if present
    const cleanText = text.replace(/^\{|\}$/g, '');
    
    // Split by coordinate pairs
    const pairs = cleanText.split('},{');
    
    for (const pair of pairs) {
        const [r, theta] = pair.split(',').map(Number);
        if (!isNaN(r) && !isNaN(theta)) {
            points.push({ r, theta });
        }
    }
    
    return points;
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = e => {
        if (!originalImageElement) {
            originalImageElement = new Image();
            originalImageElement.id = 'uploaded-image';
            originalImageElement.onload = () => {
                drawAndPrepImage(originalImageElement);
            };
        }
        originalImageElement.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// Drag and Drop Functions
function setupDragAndDrop() {
    const dragDropZone = document.getElementById('drag-drop-zone');
    if (!dragDropZone) return;
    
    // Click to open file dialog
    dragDropZone.addEventListener('click', () => {
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.click();
    });
    
    dragDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropZone.classList.add('drag-over');
    });
    
    dragDropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragDropZone.classList.remove('drag-over');
    });
    
    dragDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                handleFileUpload(file);
            }
        }
    });
}

function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        if (!originalImageElement) {
            originalImageElement = new Image();
            originalImageElement.id = 'uploaded-image';
            originalImageElement.onload = () => {
                drawAndPrepImage(originalImageElement);
            };
        }
        originalImageElement.src = e.target.result;
        
        // Update file name display
        const fileNameDisplay = document.getElementById('file-name');
        if (fileNameDisplay) {
            fileNameDisplay.textContent = file.name;
        }
    };
    reader.readAsDataURL(file);
}

// Settings Toggle Functions
function toggleSettings() {
    const settingsContent = document.getElementById('settings-content');
    
    // Find the toggle button in the currently active tab
    const activeTab = document.querySelector('.tab-content.active');
    const toggle = activeTab ? activeTab.querySelector('.settings-toggle') : document.querySelector('.settings-toggle');
    
    if (!settingsContent || !toggle) {
        console.error('Settings elements not found');
        return;
    }
    
    const isVisible = settingsContent.style.display === 'block' || 
                     getComputedStyle(settingsContent).display === 'block';
    
    if (isVisible) {
        settingsContent.style.display = 'none';
        toggle.classList.remove('active');
    } else {
        settingsContent.style.display = 'block';
        toggle.classList.add('active');
    }
}



function toggleVoiceSettings() {
    const settingsContent = document.getElementById('voice-settings-content');
    const toggle = document.querySelector('#voice2sand .settings-toggle');
    
    if (!settingsContent || !toggle) {
        console.error('Voice settings elements not found');
        return;
    }
    
    const isVisible = settingsContent.style.display === 'block' || 
                     getComputedStyle(settingsContent).display === 'block';
    
    if (isVisible) {
        settingsContent.style.display = 'none';
        toggle.classList.remove('active');
    } else {
        settingsContent.style.display = 'block';
        toggle.classList.add('active');
    }
}

// Copy coordinates to clipboard
async function copyCoordinatesToClipboard() {
    const coordinatesTextarea = document.getElementById('polar-coordinates-textarea');
    if (!coordinatesTextarea) {
        console.error('Coordinates textarea not found');
        return;
    }
    
    const coordinatesText = coordinatesTextarea.value.trim();
    if (!coordinatesText) {
        alert('No coordinates to copy. Please generate a pattern first.');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(coordinatesText);
        
        // Provide visual feedback
        const button = document.getElementById('copy-coordinates-button');
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        button.style.background = 'linear-gradient(135deg, var(--success-green), #059669)';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy coordinates:', error);
        alert('Failed to copy coordinates to clipboard. Please try selecting the text manually.');
    }
}

function toggleStreamPanel() {
    const streamContent = document.getElementById('stream-content');
    const toggle = document.querySelector('.stream-toggle');
    
    if (!streamContent || !toggle) {
        console.error('Stream panel elements not found');
        return;
    }
    
    const isVisible = streamContent.style.display === 'block' || 
                     getComputedStyle(streamContent).display === 'block';
    
    if (isVisible) {
        streamContent.style.display = 'none';
        toggle.classList.remove('active');
    } else {
        streamContent.style.display = 'block';
        toggle.classList.add('active');
    }
}



// Input Mode Switching
function switchInputMode(mode) {
    console.log('switchInputMode called with mode:', mode);
    
    // Hide all input contents
    console.log('Hiding all input-content elements:');
    document.querySelectorAll('.input-content').forEach(content => {
        console.log('Hiding:', content.id, 'current display:', content.style.display);
        content.style.display = 'none';
    });
    
    // Show selected input content
    const selectedContent = document.getElementById(`${mode}-input`);
    console.log('Selected content element:', selectedContent);
    if (selectedContent) {
        selectedContent.style.display = 'block';
        console.log('Set display to block for:', selectedContent.id);
    }
    
    // Debug: Check final state of all input-content elements
    console.log('Final state of all input-content elements:');
    document.querySelectorAll('.input-content').forEach(content => {
        console.log(content.id, 'display:', content.style.display, 'computed display:', getComputedStyle(content).display);
    });
    
    // Update prompt mode display to match the selected prompt mode
    const selectedPromptMode = document.querySelector('input[name="prompt-input-mode"]:checked');
    if (selectedPromptMode) {
        switchPromptMode(selectedPromptMode.value);
    }
    
    // Show/hide continue button for coordinates mode (only if there's text)
    const continueButton = document.getElementById('continue-coordinates-button');
    const coordinatesTextarea = document.getElementById('coordinates-text');
    if (continueButton && coordinatesTextarea) {
        const hasText = coordinatesTextarea.value.trim().length > 0;
        const shouldShow = mode === 'coordinates' && hasText;
        continueButton.style.display = shouldShow ? 'block' : 'none';
        console.log('Continue button visibility:', { mode, hasText, shouldShow });
    }
    
    
}

// Prompt Input Mode Switching
function switchPromptMode(mode) {
    // Hide all prompt input contents
    document.querySelectorAll('.prompt-input-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Show selected prompt input content
    const selectedContent = document.getElementById(`${mode}-prompt-input`);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }
    
    // Voice recognition is now initialized on-demand when the microphone button is clicked
}

// Panel Management
function showPanel(panelClass) {
    const panel = document.querySelector(`.${panelClass}`);
    if (panel) {
        panel.style.display = 'block';
    }
}

function hidePanel(panelClass) {
    const panel = document.querySelector(`.${panelClass}`);
    if (panel) {
        panel.style.display = 'none';
    }
}

// Smart panel visibility management for Guided Mode
function updateGuidedModePanelVisibility() {
    console.log('=== UPDATING GUIDED MODE PANEL VISIBILITY ===');
    
    // Always show input panel
    showPanel('input-panel');
    
    // Image panel - show only if there's an image AND we're not in Magic Mode
    // Also check if the image has actual content (not just a placeholder)
    const hasValidImage = originalImageElement && 
                         originalImageElement.src && 
                         originalImageElement.src !== '' && 
                         !originalImageElement.src.includes('data:image/svg+xml');
    
    if (hasValidImage) {
        console.log('Showing image panel - valid image exists');
        showPanel('image-panel');
    } else {
        console.log('Hiding image panel - no valid image');
        hidePanel('image-panel');
    }
    
    // Patternification panel - show only if there are coordinates AND a source image exists
    const coordinatesText = document.getElementById('polar-coordinates-textarea');
    const hasCoordinates = coordinatesText && coordinatesText.value.trim().length > 0;
    
    if (hasCoordinates && hasValidImage) {
        console.log('Showing patternification panel - coordinates exist and source image exists');
        showPanel('patternification-panel');
    } else {
        console.log('Hiding patternification panel - no coordinates or no source image');
        hidePanel('patternification-panel');
    }
    
    // Intended image panel - show only if there are coordinates
    if (hasCoordinates) {
        console.log('Showing intended image panel - coordinates exist');
        showPanel('intended-image-panel');
    } else {
        console.log('Hiding intended image panel - no coordinates');
        hidePanel('intended-image-panel');
    }
    
    // Output coordinates panel - show only if there are coordinates
    if (hasCoordinates) {
        console.log('Showing output coordinates panel - coordinates exist');
        showPanel('output-coordinates-panel');
    } else {
        console.log('Hiding output coordinates panel - no coordinates');
        hidePanel('output-coordinates-panel');
    }
    
    // Stream panel - show only if there are coordinates (streaming logic is separate)
    if (hasCoordinates) {
        console.log('Showing stream panel - coordinates exist');
        showPanel('stream-panel');
    } else {
        console.log('Hiding stream panel - no coordinates');
        hidePanel('stream-panel');
    }
}

// Voice-specific panel management
function showVoicePanel(panelClass) {
    const panel = document.querySelector(`#voice2sand .${panelClass}`);
    if (panel) {
        panel.style.display = 'block';
        console.log(`Showing voice panel: ${panelClass}`);
    } else {
        console.error(`Voice panel not found: ${panelClass}`);
    }
}

function hideVoicePanel(panelClass) {
    const panel = document.querySelector(`#voice2sand .${panelClass}`);
    if (panel) {
        panel.style.display = 'none';
        console.log(`Hiding voice panel: ${panelClass}`);
    } else {
        console.error(`Voice panel not found: ${panelClass}`);
    }
}

// Voice Mode Switching

function switchToGuidedMode() {
    console.log('=== SWITCHING TO GUIDED MODE ===');
    isAutoMode = false;
    document.getElementById('guided-mode').classList.add('active');
    document.getElementById('magic-mode').classList.remove('active');
    
    // First, hide ALL panels to reset from magic mode state
    console.log('Resetting all panels from magic mode state');
    hidePanel('image-panel');
    hidePanel('patternification-panel');
    hidePanel('intended-image-panel');
    hidePanel('output-coordinates-panel');
    hidePanel('stream-panel');
    
    // Set default input mode to text in guided mode
    const textModeRadio = document.getElementById('text-prompt-mode');
    const voiceModeRadio = document.getElementById('voice-prompt-mode');
    
    if (textModeRadio) textModeRadio.checked = true;
    if (voiceModeRadio) voiceModeRadio.checked = false;
    
    // Show text input and hide voice input
    document.getElementById('text-prompt-input').style.display = 'block';
    document.getElementById('voice-prompt-input').style.display = 'none';
    
    console.log('Text mode checked:', textModeRadio ? textModeRadio.checked : 'NOT FOUND');
    console.log('Voice mode checked:', voiceModeRadio ? voiceModeRadio.checked : 'NOT FOUND');
    console.log('Text input display:', document.getElementById('text-prompt-input').style.display);
    console.log('Voice input display:', document.getElementById('voice-prompt-input').style.display);
    
    // Force a visual update by triggering a change event
    if (textModeRadio) {
        textModeRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Now apply smart panel visibility based on actual content
    updateGuidedModePanelVisibility();
}

// Preserved functions from original image2sand.js
function plotNextContour() {
    const canvas = document.getElementById('plotcontours');
    const ctx = canvas.getContext('2d');

    if (isFirstClick) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isFirstClick = false;
    }

    if (currentContourIndex < orderedContoursSave.length) {
        const contour = orderedContoursSave[currentContourIndex];
        const baseColor = getRandomColor();
        const [r, g, b] = hexToRgb(baseColor);
        const length = contour.length;

        contour.forEach((point, i) => {
            if (i === 0) {
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
                const ratio = i / length;
                const fadedColor = `rgb(${Math.round(r * (1 - ratio))}, ${Math.round(g * (1 - ratio))}, ${Math.round(b * (1 - ratio))})`;
                ctx.strokeStyle = fadedColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
            }
        });

        ctx.fillStyle = baseColor;
        ctx.font = '12px Arial';
        ctx.fillText(`S${currentContourIndex + 1}`, contour[0].x, contour[0].y);
        ctx.beginPath();
        ctx.arc(contour[0].x, contour[0].y, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText(`E${currentContourIndex + 1}`, contour[contour.length - 1].x, contour[contour.length - 1].y);
        ctx.beginPath();
        ctx.arc(contour[contour.length - 1].x, contour[contour.length - 1].y, 3, 0, 2 * Math.PI);
        ctx.fill();
        const midPoint = contour[Math.floor(contour.length / 2)];
        ctx.fillText(`${currentContourIndex + 1}`, midPoint.x, midPoint.y);
        currentContourIndex++;
    } else {
        alert("All contours have been plotted. Starting over.");
        currentContourIndex = 0;
        isFirstClick = true;
    }
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function resetCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawOriginalToPatternification(imgElement) {
    const canvas = document.getElementById('original-pattern');
    if (!canvas || !imgElement) return;
    
    // Set canvas internal dimensions to match CSS display size
    canvas.width = 200;
    canvas.height = 200;
    
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate aspect ratio preserving dimensions
    const imgAspect = imgElement.naturalWidth / imgElement.naturalHeight;
    const canvasAspect = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgAspect > canvasAspect) {
        // Image is wider than canvas
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgAspect;
        drawX = 0;
        drawY = (canvasHeight - drawHeight) / 2;
    } else {
        // Image is taller than canvas
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imgAspect;
        drawX = (canvasWidth - drawWidth) / 2;
        drawY = 0;
    }
    
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(imgElement, drawX, drawY, drawWidth, drawHeight);
}

function drawEdgeToPatternification(edgeImage, originalImageElement) {
    // The edgeImage has been inverted back for processing, so we need to invert it again for display
    const displayEdge = edgeImage.clone();
    cv.bitwise_not(displayEdge, displayEdge);
    cv.imshow('edge-image', displayEdge);
    displayEdge.delete();
}

function plotContours(orderedContours) {
    const canvas = document.getElementById('plotcontours');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    orderedContours.forEach((contour, index) => {
        const baseColor = getRandomColor();
        const [r, g, b] = hexToRgb(baseColor);
        const length = contour.length;

        contour.forEach((point, i) => {
            if (i === 0) {
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
                const ratio = i / length;
                const fadedColor = `rgb(${Math.round(r * (1 - ratio))}, ${Math.round(g * (1 - ratio))}, ${Math.round(b * (1 - ratio))})`;
                ctx.strokeStyle = fadedColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
            }
        });

        ctx.fillStyle = baseColor;
        ctx.font = '12px Arial';
        ctx.fillText(`S${index + 1}`, contour[0].x, contour[0].y);
        ctx.beginPath();
        ctx.arc(contour[0].x, contour[0].y, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillText(`E${index + 1}`, contour[contour.length - 1].x, contour[contour.length - 1].y);
        ctx.beginPath();
        ctx.arc(contour[contour.length - 1].x, contour[contour.length - 1].y, 3, 0, 2 * Math.PI);
        ctx.fill();
        const midPoint = contour[Math.floor(contour.length / 2)];
        ctx.fillText(`${index + 1}`, midPoint.x, midPoint.y);
    });
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255
    ];
}

function drawDots(points, penUpEnabled = false, contours = null) {
    const canvas = document.getElementById('dot-image');
    if (!canvas || !originalImageElement) return;
    
    // Set canvas internal dimensions to match CSS display size
    canvas.width = 200;
    canvas.height = 200;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width, height = canvas.height;
    const scaleX = width / originalImageElement.width;
    const scaleY = height / originalImageElement.height;
    const scale = Math.min(scaleX, scaleY);
    
    // Calculate centered drawing area
    const drawWidth = originalImageElement.width * scale;
    const drawHeight = originalImageElement.height * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    let allPolarPoints = [];
    
    if (penUpEnabled && contours) {
        console.log('Processing contours in pen-up mode. Number of contours:', contours.length);
        
        const allScaledPoints = [];
        for (let i = 0; i < contours.length; i++) {
            const contour = contours[i];
            console.log(`Processing contour ${i}:`, contour.length, 'points');
            
            const scaledContour = contour.map(p => ({ 
                x: (p.x) * scale + offsetX, 
                y: (p.y) * scale + offsetY 
            }));
            
            scaledContour.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
            });
            
            allScaledPoints.push(...scaledContour);
        }
        
        allPolarPoints = calculatePolarCoordinates(allScaledPoints);
        console.log('Total polar points after processing:', allPolarPoints.length);
        
        let currentIndex = 0;
        for (let i = 0; i < contours.length - 1; i++) {
            const contourLength = contours[i].length;
            currentIndex += contourLength;
            
            const penUpPoint = allPolarPoints[currentIndex - 1];
            allPolarPoints.splice(currentIndex, 0, penUpPoint);
            console.log(`Added pen-up after contour ${i} at index ${currentIndex}`);
            currentIndex++;
        }
        
        const isLoopEnabled = document.getElementById('is-loop').checked;
        if (isLoopEnabled) {
            const lastPoint = allPolarPoints[allPolarPoints.length - 1];
            allPolarPoints.push(lastPoint);
            console.log('Added pen-up at end for loop drawing');
        }
        
        console.log('Final total polar points with pen-up:', allPolarPoints.length);
    } else {
        const scaledPoints = points.map(p => ({ x: (p.x) * scale + offsetX, y: (p.y) * scale + offsetY }));

        scaledPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
        });

        allPolarPoints = calculatePolarCoordinates(scaledPoints);
    }
    
    return allPolarPoints;
}

function drawConnections(polarPoints) {
    const canvas = document.getElementById('connect-image'), ctx = canvas.getContext('2d');
    
    // Reset transformation matrix first, then clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.width, height = canvas.height;
    ctx.translate(width / 2, height / 2);

    const scaleX = width / 2000;
    const scaleY = height / 2000;
    const scale = Math.min(scaleX, scaleY);

    ctx.beginPath();
    ctx.arc(0, 0, 1000 * scale, 0, 2 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.stroke();

    const penUpEnabled = document.getElementById('pen-up-toggle').checked;

    console.log('Drawing connections for', polarPoints.length, 'points');
    for (let i = 0; i < polarPoints.length - 1; i++) {
        const p1 = polarPoints[i];
        const p2 = polarPoints[i + 1];
        
        console.log(`Segment ${i}:`, p1, '->', p2);

        const theta1 = p1.theta * Math.PI / 1800;
        const theta2 = p2.theta * Math.PI / 1800;

        const x1 = p1.r * Math.cos(theta1) * scale;
        const y1 = -p1.r * Math.sin(theta1) * scale;
        const x2 = p2.r * Math.cos(theta2) * scale;
        const y2 = -p2.r * Math.sin(theta2) * scale;

        let isPenUp = false;
        let shouldDrawLightGrey = false;
        if (penUpEnabled) {
            const tolerance = 0.1;
            isPenUp = (Math.abs(p1.r - p2.r) < tolerance && Math.abs(p1.theta - p2.theta) < tolerance);
            if (isPenUp) {
                console.log(`Pen-up detected at segment ${i}:`, p1, p2);
                console.log(`Skipping line between repeated coordinates`);
                continue;
            }
            
            if (i > 0) {
                const prevP1 = polarPoints[i-1];
                const prevP2 = polarPoints[i];
                const prevIsPenUp = (Math.abs(prevP1.r - prevP2.r) < tolerance && Math.abs(prevP1.theta - prevP2.theta) < tolerance);
                if (prevIsPenUp) {
                    shouldDrawLightGrey = true;
                    console.log(`Drawing light grey line from pen-up to next coordinate`);
                }
            }
        }

        if (shouldDrawLightGrey) {
            ctx.strokeStyle = '#D3D3D3';
            ctx.lineWidth = 1;
        } else {
            let realSegmentIndex = 0;
            for (let j = 0; j < i; j++) {
                const jP1 = polarPoints[j];
                const jP2 = polarPoints[j + 1];
                const jTolerance = 0.1;
                const jIsPenUp = (Math.abs(jP1.r - jP2.r) < jTolerance && Math.abs(jP1.theta - jP2.theta) < jTolerance);
                if (!jIsPenUp) {
                    realSegmentIndex++;
                }
            }
            
            let totalRealSegments = 0;
            for (let j = 0; j < polarPoints.length - 1; j++) {
                const jP1 = polarPoints[j];
                const jP2 = polarPoints[j + 1];
                const jTolerance = 0.1;
                const jIsPenUp = (Math.abs(jP1.r - jP2.r) < jTolerance && Math.abs(jP1.theta - jP2.theta) < jTolerance);
                if (!jIsPenUp) {
                    totalRealSegments++;
                }
            }
            
            const t = realSegmentIndex / Math.max(1, totalRealSegments - 1);
            ctx.strokeStyle = `hsl(${t * 270}, 100%, 50%)`;
            ctx.lineWidth = 2;
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

function convertImage() {
    if (!originalImageElement) return;
    
    const processingStatus = document.getElementById('processing-status');
    const generateButton = document.getElementById('generate-button');
    
    if (processingStatus) processingStatus.style.display = 'block';
    if (generateButton) generateButton.disabled = true;
    
    const config = {
        epsilon: parseFloat(document.getElementById('epsilon-slider').value),
        contourMode: document.getElementById('contour-mode').value,
        isLoop: document.getElementById('is-loop').checked,
        minimizeJumps: document.getElementById('no-shortcuts').checked,
        outputFormat: parseInt(document.getElementById('output-type').value),
        maxPoints: parseInt(document.getElementById('dot-number').value),
        penUpEnabled: document.getElementById('pen-up-toggle').checked
    };
    
    setTimeout(() => {
        convertImageToPath(originalImageElement, config)
            .then(result => {
                document.getElementById('polar-coordinates-textarea').value = result.formattedString;
                document.getElementById('simple-coords').textContent = result.formattedString;
                document.getElementById('simple-coords-title').style = 'visibility: hidden';
                
                resetCanvas('dot-image');
                resetCanvas('connect-image');
                
                // Draw original image to patternification panel
                drawOriginalToPatternification(originalImageElement);
                
                // Draw edge image with proper aspect ratio
                drawEdgeToPatternification(result.edgeImage, originalImageElement);
                
                plotContours(result.processedContours);
                orderedContoursSave = result.processedContours;
                
                const penUpEnabled = document.getElementById('pen-up-toggle').checked;
                const displayPolarPoints = drawDots(result.orderedPoints, penUpEnabled, result.processedContours);
                
                drawConnections(displayPolarPoints);
                
                // Mirror conversion images to Magic Panel if in Magic Mode
                if (isMagicMode) {
                    waitForMagicPanel(() => {
                        mirrorConversionImagesToMagic(originalImageElement, result.edgeImage, result.orderedPoints, result.processedContours, penUpEnabled);
                    });
                }
                
                document.getElementById('total-points').innerText = `(${result.orderedPoints.length} Points)`;
                
                result.edgeImage.delete();
                
                if (processingStatus) processingStatus.style.display = 'none';
                if (generateButton) generateButton.disabled = false;
                
                // Show output and stream panels
                if (currentTab === 'voice2sand') {
                    showVoicePanel('patternification-panel');
                    showVoicePanel('intended-image-panel');
                    showVoicePanel('output-coordinates-panel');
                    showVoicePanel('stream-panel');
                } else if (currentTab === 'guided') {
                    // Use smart panel visibility management for guided mode
                    updateGuidedModePanelVisibility();
                    
                    // In Guided Mode, show stream panel but keep it closed
                    const streamContent = document.getElementById('stream-content');
                    const streamToggle = document.querySelector('.stream-toggle');
                    if (streamContent && streamToggle) {
                        streamContent.style.display = 'none';
                        streamToggle.classList.remove('active');
                    }
                } else {
                    showPanel('patternification-panel');
                    showPanel('intended-image-panel');
                    showPanel('output-coordinates-panel');
                    showPanel('stream-panel');
                }
            })
            .catch(error => {
                console.error('Image processing error:', error);
                
                // Handle error based on mode
                if (isMagicMode) {
                    // Magic Mode: Show error and reset to initial state
                    handleMagicModeError(
                        error, 
                        'convert', 
                        'Image conversion failed. Please try again with a different image or settings.'
                    );
                } else {
                    // Normal Mode: Just hide processing status and re-enable button
                    if (processingStatus) processingStatus.style.display = 'none';
                    if (generateButton) generateButton.disabled = false;
                }
            });
    }, 0);
}

// URL Parameter Functions (preserved)
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        apikey: params.get('apikey'),
        prompt: params.get('prompt'),
        run: params.get('run'),
        penup: params.get('penup')
    };
}

function fillInputsFromParams(params) {
    if (params.apikey) {
        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput) apiKeyInput.value = params.apikey;
        
        const magicApiKeyInput = document.getElementById('magic-api-key');
        if (magicApiKeyInput) magicApiKeyInput.value = params.apikey;
    }
    if (params.prompt) {
        const promptInput = document.getElementById('prompt');
        if (promptInput) promptInput.value = params.prompt;
    }
    if (params.penup) {
        const penUpToggle = document.getElementById('pen-up-toggle');
        if (penUpToggle) penUpToggle.checked = true;
    }
}

function setDefaultsForAutoGenerate() {
    const epsilonSlider = document.getElementById('epsilon-slider');
    const dotNumber = document.getElementById('dot-number');
    const noShortcuts = document.getElementById('no-shortcuts');
    const isLoop = document.getElementById('is-loop');
    const contourMode = document.getElementById('contour-mode');
    
    if (epsilonSlider) epsilonSlider.value = 0.5;
    if (dotNumber) dotNumber.value = 300;
    if (noShortcuts) noShortcuts.checked = true && !document.getElementById('pen-up-toggle').checked;
    if (isLoop) isLoop.checked = true;
    if (contourMode) contourMode.value = 'Tree';
    
    hiddenResponse();
}

function hiddenResponse() {
    const masterContainer = document.getElementById('master-container');
    const simpleContainer = document.getElementById('simple-container');
    
    if (masterContainer) masterContainer.style.display = 'none';
    if (simpleContainer) simpleContainer.style.visibility = 'visible';
}

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab system
    switchToTab('guided');
    
    // Debug helper: Press 'm' key to set transcription to 'draw a monkey'
    document.addEventListener('keydown', function(event) {
        if (event.key.toLowerCase() === 'm') {
            console.log('Debug: M key pressed - triggering voice result handler with "draw a monkey"');
            
            // Trigger the voice result handler as if "draw a monkey" was detected
            if (window.voiceRecognition && window.voiceRecognition.onResultCallback) {
                window.voiceRecognition.onResultCallback({
                    interim: 'draw a monkey',
                    final: 'draw a monkey',
                    confidence: 1.0,
                    drawDetected: true,
                    objectName: 'Monkey'
                });
            }
        }
    });
    
    // Initialize voice button state
    setVoiceButtonState('idle');
    
    // Update first box width CSS variable
    updateFirstBoxWidth();
    
    // Update first box width on window resize
    window.addEventListener('resize', updateFirstBoxWidth);
    
    // Set up event listeners for tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchToTab(tabName);
        });
    });
    
    // Set up voice mode buttons
    const magicModeBtn = document.getElementById('magic-mode');
    const guidedModeBtn = document.getElementById('guided-mode');
    if (magicModeBtn) magicModeBtn.addEventListener('click', switchToMagicMode);
    if (guidedModeBtn) guidedModeBtn.addEventListener('click', switchToGuidedMode);
    
    // Set up voice control buttons (for guided mode)
    const voiceButton = document.getElementById('voice-button');
    const cancelVoiceButton = document.getElementById('cancel-voice');
    if (voiceButton) voiceButton.addEventListener('click', startVoiceListening);
    if (cancelVoiceButton) cancelVoiceButton.addEventListener('click', stopVoiceListening);
    
    // Set up prompt input text change listener to mirror to Magic Panel
    const promptInput = document.getElementById('prompt');
    if (promptInput) {
        promptInput.addEventListener('input', (event) => {
            mirrorPromptToMagic(event.target.value);
        });
        console.log('Prompt input text change listener added');
    }
    
    // Set up copy coordinates button
    const copyCoordinatesButton = document.getElementById('copy-coordinates-button');
    if (copyCoordinatesButton) {
        copyCoordinatesButton.addEventListener('click', copyCoordinatesToClipboard);
    }
    
    // Set up API error dismiss button
    const dismissApiErrorButton = document.getElementById('dismiss-api-error');
    if (dismissApiErrorButton) {
        dismissApiErrorButton.addEventListener('click', hideApiError);
    }
    
    // Set up manual voice control button (handles both start and cancel)
    const manualVoiceButton = document.getElementById('manual-voice-button');
    if (manualVoiceButton) {
        manualVoiceButton.addEventListener('click', () => {
            console.log('Voice button clicked, current state:', voiceButtonState);
            
            switch (voiceButtonState) {
                case 'idle':
                    startVoiceListening();
                    break;
                case 'listening':
                    stopVoiceListening();
                    break;
                case 'paused':
                    resumeVoiceProcessing();
                    break;
            }
        });
    }
    
    // Set up GO button to work exactly like the microphone button
    const magicGoButton = document.getElementById('magic-go-button');
    if (magicGoButton) {
        magicGoButton.addEventListener('click', () => {
            // GO button now works exactly like the microphone button
            // It uses the same voice recognition system regardless of mode
            console.log('GO button clicked, current voice button state:', voiceButtonState);
            
            switch (voiceButtonState) {
                case 'idle':
                    startVoiceListening();
                    break;
                case 'listening':
                    stopVoiceListening();
                    break;
                case 'paused':
                    resumeVoiceProcessing();
                    break;
            }
        });
    }
    
    // Set up serial control buttons
    const connectSerialBtn = document.getElementById('connect-serial');
    const disconnectSerialBtn = document.getElementById('disconnect-serial');
    const startStreamingBtn = document.getElementById('start-streaming');
    const stopStreamingBtn = document.getElementById('stop-streaming');
    const prerequisitesConnectBtn = document.getElementById('prerequisites-connect-serial');
    
    if (connectSerialBtn) connectSerialBtn.addEventListener('click', connectSerial);
    if (disconnectSerialBtn) disconnectSerialBtn.addEventListener('click', disconnectSerial);
    if (startStreamingBtn) startStreamingBtn.addEventListener('click', startStreaming);
    if (stopStreamingBtn) stopStreamingBtn.addEventListener('click', stopStreaming);
    if (prerequisitesConnectBtn) prerequisitesConnectBtn.addEventListener('click', connectSerial);
    
    // Initialize button states (disconnected by default)
    if (connectSerialBtn) connectSerialBtn.disabled = false;
    if (disconnectSerialBtn) disconnectSerialBtn.disabled = true;
    if (startStreamingBtn) startStreamingBtn.disabled = true;
    if (stopStreamingBtn) stopStreamingBtn.disabled = true;
    
    // Set up input mode switching
    document.querySelectorAll('input[name="input-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            switchInputMode(e.target.value);
        });
    });
    
    // Set up prompt input mode switching
    document.querySelectorAll('input[name="prompt-input-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            switchPromptMode(e.target.value);
        });
    });
    
    // Set up coordinates textarea listener
    const coordinatesTextarea = document.getElementById('coordinates-text');
    if (coordinatesTextarea) {
        coordinatesTextarea.addEventListener('input', () => {
            const continueButton = document.getElementById('continue-coordinates-button');
            if (continueButton) {
                const hasText = coordinatesTextarea.value.trim().length > 0;
                continueButton.style.display = hasText ? 'block' : 'none';
                console.log('Textarea input - Continue button:', { hasText, display: hasText ? 'block' : 'none' });
            }
        });
    }
    
    // Set up drag and drop
    setupDragAndDrop();
    
    // Set up file input
    const fileInput = document.getElementById('file-input');
    const fileButton = document.getElementById('file-button');
    const fileNameDisplay = document.getElementById('file-name');
    
    if (fileButton) {
        fileButton.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });
    }
    
    // Set up generate buttons
    const generateButton = document.getElementById('generate-button');
    const genImageButton = document.getElementById('gen-image-button');
    const voiceGenImageButton = document.getElementById('voice-gen-image-button');
    const continueCoordinatesButton = document.getElementById('continue-coordinates-button');
    
    if (generateButton) generateButton.addEventListener('click', convertImage);
    if (genImageButton) {
        genImageButton.addEventListener('click', () => {
            console.log('=== GENERATE BUTTON CLICKED ===');
            console.log('Text mode checked:', document.getElementById('text-prompt-mode').checked);
            console.log('Voice mode checked:', document.getElementById('voice-prompt-mode').checked);
            
            const apiKey = document.getElementById('api-key').value;
            const prompt = document.getElementById('prompt').value + (document.getElementById('googly-eyes').checked ? ' with disproportionately large googly eyes' : '');
            
            // Show the Source Image panel immediately
            showPanel('image-panel');
            
            // Start shimmer animation on the image container
            const imageContainer = document.querySelector('.image-container');
            if (imageContainer) {
                imageContainer.classList.add('shimmer');
                
                // Add floating particles for teleporter effect
                for (let i = 0; i < 4; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.top = Math.random() * 100 + '%';
                    imageContainer.appendChild(particle);
                }
            }
            
            generateImage(apiKey, prompt, false);
        });
    }
    if (voiceGenImageButton) {
        voiceGenImageButton.addEventListener('click', generateVoiceImage);
    }
    if (continueCoordinatesButton) {
        continueCoordinatesButton.addEventListener('click', continueFromCoordinates);
    }
    
    // Settings toggles are handled by onclick in HTML, no need for addEventListener
    
    // Set up epsilon slider
    const epsilonSlider = document.getElementById('epsilon-slider');
    const epsilonValueDisplay = document.getElementById('epsilon-value-display');
    if (epsilonSlider && epsilonValueDisplay) {
        epsilonSlider.addEventListener('input', () => {
            epsilonValueDisplay.textContent = epsilonSlider.value;
        });
    }
    
    // Set up prerequisites checking for Magic Mode
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', updateAllUIState);
    }
    
    // Check prerequisites when serial connection changes
    if (connectSerialBtn) {
        const originalConnect = connectSerialBtn.onclick;
        connectSerialBtn.onclick = async function() {
            await originalConnect();
            checkMagicModePrerequisites();
        };
    }
    
    if (disconnectSerialBtn) {
        const originalDisconnect = disconnectSerialBtn.onclick;
        disconnectSerialBtn.onclick = async function() {
            await originalDisconnect();
            checkMagicModePrerequisites();
        };
    }
    
    // Set up incompatible options
    const noShortcutsCheckbox = document.getElementById('no-shortcuts');
    const penUpToggleCheckbox = document.getElementById('pen-up-toggle');
    
    function handleIncompatibleOptions() {
        if (noShortcutsCheckbox.checked && penUpToggleCheckbox.checked) {
            if (this === noShortcutsCheckbox) {
                penUpToggleCheckbox.checked = false;
            } else {
                noShortcutsCheckbox.checked = false;
            }
        }
        
        noShortcutsCheckbox.disabled = penUpToggleCheckbox.checked;
        penUpToggleCheckbox.disabled = noShortcutsCheckbox.checked;
    }
    
    if (noShortcutsCheckbox) noShortcutsCheckbox.addEventListener('change', handleIncompatibleOptions);
    if (penUpToggleCheckbox) penUpToggleCheckbox.addEventListener('change', handleIncompatibleOptions);
    
    // Set up plot button
    const plotButton = document.getElementById('plotButton');
    if (plotButton) plotButton.addEventListener('click', plotNextContour);
    
    // Handle URL parameters
    const { apikey, prompt, run, penup } = getUrlParams();
    fillInputsFromParams({ apikey, prompt, penup });
    
    if (apikey) {
        // Hide API key input and label when API key is provided in URL
        const apiKeyInput = document.getElementById('api-key');
        const apiKeyLabel = apiKeyInput ? apiKeyInput.previousElementSibling : null;
        
        if (apiKeyInput) {
            apiKeyInput.style.display = 'none';
        }
        if (apiKeyLabel && apiKeyLabel.tagName === 'LABEL') {
            apiKeyLabel.style.display = 'none';
        }
    }
    
    if (apikey && prompt && run) {
        setDefaultsForAutoGenerate();
        generateImage(apikey, prompt, run);
        convertImage();
    }
});

// Magic Mode Voice Control Functions
function startMagicVoiceListening() {
    console.log('startMagicVoiceListening called');
    if (window.voiceRecognition) {
        window.voiceRecognition.start();
        console.log('Voice recognition started');
        // Don't update button since Magic Panel handles its own UI
    } else {
        console.log('Voice recognition not available');
    }
}

function stopMagicVoiceListening() {
    if (window.voiceRecognition) {
        window.voiceRecognition.stop();
        // Don't update button since Magic Panel handles its own UI
    }
}

function updateMagicVoiceButton(listening) {
    const voiceButton = document.getElementById('magic-voice-button');
    const buttonText = voiceButton.querySelector('.button-text');
    const buttonSubtext = voiceButton.querySelector('.button-subtext');
    
    if (listening) {
        voiceButton.classList.add('listening');
        buttonText.textContent = 'Listening...';
        buttonSubtext.style.display = 'block';
        voiceButton.disabled = false; // Keep enabled so it can be clicked to cancel
    } else {
        voiceButton.classList.remove('listening');
        buttonText.textContent = 'Ask by Voice';
        buttonSubtext.style.display = 'none';
        voiceButton.disabled = false;
    }
}

// Make functions globally available
window.switchToTab = switchToTab;
window.toggleSettings = toggleSettings;
window.toggleVoiceSettings = toggleVoiceSettings;
window.toggleStreamPanel = toggleStreamPanel;
window.toggleStreamPanel = toggleStreamPanel;