const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

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
  res.render('index', { title: 'Matter.js Physics Demo' });
});

//app.get('/room.html', (req, res) => {
//  res.sendFile(path.join(__dirname, 'public', 'room.html'));
app.get('/room', (req, res) => {
  const roomId = req.query.room;
  res.render('room', { title: `Room: ${roomId}`, roomId });
});

// Static files middleware
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Store room data
const rooms = new Map();

// Socket.io connection
io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Join a room
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                physicsObjects: [],
                objects: [],
                lastUpdated: Date.now()
            });
        }
        
        // Send current room state to the new client
        socket.emit('roomState', rooms.get(roomId));
    });

    // Handle new object creation
    socket.on('createObject', ({ roomId, object }) => {
        if (rooms.has(roomId)) {
            const roomState = rooms.get(roomId);
            /*roomState.objects.push(object);
            roomState.lastUpdated = Date.now();
            
            // Broadcast to all in room except sender
            socket.to(roomId).emit('addObject', object);*/
            // Only add if not already exists
            if (!roomState.objects.some(obj => obj.id === object.id)) {
                roomState.objects.push(object);
                roomState.lastUpdated = Date.now();
                
                // Broadcast to all in room except sender
                socket.to(roomId).emit('addObject', object);
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
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});