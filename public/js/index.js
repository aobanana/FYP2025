document.addEventListener('DOMContentLoaded', () => {
    const roomId = 100;
    const socket = io();
    
    // Matter.js setup
    const { Engine, Render, World, Bodies, Body, Composite } = Matter;
    
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
            background: '#f4f4f4'
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
    
    // Start the engine and renderer
    Engine.run(engine);
    Render.run(render);
    
    // Debounce function to limit how often a function can be called
    const debounce = (func, delay) => {
        let timeoutId;
        return function() {
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
                
                // Add all objects from server
                data.objects.forEach(obj => {
                    let newBody;
                    if (obj.type === 'rectangle') {
                        newBody = Bodies.rectangle(obj.x, obj.y, obj.width, obj.height, obj.options);
                    } else if (obj.type === 'circle') {
                        newBody = Bodies.circle(obj.x, obj.y, obj.radius, obj.options);
                    }
                    
                    if (newBody) {
                        World.add(engine.world, newBody);
                        currentBodies.push(newBody);
                    }
                });
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
        }
        
        if (newBody) {
            World.add(engine.world, newBody);
            currentBodies.push(newBody);
        }
    });

    // Broadcast canvas dimensions to control page
    setInterval(() => {
        socket.emit('canvasDimensions', {
            width: render.options.width,
            height: render.options.height
        });
    }, 1000);
});