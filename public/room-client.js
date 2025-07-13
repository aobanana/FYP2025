document.addEventListener('DOMContentLoaded', () => {
    // Get room ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    if (!roomId) {
        window.location.href = '/';
        return;
    }

    // Initialize Socket.io connection
    const socket = io();
    
    // Display room ID
    document.getElementById('roomTitle').textContent = roomId;
    
    // Initialize Matter.js
    const { Engine, Render, Runner, Bodies, Composite, Body, Mouse, MouseConstraint } = Matter;
    
    // Create engine
    const engine = Engine.create();
    const { world } = engine;

    // Track all objects with unique IDs
    const physicsObjects = new Map();

    // Generate unique ID for objects
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Create renderer
    const canvas = document.getElementById('physicsCanvas');
    const render = Render.create({
        canvas,
        engine,
        options: {
            width: canvas.clientWidth,
            height: canvas.clientHeight,
            wireframes: false,
            background: '#eee'
        }
    });
    
    // Add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });
    
    Composite.add(world, mouseConstraint);
    render.mouse = mouse;
    
    // Run the engine
    Engine.run(engine);
    Render.run(render);

    // Join the room
    socket.emit('joinRoom', roomId);
    
    // Create synchronized object
    function createSyncedObject(x, y, width, height, options = {}) {
        const objectId = generateId();
        const body = Bodies.rectangle(x, y, width, height, {
            ...options,
            plugin: { id: objectId }
        });
        
        Composite.add(world, body);
        physicsObjects.set(objectId, body);
        
        // Broadcast creation to server
        socket.emit('createObject', {
            roomId: roomId,
            object: {
                id: objectId,
                x, y, width, height,
                options
            }
        });
        
        return body;
    }

    // Handle incoming objects from other clients
    socket.on('addObject', (object) => {
        if (!physicsObjects.has(object.id)) {
            const body = Bodies.rectangle(
                object.x, object.y, 
                object.width, object.height, 
                {
                    ...object.options,
                    plugin: { id: object.id }
                }
            );
            Composite.add(world, body);
            physicsObjects.set(object.id, body);
        }
    });

    // Handle initial room state
    socket.on('roomState', (state) => {
        // Clear existing bodies (except walls)
        Composite.clear(world, false);
        
        // Re-add walls
        const walls = [
            Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
            Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
            Bodies.rectangle(0, 300, 50, 600, { isStatic: true }),
            Bodies.rectangle(800, 300, 50, 600, { isStatic: true })
        ];
        
        Composite.add(world, walls);
        
        // Add existing physics objects
        if (state.physicsObjects && state.physicsObjects.length > 0) {
            state.physicsObjects.forEach(obj => {
                if (!physicsObjects.has(obj.id)) {
                    const body = Bodies.rectangle(
                        obj.x, obj.y, 
                        obj.width, obj.height,
                        {
                            ...obj.options,
                            plugin: { id: obj.id }
                        }
                    );
                    Composite.add(world, body);
                    physicsObjects.set(obj.id, body);
                }
            });
        }
    });
    
    // Handle physics state updates from other clients
    socket.on('updatePhysicsState', (objects) => {
        objects.forEach(obj => {
            const body = physicsObjects.get(obj.id);
            if (body) {
                Body.setPosition(body, { x: obj.x, y: obj.y });
                Body.setVelocity(body, obj.velocity || { x: 0, y: 0 });
                Body.setAngle(body, obj.angle || 0);
            }
        });
    });
    
    // Synchronize physics state periodically
    setInterval(() => {
        const objects = Array.from(physicsObjects.values()).map(body => ({
            id: body.plugin.id,
            x: body.position.x,
            y: body.position.y,
            width: body.bounds.max.x - body.bounds.min.x,
            height: body.bounds.max.y - body.bounds.min.y,
            angle: body.angle,
            velocity: body.velocity,
            options: body.render
        }));
        
        socket.emit('physicsUpdate', {
            roomId: roomId,
            objects
        });
    }, 100); // Update 10 times per second
    
    // Handle canvas clicks to add objects
    canvas.addEventListener('mousedown', (event) => {
        if (event.button === 0) { // Left click
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            createSyncedObject(x, y, 80, 80, {
                render: {
                    fillStyle: `hsl(${Math.random() * 360}, 100%, 50%)`
                }
            });
        }
    });
    
    // Window resize handler
    window.addEventListener('resize', () => {
        render.options.width = canvas.clientWidth;
        render.options.height = canvas.clientHeight;
        Render.setPixelRatio(render, window.devicePixelRatio);
    });
});