export function createCrossfade(root, layerSelector = '[data-crossfade-layer]') {
    const layers = [...root.querySelectorAll(layerSelector)];

    let active = 1; // первый show() ляжет на layers[0]
    let generation = 0;

    function show(src) {
        if (!src || layers.length < 2) return;

        const gen = ++generation;
        const next = layers[1 - active];
        const prev = layers[active];

        const apply = () => {
            if (gen !== generation) return;
            next.classList.add('is-active');
            prev.classList.remove('is-active');
            active = 1 - active;
        };

        if (next.dataset.current === src) {
            apply();
            return;
        }

        next.dataset.current = src;
        next.src = src;

        if (next.complete && next.naturalWidth > 0) {
            apply();
        } else {
            next.addEventListener('load', apply, { once: true });
            next.addEventListener('error', apply, { once: true });
        }
    }

    return { show };
}