const el = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text != null) node.textContent = text;
    return node;
};

export async function createMenu(root, { preview, onActive, onOpen } = {}) {
    const tabsEl = root.querySelector('[data-menu-tabs]');
    const listEl = root.querySelector('[data-menu-list]');
    const contentEl = root.querySelector('[data-menu-content]');
    const fullEl = root.querySelector('[data-menu-full]');

    let data = [];
    try {
        const response = await fetch('data/menu.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
    } catch (error) {
        console.error('Не удалось загрузить data/menu.json:', error);
        return null;
    }

    const sections = [...new Set(data.map((i) => i.section).filter(Boolean))];
    if (!sections.length) return null;

    let currentSection = sections[0];
    let entries = [];
    let isAnimating = false;

    const itemsOf = (section) => data.filter((i) => i.section === section);

    function setActiveDish(index, animate = true) {
        entries.forEach(({ card }, i) => card.classList.toggle('is-active', i === index));
        preview?.setActive(index, animate);
        const dish = itemsOf(currentSection)[index];
        if (dish) onActive?.(dish);
    }

    function renderTabs() {
        if (!tabsEl) return;
        tabsEl.innerHTML = '';
        sections.forEach((section) => {
            const li = el('li', 'tabs__item');
            const button = el('button', `tabs__button${section === currentSection ? ' is-active' : ''}`, section);
            button.type = 'button';
            button.addEventListener('click', () => switchSection(section));
            li.appendChild(button);
            tabsEl.appendChild(li);
        });
    }

    function renderList() {
        if (!listEl) return;
        listEl.innerHTML = '';
        entries = [];

        itemsOf(currentSection).forEach((dish, i) => {
            const li = el('li', 'menu-list__item');
            const card = el('button', 'menu-list__card');
            card.type = 'button';

            const row = el('span', 'menu-list__row');
            if (dish.name) row.appendChild(el('span', 'menu-list__name', dish.name));
            row.appendChild(el('span', 'menu-list__dots'));
            if (dish.price != null) row.appendChild(el('span', 'menu-list__price', `${dish.price} ₽`));
            card.appendChild(row);

            if (dish.weight) card.appendChild(el('span', 'menu-list__weight', dish.weight));
            if (Array.isArray(dish.ingredients) && dish.ingredients.length) {
                card.appendChild(el('span', 'menu-list__composition', dish.ingredients.join(' · ')));
            }

            card.addEventListener('mouseenter', () => setActiveDish(i));
            card.addEventListener('focus', () => setActiveDish(i));
            card.addEventListener('click', () => {
                setActiveDish(i);
                onOpen?.(dish);
            });

            li.appendChild(card);
            listEl.appendChild(li);
            entries.push({ card, item: dish });
        });
    }

    /* Мобильная версия: все разделы одним списком, без табов и фото */
    function renderFull() {
        if (!fullEl) return;
        fullEl.innerHTML = '';

        sections.forEach((section) => {
            const block = el('div', 'menu-full__section');
            block.appendChild(el('h2', 'menu-full__heading', section));

            const list = el('ul', 'menu-full__list');
            itemsOf(section).forEach((dish) => {
                const li = el('li', 'menu-full__item');
                const row = el('div', 'menu-full__row');
                if (dish.name) row.appendChild(el('span', 'menu-full__name', dish.name));
                row.appendChild(el('span', 'menu-full__dots'));
                if (dish.price != null) row.appendChild(el('span', 'menu-full__price', `${dish.price} ₽`));
                li.appendChild(row);
                list.appendChild(li);
            });

            block.appendChild(list);
            fullEl.appendChild(block);
        });
    }

    /* Смена раздела: контент уезжает в одну сторону, новый въезжает с другой */
    function switchSection(section) {
        if (section === currentSection || isAnimating || !contentEl) return;
        const dir = sections.indexOf(section) > sections.indexOf(currentSection) ? 1 : -1;
        isAnimating = true;

        const exit = contentEl.animate(
            [
                { transform: 'translateX(0)', opacity: 1 },
                { transform: `translateX(${-dir * 100}%)`, opacity: 0 },
            ],
            { duration: 320, easing: 'cubic-bezier(0.5, 0, 0.75, 0.4)' }
        );

        exit.onfinish = () => {
            currentSection = section;
            renderTabs();
            renderList();
            preview?.render(itemsOf(currentSection));

            const enter = contentEl.animate(
                [
                    { transform: `translateX(${dir * 100}%)`, opacity: 0 },
                    { transform: 'translateX(0)', opacity: 1 },
                ],
                { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
            );

            enter.onfinish = () => {
                isAnimating = false;
                setActiveDish(0, false);
            };
        };
    }

    renderTabs();
    renderList();
    renderFull();
    preview?.render(itemsOf(currentSection));
    setActiveDish(0, false);

    return { sections };
}