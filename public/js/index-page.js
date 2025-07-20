document.addEventListener('DOMContentLoaded', () => {
    gsap.to(".body__1", { autoAlpha: 0, duration: 0 });
    gsap.to(".body__2", { autoAlpha: 0, duration: 0 });
    //gsap.to(".body__3", { autoAlpha: 0, duration: 0 });
    gsap.to(".body__4", { autoAlpha: 0, duration: 0 });

    document.getElementById('btnStart').addEventListener('click', () => {
        //let a = document.querySelector('body__1');
        gsap.to(".body__1", { autoAlpha: 0, duration: 1 });
        gsap.to(".body__2", { autoAlpha: 1, duration: 1, delay: 0.8 });
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