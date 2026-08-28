export function createGlitchTitle(root) {
    const text = root.querySelector('[data-glitch-text]');
    if (!text) return null;

    const original = text.dataset.original || text.textContent.trim();
    const alt = text.dataset.glitchAlt || 'QUATTRA';
    const interval = Number(root.dataset.glitchInterval || 15000);
    const duration = Number(root.dataset.glitchDuration || 1900);

    let glitchTimer = null;
    let revertTimer = null;

    function run() {
        text.textContent = alt;
        text.dataset.text = alt;
        root.classList.add('is-glitching');

        revertTimer = setTimeout(() => {
            text.textContent = original;
            text.dataset.text = original;
            root.classList.remove('is-glitching');
        }, duration);
    }

    /* первый глитч чуть раньше, дальше по кругу */
    const startDelay = Math.min(interval, 2500);
    const startTimer = setTimeout(() => {
        run();
        glitchTimer = setInterval(run, interval);
    }, startDelay);

    return {
        destroy() {
            clearTimeout(startTimer);
            clearTimeout(revertTimer);
            clearInterval(glitchTimer);
        },
    };
}