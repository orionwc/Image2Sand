/*
 * Image2Sand - UI Layer for converting images to sand table coordinates
 * 
 * This script handles the user interface and calls the image2path.js library
 * for the actual image processing algorithms.
 */

let currentContourIndex = 0;
let isFirstClick = true;
let originalImageElement = null;
let isGeneratingImage = false;
let isGeneratingCoords = false;
let orderedContoursSave = [];

function drawAndPrepImage(imgElement) {
    const canvas = document.getElementById('original-image');
    const ctx = canvas.getContext('2d');
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    ctx.drawImage(imgElement, 0, 0);

    // Set originalImageElement to the current image
    originalImageElement = imgElement;

    // Enable Generate button
    document.getElementById('generate-button').disabled = false;
}

async function generateImage(apiKey, prompt, autoprocess) {
    if (isGeneratingImage) {
        document.getElementById('generation-status').textContent = "Image is still generating - please don't press the button."; 
    } else {
        isGeneratingImage = true;
        document.getElementById('gen-image-button').disabled = true;
        document.getElementById('generation-status').style.display = 'block';
        try {

            const fullPrompt = `Draw an image of the following: ${prompt}. But make it a simple black silhouette on a white background, with very minimal detail and no additional content in the image, so I can use it for a computer icon.`;

            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'dall-e-3',
                    prompt: fullPrompt,
                    size: '1024x1024',
                    quality: 'standard',
                    response_format: 'b64_json', // Specify base64 encoding
                    n: 1
                })
            });

            const data = await response.json();
            if ('error' in data) {
                throw new Error(data.error.message);
            }
            const imageData = data.data[0].b64_json;

            console.log("Image Data: ", imageData);

            const imgElement = new Image();
            imgElement.onload = function() {
                drawAndPrepImage(imgElement);
                if (autoprocess) {
                    convertImage();
                }
            };
            imgElement.src = `data:image/png;base64,${imageData}`;

            console.log(`Image generated successfully`);
        } catch (error) {
            console.error('Image generation error:', error);
        }
        isGeneratingImage = false;
        document.getElementById('generation-status').style.display = 'none';
        document.getElementById('generation-status').textContent = "Image is generating - please wait...";
        document.getElementById('gen-image-button').disabled = false;
    }
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
            document.getElementById('original-image').appendChild(originalImageElement);
        }
        originalImageElement.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

function plotNextContour() {
    const canvas = document.getElementById('plotcontours');
    const ctx = canvas.getContext('2d');

    if (isFirstClick) {
        // Clear the canvas on first click
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isFirstClick = false;
    }

    console.log('Cur Contour: ', currentContourIndex + '/' + orderedContoursSave.length + ":", JSON.stringify(orderedContoursSave[currentContourIndex]));

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

                // Calculate color fade
                const ratio = i / length;
                const fadedColor = `rgb(${Math.round(r * (1 - ratio))}, ${Math.round(g * (1 - ratio))}, ${Math.round(b * (1 - ratio))})`;
                ctx.strokeStyle = fadedColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
            }
        });

        // Mark the start and end points
        ctx.fillStyle = baseColor;
        ctx.font = '12px Arial';

        // Start point
        ctx.fillText(`S${currentContourIndex + 1}`, contour[0].x, contour[0].y);
        ctx.beginPath();
        ctx.arc(contour[0].x, contour[0].y, 3, 0, 2 * Math.PI);
        ctx.fill();

        // End point
        ctx.fillText(`E${currentContourIndex + 1}`, contour[contour.length - 1].x, contour[contour.length - 1].y);
        ctx.beginPath();
        ctx.arc(contour[contour.length - 1].x, contour[contour.length - 1].y, 3, 0, 2 * Math.PI);
        ctx.fill();

        // Label the contour with its number
        const midPoint = contour[Math.floor(contour.length / 2)];
        ctx.fillText(`${currentContourIndex + 1}`, midPoint.x, midPoint.y);

        // Increment the contour index
        currentContourIndex++;
    } else {
        alert("All contours have been plotted. Starting over.");
        currentContourIndex = 0; // Reset the index
        isFirstClick = true; // Reset the first click flag
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
    // Reset transformation matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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

                // Calculate color fade
                const ratio = i / length;
                const fadedColor = `rgb(${Math.round(r * (1 - ratio))}, ${Math.round(g * (1 - ratio))}, ${Math.round(b * (1 - ratio))})`;
                ctx.strokeStyle = fadedColor;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
            }
        });

        // Mark the start and end points
        ctx.fillStyle = baseColor;
        ctx.font = '12px Arial';

        // Start point
        ctx.fillText(`S${index + 1}`, contour[0].x, contour[0].y);
        ctx.beginPath();
        ctx.arc(contour[0].x, contour[0].y, 3, 0, 2 * Math.PI);
        ctx.fill();

        // End point
        ctx.fillText(`E${index + 1}`, contour[contour.length - 1].x, contour[contour.length - 1].y);
        ctx.beginPath();
        ctx.arc(contour[contour.length - 1].x, contour[contour.length - 1].y, 3, 0, 2 * Math.PI);
        ctx.fill();

        // Label the contour with its number
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
    const canvas = document.getElementById('dot-image'), ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width, height = canvas.height;
    const scaleX = width / originalImageElement.width;
    const scaleY = height / originalImageElement.height;
    const scale = Math.min(scaleX, scaleY);

    let allPolarPoints = [];
    
    if (penUpEnabled && contours) {
        // Pen-up mode: process contours individually to maintain structure
        console.log('Processing contours in pen-up mode. Number of contours:', contours.length);
        
        // First, scale all points together to maintain coordinate relationships
        const allScaledPoints = [];
        for (let i = 0; i < contours.length; i++) {
            const contour = contours[i];
            console.log(`Processing contour ${i}:`, contour.length, 'points');
            
            // Scale the contour points for display
            const scaledContour = contour.map(p => ({ 
                x: (p.x) * scale, 
                y: (p.y) * scale 
            }));
            
            // Draw the scaled points
            scaledContour.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                ctx.fill();
            });
            
            allScaledPoints.push(...scaledContour);
        }
        
        // Calculate polar coordinates for ALL points together (maintains relationships)
        allPolarPoints = calculatePolarCoordinates(allScaledPoints);
        console.log('Total polar points after processing:', allPolarPoints.length);
        
        // Now insert pen-up commands between contours
        let currentIndex = 0;
        for (let i = 0; i < contours.length - 1; i++) {
            const contourLength = contours[i].length;
            currentIndex += contourLength;
            
            // Insert pen-up (repeat the last coordinate of this contour)
            const penUpPoint = allPolarPoints[currentIndex - 1];
            allPolarPoints.splice(currentIndex, 0, penUpPoint);
            console.log(`Added pen-up after contour ${i} at index ${currentIndex}`);
            currentIndex++; // Account for the inserted point
        }
        
        // If loop drawing is enabled, add a pen-up command at the end to return to start
        const isLoopEnabled = document.getElementById('is-loop').checked;
        if (isLoopEnabled) {
            const lastPoint = allPolarPoints[allPolarPoints.length - 1];
            allPolarPoints.push(lastPoint);
            console.log('Added pen-up at end for loop drawing');
        }
        
        console.log('Final total polar points with pen-up:', allPolarPoints.length);
    } else {
        // Normal mode: process flattened points
        // Scale the points for display
        const scaledPoints = points.map(p => ({ x: (p.x) * scale, y: (p.y) * scale }));

        // Draw the scaled points
        scaledPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Calculate polar coordinates using the helper function
        allPolarPoints = calculatePolarCoordinates(scaledPoints);
    }
    
    return allPolarPoints;
}



function drawConnections(polarPoints) {
    const canvas = document.getElementById('connect-image'), ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width, height = canvas.height;

    // Reset transformation matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Translate the context to the center of the canvas
    ctx.translate(width / 2, height / 2);

    // Scale the points based on the size of the original image
    const scaleX = width / 2000; // Since the circle radius is 1000
    const scaleY = height / 2000;
    const scale = Math.min(scaleX, scaleY);

    // Draw the outline circle
    ctx.beginPath();
    ctx.arc(0, 0, 1000 * scale, 0, 2 * Math.PI);
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // Check if pen-up mode is enabled
    const penUpEnabled = document.getElementById('pen-up-toggle').checked;

    // Draw the connections based on polar coordinates
    console.log('Drawing connections for', polarPoints.length, 'points');
    for (let i = 0; i < polarPoints.length - 1; i++) {
        const p1 = polarPoints[i];
        const p2 = polarPoints[i + 1];
        
        console.log(`Segment ${i}:`, p1, '->', p2);

        // Convert from tenths of degrees to radians for visualization
        const theta1 = p1.theta * Math.PI / 1800;
        const theta2 = p2.theta * Math.PI / 1800;

        // Adjust y-coordinate calculation to invert the y-axis
        const x1 = p1.r * Math.cos(theta1) * scale;
        const y1 = -p1.r * Math.sin(theta1) * scale;
        const x2 = p2.r * Math.cos(theta2) * scale;
        const y2 = -p2.r * Math.sin(theta2) * scale;

        // Determine if this is a pen-up section (repeated coordinates)
        let isPenUp = false;
        let shouldDrawLightGrey = false;
        if (penUpEnabled) {
            // For pen-up mode, we'll use a simple heuristic: 
            // if coordinates are repeated (same r and theta), it's a pen-up section
            // Add small tolerance for floating point precision
            const tolerance = 0.1;
            isPenUp = (Math.abs(p1.r - p2.r) < tolerance && Math.abs(p1.theta - p2.theta) < tolerance);
            if (isPenUp) {
                console.log(`Pen-up detected at segment ${i}:`, p1, p2);
                console.log(`Skipping line between repeated coordinates`);
                continue; // Skip drawing this line entirely
            }
            
            // Check if the previous segment was a pen-up (repeated coordinates)
            // If so, draw this line in light grey
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

        // Set color based on pen state
        if (shouldDrawLightGrey) {
            ctx.strokeStyle = '#D3D3D3'; // Light grey for pen-up sections
            ctx.lineWidth = 1; // Thinner line for pen-up
        } else {
            // Calculate the color for each segment, but skip pen-up segments for gradient
            // Count only the real drawing segments (excluding pen-up segments)
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
            
            // Calculate total real segments for gradient
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
            
            // Calculate the color for this real segment
            const t = realSegmentIndex / Math.max(1, totalRealSegments - 1);
            ctx.strokeStyle = `hsl(${t * 270}, 100%, 50%)`; // 270 degrees covers red to violet
            ctx.lineWidth = 2; // Normal line width for pen-down sections
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

function convertImage() {
    if (!originalImageElement) return;
    
    // UI status updates
    document.getElementById('processing-status').style.display = 'block';
    document.getElementById('generate-button').disabled = true;
    
    // Read UI values and create config
    const config = {
        epsilon: parseFloat(document.getElementById('epsilon-slider').value),
        contourMode: document.getElementById('contour-mode').value,
        isLoop: document.getElementById('is-loop').checked,
        minimizeJumps: document.getElementById('no-shortcuts').checked,
        outputFormat: parseInt(document.getElementById('output-type').value),
        maxPoints: parseInt(document.getElementById('dot-number').value),
        penUpEnabled: document.getElementById('pen-up-toggle').checked
    };
    
    // Use setTimeout to allow the UI to update
    setTimeout(() => {
        // Call library function
        convertImageToPath(originalImageElement, config)
            .then(result => {
                // Use the pre-computed formatted string for the textarea
                document.getElementById('polar-coordinates-textarea').value = result.formattedString;
                document.getElementById('simple-coords').textContent = result.formattedString;
                document.getElementById('simple-coords-title').style = 'visibility: hidden';
                
                // UI-specific display updates
                // Clear canvases before drawing new image
                resetCanvas('dot-image');
                resetCanvas('connect-image');
                
                // Use library results directly for display
                plotContours(result.processedContours);
                orderedContoursSave = result.processedContours;
                
                // Draw dots using UI function for display
                const penUpEnabled = document.getElementById('pen-up-toggle').checked;
                const isLoopEnabled = document.getElementById('is-loop').checked;
                const displayPolarPoints = drawDots(result.orderedPoints, penUpEnabled, result.processedContours);
                
                drawConnections(displayPolarPoints);
                
                document.getElementById('total-points').innerText = `(${result.orderedPoints.length} Points)`;
                
                // Cleanup library's edgeImage
                result.edgeImage.delete();
                
                // Hide processing status
                document.getElementById('processing-status').style.display = 'none';
                document.getElementById('generate-button').disabled = false;
            })
            .catch(error => {
                console.error('Image processing error:', error);
                // Hide processing status on error
                document.getElementById('processing-status').style.display = 'none';
                document.getElementById('generate-button').disabled = false;
            });
    }, 0);
    
    // Ensure grid height does not exceed 70% of the viewport height
    const gridHeight = document.querySelector('.grid').clientHeight;
    const viewportHeight = window.innerHeight * 0.7;
    if (gridHeight > viewportHeight) {
        document.querySelector('.grid').style.height = `${viewportHeight}px`;
    }
}

// Function to get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        apikey: params.get('apikey'),
        prompt: params.get('prompt'),
        run: params.get('run'),
        penup: params.get('penup')
    };
}

// Function to fill inputs from URL parameters
function fillInputsFromParams(params) {
    if (params.apikey) {
        document.getElementById('api-key').value = params.apikey;
    }
    if (params.prompt) {
        document.getElementById('prompt').value = params.prompt;
    }
    if (params.penup) {
        document.getElementById('pen-up-toggle').checked = true;
    }
}

function setDefaultsForAutoGenerate() {
    document.getElementById('epsilon-slider').value = 0.5;
    document.getElementById('dot-number').value = 300;
    document.getElementById('no-shortcuts').checked = true && !document.getElementById('pen-up-toggle').checked;
    document.getElementById('is-loop').checked = true;
    document.getElementById('contour-mode').value = 'Tree';
    hiddenResponse();
}

function hiddenResponse() {
    document.getElementById('master-container').style = 'display: none;';
    document.getElementById('simple-container').style = 'visibility: visible';
}

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const fileButton = document.getElementById('file-button');
    const fileNameDisplay = document.getElementById('file-name');
    const generateButton = document.getElementById('generate-button');
    const epsilonSlider = document.getElementById('epsilon-slider');
    const epsilonValueDisplay = document.getElementById('epsilon-value-display');
    const dotNumberInput = document.getElementById('dot-number');
    const contourModeSelect = document.getElementById('contour-mode');

    // Add event listeners for incompatible options
    const noShortcutsCheckbox = document.getElementById('no-shortcuts');
    const penUpToggleCheckbox = document.getElementById('pen-up-toggle');

    // Function to handle incompatible options
    function handleIncompatibleOptions() {
        if (noShortcutsCheckbox.checked && penUpToggleCheckbox.checked) {
            // If both are checked, uncheck the one that wasn't just clicked
            if (this === noShortcutsCheckbox) {
                penUpToggleCheckbox.checked = false;
            } else {
                noShortcutsCheckbox.checked = false;
            }
        }
        
        // Update disabled states
        noShortcutsCheckbox.disabled = penUpToggleCheckbox.checked;
        penUpToggleCheckbox.disabled = noShortcutsCheckbox.checked;
    }

    // Add event listeners
    noShortcutsCheckbox.addEventListener('change', handleIncompatibleOptions);
    penUpToggleCheckbox.addEventListener('change', handleIncompatibleOptions);

    document.getElementById('plotButton').addEventListener('click', plotNextContour);

    generateButton.addEventListener('click', convertImage);

    fileButton.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            handleImageUpload(event);
        }
    });

    epsilonSlider.addEventListener('input', function() {
        epsilonValueDisplay.textContent = epsilonSlider.value;
    });

    window.showTab = function(tabName) {
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => { content.style.display = 'none'; });
        document.getElementById(tabName).style.display = 'block'; 
    };

});

// Initialize the page with URL parameters if present
document.addEventListener('DOMContentLoaded', (event) => {
    const { apikey, prompt, run, penup } = getUrlParams();

    // Fill inputs with URL parameters if they exist
    fillInputsFromParams({ apikey, prompt, penup });
    if (apikey) {  
        document.getElementById('api-key-group').style.display = 'none'; 
    }

    // Generate image if all parameters are present
    if (apikey && prompt && run) {
        setDefaultsForAutoGenerate();
        generateImage(apikey, prompt, run);
        convertImage();
    }

    // Add event listener to the button inside the DOMContentLoaded event
    document.getElementById('gen-image-button').addEventListener('click', () => {
        let apiKey = document.getElementById('api-key').value;
        const prompt = document.getElementById('prompt').value + (document.getElementById('googly-eyes').checked ? ' with disproportionately large googly eyes' : '');
        generateImage(apiKey, prompt, false);
    });
    
});
