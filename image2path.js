/*
 * Image2Path - Library for converting images to sand table coordinates
 * 
 * This library processes images and converts them to polar coordinates
 * according to the specified settings, supporting multiple output formats including:
 *  Default: HackPack Sand Garden .ino in this repository
 *  theta-rho format: for use with sand tables like Sisyphus and Dune Weaver Mini.
 * 
 * Note:
 *  For Dune Weaver Mini compatibility, this script uses continuous theta values
 *  that can exceed 2π (360 degrees). This allows the arm to make multiple revolutions
 *  without creating unintended circles in the patterns.
 */

class PriorityQueue {
    constructor() {
        this.heap = [];
    }

    enqueue(priority, key) {
        this.heap.push({ key, priority });
        this._bubbleUp(this.heap.length - 1);
    }

    dequeue() {
        const min = this.heap[0];
        const end = this.heap.pop();
        
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this._sinkDown(0);
        }
        
        return min;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    _bubbleUp(index) {
        const element = this.heap[index];
        
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            const parent = this.heap[parentIndex];
            
            if (element.priority >= parent.priority) break;
            
            this.heap[parentIndex] = element;
            this.heap[index] = parent;
            index = parentIndex;
        }
    }

    _sinkDown(index) {
        const length = this.heap.length;
        const element = this.heap[index];
        
        while (true) {
            const leftChildIndex = 2 * index + 1;
            const rightChildIndex = 2 * index + 2;
            let smallestChildIndex = null;
            
            if (leftChildIndex < length) {
                if (this.heap[leftChildIndex].priority < element.priority) {
                    smallestChildIndex = leftChildIndex;
                }
            }
            
            if (rightChildIndex < length) {
                if (
                    (smallestChildIndex === null && this.heap[rightChildIndex].priority < element.priority) ||
                    (smallestChildIndex !== null && this.heap[rightChildIndex].priority < this.heap[leftChildIndex].priority)
                ) {
                    smallestChildIndex = rightChildIndex;
                }
            }
            
            if (smallestChildIndex === null) break;
            
            this.heap[index] = this.heap[smallestChildIndex];
            this.heap[smallestChildIndex] = element;
            index = smallestChildIndex;
        }
    }
}

// Main library function
async function convertImageToPath(imageElement, config = {}) {
    // Default configuration
    const defaultConfig = {
        epsilon: 2,
        contourMode: 'Tree',
        maxPoints: 200,
        outputFormat: 0,
        isLoop: false,
        minimizeJumps: false,
        penUpEnabled: false
    };
    
    // Merge with provided config
    const finalConfig = { ...defaultConfig, ...config };
    
    // Check if OpenCV is loaded
    if (typeof cv === 'undefined') {
        throw new Error('OpenCV is not loaded. Please include the OpenCV script tag.');
    }
    
    // Process the image
    const result = await _processImage(imageElement, finalConfig);
    return result;
}

// Core image processing function
function _processImageCore(imgElement) {
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
            
    return {
        src: src,
        edgeImage: dst
    };
}

// Main processing function
async function _processImage(imgElement, config) {
    // Process with OpenCV using the core function directly on the image element
    const result = _processImageCore(imgElement);
    
    // Generate coordinates using the core function
    const coordsResult = _generateDots(result.edgeImage, config.epsilon, config.contourMode, config.isLoop, config.minimizeJumps, config.outputFormat, config.maxPoints, config.penUpEnabled, imgElement);
    
    // Format the coordinates
    const formattedString = _formatCoordinates(coordsResult.polarPoints, config.outputFormat);
    
    // Cleanup src but keep edgeImage for UI use
    result.src.delete(); 
    
    // Return both the formatted string (for backward compatibility) and additional data
    return {
        formattedString: formattedString,
        processedContours: coordsResult.processedContours,
        orderedPoints: coordsResult.orderedPoints,
        polarPoints: coordsResult.polarPoints,
        edgeImage: result.edgeImage  // Include edgeImage for UI use
    };
}

// Core dots generation function (renamed from generateDotsCore)
function _generateDots(edgeImage, epsilon, contourMode, isLoop, minimizeJumps, outputFormat, maxPoints, penUpEnabled = false, originalImageElement) {
    const retrievalMode = (contourMode == 'External') ?  cv.RETR_EXTERNAL : cv.RETR_TREE;    
    
    const orderedContours = getOrderedContours(edgeImage, epsilon, retrievalMode, maxPoints);

    const tracedContours = traceContours(orderedContours, isLoop, minimizeJumps);

    // Only apply additional interpolation if .thr format (format 2) is selected
    let processedContours;
    if (outputFormat === 2) {
        // Apply interpolation for .thr format which needs more points for straight lines
        processedContours = tracedContours.map(contour => 
            addInterpolatedPoints(contour, epsilon)
        );
    } else {
        processedContours = tracedContours;
    }

    let orderedPoints = processedContours.flat();

    // Should always be the case for isLoop
    if (isFullyClosed(orderedPoints) || isLoop) {
        orderedPoints = reorderPointsForLoop(orderedPoints);
    }

    orderedPoints = removeConsecutiveDuplicates(orderedPoints);

    // For final output - if last point is same as first point, drop it.
    if (isFullyClosed(orderedPoints)) {
        orderedPoints = [...orderedPoints.slice(0,orderedPoints.length-1)];
    }

    
    // For pen-up mode, we need to work with contours to identify boundaries
    // For normal mode, we can work with the flattened orderedPoints
    let polarPoints;
    if (penUpEnabled) {
        // Use contours to maintain structure for pen-up logic
        polarPoints = _calculatePolarCoordinatesFromPoints(orderedPoints, true, processedContours, isLoop);
    } else {
        // Use flattened points for normal processing
        polarPoints = _calculatePolarCoordinatesFromPoints(orderedPoints);
    }
    
    return {
        processedContours,
        orderedPoints,
        polarPoints
    };
}

// Coordinate formatting function
function _formatCoordinates(polarPoints, outputFormat = 0){
    let formattedPolarPoints = '';
    switch (outputFormat) {
        case 0: //Default
            // For Image2Sand.ino code, we normalize the theta values
            // We'll use modulo for this format
            formattedPolarPoints = polarPoints.map(p => {
            const normalizedTheta = ((p.theta % 3600) + 3600) % 3600; // Ensure positive value between 0-3600
            return `{${p.r.toFixed(0)},${normalizedTheta.toFixed(0)}}`;
        }).join(',');
            break;

        case 1: //Single Byte
            // For single byte format, we need to normalize the theta values
            // We'll use modulo for this format since it's just for Arduino code
            formattedPolarPoints = polarPoints.map(p => {
                const normalizedTheta = ((p.theta % 3600) + 3600) % 3600; // Ensure positive value between 0-3600
                return `{${Math.round(255 * p.r / 1000)},${Math.round(255 * normalizedTheta / 3600)}}`;
            }).join(',');
            break;

        case 2: //.thr
            // For .thr format, we keep the continuous theta values
            // Convert from tenths of degrees back to radians
            // Apply a 90° clockwise rotation by subtracting π/2 (900 in tenths of degrees) from theta
            formattedPolarPoints = polarPoints.map(p => {
                // Subtract 900 (90 degrees) to rotate clockwise
                const rotatedTheta = p.theta - 900;
                return `${(-rotatedTheta * Math.PI / 1800).toFixed(5)} ${(p.r / 1000).toFixed(5)}`;
            }).join("\n");
            break;

        case 3: // whitespace (might cause problems as it outputs a space)
            // For whitespace format, we need to normalize the theta values
            // We'll use modulo for this format
            formattedPolarPoints = polarPoints.map(p => {
                const normalizedTheta = ((p.theta % 3600) + 3600) % 3600; // Ensure positive value between 0-3600
                return `${Math.round(255 * p.r / 1000).toString(2).padStart(8,'0').replaceAll('0',' ').replaceAll('1',"\t")}${Math.round(255 * normalizedTheta / 3600).toString(2).padStart(8,'0').replaceAll('0',' ').replaceAll('1',"\t")}`;
            }).join("\n");
            break;

        default: 
            break;
    }
   
    return formattedPolarPoints;
}

// Pure algorithmic function for calculating polar coordinates
function _calculatePolarCoordinatesFromPoints(points, penUpEnabled = false, contours = null, isLoopEnabled = false) {
    let allPolarPoints = [];
    
    if (penUpEnabled && contours) {
        // Pen-up mode: process contours individually to maintain structure
        console.log('Processing contours in pen-up mode. Number of contours:', contours.length);
        
        // Calculate polar coordinates for ALL points together (maintains relationships)
        allPolarPoints = calculatePolarCoordinates(points);
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
        if (isLoopEnabled) {
            const lastPoint = allPolarPoints[allPolarPoints.length - 1];
            allPolarPoints.push(lastPoint);
            console.log('Added pen-up at end for loop drawing');
        }
        
        console.log('Final total polar points with pen-up:', allPolarPoints.length);
    } else {
        // Normal mode: process flattened points
        allPolarPoints = calculatePolarCoordinates(points);
    }
    
    return allPolarPoints;
}

// Polar coordinate calculation
function calculatePolarCoordinates(points) {
    // Calculate polar coordinates
    const center = findMaximalCenter(points);
    points = points.map(p => ({ x: p.x - center.centerX, y: p.y - center.centerY }));
    
    // Calculate initial angles for all points
    let polarPoints = points.map(p => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y);
        // Get the basic angle in radians
        let theta = Math.atan2(p.y, p.x);
        
        // Adjust theta to align 0 degrees to the right and 90 degrees up by flipping the y-axis
        theta = -theta;
        
        return { 
            r: r * (1000 / Math.max(...points.map(p => Math.sqrt(p.x * p.x + p.y * p.y)))), 
            theta: theta, // Store in radians initially
            x: p.x,
            y: p.y
        };
    });
    
    // Process points to create continuous theta values
    for (let i = 1; i < polarPoints.length; i++) {
        const prev = polarPoints[i-1];
        const curr = polarPoints[i];
        
        // Calculate the difference between current and previous theta
        let diff = curr.theta - prev.theta;
        
        // If the difference is greater than π, it means we've wrapped around counterclockwise
        // Adjust by subtracting 2π
        if (diff > Math.PI) {
            curr.theta -= 2 * Math.PI;
        }
        // If the difference is less than -π, it means we've wrapped around clockwise
        // Adjust by adding 2π
        else if (diff < -Math.PI) {
            curr.theta += 2 * Math.PI;
        }
    }
    
    // Convert to degrees * 10 for the final format
    polarPoints = polarPoints.map(p => ({
        r: p.r,
        theta: p.theta * (1800 / Math.PI) // Convert radians to tenths of degrees
    }));
    
    return polarPoints;
}

// Utility functions
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

// Contour processing functions
function getOrderedContours(edgeImage, initialEpsilon, retrievalMode, maxPoints) {
    const contours = new cv.MatVector(), hierarchy = new cv.Mat();
    cv.findContours(edgeImage, contours, hierarchy, retrievalMode, cv.CHAIN_APPROX_SIMPLE);

    // Deduplicate contours
    const uniqueContours = deduplicateContours(contours);

    const maxIterations = 100;  // Maximum iterations to avoid infinite loop

    let contourPoints = [];
    let totalPoints = 0;
    let epsilon = initialEpsilon;
    let iterations = 0;

    do {
        totalPoints = 0;
        contourPoints = [];

        for (let i = 0; i < uniqueContours.length; i++) {
            const contour = uniqueContours[i]; // Use [] to access array elements
            const simplified = new cv.Mat();
            cv.approxPolyDP(contour, simplified, epsilon, true);
        
            let points = [];
            for (let j = 0; j < simplified.rows; j++) {
                const point = simplified.intPtr(j);
                points.push({ x: point[0], y: point[1] });
            }
            simplified.delete();
        
            if (points.length > 0) {  // Check for empty contours
                if (isNearlyClosed(contour)) {  // Only close the contour if it's nearly closed
                    points = closeContour(points);
                }

                if (isFullyClosed(points)) {
                    // Move starting point to nearest the center
                    points = reorderPointsForLoop(points);
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
        }
    }

    // If not looping, add the last contour as it doesn't need a connecting path and wasn't added above
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

function reorderPointsForLoop(points, startNear = calculateCentroid(points)) {
    let minDist = Infinity;
    let startIndex = 0;

    // Find the point nearest to the centroid
    points.forEach((point, index) => {
        const dist = Math.hypot(point.x - startNear.x, point.y - startNear.y);
        if (dist < minDist) {
            minDist = dist;
            startIndex = index;
        }
    });

    // Reorder points to start from the point nearest to the centroid
    return removeConsecutiveDuplicates([...points.slice(startIndex), ...points.slice(0, startIndex+1)]);
}

// Contour analysis functions
function isNearlyClosed(contour, percentThreshold = 0.1) {
    // Get the bounding box of the contour
    const rect = cv.boundingRect(contour);
    const size = Math.sqrt(rect.width * rect.width + rect.height * rect.height);

    // Calculate the distance between the first and last points
    const startPoint = { x: contour.intPtr(0)[0], y: contour.intPtr(0)[1] };
    const endPoint = { x: contour.intPtr(contour.rows - 1)[0], y: contour.intPtr(contour.rows - 1)[1] };
    const distance = Math.sqrt((startPoint.x - endPoint.x) ** 2 + (startPoint.y - endPoint.y) ** 2);

    // Use a threshold based on the size of the object
    const threshold = size * percentThreshold;
    return (distance < threshold);
}

function isFullyClosed(points) {
    return ((points[0].x === points[points.length - 1].x) && (points[0].y === points[points.length - 1].y));
}

function closeContour(points) {
    if (points.length > 1 && (points[0].x !== points[points.length - 1].x || points[0].y !== points[points.length - 1].y)) {
        points.push({ x: points[0].x, y: points[0].y });
    }
    return points;
}

function areContoursSimilar(contour1, contour2, similarityThreshold) {
    // Calculate the bounding boxes of the contours
    const rect1 = cv.boundingRect(contour1);
    const rect2 = cv.boundingRect(contour2);

    // Calculate the intersection of the bounding boxes
    const x1 = Math.max(rect1.x, rect2.x);
    const y1 = Math.max(rect1.y, rect2.y);
    const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    // Check if there is an intersection
    const intersectionWidth = Math.max(0, x2 - x1);
    const intersectionHeight = Math.max(0, y2 - y1);
    const intersectionArea = intersectionWidth * intersectionHeight;

    // Calculate the union of the bounding boxes
    const area1 = rect1.width * rect1.height;
    const area2 = rect2.width * rect2.height;
    const unionArea = area1 + area2 - intersectionArea;

    // Calculate the similarity based on the intersection over union (IoU)
    const similarity = intersectionArea / unionArea;

    return similarity > similarityThreshold;
}

function deduplicateContours(contours, similarityThreshold = 0.5) {
    const uniqueContours = [];
    for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        let isDuplicate = false;
        for (let j = 0; j < uniqueContours.length; j++) {
            if (areContoursSimilar(contour, uniqueContours[j], similarityThreshold)) {
                isDuplicate = true;
                break;
            }
        }
        if (!isDuplicate) {
            uniqueContours.push(contour);
        }
    }
    return uniqueContours;
}

// Pathfinding functions
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

    for (let i = 0; i < path.length; i++) {
        const contourIndex = path[i];
        let contour = contours[contourIndex];

        // Determine the direction to use the contour
        if (i > 0) {
            const prevContour = orderedContours[orderedContours.length - 1];
            const prevPoint = prevContour[prevContour.length - 1];
            
            if (isFullyClosed(contour)) {
                // Contour is fully closed, so can move the startPoint
                contour = reorderPointsForLoop(contour, startNear = prevPoint)
            } else if (prevPoint && contour[0]) {
                // Contour not fully closed, decide whether to reverse contour
                const startToStart = Math.hypot(prevPoint.x - contour[0].x, prevPoint.y - contour[0].y);
                const startToEnd = Math.hypot(prevPoint.x - contour[contour.length - 1].x, prevPoint.y - contour[contour.length - 1].y);

                if (startToEnd < startToStart) {
                    contour.reverse();
                }
            } else {
                continue; // Skip if any point is undefined
            }
        }

        orderedContours.push(contour);
    }

    return orderedContours;
}

function createGraphWithConnectionTypes(contours) {
    const graph = [];
    const nodeMap = new Map(); // Map to quickly find nodes by coordinates
    const MAX_JUMP_CONNECTIONS = 10; // Limit the number of jump connections per node

    // Create nodes for each point in the contours
    contours.forEach(contour => {
        contour.forEach(pt => {
            const key = `${pt.x},${pt.y}`;
            if (!nodeMap.has(key)) {
                const node = { x: pt.x, y: pt.y, neighbors: [] };
                graph.push(node);
                nodeMap.set(key, node);
            }
        });
    });

    // Connect points within the same contour (regular path connections)
    contours.forEach(contour => {
        for (let i = 0; i < contour.length; i++) {
            const key = `${contour[i].x},${contour[i].y}`;
            const node = nodeMap.get(key);
            
            if (i > 0) {
                const prevKey = `${contour[i - 1].x},${contour[i - 1].y}`;
                const prevNode = nodeMap.get(prevKey);
                
                if (!node.neighbors.some(neighbor => neighbor.node === prevNode)) {
                    node.neighbors.push({ node: prevNode, isJump: false });
                    prevNode.neighbors.push({ node: node, isJump: false });
                }
            }
        }
    });

    // Create a spatial index for efficient nearest neighbor search
    const spatialIndex = [];
    graph.forEach(node => {
        spatialIndex.push({
            node: node,
            x: node.x,
            y: node.y
        });
    });

    // Connect nodes from different contours with jump connections, but limit the number
    graph.forEach(nodeA => {
        // Sort other nodes by distance to current node
        const distances = spatialIndex
            .filter(item => item.node !== nodeA)
            .map(item => ({
                node: item.node,
                distance: Math.hypot(nodeA.x - item.node.x, nodeA.y - item.node.y)
            }))
            .sort((a, b) => a.distance - b.distance);
        
        // Only connect to the closest MAX_JUMP_CONNECTIONS nodes
        distances.slice(0, MAX_JUMP_CONNECTIONS).forEach(({ node: nodeB, distance }) => {
            if (!nodeA.neighbors.some(neighbor => neighbor.node === nodeB)) {
                nodeA.neighbors.push({ node: nodeB, isJump: true, jumpDistance: distance });
            }
            if (!nodeB.neighbors.some(neighbor => neighbor.node === nodeA)) {
                nodeB.neighbors.push({ node: nodeA, isJump: true, jumpDistance: distance });
            }
        });
    });

    return graph;
}

function addStartEndToGraph(graph, start, end) {
    const nodeMap = new Map();
    const MAX_CONNECTIONS = 10; // Limit the number of connections from start/end points
    
    // Create a map for faster node lookups
    graph.forEach((node, index) => {
        nodeMap.set(`${node.x},${node.y}`, { node, index });
    });
    
    // Check if start and end points already exist in the graph
    const startKey = `${start.x},${start.y}`;
    const endKey = `${end.x},${end.y}`;
    
    let startIdx = nodeMap.has(startKey) ? nodeMap.get(startKey).index : graph.length;
    let endIdx = nodeMap.has(endKey) ? nodeMap.get(endKey).index : (startIdx === graph.length ? graph.length + 1 : graph.length);
    
    // Add start point if it doesn't exist
    if (!nodeMap.has(startKey)) {
        const startNode = { x: start.x, y: start.y, neighbors: [] };
        graph.push(startNode);
        nodeMap.set(startKey, { node: startNode, index: startIdx });
    }
    
    // Add end point if it doesn't exist
    if (!nodeMap.has(endKey)) {
        const endNode = { x: end.x, y: end.y, neighbors: [] };
        graph.push(endNode);
        nodeMap.set(endKey, { node: endNode, index: endIdx });
    }
    
    // Find the closest nodes to connect to start and end
    const startNode = graph[startIdx];
    const endNode = graph[endIdx];
    
    // Calculate distances from start to all other nodes
    const startDistances = [];
    graph.forEach((node, idx) => {
        if (idx !== startIdx) {
            const distance = Math.hypot(start.x - node.x, start.y - node.y);
            startDistances.push({ node, idx, distance });
        }
    });
    
    // Sort by distance and connect only to the closest MAX_CONNECTIONS nodes
    startDistances.sort((a, b) => a.distance - b.distance);
    startDistances.slice(0, MAX_CONNECTIONS).forEach(({ node, idx, distance }) => {
        startNode.neighbors.push({ node, isJump: true, jumpDistance: distance });
        node.neighbors.push({ node: startNode, isJump: true, jumpDistance: distance });
    });
    
    // Calculate distances from end to all other nodes
    const endDistances = [];
    graph.forEach((node, idx) => {
        if (idx !== endIdx) {
            const distance = Math.hypot(end.x - node.x, end.y - node.y);
            endDistances.push({ node, idx, distance });
        }
    });
    
    // Sort by distance and connect only to the closest MAX_CONNECTIONS nodes
    endDistances.sort((a, b) => a.distance - b.distance);
    endDistances.slice(0, MAX_CONNECTIONS).forEach(({ node, idx, distance }) => {
        endNode.neighbors.push({ node, isJump: true, jumpDistance: distance });
        node.neighbors.push({ node: endNode, isJump: true, jumpDistance: distance });
    });
    
    return { startIdx, endIdx };
}

function dijkstraWithMinimalJumps(graph, startIdx, endIdx) {
    const distances = Array(graph.length).fill(Infinity);
    const previous = Array(graph.length).fill(null);
    const totalJumpDistances = Array(graph.length).fill(Infinity);
    const priorityQueue = new PriorityQueue();
    const nodeIndices = new Map(); // Map to quickly find node indices
    
    // Create a map of node coordinates to indices for faster lookups
    graph.forEach((node, index) => {
        nodeIndices.set(`${node.x},${node.y}`, index);
    });

    distances[startIdx] = 0;
    totalJumpDistances[startIdx] = 0;
    priorityQueue.enqueue(0, startIdx);

    while (!priorityQueue.isEmpty()) {
        const { key: minDistanceNode } = priorityQueue.dequeue();

        if (minDistanceNode === endIdx) break;

        const currentNode = graph[minDistanceNode];
        currentNode.neighbors.forEach(neighbor => {
            // Use the map for faster node index lookup
            const neighborKey = `${neighbor.node.x},${neighbor.node.y}`;
            const neighborIdx = nodeIndices.get(neighborKey);
            
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

function findPathWithMinimalJumpDistances(contours, start, end) {
    const graph = createGraphWithConnectionTypes(contours);
    const { startIdx, endIdx } = addStartEndToGraph(graph, start, end);
    const path = dijkstraWithMinimalJumps(graph, startIdx, endIdx);
    return path;
}

// Interpolation functions
function interpolatePoints(startPoint, endPoint, numPoints) {
    if (numPoints <= 2) return [startPoint, endPoint];

    const points = [];
    for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        const x = startPoint.x + t * (endPoint.x - startPoint.x);
        const y = startPoint.y + t * (endPoint.y - startPoint.y);
        points.push({ x, y });
    }
    return points;
}

function distanceBetweenPoints(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function addInterpolatedPoints(points, epsilon) {
    if (points.length <= 1) return points;

    const result = [];
    for (let i = 0; i < points.length - 1; i++) {
        const startPoint = points[i];
        const endPoint = points[i + 1];

        // Calculate distance between points
        const distance = distanceBetweenPoints(startPoint, endPoint);

        // Determine how many points to add based on distance and epsilon
        // For longer segments and smaller epsilon values, we want more points
        // The smaller the epsilon, the more detailed the contour, so we add more points
        const pointsToAdd = Math.max(2, Math.ceil(distance / (epsilon * 5)));

        // Add interpolated points for this segment
        const interpolated = interpolatePoints(startPoint, endPoint, pointsToAdd);

        // Add all points except the last one (to avoid duplicates)
        if (i < points.length - 2) {
            result.push(...interpolated.slice(0, -1));
        } else {
            // For the last segment, include the end point
            result.push(...interpolated);
        }
    }

    return result;
}

// Epsilon adjustment
function adjustEpsilon(epsilon, pointsOver) {
    if (pointsOver > 100) {
        return epsilon + 0.5;
    } else if (pointsOver <= 20) {
        return epsilon + 0.1;
    } else {
        // Scale adjustment for points over the target between 20 and 100
        let scale = (pointsOver - 20) / (100 - 20); // Normalized to range 0-1
        return epsilon + 0.1 + 0.5 * scale;  // Adjust between 0.1 and 0.5
    }
}
