document.addEventListener('DOMContentLoaded', () => {
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
    const createWalls = () => {
        const { width, height } = getViewportDimensions();
        return [
            Bodies.rectangle(width / 2, height + 30, width, 60, { isStatic: true }), // ground
            Bodies.rectangle(-30, height / 2, 60, height, { isStatic: true }), // left wall
            Bodies.rectangle(width + 30, height / 2, 60, height, { isStatic: true }), // right wall
            Bodies.rectangle(width / 2, -30, width, 60, { isStatic: true }) // ceiling
        ];
    };

    let walls = createWalls();
    World.add(engine.world, walls);

    const addTextRectangle = (world, x, y, width, height, title, content) => {
        // Create the physical rectangle body
        const body = Bodies.rectangle(x, y, width, height, {
            chamfer: { radius: 10 },
            render: {
                fillStyle: '#ffffff',
                strokeStyle: '#333333',
                lineWidth: 2
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
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(body.textData.title, 0, -body.textData.height / 2 + 20);

                    ctx.fillStyle = '#333333';
                    ctx.font = '14px Arial';
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

    // Add this to your animation loop or update function
    /*Events.on(engine, 'afterUpdate', () => {
        const bodies = Composite.allBodies(engine.world);
        bodies.forEach(body => {
            if (body.updateTextPosition) {
                body.updateTextPosition();
            }
        });
    });*/

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
        const { width, height } = getViewportDimensions();

        // Update renderer dimensions
        render.options.width = width;
        render.options.height = height;
        render.canvas.width = width;
        render.canvas.height = height;

        // Update bounds for the renderer
        Render.setPixelRatio(render, window.devicePixelRatio);

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
});