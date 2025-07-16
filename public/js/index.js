document.addEventListener('DOMContentLoaded', () => {
    const roomId = 100;
    const socket = io();
    
    // Matter.js setup
    const { Engine, Render, World, Bodies, Body, Composite } = Matter;
    
    // Create engine
    const engine = Engine.create({
        gravity: { x: 0, y: 1 }
    });
    
    // Create renderer
    const render = Render.create({
        element: document.getElementById('canvas-container'),
        engine: engine,
        options: {
            width: 800,
            height: 600,
            wireframes: false,
            background: '#f4f4f4'
        }
    });
    
    // Add walls to contain objects
    const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    const leftWall = Bodies.rectangle(-10, 300, 60, 620, { isStatic: true });
    const rightWall = Bodies.rectangle(810, 300, 60, 620, { isStatic: true });
    const ceiling = Bodies.rectangle(400, -10, 810, 60, { isStatic: true });
    
    World.add(engine.world, [ground, leftWall, rightWall, ceiling]);
    
    // Start the engine and renderer
    Engine.run(engine);
    Render.run(render);
    
    // Join the room
    socket.emit('joinRoom', roomId);
    
    // Load existing objects from server
    fetch(`/api/room/${roomId}`)
        .then(response => response.json())
        .then(data => {
            data.objects.forEach(obj => {
                let newBody;
                if (obj.type === 'rectangle') {
                    newBody = Bodies.rectangle(obj.x, obj.y, obj.width, obj.height, obj.options);
                } else if (obj.type === 'circle') {
                    newBody = Bodies.circle(obj.x, obj.y, obj.radius, obj.options);
                }
                
                if (newBody) {
                    World.add(engine.world, newBody);
                }
            });
        });
    
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
        }
    });
});