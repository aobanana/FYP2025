document.addEventListener('DOMContentLoaded', () => {
    const roomId = 100;
    const socket = io();
    
    // Join the room
    socket.emit('joinRoom', roomId);
    
    // Button event listeners
    document.getElementById('addBox').addEventListener('click', () => {
        const box = {
            id: Date.now().toString(),
            type: 'rectangle',
            x: 400,
            y: 100,
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
            x: 400,
            y: 100,
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