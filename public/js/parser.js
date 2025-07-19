// Simple SVG path parser for Matter.js
function parseSvgPath(svgPath) {
    const parts = svgPath.split(/([A-Za-z])/).filter(Boolean);
    const commands = [];
    let currentCommand = null;
    
    for (let i = 0; i < parts.length; i++) {
        const token = parts[i].trim();
        if (/[A-Za-z]/.test(token)) {
            currentCommand = {
                type: token.toUpperCase(),
                values: []
            };
            commands.push(currentCommand);
        } else if (currentCommand) {
            const numbers = token.split(/[\s,]+/).filter(Boolean).map(parseFloat);
            currentCommand.values.push(...numbers);
        }
    }
    return commands;
}

// Convert SVG commands to Matter.js vertices
function svgToVertices(svgPath, scale = 1) {
    const commands = parseSvgPath(svgPath);
    const vertices = [];
    let currentX = 0;
    let currentY = 0;
    
    commands.forEach(cmd => {
        switch(cmd.type) {
            case 'M': // MoveTo
                currentX = cmd.values[0] * scale;
                currentY = cmd.values[1] * scale;
                vertices.push({ x: currentX, y: currentY });
                break;
                
            case 'L': // LineTo
                currentX = cmd.values[0] * scale;
                currentY = cmd.values[1] * scale;
                vertices.push({ x: currentX, y: currentY });
                break;
                
            case 'H': // Horizontal line
                currentX = cmd.values[0] * scale;
                vertices.push({ x: currentX, y: currentY });
                break;
                
            case 'V': // Vertical line
                currentY = cmd.values[0] * scale;
                vertices.push({ x: currentX, y: currentY });
                break;
                
            case 'Z': // Close path
                // Connects back to first point
                break;
                
            // Add cases for curves if needed
        }
    });
    
    return vertices;
}

// Create Matter.js body from SVG path
function createBodyFromSvg(world, svgPath, x, y, options = {}) {
    const vertices = svgToVertices(svgPath);
    
    if (vertices.length < 3) {
        console.error("Not enough vertices to create a body");
        return null;
    }
    
    // For concave shapes, we need to decompose
    const body = Bodies.fromVertices(
        x, y, 
        [vertices], 
        { ...options, chamfer: { radius: 0 } },
        true // Flag to try convex decomposition
    );
    
    if (body) {
        World.add(world, body);
        return body;
    }
    
    console.error("Failed to create body from SVG path");
    return null;
}