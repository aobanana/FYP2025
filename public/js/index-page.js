document.addEventListener('DOMContentLoaded', () => {
    gsap.to(".body__2", { autoAlpha: 0, duration: 0 });
    gsap.to(".body__3", { autoAlpha: 0, duration: 0 });



    document.getElementById('btnStart').addEventListener('click', () => {
        //let a = document.querySelector('body__1');
        gsap.to(".body__1", { autoAlpha: 0, duration: 1 });
        gsap.to(".body__2", { autoAlpha: 1, duration: 1, delay: 0.8 });
    });
});