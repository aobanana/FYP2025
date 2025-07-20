document.addEventListener('DOMContentLoaded', () => {
    // Add these near the top of control.js
    const MAX_OBJECTS_BEFORE_EXPAND = 15; // Adjust as needed
    const CANVAS_BASE = 100;
    const CANVAS_EXPANSION_STEP = 200; // Pixels to expand by
    let autoExpandingEnabled = true;
    let expandCanvasHeightCount = 0;

    // Function to check if we need to expand the canvas
    const checkCanvasExpansion = () => {
        if (!autoExpandingEnabled) return;

        const bodies = Composite.allBodies(engine.world);
        const dynamicBodies = bodies.filter(body => !body.isStatic);

        let extra = (dynamicBodies.length - 100 < 0)?0:dynamicBodies.length - CANVAS_BASE;
        let level = Math.floor(extra / MAX_OBJECTS_BEFORE_EXPAND);
        //console.log(dynamicBodies.length  + ":" +  level + ":" + expandCanvasHeightCount);

        if (level > expandCanvasHeightCount) {
            expandCanvasHeight();
        }
    };

    // Function to expand the canvas height
    const expandCanvasHeight = () => {
        if (!autoExpandingEnabled) return;

        expandCanvasHeightCount++;
        const newHeight = render.options.height + CANVAS_EXPANSION_STEP;

        // Update renderer dimensions
        render.options.height = newHeight;
        render.canvas.height = newHeight;

        // Update walls (remove old ones first)
        World.remove(engine.world, walls);

        // Create new walls with expanded height
        walls = createWalls();
        World.add(engine.world, walls);

        // Reposition existing bodies
        const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
        bodies.forEach(body => {
            if (body.position.y > newHeight - 100) {
                Body.setPosition(body, {
                    x: body.position.x,
                    y: newHeight - 100
                });
            }
        });

        // Update socket
        socket.emit('canvasDimensions', {
            width: render.options.width,
            height: newHeight
        });
    };

    const roomId = 100;
    const socket = io();

    // Matter.js setup
    const { Engine, Render, World, Bodies, Body, Composite, Events } = Matter;

    // Create engine
    const engine = Engine.create({
        gravity: { x: 0, y: 1 }
    });

    // Store all current bodies except walls
    let currentBodies = [];

    // Get viewport dimensions
    const getViewportDimensions = () => {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    };

    // Initial viewport dimensions
    const viewport = getViewportDimensions();

    // Create renderer
    const render = Render.create({
        element: document.getElementById('canvas-container'),
        engine: engine,
        options: {
            width: viewport.width,
            height: viewport.height,
            wireframes: false,
            background: '#f4f4f4',
            showAngleIndicator: false  // Add this for cleaner rendering
        }
    });

    // Add walls to contain objects
    /*const createWalls = () => {
        const { width, height } = getViewportDimensions();
        return [
            Bodies.rectangle(width / 2, height + 30, width, 60, { isStatic: true }), // ground
            Bodies.rectangle(-30, height / 2, 60, height, { isStatic: true }), // left wall
            Bodies.rectangle(width + 30, height / 2, 60, height, { isStatic: true }), // right wall
            Bodies.rectangle(width / 2, -30, width, 60, { isStatic: true }) // ceiling
        ];
    };*/
    const createWalls = () => {
        //const { width, height } = getViewportDimensions();
        const width = render.options.width;
        const height = render.options.height;
        const wallThickness = 60;
        const wallExtension = 1000; // Extra height for side walls

        return [
            // Floor (moves down as canvas expands)
            Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, {
                isStatic: true,
                render: { fillStyle: '#2c3e50' },
                label: 'floor' // Add label for easier identification
            }),

            // Left wall (extends beyond viewport)
            Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + wallExtension, {
                isStatic: true,
                render: { fillStyle: '#2c3e50' }
            }),

            // Right wall (extends beyond viewport)
            Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + wallExtension, {
                isStatic: true,
                render: { fillStyle: '#2c3e50' }
            }),

            // Ceiling (stays at top)
            Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, {
                isStatic: true,
                render: { fillStyle: '#2c3e50' }
            })
        ];
    };

    let walls = createWalls();
    World.add(engine.world, walls);

    const addTextRectangle = (world, x, y, width, height, title, content) => {
        // Create the physical rectangle body
        const body = Bodies.rectangle(x, y, width, height, {
            chamfer: { radius: 0 },
            render: {
                fillStyle: '#000000',
                //strokeStyle: '#333333',
                //lineWidth: 2
            }
        });

        // Store text data with the body
        body.textData = { title, content, width, height };

        // Add custom rendering
        Events.on(render, 'afterRender', function () {
            const ctx = render.context;
            const bodies = Composite.allBodies(engine.world);

            bodies.forEach(body => {
                if (body.textData) {
                    ctx.save();

                    // Get body position and angle
                    const pos = body.position;
                    const angle = body.angle;

                    // Transform to body's coordinate system
                    ctx.translate(pos.x, pos.y);
                    ctx.rotate(angle);

                    // Draw text
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'italic 12px "Nunito Sans"';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(body.textData.title, 0, -body.textData.height / 2 + 20);
                    /*wrapText(ctx, body.textData.title, 0, -body.textData.height / 2 + 0,
                        body.textData.width - 20, 18);*/

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '14px "Nunito Sans"';
                    wrapText(ctx, body.textData.content, 0, -body.textData.height / 2 + 50,
                        body.textData.width - 20, 18);

                    ctx.restore();
                }
            });
        });

        World.add(world, body);
        return body;
    };

    // Helper function to create canvas texture with text
    /*function createTextTexture(width, height, title, content) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Draw rectangle background
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, 10);
        ctx.fill();
        ctx.stroke();
        
        // Draw title
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width/2, 30);
        
        // Draw content
        ctx.fillStyle = '#333333';
        ctx.font = '14px Arial';
        wrapText(ctx, content, width/2, 50, width - 20, 20);
        
        return canvas;
    }*/

    // Helper to wrap text
    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;

                // Stop if we've reached the bottom of the rectangle
                if (currentY > y + 100) {
                    ctx.fillText('...', x, currentY);
                    break;
                }
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }

    // Add this function to control.js (alongside addTextRectangle)
    const addTextCircle = (world, x, y, radius, title, content) => {
        // Create the physical circle body
        const body = Bodies.circle(x, y, radius, {
            render: {
                fillStyle: '#000000',
                //strokeStyle: '#333333',
                lineWidth: 2
            }
        });

        // Store text data with the body
        body.textData = { title, content, radius };

        // Add custom rendering
        Events.on(render, 'afterRender', function () {
            const ctx = render.context;
            const bodies = Composite.allBodies(engine.world);

            bodies.forEach(body => {
                if (body.textData) {
                    ctx.save();

                    // Get body position and angle
                    const pos = body.position;
                    const angle = body.angle;

                    // Transform to body's coordinate system
                    ctx.translate(pos.x, pos.y);
                    ctx.rotate(angle);

                    // Draw text
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Draw title at top of circle
                    ctx.fillText(body.textData.title, 0, -body.textData.radius / 2);

                    // Draw content in center
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '12px Arial';
                    wrapTextInCircle(ctx, body.textData.content, 0, 0,
                        body.textData.radius - 10, 16);

                    ctx.restore();
                }
            });
        });

        World.add(world, body);
        return body;
    };

    // Helper to wrap text inside a circle
    function wrapTextInCircle(ctx, text, x, y, maxRadius, lineHeight) {
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';

        // First break text into lines that fit horizontally
        for (let n = 0; n < words.length; n++) {
            const testLine = currentLine + words[n] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxRadius * 1.8 && currentLine !== '') {
                lines.push(currentLine);
                currentLine = words[n] + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        // Then adjust vertical placement
        const totalHeight = lines.length * lineHeight;
        let currentY = y - totalHeight / 2 + lineHeight;

        // Draw each line centered
        lines.forEach(line => {
            ctx.fillText(line.trim(), x, currentY);
            currentY += lineHeight;
        });
    }

    const addTextTriangle = (world, x, y, size, title, content) => {
        // Create triangle vertices
        const triangleVertices = [
            { x: 0, y: -size },       // Top point
            { x: -size, y: size },    // Bottom left
            { x: size, y: size }      // Bottom right
        ];

        // Create the physical triangle body
        const body = Bodies.fromVertices(x, y, [triangleVertices], {
            chamfer: { radius: 5 },
            render: {
                fillStyle: '#000000',
                //strokeStyle: '#333333',
                lineWidth: 2
            }
        }, true);

        // Store text data with the body
        body.textData = { title, content, size };

        // Add custom rendering
        Events.on(render, 'afterRender', function () {
            const ctx = render.context;
            const bodies = Composite.allBodies(engine.world);

            bodies.forEach(body => {
                if (body.textData && body.textData.size) { // Check for triangle
                    ctx.save();
                    const pos = body.position;
                    const angle = body.angle;

                    // Transform to body's coordinate system
                    ctx.translate(pos.x, pos.y);
                    ctx.rotate(angle);

                    // Draw title at top
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(body.textData.title, 0, -body.textData.size + 20);

                    // Draw content in center
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '10px Arial';
                    wrapTextInTriangle(ctx, body.textData.content, 0, 0, body.textData.size - 15, 12);

                    ctx.restore();
                }
            });
        });

        World.add(world, body);
        return body;
    };

    // Helper to wrap text inside a triangle
    function wrapTextInTriangle(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y - maxWidth / 3;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }



    // Add this function to create quarter donut shapes
    const addQuarterDonut = (world, x, y, innerRadius, outerRadius, options) => {
        // Create the outer quarter circle
        const outerArc = [];
        const innerArc = [];
        const segments = 16; // More segments for smoother curve

        // Generate points for both arcs
        for (let i = 0; i <= segments; i++) {
            const angle = (Math.PI / 2) * (i / segments);

            // Outer arc points
            outerArc.push({
                x: Math.cos(angle) * outerRadius,
                y: Math.sin(angle) * outerRadius
            });

            // Inner arc points (in reverse order)
            innerArc.unshift({
                x: Math.cos(angle) * innerRadius,
                y: Math.sin(angle) * innerRadius
            });
        }

        // Combine both arcs to form the quarter donut shape
        const vertices = [...outerArc, ...innerArc];

        // Create the body at the specified position
        const donut = Bodies.fromVertices(x, y, [vertices], {
            ...options,
            chamfer: { radius: 0 },
            isStatic: false
        }, true);

        if (!donut) {
            console.error('Failed to create quarter donut');
            return null;
        }

        // Add some physical properties
        Body.set(donut, {
            friction: 0.1,
            frictionStatic: 0.5,
            restitution: 0.3,
            density: 0.001
        });

        World.add(world, donut);
        return donut;
    };
    // Add this to your animation loop or update function
    /*Events.on(engine, 'afterUpdate', () => {
        const bodies = Composite.allBodies(engine.world);
        bodies.forEach(body => {
            if (body.updateTextPosition) {
                body.updateTextPosition();
            }
        });
    });*/
    Events.on(engine, 'afterUpdate', () => {
        // Check every 60 frames (about 1 second at 60fps)
        if (Math.floor(engine.timing.timestamp) % 60 === 0) {
            checkCanvasExpansion();
        }
    });

    // Start the engine and renderer
    Engine.run(engine);
    Render.run(render);

    // Debounce function to limit how often a function can be called
    const debounce = (func, delay) => {
        let timeoutId;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    };

    // Load objects from server
    const loadObjects = () => {
        return fetch(`/api/room/${roomId}`)
            .then(response => response.json())
            .then(data => {
                // Clear existing bodies (except walls)
                World.clear(engine.world, false);

                // Re-add walls
                walls = createWalls();
                World.add(engine.world, walls);

                // Load objects with delay between each
                return loadObjectsWithDelay(data.objects, 0);
            });
    };

    const loadObjectsWithDelay = (objects, index) => {
        if (index >= objects.length) {
            console.log('Finished loading all objects');
            return Promise.resolve();
        }

        return new Promise(resolve => {
            setTimeout(() => {
                const obj = objects[index];
                let newBody;

                if (obj.type === 'rectangle') {
                    newBody = Bodies.rectangle(obj.x, obj.y, obj.width, obj.height, obj.options);
                } else if (obj.type === 'circle') {
                    newBody = Bodies.circle(obj.x, obj.y, obj.radius, obj.options);
                } else if (obj.type === 'textRectangle') {
                    newBody = addTextRectangle(
                        engine.world,
                        obj.x,
                        obj.y,
                        obj.width,
                        obj.height,
                        obj.title,
                        obj.content
                    );
                } else if (obj.type === 'textCircle') {
                    newBody = addTextCircle(
                        engine.world,
                        obj.x,
                        obj.y,
                        obj.radius,
                        obj.title,
                        obj.content
                    );
                } else if (obj.type === 'textTriangle') {
                    newBody = addTextTriangle(
                        engine.world,
                        obj.x,
                        obj.y,
                        obj.size,
                        obj.title,
                        obj.content
                    );
                } else if (obj.type === 'quarterDonut') {
                    newBody = addQuarterDonut(
                        engine.world,
                        obj.x,
                        obj.y,
                        obj.innerRadius,
                        obj.outerRadius,
                        obj.options
                    );
                }

                if (newBody) {
                    World.add(engine.world, newBody);
                    currentBodies.push(newBody);
                }

                // Load next object after a short delay
                loadObjectsWithDelay(objects, index + 1).then(resolve);
            }, 50); // 50ms delay between objects
        });
    };

    // Handle window resize with debounce
    const handleResize = () => {
        expandCanvasHeightCount = 0;

        const { width, height } = getViewportDimensions();
        /*const width = render.options.width;
        const height = render.options.height;*/
        const oldHeight = render.options.height;

        // 1. Remove old walls
        World.remove(engine.world, walls);

        // 2. Update renderer
        render.options.width = width;
        render.options.height = height;
        render.canvas.width = width;
        render.canvas.height = height;
        //Render.setPixelRatio(render, window.devicePixelRatio);

        // 3. Create new walls
        walls = createWalls();
        World.add(engine.world, walls);

        // Adjust objects if height changed
        if (height !== oldHeight) {
            const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
            bodies.forEach(body => {
                if (body.position.y > height - 100) {
                    Body.setPosition(body, {
                        x: body.position.x,
                        y: height - 100
                    });
                }
            });
        }

        // 4. Notify other clients
        socket.emit('canvasDimensions', {
            width: width,
            height: height
        });

        // Reload objects to maintain their positions
        loadObjects().then(() => {
            console.log('Objects reloaded after resize');
        });
    };

    // Create debounced version of the resize handler with 500ms delay
    const debouncedResize = debounce(handleResize, 500);

    // Add event listener with debounced handler
    window.addEventListener('resize', debouncedResize);

    // Join the room
    socket.emit('joinRoom', roomId);

    // Initial load of objects
    loadObjects();

    // Listen for new objects from server
    socket.on('newObject', (object) => {
        let newBody;

        if (object.type === 'rectangle') {
            newBody = Bodies.rectangle(object.x, object.y, object.width, object.height, object.options);
        } else if (object.type === 'circle') {
            newBody = Bodies.circle(object.x, object.y, object.radius, object.options);
        } else if (object.type === 'textRectangle') {
            newBody = addTextRectangle(
                engine.world,
                object.x,
                object.y,
                object.width,
                object.height,
                object.title,
                object.content
            );
        } else if (object.type === 'textCircle') {
            newBody = addTextCircle(
                engine.world,
                object.x,
                object.y,
                object.radius,
                object.title,
                object.content
            );
        } else if (object.type === 'textTriangle') {
            newBody = addTextTriangle(
                engine.world,
                object.x,
                object.y,
                object.size,
                object.title,
                object.content
            );
        } else if (object.type === 'quarterDonut') {
            newBody = addQuarterDonut(
                engine.world,
                object.x,
                object.y,
                object.innerRadius,
                object.outerRadius,
                object.options
            );
        }

        if (newBody) {
            World.add(engine.world, newBody);
            currentBodies.push(newBody);
        }
    });

    // Broadcast canvas dimensions to control page
    socket.on('joinRoom', (room) => {
        // Send immediately when control page joins
        socket.emit('canvasDimensions', {
            width: render.options.width,
            height: render.options.height
        });
    });

    // Listen for clear events from server
    socket.on('roomCleared', () => {
        // Clear all bodies except walls
        const bodies = Composite.allBodies(engine.world);
        bodies.forEach(body => {
            if (!body.isStatic) {  // Don't remove walls
                World.remove(engine.world, body);
            }
        });
        console.log('Room cleared - removed all objects');
    });

    socket.on('setAutoExpand', (enabled) => {
        autoExpandingEnabled = enabled;
    });

    socket.on('autoExpandUpdated', (enabled) => {
        autoExpandingEnabled = enabled;
        console.log(`Auto-expansion ${enabled ? 'enabled' : 'disabled'}`);

        // Force an immediate check when enabled
        if (enabled) {
            checkCanvasExpansion();
        }
    });

    // Also update on resize
    const sendDimensions = () => {
        socket.emit('canvasDimensions', {
            width: render.options.width,
            height: render.options.height
        });
    };

    window.addEventListener('resize', debounce(() => {
        sendDimensions();
    }, 500));

    /*setInterval(() => {
        addQuarterDonut(engine.world, 400, 100, 30, 60, {
            render: {
                fillStyle: '#FF5722',
                strokeStyle: '#333',
                lineWidth: 2
            }
        });
        console.log(1);
    }, 2000);*/

});