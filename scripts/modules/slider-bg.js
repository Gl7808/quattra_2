/* ============================================================
   НАСТРОЙКИ ФОНА
   Картинка для каждого слайда. Порядок элементов соответствует
   порядку слайдов в index.html (индекс = логический номер).
   Сейчас указаны текущие картинки слайдов как заглушки —
   замените на отдельные фоновые, когда они появятся.
   ============================================================ */
const SLIDE_BACKGROUNDS = [
    'images/slides/slide-01.png', // 01 · ПК клуб
    'images/slides/slide-02.png', // 02 · Кухня
    'images/slides/slide-03.png', // 03 · Лаунж
    'images/slides/slide-04.png', // 04 · Бар
    'images/slides/slide-05.png', // 05 · Турниры
    'images/slides/slide-06.png', // 06 · Интерактив
];

export function createSliderBg(root) {
    const layers = [...root.querySelectorAll('[data-slider-bg-layer]')];

    let activeLayer = 1; // первый show() ляжет на layers[0]
    let generation = 0;  // защита от «устаревших» загрузок при быстром скролле

    function show(logicalIndex) {
        const src = SLIDE_BACKGROUNDS[logicalIndex];
        if (!src || layers.length < 2) return;

        const gen = ++generation;
        const nextLayer = layers[1 - activeLayer];
        const prevLayer = layers[activeLayer];

        const apply = () => {
            if (gen !== generation) return; // за это время переключились ещё раз
            nextLayer.classList.add('is-active');
            prevLayer.classList.remove('is-active');
            activeLayer = 1 - activeLayer;
        };

        /* картинка уже загружена в скрытый слой — просто кроссфейдим */
        if (nextLayer.dataset.current === src) {
            apply();
            return;
        }

        nextLayer.dataset.current = src;
        nextLayer.src = src;

        if (nextLayer.complete && nextLayer.naturalWidth > 0) {
            apply();
        } else {
            /* переключаем только после загрузки, чтобы не было «пустого» кадра;
               по error тоже применяем, чтобы смена не зависла на битой картинке */
            nextLayer.addEventListener('load', apply, { once: true });
            nextLayer.addEventListener('error', apply, { once: true });
        }
    }

    /* после загрузки страницы предзагружаем все фоны,
       чтобы при переключении они появлялись мгновенно */
    function preloadAll() {
        SLIDE_BACKGROUNDS.forEach((src) => {
            if (!src) return;
            const img = new Image();
            img.src = src;
        });
    }

    window.addEventListener('load', preloadAll, { once: true });

    return { show };
}