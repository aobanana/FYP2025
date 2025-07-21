document.addEventListener('DOMContentLoaded', () => {
    let pageProcessing = false;
    window.currentStage = 0;

    //gsap.to(".body__1", { autoAlpha: 0, duration: 0 });
    gsap.to(".body__2", { autoAlpha: 0, duration: 0 });
    gsap.to(".body__3", { autoAlpha: 0, duration: 0 });
    gsap.to(".body__4", { autoAlpha: 0, duration: 0 });
    gsap.to("#backButton", { autoAlpha: 0, duration: 0 });
    gsap.to("#closeButton", { autoAlpha: 0, duration: 0 });

    document.getElementById('btnStart').addEventListener('click', () => {
        if (pageProcessing) return;
        pageProcessing = true;
        window.currentStage = 1;
        //let a = document.querySelector('body__1');
        gsap.to(".body__1", { autoAlpha: 0, duration: 1 });
        gsap.to("#aboutButton", { autoAlpha: 0, duration: 1 });
        gsap.to("#backButton", { autoAlpha: 1, duration: 1, delay: 0.8 });
        gsap.to(".body__2", {
            autoAlpha: 1, duration: 1, delay: 0.8, onComplete: () => {
                pageProcessing = false;
            }
        });
    });

    document.getElementById('aboutButton').addEventListener('click', () => {
        if (pageProcessing) return;
        pageProcessing = true;
        //let a = document.querySelector('body__1');
        gsap.to(".body__1", { autoAlpha: 0, duration: 1 });
        gsap.to("#aboutButton", { autoAlpha: 0, duration: 1 });
        gsap.to(".body__4", { autoAlpha: 1, duration: 1, delay: 0.8 });
        gsap.to("#closeButton", {
            autoAlpha: 1, duration: 1, delay: 0.8, onComplete: () => {
                pageProcessing = false;
            }
        });
    });

    document.getElementById('backButton').addEventListener('click', () => {
        if (pageProcessing) return;
        pageProcessing = true;
        if (window.currentStage == 1) {
            gsap.to(".body__2", { autoAlpha: 0, duration: 1 });
            gsap.to("#backButton", { autoAlpha: 0, duration: 1 });
            gsap.to(".body__1", { autoAlpha: 1, duration: 1, delay: 0.8 });
            gsap.to("#aboutButton", {
                autoAlpha: 1, duration: 1, delay: 0.8, onComplete: () => {
                    pageProcessing = false;
                    window.currentStage = 0;
                }
            });
        } else if (window.currentStage == 2) {
            gsap.to(".body__3", { autoAlpha: 0, duration: 1 });
            gsap.to(".body__2", {
                autoAlpha: 1, duration: 1, delay: 0.8, onComplete: () => {
                    pageProcessing = false;
                    window.currentStage = 1;
                }
            });
        }
    });

    document.getElementById('closeButton').addEventListener('click', () => {
        if (pageProcessing) return;
        pageProcessing = true;
        //let a = document.querySelector('body__1');
        gsap.to(".body__4", { autoAlpha: 0, duration: 1 });
        gsap.to("#closeButton", { autoAlpha: 0, duration: 1 });
        gsap.to(".body__1", { autoAlpha: 1, duration: 1, delay: 0.8 });
        gsap.to("#aboutButton", {
            autoAlpha: 1, duration: 1, delay: 0.8, onComplete: () => {
                pageProcessing = false;
            }
        });
    });


    // Get elements
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    const titleCount = document.getElementById('title-count');
    const contentCount = document.getElementById('content-count');
    const submitBtn = document.getElementById('submit-btn');

    // Update counters and button state
    function updateCounters() {
        const titleLength = titleInput.value.length;
        const contentLength = contentInput.value.length;

        // Update counters
        titleCount.textContent = titleLength;
        contentCount.textContent = contentLength;

        // Change color when approaching limit
        titleCount.style.color = titleLength >= 18 ? 'red' : '';
        contentCount.style.color = contentLength >= 55 ? 'red' : '';

        // Enable/disable submit button
        submitBtn.disabled = titleLength === 0 || contentLength === 0;
    }

    // Add event listeners
    titleInput.addEventListener('input', updateCounters);
    contentInput.addEventListener('input', updateCounters);

    document.getElementById('textObjectForm').addEventListener('reset', () => {
        setTimeout(() => {
            updateCounters();
        }, 50);
    });

    // Initialize counters
    updateCounters();

    // Update form submission handler
    /*document.getElementById('textObjectForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const title = titleInput.value.slice(0, 20);
        const content = contentInput.value.slice(0, 60);

        // Rest of your submission code...
    });*/
});