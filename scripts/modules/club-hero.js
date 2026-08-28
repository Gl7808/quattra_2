export function createClubHero(root) {
    const track = root.querySelector('[data-hero-track]');
    const slides = [...root.querySelectorAll('[data-hero-slide]')];
    const prev = root.querySelector('[data-hero-prev]');
    const next = root.querySelector('[data-hero-next]');
    const dotsWrap = root.querySelector('[data-hero-dots]');

    if (!track || slides.length === 0) return null;

    let index = 0;
    let dots = [];

    function buildDots() {
        if (!dotsWrap) return;
        dotsWrap.innerHTML = '';
        dots = slides.map((_, i) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'club-hero__dot';
            button.setAttribute('aria-label', `Слайд ${i + 1}`);
            button.addEventListener('click', () => go(i));
            dotsWrap.appendChild(button);
            return button;
        });
    }

    function render() {
        track.style.transform = `translateX(${-index * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));

        /* видео играет только на активном слайде */
        slides.forEach((slide, i) => {
            const video = slide.querySelector('video');
            if (!video) return;
            if (i === index) video.play().catch(() => {});
            else video.pause();
        });
    }

    function go(i) {
        index = Math.max(0, Math.min(slides.length - 1, i));
        render();
    }

    prev?.addEventListener('click', () => go(index - 1));
    next?.addEventListener('click', () => go(index + 1));

    /* свайп (не реагируем на кнопки/ссылки внутри) */
    let startX = null;
    root.addEventListener('pointerdown', (event) => {
        if (event.target.closest('button, a')) return;
        startX = event.clientX;
    });
    root.addEventListener('pointerup', (event) => {
        if (startX === null) return;
        const deltaX = event.clientX - startX;
        startX = null;
        if (Math.abs(deltaX) > 60) go(index + (deltaX < 0 ? 1 : -1));
    });
    root.addEventListener('pointercancel', () => { startX = null; });

    buildDots();
    render();

    return { go };
}