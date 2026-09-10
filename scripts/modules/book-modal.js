export function createBookModal(root) {
    function open() {
        root.classList.add('is-open');
        root.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('is-modal-open');
    }

    function close() {
        root.classList.remove('is-open');
        root.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('is-modal-open');
    }

    root.addEventListener('click', (event) => {
        if (event.target.closest('[data-book-close]')) close();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && root.classList.contains('is-open')) close();
    });

    return { open, close };
}