document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('thankYouCanvas');
    const ctx = canvas.getContext('2d');
    const saveButton = document.getElementById('saveButton');

    // Set canvas size
    canvas.width = 728;
    canvas.height = 1598;

    // Load images
    const bgImage = new Image();
    const layoutImage = new Image();

    bgImage.src = 'images/bg.jpg';
    layoutImage.src = 'images/layout.jpg';

    // When both images are loaded
    Promise.all([
        new Promise(resolve => { bgImage.onload = resolve; }),
        new Promise(resolve => { layoutImage.onload = resolve; })
    ]).then(() => {
        // Draw background image
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        // Draw layout image (content)
        const contentWidth = canvas.width * 0.8;
        const contentHeight = canvas.height * 0.6;
        const contentX = (canvas.width - contentWidth) / 2;
        const contentY = (canvas.height - contentHeight) / 2;

        ctx.drawImage(layoutImage, contentX, contentY, contentWidth, contentHeight);

        // Add text from content and title
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px "Nunito Sans"';
        ctx.textAlign = 'center';

        // Title text
        ctx.fillText('Between What\'s Seen & Unseen', canvas.width / 2, 80);

        // Subtitle text
        ctx.font = '18px "Nunito Sans"';
        ctx.fillText('SENSO LAB', canvas.width / 2, 120);

        // Add decorative elements if needed
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 100, 140);
        ctx.lineTo(canvas.width / 2 + 100, 140);
        ctx.stroke();
    });

    // Save button functionality
    saveButton.addEventListener('click', function () {
        // Create a temporary link
        const link = document.createElement('a');
        link.download = 'thank-you-image.png';
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});