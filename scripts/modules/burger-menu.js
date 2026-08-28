export function createBurgerMenu(burger, nav) {
    if (!burger || !nav) return null;

    function open() {
        burger.classList.add('is-active');
        nav.classList.add('is-open');
        burger.setAttribute('aria-expanded', 'true');
        burger.setAttribute('aria-label', 'Закрыть меню');
        nav.setAttribute('aria-hidden', 'false');
        document.body.classList.add('is-menu-open');
    }

    function close() {
        burger.classList.remove('is-active');
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Открыть меню');
        nav.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('is-menu-open');
    }

    function toggle() {
        nav.classList.contains('is-open') ? close() : open();
    }

    burger.addEventListener('click', toggle);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && nav.classList.contains('is-open')) close();
    });

    nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', close);
    });

    return { open, close, toggle };
}