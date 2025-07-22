document.addEventListener('DOMContentLoaded', () => {
    // Add these near the top of control.js
    const MAX_OBJECTS_BEFORE_EXPAND = 10; // Adjust as needed
    const CANVAS_BASE = 20;
    const CANVAS_EXPANSION_STEP = 200; // Pixels to expand by
    let autoExpandingEnabled = true;
    let expandCanvasHeightCount = 0;

    // Function to check if we need to expand the canvas
    const checkCanvasExpansion = () => {
        if (!autoExpandingEnabled) return;

        const bodies = Composite.allBodies(engine.world);
        const dynamicBodies = bodies.filter(body => !body.isStatic);

        let extra = (dynamicBodies.length - CANVAS_BASE < 0) ? 0 : dynamicBodies.length - CANVAS_BASE;
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
            width: viewport.width - 64,
            height: viewport.height - 80,
            wireframes: false,
            //background: '#f4f4f4',
            background: 'transparent',
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

    const addTextRectangle = (world, x, y, width, height, title, content, storageId) => {
        // Create the physical rectangle body
        const body = Bodies.rectangle(x, y, width, height, {
            chamfer: { radius: 0 },
            render: {
                fillStyle: '#000000',
                strokeStyle: '#ffffff', // White border
                lineWidth: 1          // 1px border
            }
        });

        // Store text data with the body including storage ID
        body.customId = storageId;
        body.customData = {
            title,
            content,
            width,
            height,
            storageId,
            type: 'textRectangle'
        };

        // Store text data with the body
        body.textData = { title, content, width, height };

        // Add custom rendering - only once per body type
        if (!addTextRectangle.renderingAdded) {
            addTextRectangle.renderingAdded = true;

            Events.on(render, 'afterRender', function () {
                const ctx = render.context;
                const bodies = Composite.allBodies(engine.world);

                for (let i = 0; i < bodies.length; i++) {
                    const body = bodies[i];
                    if (body.textData && body.textData.width) { // Check for rectangle specifically
                        renderTextRectangle(ctx, body);
                    }
                }
            });
        }

        World.add(world, body);
        return body;
    };

    // Separate rendering function for better organization and potential reuse
    function renderTextRectangle(ctx, body) {
        ctx.save();

        // Get body position and angle
        const pos = body.position;
        const angle = body.angle;

        // Transform to body's coordinate system
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        // Calculate text metrics
        const maxWidth = body.textData.width - 100;
        const lineHeight = 18;
        const padding = 35;

        // Calculate wrapped lines for content
        const contentLines = wrapTextToLines(ctx, body.textData.content, maxWidth, '14px "Nunito Sans"');
        const contentHeight = contentLines.length * lineHeight;
        const titleHeight = 20;
        const separatorHeight = 35;
        const totalTextHeight = titleHeight + separatorHeight + contentHeight;

        // Starting Y position for vertical centering
        const startY = -totalTextHeight / 2;

        // Set common text properties
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Draw content (top section)
        ctx.font = '14px "Nunito Sans"';
        for (let i = 0; i < contentLines.length; i++) {
            ctx.fillText(contentLines[i], 0, startY + (i * lineHeight));
        }

        // Draw separator line (1px horizontal line)
        const lineY = startY + contentHeight + 20;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-5, lineY); // Make separator proportional to width
        ctx.lineTo(5, lineY);
        ctx.stroke();

        // Draw title (bottom section)
        ctx.font = '12px "Nunito Sans"';
        ctx.fillText(body.textData.title, 0, lineY + 10);

        ctx.restore();
    }

    // Helper function to wrap text into lines
    function wrapTextToLines(ctx, text, maxWidth, font) {
        ctx.font = font;
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // Add this function to control.js (alongside addTextRectangle)
    const addTextCircle = (world, x, y, radius, title, content, storageId) => {
        // Create the physical circle body
        const body = Bodies.circle(x, y, radius, {
            render: {
                fillStyle: '#000000',
                lineWidth: 2
            }
        });

        body.customId = storageId;
        body.customData = {
            title,
            content,
            radius,
            storageId,
            type: 'textCircle'
        };

        // Store text data with the body
        body.textData = { title, content, radius };

        // Add custom rendering - only once per body type
        if (!addTextCircle.renderingAdded) {
            addTextCircle.renderingAdded = true;

            Events.on(render, 'afterRender', function () {
                const ctx = render.context;
                const bodies = Composite.allBodies(engine.world);

                for (let i = 0; i < bodies.length; i++) {
                    const body = bodies[i];
                    if (body.textData && body.textData.radius) { // Check for circle specifically
                        renderTextCircle(ctx, body);
                    }
                }
            });
        }

        World.add(world, body);
        return body;
    };

    // Separate rendering function for better organization and potential reuse
    function renderTextCircle(ctx, body) {
        ctx.save();

        // Get body position and angle
        const pos = body.position;
        const angle = body.angle;

        // Transform to body's coordinate system
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        // Calculate text metrics
        const maxWidth = (body.textData.radius - 20) * 1.8; // Slightly smaller than circle
        const lineHeight = 18;

        // Calculate wrapped lines for content
        const contentLines = wrapTextToLines(ctx, body.textData.content, maxWidth, '14px "Nunito Sans"');
        const contentHeight = contentLines.length * lineHeight;
        const separatorHeight = 10;
        const titleHeight = 20;
        const totalHeight = contentHeight + separatorHeight + titleHeight;

        // Starting Y position for vertical centering
        const startY = -totalHeight / 2;

        // Set common text properties
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Draw content lines (centered)
        ctx.font = '14px "Nunito Sans"';
        for (let i = 0; i < contentLines.length; i++) {
            ctx.fillText(contentLines[i], 0, startY + (i * lineHeight));
        }

        // Draw separator line (centered, short)
        const lineY = startY + contentHeight + 5;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-5, lineY); // Make separator proportional to radius
        ctx.lineTo(5, lineY);
        ctx.stroke();

        // Draw title (centered below separator)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Nunito Sans"';
        ctx.fillText(body.textData.title, 0, lineY + 8);

        ctx.restore();
    }

    const addTextTriangle = (world, x, y, size, title, content, storageId) => {
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
                lineWidth: 2
            }
        }, true);

        body.customId = storageId;
        body.customData = {
            title,
            content,
            size,
            storageId,
            type: 'textTriangle'
        };

        // Store text data with the body
        body.textData = { title, content, size };

        // Add custom rendering - only once per body type
        if (!addTextTriangle.renderingAdded) {
            addTextTriangle.renderingAdded = true;

            Events.on(render, 'afterRender', function () {
                const ctx = render.context;
                const bodies = Composite.allBodies(engine.world);

                for (let i = 0; i < bodies.length; i++) {
                    const body = bodies[i];
                    if (body.textData && body.textData.size) { // Check for triangle specifically
                        renderTextTriangle(ctx, body);
                    }
                }
            });
        }

        World.add(world, body);
        return body;
    };

    // Separate rendering function for better organization and potential reuse
    function renderTextTriangle(ctx, body) {
        ctx.save();

        // Get body position and angle
        const pos = body.position;
        const angle = body.angle;

        // Transform to body's coordinate system
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        // Calculate text metrics
        //const maxWidth = body.textData.size * 1.6; // Adjusted for triangle shape
        const maxWidth = body.textData.size * 0.8; // Adjusted for triangle shape
        const lineHeight = 16;

        // Calculate wrapped lines for content
        const contentLines = wrapTextToLines(ctx, body.textData.content, maxWidth, '14px "Nunito Sans"');
        const contentHeight = contentLines.length * lineHeight;
        const separatorHeight = 10;
        const titleHeight = 16;
        const totalHeight = contentHeight + separatorHeight + titleHeight;

        // Starting Y position for vertical centering
        const startY = -totalHeight / 2;

        // Set common text properties
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Draw content lines (centered)
        ctx.font = '14px "Nunito Sans"';
        for (let i = 0; i < contentLines.length; i++) {
            ctx.fillText(contentLines[i], 0, startY + (i * lineHeight));
        }

        // Draw separator line (centered, proportional to triangle size)
        const lineY = startY + contentHeight + 5;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(-5, lineY);
        ctx.lineTo(5, lineY);
        ctx.stroke();

        // Draw title (centered below separator)
        ctx.font = 'bold 12px "Nunito Sans"';
        ctx.fillText(body.textData.title, 0, lineY + 8);

        ctx.restore();
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
                    newBody.customId = obj.id; // Store the storage ID
                } else if (obj.type === 'circle') {
                    newBody = Bodies.circle(obj.x, obj.y, obj.radius, obj.options);
                    newBody.customId = obj.id; // Store the storage ID
                } else if (obj.type === 'textRectangle') {
                    newBody = addTextRectangle(
                        engine.world,
                        obj.x,
                        obj.y,
                        obj.width,
                        obj.height,
                        obj.title,
                        obj.content,
                        obj.id
                    );
                    newBody.customId = obj.id;
                } else if (obj.type === 'textCircle') {
                    newBody = addTextCircle(
                        engine.world,
                        obj.x,
                        obj.y,
                        obj.radius,
                        obj.title,
                        obj.content,
                        obj.id
                    );
                    newBody.customId = obj.id;
                } else if (obj.type === 'textTriangle') {
                    newBody = addTextTriangle(
                        engine.world,
                        obj.x,
                        obj.y,
                        obj.size,
                        obj.title,
                        obj.content,
                        obj.id
                    );
                    newBody.customId = obj.id;
                } else if (obj.type === 'quarterDonut') {
                    newBody = addQuarterDonut(
                        engine.world,
                        obj.x,
                        obj.y,
                        obj.innerRadius,
                        obj.outerRadius,
                        obj.options,
                        obj.id
                    );
                    newBody.customId = obj.id;
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
            newBody.customId = object.id; // Store the storage ID
        } else if (object.type === 'circle') {
            newBody = Bodies.circle(object.x, object.y, object.radius, object.options);
            newBody.customId = object.id; // Store the storage ID
        } else if (object.type === 'textRectangle') {
            newBody = addTextRectangle(
                engine.world,
                object.x,
                object.y,
                object.width,
                object.height,
                object.title,
                object.content,
                object.id
            );
            newBody.customId = object.id; // Store the storage ID
        } else if (object.type === 'textCircle') {
            newBody = addTextCircle(
                engine.world,
                object.x,
                object.y,
                object.radius,
                object.title,
                object.content,
                object.id
            );
            newBody.customId = object.id; // Store the storage ID
        } else if (object.type === 'textTriangle') {
            newBody = addTextTriangle(
                engine.world,
                object.x,
                object.y,
                object.size,
                object.title,
                object.content,
                object.id
            );
            newBody.customId = object.id; // Store the storage ID
        } else if (object.type === 'quarterDonut') {
            newBody = addQuarterDonut(
                engine.world,
                object.x,
                object.y,
                object.innerRadius,
                object.outerRadius,
                object.options,
                object.id
            );
            newBody.customId = object.id; // Store the storage ID
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

    // Listen for object removal events
    socket.on('objectRemoved', ({ objectId }) => {
        console.log('objectRemoved: ' + objectId);
        const bodies = Composite.allBodies(engine.world);
        const bodyToRemove = bodies.find(b => {
            // Check all possible ID locations for text and regular objects
            return (
                b.id.toString() === objectId.toString() ||
                (b.customId && b.customId.toString() === objectId.toString()) ||
                (b.customData && b.customData.storageId === objectId)
            );
        });

        if (bodyToRemove) {
            World.remove(engine.world, bodyToRemove);
            currentBodies = currentBodies.filter(b =>
                b.id !== bodyToRemove.id &&
                (!b.customId || b.customId.toString() !== objectId.toString())
            );
            console.log(`Removed object ${objectId}`);
        } else {
            console.log(`Object ${objectId} not found in physics world`);
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