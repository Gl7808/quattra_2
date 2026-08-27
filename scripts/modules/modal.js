export function createModal(root) {
    let lastFocus = null;

    function open() {
        lastFocus = document.activeElement;
        root.classList.add('is-open');
        root.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('is-modal-open');
    }

    function close() {
        root.classList.remove('is-open');
        root.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('is-modal-open');
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    root.addEventListener('click', (event) => {
        if (event.target.closest('[data-modal-close]')) close();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && root.classList.contains('is-open')) close();
    });

    return { open, close, root };
}