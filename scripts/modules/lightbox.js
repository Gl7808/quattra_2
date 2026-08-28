export function createLightbox(root) {
    const image = root.querySelector('[data-lightbox-image]');

    function open(src, alt = '') {
        if (!src) return;
        image.src = src;
        image.alt = alt;
        root.classList.add('is-open');
        root.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('is-lightbox-open');
    }

    function close() {
        root.classList.remove('is-open');
        root.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('is-lightbox-open');
    }

    root.addEventListener('click', (event) => {
        if (event.target.closest('[data-lightbox-close]')) close();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && root.classList.contains('is-open')) close();
    });

    return { open, close };
}