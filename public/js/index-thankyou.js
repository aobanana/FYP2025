document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('thankYouCanvas');
    const ctx = canvas.getContext('2d');
    const randomButton = document.getElementById('randomButton');
    const refreshButton = document.getElementById('refreshButton');
    const saveButton = document.getElementById('saveButton');

    // Set canvas size
    canvas.width = 728;
    canvas.height = 1598;

    // Load images
    const bgImage = new Image();
    // Image paths
    const bgImages = [
        'images/Wallpaper/Unssen-01.jpg',
        'images/Wallpaper/Unssen-02.jpg',
        'images/Wallpaper/Unssen-03.jpg',
        'images/Wallpaper/Unssen-04.jpg',
        'images/Wallpaper/Unssen-05.jpg',
        'images/Wallpaper/Unssen-06.jpg',
        'images/Wallpaper/Unssen-07.jpg',
        'images/Wallpaper/Unssen-08.jpg',
        'images/Wallpaper/Unssen-09.jpg',
        'images/Wallpaper/Unssen-10.jpg',
        'images/Wallpaper/Unssen-11.jpg',
        'images/Wallpaper/Unssen-12.jpg',
        'images/Wallpaper/Unssen-13.jpg',
        'images/Wallpaper/Unssen-14.jpg',
        'images/Wallpaper/Unssen-15.jpg',
        'images/Wallpaper/Unssen-16.jpg',
        'images/Wallpaper/Unssen-17.jpg',
        'images/Wallpaper/Unssen-18.jpg',
        'images/Wallpaper/Unssen-19.jpg',
        'images/Wallpaper/Unssen-20.jpg',
        'images/Wallpaper/Unssen-21.jpg',
        'images/Wallpaper/Unssen-22.jpg',
        'images/Wallpaper/Unssen-23.jpg',
        'images/Wallpaper/Unssen-24.jpg',
        'images/Wallpaper/Unssen-25.jpg',
        'images/Wallpaper/Unssen-26.jpg',
        'images/Wallpaper/Unssen-27.jpg',
        'images/Wallpaper/Unssen-28.jpg',
        'images/Wallpaper/Unssen-29.jpg',
        'images/Wallpaper/Unssen-30.jpg',
        'images/Wallpaper/Unssen-31.jpg',
        'images/Wallpaper/Unssen-32.jpg',
        'images/Wallpaper/Unssen-33.jpg',
        'images/Wallpaper/Unssen-34.jpg',
        'images/Wallpaper/Unssen-35.jpg',
        'images/Wallpaper/Unssen-36.jpg',
        'images/Wallpaper/Unssen-37.jpg',
        'images/Wallpaper/Unssen-38.jpg',
        'images/Wallpaper/Unssen-39.jpg',
        'images/Wallpaper/Unssen-40.jpg',
        'images/Wallpaper/Unssen-41.jpg',
        'images/Wallpaper/Unssen-42.jpg',
        'images/Wallpaper/Unssen-43.jpg',
        'images/Wallpaper/Unssen-44.jpg',
        'images/Wallpaper/Unssen-45.jpg',
        'images/Wallpaper/Unssen-46.jpg',
        'images/Wallpaper/Unssen-47.jpg',
        'images/Wallpaper/Unssen-48.jpg',
        'images/Wallpaper/Unssen-49.jpg',
        'images/Wallpaper/Unssen-50.jpg'
    ];

    //generate();// test use

    function generate() {
        const title = localStorage.getItem("title",);
        const content = localStorage.getItem("content",);

        // When both images are loaded
        Promise.all([
            new Promise(resolve => { bgImage.onload = resolve; }),
        ]).then(() => {
            // Draw background image
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

            // Calculate positions from bottom
            const leftMargin = 42; // Left margin for all text
            const bottomPadding = 180; // Space from bottom
            const titleHeight = 30; // Title text height
            const separatorHeight = 60; // Space for separator line
            const lineSpacing = 52; // Space between content lines
            const contentTopMargin = 20; // Space above content

            // Process content into lines
            //const subtitleLines = wrapText(ctx, content, canvas.width * 0.8, 'bold 44px "Nunito Sans"');
            const subtitleLines = wrapText(ctx, content, 482, 'bold 44px "Nunito Sans"');
            const contentHeight = subtitleLines.length * lineSpacing;

            // Calculate positions (working from bottom up)
            const contentBottomY = canvas.height - bottomPadding;
            //const titleY = lineY - separatorHeight;
            const titleY = contentBottomY - titleHeight;
            //const lineY = contentStartY - contentTopMargin;
            const lineY = titleY - separatorHeight;
            //const contentStartY = contentBottomY - contentHeight;
            const contentStartY = lineY - contentHeight;

            // Draw title (top element) - left aligned
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic 28px "Nunito Sans"';
            ctx.textAlign = 'left';
            ctx.fillText(title, leftMargin, titleY);

            // Draw separator line (middle element) - left aligned
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(leftMargin, lineY);
            ctx.moveTo(leftMargin, lineY);
            ctx.lineTo(leftMargin + 50, lineY); // 200px wide line
            ctx.stroke();

            // Draw content lines (bottom element) - left aligned
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 44px "Nunito Sans"';
            ctx.textAlign = 'left';

            subtitleLines.forEach((line, index) => {
                ctx.fillText(line, leftMargin, contentStartY + (index * lineSpacing));
            });
        });
    }

    function generateFn() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        bgImage.src = 'images/Quote-Template-Background.jpg';
        generate();
    }
    window.generateFn = generateFn;

    // Helper function to wrap text into lines
    function wrapText(ctx, text, maxWidth, font) {
        ctx.font = font;
        const lines = [];

        // Check if the text contains CJK characters (Japanese, Chinese, etc.)
        const isCJK = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);

        if (isCJK) {
            // Handle CJK text (character-by-character wrapping)
            let currentLine = '';

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const testLine = currentLine + char;
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }

            if (currentLine) {
                lines.push(currentLine);
            }
        } else {
            // Handle Western text (space-separated word wrapping)
            const words = text.split(' ');
            let currentLine = words[0] || '';

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const testLine = currentLine + ' ' + word;
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }

            if (currentLine) {
                lines.push(currentLine);
            }
        }

        return lines;
    }

    randomButton.addEventListener('click', function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const bgImage = new Image();
        bgImage.src = bgImages[Math.floor(Math.random() * 50)];
        bgImage.onload = function () {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        }
    });

    refreshButton.addEventListener('click', function () {
        generateFn();
    });

    // Save button functionality
    saveButton.addEventListener('click', function () {
        // Create a temporary link
        const link = document.createElement('a');
        link.download = 'SENSO.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});