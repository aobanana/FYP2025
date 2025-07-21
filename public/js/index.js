document.addEventListener('DOMContentLoaded', () => {
    const roomId = 100;
    const socket = io();

    // Default canvas dimensions (will be updated from index page)
    let canvasWidth = 800;
    let canvasHeight = 600;
    let autoExpandingEnabled = true;

    // Request dimensions when joining room
    socket.emit('joinRoom', roomId);

    // Listen for canvas dimension updates from index page
    socket.on('canvasDimensions', (dimensions) => {
        canvasWidth = dimensions.width;
        canvasHeight = dimensions.height;
        console.log('Updated canvas dimensions:', dimensions);
    });

    socket.on('autoExpandUpdated', (enabled) => {
        autoExpandingEnabled = enabled;
        document.getElementById('toggleAutoExpand').textContent =
            `Auto-Expand: ${enabled ? 'ON' : 'OFF'}`;
    });

    // Form submission handler
    document.getElementById('textObjectForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const titleInput = document.getElementById('title');
        const contentInput = document.getElementById('content');

        // Apply character limits
        const title = titleInput.value.slice(0, 20);  // Max 20 chars
        let content = contentInput.value.slice(0, 100);  // Max 100 chars
        content = content.replace(/(\r\n|\n|\r)/gm, " ");
        content = content.toUpperCase();console.log(content);

        localStorage.setItem("title", title);
        localStorage.setItem("content", content);

        let shapeType = Math.floor(Math.random() * 3);
        //shapeType = 2;// test use

        switch (shapeType) {
            case 1:
                textObject = {
                    id: Date.now().toString(),
                    type: 'textRectangle',
                    x: canvasWidth / 2,
                    y: 0,
                    width: 240,
                    height: 240,
                    title: title,
                    content: content,
                    options: {
                        restitution: 0.5,
                        render: {
                            fillStyle: '#ffffff',
                            strokeStyle: '#333333',
                            lineWidth: 2
                        }
                    }
                }; break;
            case 2:
                textObject = { // Triangle
                    id: Date.now().toString(),
                    type: 'textTriangle',
                    x: canvasWidth / 2,
                    y: 0,
                    size: 200,
                    title: title,
                    content: content,
                    options: {
                        restitution: 0.5,
                        render: {
                            fillStyle: '#ffffff',
                            strokeStyle: '#333333',
                            lineWidth: 2
                        }
                    }
                }; break;
            default: textObject = {
                id: Date.now().toString(),
                type: 'textCircle',
                x: canvasWidth / 2,
                y: 0,
                radius: 120,
                title: title,
                content: content,
                options: {
                    restitution: 0.5,
                    render: {
                        fillStyle: '#ffffff',
                        strokeStyle: '#333333',
                        lineWidth: 2
                    }
                }
            };
        }

        socket.emit('addObject', { roomId, object: textObject });
        e.target.reset();
    });

    // Button event listeners
    document.getElementById('addBox').addEventListener('click', () => {
        const box = {
            id: Date.now().toString(),
            type: 'rectangle',
            x: canvasWidth / 2,  // Dynamic center based on current canvas width
            y: 0,                // Top of the canvas
            width: 240,
            height: 240,
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
            radius: 120,
            options: {
                restitution: 0.8,
                render: {
                    fillStyle: getRandomColor()
                }
            }
        };

        socket.emit('addObject', { roomId, object: circle });
    });

    document.getElementById('addDonut').addEventListener('click', () => {
        const donut = {
            id: Date.now().toString(),
            type: 'quarterDonut',
            x: canvasWidth / 2,
            y: 0,
            innerRadius: 1,
            outerRadius: 60,
            options: {
                restitution: 0.8,
                render: {
                    fillStyle: getRandomColor()
                }
            }
        };
        socket.emit('addObject', { roomId, object: donut });
    });

    document.getElementById('toggleAutoExpand').addEventListener('click', () => {
        autoExpandingEnabled = !autoExpandingEnabled;
        socket.emit('setAutoExpand', {
            roomId: roomId,
            enabled: autoExpandingEnabled
        });
        console.log(autoExpandingEnabled);
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