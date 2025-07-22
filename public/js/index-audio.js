document.addEventListener('DOMContentLoaded', function () {
    const bgMusic = document.getElementById('bgMusic');
    const toggleButton = document.getElementById('toggleMusic');
    const volumeControl = document.getElementById('volumeControl');

    // Check if user has previously interacted with music
    //let musicEnabled = localStorage.getItem('musicEnabled') === 'true';
    let musicEnabled = 'true';

    // Set initial state
    if (musicEnabled) {
        //bgMusic.volume = localStorage.getItem('musicVolume') || 0.5;
        bgMusic.volume = 1;
        bgMusic.play();
        //toggleButton.textContent = 'Pause Music';
    } else {
        bgMusic.pause();
        //toggleButton.textContent = 'Play Music';
    }

    // Toggle music play/pause
    toggleButton.addEventListener('click', function () {
        if (bgMusic.paused) {
            bgMusic.play();
            //toggleButton.textContent = 'Pause Music';
            musicEnabled = true;
            toggleButton.classList.remove('off');
        } else {
            bgMusic.pause();
            //toggleButton.textContent = 'Play Music';
            musicEnabled = false;
            toggleButton.classList.add('off');
        }
        localStorage.setItem('musicEnabled', musicEnabled);
    });

    // Volume control
    volumeControl.addEventListener('input', function () {
        bgMusic.volume = this.value;
        localStorage.setItem('musicVolume', this.value);
    });

    // Autoplay after user interaction (to comply with browser policies)
    document.body.addEventListener('click', function firstInteraction() {
        if (musicEnabled && bgMusic.paused) {
            bgMusic.play();
        }
        document.body.removeEventListener('click', firstInteraction);
    });
});