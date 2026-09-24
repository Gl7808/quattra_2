export async function createBarMenu(root) {
    const nav = root.querySelector('[data-bar-nav]');
    const content = root.querySelector('[data-bar-content]');

    if (!nav || !content) return;

    let data = null;
    try {
        const response = await fetch('data/bar.json');
        data = await response.json();
    } catch (e) {
        console.error('Не удалось загрузить меню бара:', e);
        return;
    }

    const categories = data.categories || [];
    if (!categories.length) return;

    /* --- Рендер навигации --- */
    categories.forEach((cat, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `bar-menu__nav-btn${i === 0 ? ' is-active' : ''}`;
        btn.textContent = cat.title;
        btn.dataset.target = cat.id;
        btn.addEventListener('click', () => scrollToCategory(cat.id));
        nav.appendChild(btn);
    });

    /* --- Рендер секций: картинка + список --- */
    categories.forEach((cat) => {
        const section = document.createElement('section');
        section.className = 'bar-menu__section';
        section.id = cat.id;

        /* Медиа-блок со статичной картинкой */
        const media = document.createElement('div');
        media.className = 'bar-menu__section-media';
        if (cat.image) {
            const img = document.createElement('img');
            img.className = 'bar-menu__section-image';
            img.src = cat.image;
            img.alt = cat.title;
            img.loading = 'lazy';
            img.draggable = false;
            media.appendChild(img);
        }

        /* Контент: заголовок + список позиций */
        const sectionContent = document.createElement('div');
        sectionContent.className = 'bar-menu__section-content';

        const title = document.createElement('h2');
        title.className = 'bar-menu__section-title';
        title.textContent = cat.title;
        sectionContent.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'bar-menu__list';

        (cat.items || []).forEach((item) => {
            const li = document.createElement('li');
            li.className = 'bar-menu__item';
            li.innerHTML = `
        <div class="bar-menu__item-header">
          <div class="bar-menu__item-title">
            <span class="bar-menu__item-name">${item.name}</span>
            ${item.volume ? `<span class="bar-menu__item-volume">${item.volume}</span>` : ''}
          </div>
          <span class="bar-menu__item-price">${item.price} ₽</span>
        </div>
        ${item.desc ? `<p class="bar-menu__item-desc">${item.desc}</p>` : ''}
      `;
            list.appendChild(li);
        });

        sectionContent.appendChild(list);
        section.appendChild(media);
        section.appendChild(sectionContent);
        content.appendChild(section);
    });

    /* --- Подсветка активной кнопки --- */
    function setActiveBtn(id) {
        nav.querySelectorAll('.bar-menu__nav-btn').forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.target === id);
        });
    }

    /* --- Клик по категории: плавный скролл --- */
    let scrollLock = false;
    let scrollLockTimer = null;

    function scrollToCategory(id) {
        const target = content.querySelector(`#${id}`);
        if (!target) return;

        setActiveBtn(id);
        scrollLock = true;

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        clearTimeout(scrollLockTimer);
        scrollLockTimer = setTimeout(() => { scrollLock = false; }, 900);
    }

    /* --- Автоподсветка при скролле --- */
    let scrollTick = false;

    function updateActiveOnScroll() {
        const sections = [...content.querySelectorAll('.bar-menu__section')];
        if (!sections.length) return;

        const offset = nav.offsetHeight + 40;
        let activeId = sections[0].id;

        for (const section of sections) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= offset) {
                activeId = section.id;
            }
        }

        setActiveBtn(activeId);
    }

    function onScroll() {
        if (scrollLock || scrollTick) return;
        scrollTick = true;
        requestAnimationFrame(() => {
            updateActiveOnScroll();
            scrollTick = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateActiveOnScroll();
}