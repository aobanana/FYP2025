const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Configuration
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'room_100.json');

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
app.post('/api/room/:roomId/clear', (req, res) => {
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
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId.toString());
        console.log(`User joined room ${roomId}`);
    });

    socket.on('addObject', ({ roomId, object }) => {
        // Save to JSON file
        const data = getRoomData(roomId);
        data.objects.push(object);
        saveRoomData(roomId, data);

        // Broadcast to all clients in the room
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
});