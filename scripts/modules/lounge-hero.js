export function createLoungeHero(root) {
    const photos = [...root.querySelectorAll('.lounge-hero__photo')];
    if (photos.length < 2) return null;

    let current = 0;
    const INTERVAL = 5500;

    const timer = setInterval(() => {
        photos[current].classList.remove('is-active');
        current = (current + 1) % photos.length;
        photos[current].classList.add('is-active');
    }, INTERVAL);

    return { destroy: () => clearInterval(timer) };
}