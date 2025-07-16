document.addEventListener('DOMContentLoaded', () => {
    const roomId = 100;
    const socket = io();
    
    // Default canvas dimensions (will be updated from index page)
    let canvasWidth = 800;
    let canvasHeight = 600;

    // Request dimensions when joining room
    socket.emit('joinRoom', roomId);

    // Listen for canvas dimension updates from index page
    socket.on('canvasDimensions', (dimensions) => {
        canvasWidth = dimensions.width;
        canvasHeight = dimensions.height;
        console.log('Updated canvas dimensions:', dimensions);
    });

    // Button event listeners
    document.getElementById('addBox').addEventListener('click', () => {
        const box = {
            id: Date.now().toString(),
            type: 'rectangle',
            x: canvasWidth / 2,  // Dynamic center based on current canvas width
            y: 0,                // Top of the canvas
            width: 80,
            height: 80,
            options: {
                restitution: 0.8,
                render: {
                    fillStyle: getRandomColor()
                }
            }
        };
        
        socket.emit('addObject', { roomId, object: box });
    });
    
    document.getElementById('addCircle').addEventListener('click', () => {
        const circle = {
            id: Date.now().toString(),
            type: 'circle',
            x: canvasWidth / 2,  // Dynamic center based on current canvas width
            y: 0,                // Top of the canvas
            radius: 40,
            options: {
                restitution: 0.8,
                render: {
                    fillStyle: getRandomColor()
                }
            }
        };
        
        socket.emit('addObject', { roomId, object: circle });
    });
    
    // Helper function to generate random colors
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
});