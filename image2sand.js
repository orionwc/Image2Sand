class PriorityQueue {
    constructor() {
        this.nodes = [];
    }

    enqueue(priority, key) {
        this.nodes.push({ key, priority });
        this.sort();
    }

    dequeue() {
        return this.nodes.shift();
    }

    sort() {
        this.nodes.sort((a, b) => a.priority - b.priority);
    }

    isEmpty() {
        return !this.nodes.length;
    }
}


let currentContourIndex = 0;
let isFirstClick = true;
let originalImageElement = null;
let isGeneratingImage = false;
let isGeneratingCoords = false;

function drawAndProcessImage(imgElement) {
    const canvas = document.getElementById('original-image');
    const ctx = canvas.getContext('2d');
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    ctx.drawImage(imgElement, 0, 0);

    // Set originalImageElement to the current image
    originalImageElement = imgElement;

    // Process the image after drawing it on the canvas
    processImage(originalImageElement);

    // Ensure grid height does not exceed 70% of the viewport height
    const gridHeight = document.querySelector('.grid').clientHeight;
    const viewportHeight = window.innerHeight * 0.7;
    if (gridHeight > viewportHeight) {
        document.querySelector('.grid').style.height = `${viewportHeight}px`;
    }
}


async function generateImage(apiKey, prompt) {
    if (isGeneratingImage) {
        document.getElementById('generation-status').textContent = "Image is still generating - please don't press the button."; 
    } else {
        isGeneratingImage = true;
        document.getElementById('gen-image-button').disabled = true;
        document.getElementById('generation-status').style.display = 'block';
        try {

            const fullPrompt = `Draw an image of the following: ${prompt}. But make it a simple black silhouette on a white background, with minimal details, like a coloring book for a 5-year-old where the image is already colored black.`;

            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'dall-e-2',
                    prompt: fullPrompt,
                    size: '256x256',
                    quality: 'standard',
                    response_format: 'b64_json', // Specify base64 encoding
                    n: 1
                })
            });

            const data = await response.json();
            //const imageUrl = data.data[0].url;
            const imageData = data.data[0].b64_json;

            console.log("Image Data: ", imageData);

            const imgElement = new Image();
            imgElement.onload = function() {
                drawAndProcessImage(imgElement);
            };
            imgElement.src = `data:image/png;base64,${imageData}`;

            console.log(`Image generated successfully`);
        } catch (error) {
            console.error('Error:', error);
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
                drawAndProcessImage(originalImageElement);
            };
            document.getElementById('original-image').appendChild(originalImageElement);
        }
        originalImageElement.src = e.target.result;
    };

    reader.readAsDataURL(file);
}


function processImage(imgElement) {
    document.getElementById('processing-status').style.display = 'block';
    document.getElementById('generate-button').disabled = true;

    // Use setTimeout to allow the UI to update
    setTimeout(() => {
        const src = cv.imread(imgElement), dst = new cv.Mat();
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
        cv.Canny(src, dst, 50, 150, 3, false);

        // Add morphological operations
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        cv.dilate(dst, dst, kernel);
        cv.erode(dst, dst, kernel);
        // Invert the colors of the detected edges image
        cv.bitwise_not(dst, dst);

        cv.imshow('edge-image', dst);
        cv.bitwise_not(dst, dst);
        generateDots(dst);
        src.delete(); dst.delete();

        // Hide the processing status label
        document.getElementById('processing-status').style.display = 'none';
        document.getElementById('generate-button').disabled = false;
    }, 0); // Set delay to 0 to allow the UI to update
}



function adjustEpsilon(epsilon, pointsOver) {
    if (pointsOver > 100) {
        return epsilon + 1.0;
    } else if (pointsOver <= 20) {
        return epsilon + 0.1;
    } else {
        // Scale adjustment for points over the target between 20 and 100
        let scale = (pointsOver - 20) / (100 - 20); // Normalized to range 0-1
        return epsilon + 0.1 + 0.9 * scale;  // Adjust between 0.1 and 1.0
    }
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


function findNearestPoint(lastPoint, contours, visitedPoints) {
    let nearestPoint = null;
    let nearestDistance = Infinity;

    contours.forEach(contour => {
        contour.forEach(point => {
            if (!point || visitedPoints.has(JSON.stringify(point))) return;

            const distance = Math.sqrt(
                Math.pow(lastPoint.x - point.x, 2) + 
                Math.pow(lastPoint.y - point.y, 2)
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPoint = point;
            }
        });
    });

    return nearestPoint;
}


function findMaximalCenter(points) {
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const width = maxX - minX;
    const height = maxY - minY;

    return { centerX, centerY, width, height };
}


function calculateCentroid(points) {
    let sumX = 0, sumY = 0;
    points.forEach(p => {
        sumX += p.x;
        sumY += p.y;
    });
    return { x: sumX / points.length, y: sumY / points.length };
}


function calculateDistances(contours) {
    const distances = [];

    for (let i = 0; i < contours.length; i++) {
        distances[i] = [];
        for (let j = 0; j < contours.length; j++) {
            if (i !== j) {
                const startToStart = Math.hypot(contours[i][0].x - contours[j][0].x, contours[i][0].y - contours[j][0].y);
                const startToEnd = Math.hypot(contours[i][0].x - contours[j][contours[j].length - 1].x, contours[i][0].y - contours[j][contours[j].length - 1].y);
                const endToStart = Math.hypot(contours[i][contours[i].length - 1].x - contours[j][0].x, contours[i][contours[i].length - 1].y - contours[j][0].y);
                const endToEnd = Math.hypot(contours[i][contours[i].length - 1].x - contours[j][contours[j].length - 1].x, contours[i][contours[i].length - 1].y - contours[j][contours[j].length - 1].y);
                distances[i][j] = Math.min(startToStart, startToEnd, endToStart, endToEnd);
            }
        }
    }

    return distances;
}


function tspNearestNeighbor(distances, contours) {
    const path = [0];
    const visited = new Set([0]);

    while (path.length < contours.length) {
        let last = path[path.length - 1];
        let nearest = -1;
        let nearestDistance = Infinity;

        for (let i = 0; i < contours.length; i++) {
            if (!visited.has(i) && distances[last][i] < nearestDistance) {
                nearestDistance = distances[last][i];
                nearest = i;
            }
        }

        if (nearest !== -1) {
            path.push(nearest);
            visited.add(nearest);
        }
    }

    return path;
}


function reorderContours(contours, path) {
    const orderedContours = [];
    console.log("Path:", path); // Debugging

    for (let i = 0; i < path.length; i++) {
        const contourIndex = path[i];
        const contour = contours[contourIndex];

        // Determine the direction to use the contour
        if (i > 0) {
            const prevContour = orderedContours[orderedContours.length - 1];
            const prevPoint = prevContour[prevContour.length - 1];

            if (prevPoint && contour[0]) {
                const startToStart = Math.hypot(prevPoint.x - contour[0].x, prevPoint.y - contour[0].y);
                const startToEnd = Math.hypot(prevPoint.x - contour[contour.length - 1].x, prevPoint.y - contour[contour.length - 1].y);

                if (startToEnd < startToStart) {
                    contour.reverse();
                }
                
            } else {
                console.error('Previous point or current contour start point is undefined.', { prevPoint, currentStart: contour[0] });
                continue; // Skip if any point is undefined
            }
        }

        orderedContours.push(contour);
    }

    return orderedContours;
}


function findClosestPoint(contours, point) {
    let minDistance = Infinity;
    let closestPoint = null;

    contours.forEach(contour => {
        contour.forEach(pt => {
            const distance = Math.hypot(point.x - pt.x, point.y - pt.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = pt;
            }
        });
    });
    return closestPoint;
}


function createGraphFromContours(contours) {
    const graph = [];

    contours.forEach(contour => {
        contour.forEach(pt => {
            let node = graph.find(n => n.x === pt.x && n.y === pt.y);
            if (!node) {
                node = { x: pt.x, y: pt.y, neighbors: [] };
                graph.push(node);
            }
        });
    });

    contours.forEach(contour => {
        for (let i = 0; i < contour.length; i++) {
            const node = graph.find(n => n.x === contour[i].x && n.y === contour[i].y);
            if (i > 0) {
                const prevNode = graph.find(n => n.x === contour[i - 1].x && n.y === contour[i - 1].y);
                if (!node.neighbors.includes(prevNode)) {
                    node.neighbors.push(prevNode);
                    prevNode.neighbors.push(node);
                }
            }
        }
    });

    // Connect nodes from different contours within a small distance threshold
    const threshold = 1;
    graph.forEach(node => {
        graph.forEach(otherNode => {
            if (node !== otherNode && !node.neighbors.includes(otherNode)) {
                const distance = Math.hypot(node.x - otherNode.x, node.y - otherNode.y);
                if (distance <= threshold) {
                    node.neighbors.push(otherNode);
                    otherNode.neighbors.push(node);
                }
            }
        });
    });

    return graph;
}


function addStartEndToGraph(graph, start, end) {
    let startIdx = graph.findIndex(pt => pt.x === start.x && pt.y === start.y);
    if (startIdx === -1) {
        startIdx = graph.length;
        graph.push({ x: start.x, y: start.y, neighbors: [] });
    }

    let endIdx = graph.findIndex(pt => pt.x === end.x && pt.y === end.y);
    if (endIdx === -1) {
        endIdx = graph.length;
        graph.push({ x: end.x, y: end.y, neighbors: [] });
    }

    // Connect start point to nearest nodes as jumps
    graph.forEach((node, idx) => {
        if (idx !== startIdx) {
            const distanceToStart = Math.hypot(start.x - node.x, start.y - node.y);
            graph[startIdx].neighbors.push({ node, isJump: true, jumpDistance: distanceToStart });
            node.neighbors.push({ node: graph[startIdx], isJump: true, jumpDistance: distanceToStart });
        }
    });

    // Connect end point to nearest nodes as jumps
    graph.forEach((node, idx) => {
        if (idx !== endIdx) {
            const distanceToEnd = Math.hypot(end.x - node.x, end.y - node.y);
            graph[endIdx].neighbors.push({ node, isJump: true, jumpDistance: distanceToEnd });
            node.neighbors.push({ node: graph[endIdx], isJump: true, jumpDistance: distanceToEnd });
        }
    });

    return { startIdx, endIdx };
}


function dijkstraWithMinimalJumps(graph, startIdx, endIdx) {
    const distances = Array(graph.length).fill(Infinity);
    const previous = Array(graph.length).fill(null);
    const totalJumpDistances = Array(graph.length).fill(Infinity);
    const priorityQueue = new PriorityQueue();

    distances[startIdx] = 0;
    totalJumpDistances[startIdx] = 0;
    priorityQueue.enqueue(0, startIdx);

    while (!priorityQueue.isEmpty()) {
        const { key: minDistanceNode } = priorityQueue.dequeue();

        if (minDistanceNode === endIdx) break;

        const currentNode = graph[minDistanceNode];
        currentNode.neighbors.forEach(neighbor => {
            const neighborIdx = graph.findIndex(pt => pt.x === neighbor.node.x && pt.y === neighbor.node.y);
            const jumpDistance = neighbor.isJump ? neighbor.jumpDistance : 0;
            const alt = distances[minDistanceNode] + Math.hypot(currentNode.x - neighbor.node.x, currentNode.y - neighbor.node.y);
            const totalJumpDist = totalJumpDistances[minDistanceNode] + jumpDistance;

            if (totalJumpDist < totalJumpDistances[neighborIdx] || (totalJumpDist === totalJumpDistances[neighborIdx] && alt < distances[neighborIdx])) {
                distances[neighborIdx] = alt;
                previous[neighborIdx] = minDistanceNode;
                totalJumpDistances[neighborIdx] = totalJumpDist;
                priorityQueue.enqueue(totalJumpDist, neighborIdx);
            }
        });

    }

    const path = [];
    let u = endIdx;

    while (u !== null) {
        path.unshift({ x: graph[u].x, y: graph[u].y });
        u = previous[u];
    }

    return path;
}


function checkContourClosure(contour) {
    const firstPoint = { x: contour.intPtr(0)[0], y: contour.intPtr(0)[1] };
    const lastPoint = { x: contour.intPtr(contour.rows - 1)[0], y: contour.intPtr(contour.rows - 1)[1] };
    return firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y;
}


function closeContour(points) {
    if (points.length > 1 && (points[0].x !== points[points.length - 1].x || points[0].y !== points[points.length - 1].y)) {
        points.push({ x: points[0].x, y: points[0].y });
    }
    return points;
}


function adjustEpsilon(epsilon, pointsOver) {
    if (pointsOver > 100) {
        return epsilon + 1.0;
    } else if (pointsOver <= 20) {
        return epsilon + 0.1;
    } else {
        // Scale adjustment for points over the target between 20 and 100
        let scale = (pointsOver - 20) / (100 - 20); // Normalized to range 0-1
        return epsilon + 0.1 + 0.9 * scale;  // Adjust between 0.1 and 1.0
    }
}


function getOrderedContours(edgeImage, initialEpsilon, retrievalMode, maxPoints) {
    const contours = new cv.MatVector(), hierarchy = new cv.Mat();
    cv.findContours(edgeImage, contours, hierarchy, retrievalMode, cv.CHAIN_APPROX_SIMPLE);
    
    const maxIterations = 100;  // Maximum iterations to avoid infinite loop

    let contourPoints = [];
    let totalPoints = 0;
    let epsilon = initialEpsilon;
    let iterations = 0;

    do {
        totalPoints = 0;
        contourPoints = [];
        
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const simplified = new cv.Mat();
            cv.approxPolyDP(contour, simplified, epsilon, true);

            let points = [];
            for (let j = 0; j < simplified.rows; j++) {
                const point = simplified.intPtr(j);
                points.push({ x: point[0], y: point[1] });
            }
            simplified.delete();

            if (points.length > 0) {  // Check for empty contours
                if (checkContourClosure(contour)) {
                    points = closeContour(points);
                }
                contourPoints.push(points);
                totalPoints += points.length;
            }
        }

        if (totalPoints > maxPoints) {
            let pointsOver = totalPoints - maxPoints;
            epsilon = adjustEpsilon(epsilon, pointsOver);
            iterations++;
        }
    } while (totalPoints > maxPoints && iterations < maxIterations);

    if (totalPoints > maxPoints && iterations >= maxIterations) {
        let flattenedPoints = contourPoints.flat();
        contourPoints = [flattenedPoints.slice(0, maxPoints)];  // Take the first N points
    }

    if (contourPoints.length === 0) {
        console.error("No valid contours found.");
        return [];
    }


    // Calculate distances and find the best path
    const distances = calculateDistances(contourPoints);
    const path = tspNearestNeighbor(distances, contourPoints);
    const orderedContours = reorderContours(contourPoints, path);

    return orderedContours;
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


function traceContours(orderedContours, isLoop = false, minimizeJumps = true) {
    let result = [];
    let pathsUsed = [...orderedContours];
   
    for (let i = 0; i < orderedContours.length - (isLoop ? 0 : 1); i++) {
        const currentContour = orderedContours[i];
        
        // If looping, add 1st contour again
        const nextContour = orderedContours[(i + 1) % orderedContours.length];
        const start = currentContour[currentContour.length - 1];  // End of the current contour
        const end = nextContour[0];  // Start of the next contour

        let path = [];
        if (minimizeJumps){
            // Find path between contours
            path = findPathWithMinimalJumpDistances(pathsUsed, start, end);
        }
        
        result.push(currentContour);
        if (path.length > 0) {  // Add the path only if it has points
            result.push(path);
            pathsUsed.push(path);  // Add the used path to the list of paths
            //console.log('Added Path: ', i, JSON.stringify(path));
        } else {
            //console.log('No Path Needed', i)
        }
    }

    // Add the last contour as it doesn't need a connecting path and not looping
    if (!isLoop) { result.push(orderedContours[orderedContours.length - 1]); }

    return result;
}


function removeConsecutiveDuplicates(points) {
    return points.filter((point, index) => {
        if (index === 0) return true; // Keep the first point
        const prevPoint = points[index - 1];
        return !(point.x === prevPoint.x && point.y === prevPoint.y);
    });
}


function findPathWithMinimalJumpDistances(contours, start, end) {
    const graph = createGraphWithConnectionTypes(contours);
    const { startIdx, endIdx } = addStartEndToGraph(graph, start, end, start, end);
    const path = dijkstraWithMinimalJumps(graph, startIdx, endIdx);
    return path;
}


function createGraphWithConnectionTypes(contours) {
    const graph = [];

    // Create nodes for each point in the contours
    contours.forEach(contour => {
        contour.forEach(pt => {
            let node = graph.find(n => n.x === pt.x && n.y === pt.y);
            if (!node) {
                node = { x: pt.x, y: pt.y, neighbors: [] };
                graph.push(node);
            }
        });
    });

    // Connect points within the same contour (regular path connections)
    contours.forEach(contour => {
        for (let i = 0; i < contour.length; i++) {
            const node = graph.find(n => n.x === contour[i].x && n.y === contour[i].y);
            if (i > 0) {
                const prevNode = graph.find(n => n.x === contour[i - 1].x && n.y === contour[i - 1].y);
                if (!node.neighbors.some(neighbor => neighbor.node === prevNode)) {
                    node.neighbors.push({ node: prevNode, isJump: false });
                    prevNode.neighbors.push({ node: node, isJump: false });
                }
            }
        };
    });

    // Connect nodes from different contours with jump connections
    for (let i = 0; i < graph.length; i++) {
        for (let j = i + 1; j < graph.length; j++) {
            const nodeA = graph[i];
            const nodeB = graph[j];
            const distance = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);

            if (!nodeA.neighbors.some(neighbor => neighbor.node === nodeB)) {
                nodeA.neighbors.push({ node: nodeB, isJump: true, jumpDistance: distance });
            }
            if (!nodeB.neighbors.some(neighbor => neighbor.node === nodeA)) {
                nodeB.neighbors.push({ node: nodeA, isJump: true, jumpDistance: distance });
            }
        }
    }

    return graph;
}


function generateDots(edgeImage) {
    // Reset the canvas before drawing the new image
    resetCanvas('dot-image');
    resetCanvas('connect-image');

    const epsilon = parseFloat(document.getElementById('epsilon-slider').value),
        contourMode = document.getElementById('contour-mode').value,
        isLoop = document.getElementById('is-loop').checked,
        minimizeJumps = document.getElementById('no-shortcuts').checked,
        singleByte = document.getElementById('single-byte').checked,
        maxPoints = parseInt(document.getElementById('dot-number').value);
        // useGaussianBlur = document.getElementById('gaussian-blur-toggle').checked,
    const retrievalMode = (contourMode == 'External') ?  cv.RETR_EXTERNAL : cv.RETR_TREE;    
    
    orderedContours = getOrderedContours(edgeImage, epsilon, retrievalMode, maxPoints);

    console.log('Ordered Contours: ', JSON.stringify(orderedContours));

    const tracedContours = traceContours(orderedContours, isLoop, minimizeJumps);
    console.log('Traced: ', JSON.stringify(tracedContours));

    plotContours(tracedContours);
    // Save for future plotting
    orderedContoursSave = tracedContours;

    let orderedPoints = tracedContours.flat();

    if (isLoop) {
        orderedPoints = reorderPointsForLoop(orderedPoints);
    }

    orderedPoints = removeConsecutiveDuplicates(orderedPoints);

    const polarPoints = drawDots(orderedPoints);
    WriteCoords(polarPoints, singleByte);
    drawConnections(polarPoints);
    document.getElementById('total-points').innerText = `(${orderedPoints.length} Points)`;
}


function WriteCoords(polarPoints, singleByte = false){
    let formattedPoints = '';
    if (!singleByte) {
        formattedPolarPoints = polarPoints.map(p => `{${p.r.toFixed(0)},${p.theta.toFixed(0)}}`).join(',');
    } else {
        formattedPolarPoints = polarPoints.map(p => `{${Math.round(255 * p.r / 1000)},${Math.round(255 * p.theta / 3600)}}`).join(',');
    }
    
    document.getElementById('polar-coordinates-textarea').value = formattedPolarPoints;
    document.getElementById('simple-coords').textContent = formattedPolarPoints;
    document.getElementById('simple-coords-title').style = 'visibility: hidden';
}


function reorderPointsForLoop(points) {
    const centroid = calculateCentroid(points);
    let minDist = Infinity;
    let startIndex = 0;

    // Find the point nearest to the centroid
    points.forEach((point, index) => {
        const dist = Math.hypot(point.x - centroid.x, point.y - centroid.y);
        if (dist < minDist) {
            minDist = dist;
            startIndex = index;
        }
    });

    // Reorder points to start from the point nearest to the centroid
    return [...points.slice(startIndex), ...points.slice(0, startIndex)];
}


function drawDots(points) {
    const canvas = document.getElementById('dot-image'), ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width, height = canvas.height;
    const scaleX = width / originalImageElement.width;
    const scaleY = height / originalImageElement.height;
    const scale = Math.min(scaleX, scaleY);

    points = points.map(p => ({ x: (p.x) * scale, y: (p.y) * scale }));

    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
    });

    const formattedPoints = points.map(p => `{${p.x.toFixed(2)}, ${p.y.toFixed(2)}}`).join(',\n');

    // Calculate polar coordinates
    const center = findMaximalCenter(points);

    points = points.map(p => ({ x: p.x - center.centerX, y: p.y - center.centerY }));
    const polarPoints = points.map(p => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y);
        let theta = Math.atan2(p.y, p.x) * (180 / Math.PI); // Convert radians to degrees
        if (theta < 0) theta += 360; // Ensure theta is between 0 and 360

        // Adjust theta to align 0 degrees to the right and 90 degrees up by flipping the y-axis
        theta = -theta;
        if (theta < 0) theta += 360;

        return { r: r * (1000 / Math.max(...points.map(p => Math.sqrt(p.x * p.x + p.y * p.y)))), theta: theta * 10 };
    });

    return polarPoints; // Return polarPoints
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

    // Draw the connections based on polar coordinates
    for (let i = 0; i < polarPoints.length - 1; i++) {
        // Calculate the color for each segment
        const t = i / (polarPoints.length - 1);
        const color = `hsl(${t * 270}, 100%, 50%)`; // 270 degrees covers red to violet
        ctx.strokeStyle = color;

        const p1 = polarPoints[i];
        const p2 = polarPoints[i + 1];

        // Adjust y-coordinate calculation to invert the y-axis
        const x1 = p1.r * Math.cos(p1.theta / 10 * Math.PI / 180) * scale;
        const y1 = -p1.r * Math.sin(p1.theta / 10 * Math.PI / 180) * scale;
        const x2 = p2.r * Math.cos(p2.theta / 10 * Math.PI / 180) * scale;
        const y2 = -p2.r * Math.sin(p2.theta / 10 * Math.PI / 180) * scale;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}


function convertImage() {
    originalImageElement && processImage(originalImageElement);
}


// Function to get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        apikey: params.get('apikey'),
        prompt: params.get('prompt'),
        run: params.get('run')
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
}


function setDefaultsForAutoGenerate() {
    document.getElementById('epsilon-slider').value = 1;
    document.getElementById('dot-number').value = 200;
    document.getElementById('no-shortcuts').value = true;
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
    //const gaussianBlurToggle = document.getElementById('gaussian-blur-toggle');

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
        // convertImage(); // Automatically run convertImage on change
    });

    window.showTab = function(tabName) {
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => { content.style.display = 'none'; });
        document.getElementById(tabName).style.display = 'block'; 
    };

});


// Initialize the page with URL parameters if present
document.addEventListener('DOMContentLoaded', (event) => {
    const { apikey, prompt, run } = getUrlParams();

    // Fill inputs with URL parameters if they exist
    fillInputsFromParams({ apikey, prompt });

    // Generate image if all parameters are present
    if (apikey && prompt && run) {
        setDefaultsForAutoGenerate();
        generateImage(apikey, prompt);
    }

    // Add event listener to the button inside the DOMContentLoaded event
    document.getElementById('gen-image-button').addEventListener('click', () => {
        let apiKey = document.getElementById('api-key').value;
        const prompt = document.getElementById('prompt').value;
        generateImage(apiKey, prompt);

    });
    
});