const TICK_BASE_MS = 18;    // базовый интервал шага
const TICK_SLOW_MS = 20;    // шаг в начале (разгон)
const GLITCH_DURATION_MS = 500; // длина глитча
const GLITCH_INTERVAL_MS = 70;  // шаг внутри глитча

const pad = (n) => String(Math.max(0, Math.min(999, n))).padStart(3, '0');
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function createLoader(root) {
    const wheels = {
        hundreds: root.querySelector('[data-loader-wheel="hundreds"]'),
        tens: root.querySelector('[data-loader-wheel="tens"]'),
        units: root.querySelector('[data-loader-wheel="units"]'),
    };

    const tracks = {
        hundreds: wheels.hundreds.querySelector('.loader__wheel-track'),
        tens: wheels.tens.querySelector('.loader__wheel-track'),
        units: wheels.units.querySelector('.loader__wheel-track'),
    };

    let digitHeight = 0;

    function measure() {
        const d = wheels.hundreds.querySelector('.loader__digit');
        digitHeight = d ? d.getBoundingClientRect().height : 0;
    }

    function setWheel(track, digit, fast) {
        track.classList.toggle('loader__wheel-track--fast', fast);
        track.style.transform = `translate3d(0, ${-digit * digitHeight}px, 0)`;
    }

    function setNumber(n, fast = false) {
        const s = pad(n);
        setWheel(tracks.hundreds, Number(s[0]), fast);
        setWheel(tracks.tens, Number(s[1]), fast);
        setWheel(tracks.units, Number(s[2]), fast);
    }

    measure();

    /* Параметры сценария: точка глитча и случайное значение */
    const GLITCH_AT = randInt(38, 62);
    const GLITCH_VALUE = randInt(50, 75);

    return new Promise((resolve) => {
        let current = 0;
        let phase = 'ramp'; // ramp → glitch → settle → done
        let glitchStartedAt = 0;

        setNumber(0);

        function step() {
            if (phase === 'ramp') {
                current += 1;
                setNumber(current);
                if (current >= GLITCH_AT) {
                    phase = 'glitch';
                    glitchStartedAt = performance.now();
                    setTimeout(step, GLITCH_INTERVAL_MS);
                    return;
                }
                /* разгон: медленнее в начале, быстрее ближе к глитчу */
                const t = current / GLITCH_AT;
                setTimeout(step, TICK_SLOW_MS - (TICK_SLOW_MS - TICK_BASE_MS) * t);
                return;
            }

            if (phase === 'glitch') {
                const elapsed = performance.now() - glitchStartedAt;
                if (elapsed < GLITCH_DURATION_MS) {
                    /* случайные трёхзначные значения — имитация сбойного чтения */
                    setNumber(randInt(0, 999), true);
                    setTimeout(step, GLITCH_INTERVAL_MS);
                    return;
                }
                /* конец глитча: ставим случайное значение 50..75 и продолжаем */
                current = GLITCH_VALUE;
                setNumber(current);
                phase = 'settle';
                setTimeout(step, TICK_BASE_MS);
                return;
            }

            if (phase === 'settle') {
                current += 1;
                setNumber(current);
                if (current >= 100) {
                    phase = 'done';
                    setTimeout(resolve, 320); /* дать 100 отстояться один кадр */
                    return;
                }
                /* финал быстрее, чем разгон */
                setTimeout(step, Math.max(26, TICK_BASE_MS - (current - GLITCH_VALUE) * 0.4));
                return;
            }
        }

        /* стартовая пауза, чтобы страница успела отрисоваться */
        setTimeout(step, 280);
    });
}