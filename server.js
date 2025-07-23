const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Matter = require('matter-js'); // Add this line
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Configuration
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'room_100.json');

// Initialize rooms with Matter.js worlds
const rooms = {
    100: (function () {
        const engine = Matter.Engine.create();
        const world = engine.world;
        return {
            engine,
            world,
            bodies: {} // Track objects by ID
        };
    })()
};

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize empty data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ objects: [] }, null, 2));
}

const roomSettings = {
    100: { // Using roomId as key
        autoExpandingEnabled: true
    }
};

// Add this after your room initialization
const syncPhysicsWithStorage = (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    // Clear existing physics bodies (except walls/static bodies if any)
    Matter.Composite.clear(room.world, false);

    // Load objects from storage and add to physics world
    const data = getRoomData(roomId);
    data.objects.forEach(obj => {
        let body;

        switch (obj.type) {
            case 'rectangle':
                body = Matter.Bodies.rectangle(obj.x, obj.y, obj.width, obj.height, obj.options);
                break;
            case 'circle':
                body = Matter.Bodies.circle(obj.x, obj.y, obj.radius, obj.options);
                break;
            // Add other shape types as needed
            default:
                body = Matter.Bodies.rectangle(obj.x, obj.y, 80, 80, obj.options);
        }

        if (body) {
            // Store additional metadata
            body.customData = {
                title: obj.title,
                content: obj.content,
                type: obj.type
            };
            Matter.Composite.add(room.world, body);
            room.bodies[body.id] = body.customData;
        }
    });
};

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.render('index', { roomId: 100 });
});

app.get('/control', (req, res) => {
    res.render('control', { roomId: 100 });
});

// Add this with your other routes
app.get('/clear-json', (req, res) => {
    res.render('clear-json', { roomId: 100 });
});

// API to get room data
app.get('/api/room/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    const data = getRoomData(roomId);
    res.json(data);
});

// Add this API endpoint
/*app.post('/api/room/:roomId/clear', (req, res) => {
    const roomId = req.params.roomId;
    const emptyData = { objects: [] };

    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(emptyData, null, 2));
        // Broadcast clear event to all clients
        io.to(roomId.toString()).emit('roomCleared');
        res.json({ success: true });
    } catch (err) {
        console.error('Error clearing room data:', err);
        res.status(500).json({ success: false });
    }
});*/
app.post('/api/room/:roomId/clear', (req, res) => {
    const roomId = req.params.roomId;
    const emptyData = { objects: [] };

    try {
        // Clear storage
        fs.writeFileSync(DATA_FILE, JSON.stringify(emptyData, null, 2));

        // Clear physics world
        const room = rooms[roomId];
        if (room) {
            Matter.Composite.clear(room.world, false);
            room.bodies = {};
        }

        // Broadcast clear event
        io.to(roomId.toString()).emit('roomCleared');
        res.json({ success: true });
    } catch (err) {
        console.error('Error clearing room:', err);
        res.status(500).json({ success: false });
    }
});

// Get all objects in a room
app.get('/api/room/:roomId/objects', (req, res) => {
    const roomId = req.params.roomId;

    try {
        // Get from storage
        const data = getRoomData(roomId);

        // Verify against physics world
        const room = rooms[roomId];
        if (room) {
            const physicsIds = Matter.Composite.allBodies(room.world)
                .map(b => b.customId);

            // Check for desync
            const storageIds = data.objects.map(o => o.id);
            const missingInPhysics = storageIds.filter(id => !physicsIds.includes(id));

            if (missingInPhysics.length > 0) {
                console.warn('Objects in storage missing from physics world:', missingInPhysics);
            }
        }

        res.json(data.objects);
    } catch (err) {
        console.error('Error getting objects:', err);
        res.status(500).json({
            success: false,
            message: 'Error getting objects'
        });
    }
});

// Add this endpoint to create test objects
app.post('/api/room/:roomId/test-object', (req, res) => {
    const roomId = req.params.roomId;
    const room = rooms[roomId];

    if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Create a test box
    const box = Matter.Bodies.rectangle(400, 200, 80, 80);
    room.bodies[box.id] = {
        type: 'test-box',
        title: 'Test Object',
        content: 'This is a test object'
    };
    Matter.Composite.add(room.world, box);

    res.json({
        success: true,
        objectId: box.id
    });
});

// Remove a specific object
app.delete('/api/room/:roomId/objects/:objectId', (req, res) => {
    const { roomId, objectId } = req.params;

    try {
        // 1. Get current room data
        const data = getRoomData(roomId);

        // 2. Find the object index - handle both string and number IDs
        const objectIndex = data.objects.findIndex(obj =>
            obj.id.toString() === objectId.toString()
        );

        if (objectIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Object not found in storage'
            });
        }

        // 3. Remove from physics world if it exists
        const room = rooms[roomId];
        if (room) {
            // Search all bodies for matching ID or customId
            const body = Matter.Composite.allBodies(room.world).find(b => {
                return b.id.toString() === objectId.toString() ||
                    (b.customId && b.customId.toString() === objectId.toString()) ||
                    (b.customData && b.customData.storageId === objectId);
            });

            if (body) {
                Matter.Composite.remove(room.world, body);
                // Clean up tracking regardless of ID type
                if (body.customId) delete room.bodies[body.customId];
                if (body.id) delete room.bodies[body.id];
            }
        }

        // 4. Remove from storage
        data.objects.splice(objectIndex, 1);
        saveRoomData(roomId, data);

        // 5. Broadcast removal to ALL clients
        io.to(roomId.toString()).emit('objectRemoved', { objectId });

        res.json({ success: true });
    } catch (err) {
        console.error('Error removing object:', err);
        res.status(500).json({
            success: false,
            message: 'Error removing object'
        });
    }
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId.toString());
        console.log(`User joined room ${roomId}`);
    });

    /*socket.on('addObject', ({ roomId, object }) => {
        // Save to JSON file
        const data = getRoomData(roomId);
        data.objects.push(object);
        saveRoomData(roomId, data);

        // Broadcast to all clients in the room
        io.to(roomId.toString()).emit('newObject', object);
    });*/
    socket.on('addObject', ({ roomId, object }) => {
        // Ensure object has an ID
        if (!object.id) {
            object.id = Date.now().toString();
        }

        // Save to JSON file
        const data = getRoomData(roomId);
        data.objects.push(object);
        saveRoomData(roomId, data);

        // Add to physics world if needed
        const room = rooms[roomId];
        if (room) {
            let body;
            switch (object.type) {
                case 'rectangle':
                    body = Matter.Bodies.rectangle(
                        object.x,
                        object.y,
                        object.width,
                        object.height,
                        object.options
                    );
                    break;
                case 'circle':
                    body = Matter.Bodies.circle(
                        object.x,
                        object.y,
                        object.radius,
                        object.options
                    );
                    break;
                // Add other cases as needed
                default:
                    body = Matter.Bodies.rectangle(object.x, object.y, 80, 80, {});
            }

            if (body) {
                // Store the storage ID with the physics body
                body.customId = object.id;
                Matter.Composite.add(room.world, body);
                room.bodies[body.id] = {
                    storageId: object.id,
                    type: object.type
                };
            }
        }

        // Broadcast to all clients
        io.to(roomId.toString()).emit('newObject', object);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('setAutoExpand', ({ roomId, enabled }) => {
        if (roomSettings[roomId]) {
            roomSettings[roomId].autoExpandingEnabled = enabled;
            io.to(roomId.toString()).emit('autoExpandUpdated', enabled);
        }
    });

    // When a client connects to the management page
    socket.on('joinManagement', (roomId) => {
        socket.join(roomId);
    });

    socket.on('canvasDimensions', ({ roomId, width, height }) => {
        // Broadcast to all OTHER clients in the room
        io.to(roomId).emit('canvasDimensions', { width, height });
        console.log('room '+ roomId + ' canvasDimensions: ' + width + '/' + height);
    });

});

// Helper functions
function getRoomData(roomId) {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading room data:', err);
        return { objects: [] };
    }
}

function saveRoomData(roomId, data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error saving room data:', err);
    }
}

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    syncPhysicsWithStorage(100); // Initialize room 100
});