document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const joinRoomBtn = document.getElementById('joinRoom');
    const roomIdInput = document.getElementById('roomId');
    
    joinRoomBtn.addEventListener('click', () => {
        const roomId = roomIdInput.value.trim();
        if (roomId) {
            window.location.href = `/room.html?room=${roomId}`;
        }
    });
    
    // Allow joining by pressing Enter
    roomIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinRoomBtn.click();
        }
    });
});