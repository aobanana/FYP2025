const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const fs = require('fs');
const ROOMS_DATA_PATH = path.join(__dirname, 'rooms-data');
if (!fs.existsSync(ROOMS_DATA_PATH)) {
    fs.mkdirSync(ROOMS_DATA_PATH);
}

// Helper function to save room data
function saveRoomData(roomId, data) {
    const filePath = path.join(ROOMS_DATA_PATH, `room-${roomId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Helper function to load room data
function loadRoomData(roomId) {
    const filePath = path.join(ROOMS_DATA_PATH, `room-${roomId}.json`);
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (err) {
        console.error(`Error loading room ${roomId} data:`, err);
    }
    return null;
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files with proper headers
app.use('/styles.css', (req, res, next) => {
  res.setHeader('Content-Type', 'text/css');
  next();
});

// Add these routes before the static middleware
app.get('/', (req, res) => {
  //res.sendFile(path.join(__dirname, 'public', 'index.html'));
  const roomId = 101;
  res.render('index', { title: 'SENSO LAB' });
});

//app.get('/room.html', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'room.html'));
app.get('/dashboard', (req, res) => {
  //const roomId = req.query.room;
  const roomId = 101;
  res.render('dashboard', { title: `Dashboard` });
});

// Static files middleware
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Load room endpoint
app.get('/load-room/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    const filePath = path.join(ROOMS_DATA_PATH, `room-${roomId}.json`);
    
    try {
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            res.json(data);
        } else {
            res.json({ objects: [] }); // Return empty if no file exists
        }
    } catch (err) {
        console.error('Error loading room data:', err);
        res.status(500).json({ error: 'Failed to load room data' });
    }
});

// Store room data
const rooms = new Map();

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');
    rooms.set(socket.id, { roomId: null });
    
    // Join a room
    socket.on('joinRoom', (roomId) => {
        const previousRoom = rooms.get(socket.id)?.roomId;
        
        // Leave previous room if different
        if (previousRoom && previousRoom !== roomId) {
            socket.leave(previousRoom);
        }

        socket.join(roomId);
        rooms.set(socket.id, { roomId });
        console.log('joinRoom: ' + roomId);

        // Load or initialize room state
        if (!rooms.has(roomId)) {
            const savedData = loadRoomData(roomId) || {
                objects: [],
                lastUpdated: Date.now()
            };
            rooms.set(roomId, savedData);
        }
        
        // Send current room state to the new client
        socket.emit('roomState', rooms.get(roomId));
    });

    // Handle new object creation
    socket.on('createObject', ({ roomId, object }) => {
        if (rooms.has(roomId)) {
            const roomState = rooms.get(roomId);
            
            // Check if object exists by ID
            const existingIndex = roomState.objects.findIndex(obj => obj.id === object.id);
            
            if (existingIndex === -1) {
                // Add new object
                roomState.objects.push(object);
                roomState.lastUpdated = Date.now();
                
                // Broadcast to all in room except sender
                socket.to(roomId).emit('addObject', object);
            } else {
                // Update existing object
                roomState.objects[existingIndex] = object;
                roomState.lastUpdated = Date.now();
                
                // Broadcast update
                socket.to(roomId).emit('updatePhysicsState', [object]);
            }
        }
    });
    
    // Handle physics updates
    /*socket.on('physicsUpdate', (data) => {
        const { roomId, objects } = data;
        
        if (rooms.has(roomId)) {
            rooms.get(roomId).physicsObjects = objects;
            socket.to(roomId).emit('physicsUpdate', objects);
        }
    });*/
    // Handle physics updates
    socket.on('physicsUpdate', ({ roomId, objects }) => {
        if (rooms.has(roomId)) {
            const roomState = rooms.get(roomId);
            // Update existing objects
            objects.forEach(updatedObj => {
                const index = roomState.objects.findIndex(obj => obj.id === updatedObj.id);
                if (index !== -1) {
                    roomState.objects[index] = updatedObj;
                }
            });
            roomState.lastUpdated = Date.now();
            
            // Broadcast to all in room except sender
            socket.to(roomId).emit('updatePhysicsState', objects);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        rooms.delete(socket.id);
        console.log('Client disconnected');
    });

    // Add periodic saving
    setInterval(() => {
        rooms.forEach((data, roomId) => {
            saveRoomData(roomId, data);
        });
    }, 30000); // Save every 30 seconds
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});