export function initRevealGrid() {
    const intro = document.querySelector('[data-tournament-intro]');
    const curtainTop = document.querySelector('[data-curtain-top]');
    const curtainBottom = document.querySelector('[data-curtain-bottom]');

    if (!intro || !curtainTop || !curtainBottom) return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.set(curtainTop, { yPercent: 0 });
    gsap.set(curtainBottom, { yPercent: 0 });

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: intro,
            start: 'top top',
            end: '+=150%',
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
        },
    });

    /* Небольшая пауза перед разрезанием */
    tl.to({}, { duration: 0.3 }, 0);

    /* Верхняя половинка уезжает вверх */
    tl.to(curtainTop, {
        yPercent: -100,
        duration: 1.2,
        ease: 'power3.inOut',
    }, 0.3);

    /* Нижняя половинка уезжает вниз */
    tl.to(curtainBottom, {
        yPercent: 100,
        duration: 1.2,
        ease: 'power3.inOut',
    }, 0.3);
}