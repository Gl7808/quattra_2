const STIFFNESS = 0.08;
const DAMPING = 0.22;

const SPREAD_STIFFNESS = 0.1;
const SPREAD_DAMPING = 0.66;
const KICK_VELOCITY = 0.1;

const SPREAD_X_RATIO = 0.22;
const SPREAD_Y_RATIO = 0.18;

const BASE_OPACITY = 0.5;
const CORNER_BASE_OPACITY = 0.9;
const MAX_BLUR = 2.5;
const DEFAULT_OFFSET = 20;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

class Spring {
    constructor(value = 0, stiffness = STIFFNESS, damping = DAMPING) {
        this.value = value;
        this.target = value;
        this.velocity = 0;
        this.stiffness = stiffness;
        this.damping = damping;
    }

    update() {
        this.velocity += (this.target - this.value) * this.stiffness;
        this.velocity *= this.damping;
        this.value += this.velocity;
        return this.value;
    }
}

export function createCrosshair(root, getTarget, options = {}) {
    const { intro = false } = options;

    const lines = {
        top: root.querySelector('[data-crosshair-line="top"]'),
        bottom: root.querySelector('[data-crosshair-line="bottom"]'),
        left: root.querySelector('[data-crosshair-line="left"]'),
        right: root.querySelector('[data-crosshair-line="right"]'),
    };

    const corners = {
        topLeft: root.querySelector('[data-crosshair-corner="top-left"]'),
        topRight: root.querySelector('[data-crosshair-corner="top-right"]'),
        bottomLeft: root.querySelector('[data-crosshair-corner="bottom-left"]'),
        bottomRight: root.querySelector('[data-crosshair-corner="bottom-right"]'),
    };

    const springs = {
        top: new Spring(),
        bottom: new Spring(),
        left: new Spring(),
        right: new Spring(),
    };

    const spreadSpring = new Spring(0, SPREAD_STIFFNESS, SPREAD_DAMPING);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let offset = DEFAULT_OFFSET;
    let engaged = !intro; // в intro-режиме прицел заморожен в центре

    function readOffset() {
        const value = parseFloat(getComputedStyle(root).getPropertyValue('--crosshair-offset'));
        return Number.isFinite(value) ? value : DEFAULT_OFFSET;
    }

    function kick(strength = 1) {
        if (reducedMotion.matches) return;
        spreadSpring.velocity += KICK_VELOCITY * clamp(strength, 0.5, 2);
    }

    function readTarget() {
        const target = getTarget();
        return target ? target.getBoundingClientRect() : null;
    }

    function centerPosition() {
        return {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        };
    }

    /* Ставим линии в центр экрана (используется для intro и snap) */
    function placeAtCenter() {
        const { x, y } = centerPosition();
        springs.top.value = springs.top.target = y;
        springs.bottom.value = springs.bottom.target = y;
        springs.left.value = springs.left.target = x;
        springs.right.value = springs.right.target = x;
        Object.values(springs).forEach((s) => { s.velocity = 0; });
        spreadSpring.value = spreadSpring.target = 0;
        spreadSpring.velocity = 0;
    }

    function snap() {
        offset = readOffset();
        const rect = readTarget();

        if (!engaged || !rect) {
            placeAtCenter();
            apply(null, 0);
            return;
        }

        springs.top.value = springs.top.target = rect.top - offset;
        springs.bottom.value = springs.bottom.target = rect.bottom + offset;
        springs.left.value = springs.left.target = rect.left - offset;
        springs.right.value = springs.right.target = rect.right + offset;
        Object.values(springs).forEach((s) => { s.velocity = 0; });
        spreadSpring.value = spreadSpring.target = 0;
        spreadSpring.velocity = 0;
        apply(rect, 0);
    }

    /* «Включить» прицел: целевые точки становятся позицией слайда,
       текущие значения остаются в центре — пружина поедет от центра к слайду */
    function engage() {
        if (engaged) return;
        engaged = true;
        offset = readOffset();
        root.classList.remove('crosshair--intro');

        const rect = readTarget();
        if (rect) {
            springs.top.target = rect.top - offset;
            springs.bottom.target = rect.bottom + offset;
            springs.left.target = rect.left - offset;
            springs.right.target = rect.right + offset;
        }
    }

    function apply(rect, spread) {
        const offX = rect ? rect.width * SPREAD_X_RATIO * spread : 0;
        const offY = rect ? rect.height * SPREAD_Y_RATIO * spread : 0;

        const xLeft = springs.left.value - offX;
        const xRight = springs.right.value + offX;
        const yTop = springs.top.value - offY;
        const yBottom = springs.bottom.value + offY;

        lines.top.style.transform = `translate3d(0, ${yTop}px, 0)`;
        lines.bottom.style.transform = `translate3d(0, ${yBottom}px, 0)`;
        lines.left.style.transform = `translate3d(${xLeft}px, 0, 0)`;
        lines.right.style.transform = `translate3d(${xRight}px, 0, 0)`;

        corners.topLeft.style.transform = `translate3d(${xLeft}px, ${yTop}px, 0)`;
        corners.topRight.style.transform = `translate3d(${xRight}px, ${yTop}px, 0)`;
        corners.bottomLeft.style.transform = `translate3d(${xLeft}px, ${yBottom}px, 0)`;
        corners.bottomRight.style.transform = `translate3d(${xRight}px, ${yBottom}px, 0)`;

        const focusLoss = Math.max(0, spread);
        const blur = focusLoss > 0.03 ? `blur(${(focusLoss * MAX_BLUR).toFixed(2)}px)` : 'none';
        const lineOpacity = BASE_OPACITY - focusLoss * 0.25;
        const cornerOpacity = CORNER_BASE_OPACITY - focusLoss * 0.35;

        Object.values(lines).forEach((line) => {
            line.style.opacity = lineOpacity;
            line.style.filter = blur;
        });
        Object.values(corners).forEach((corner) => {
            corner.style.opacity = cornerOpacity;
            corner.style.filter = blur;
        });
    }

    function frame() {
        const rect = readTarget();

        /* пока прицел не «включён» — таргет не обновляем, держим в центре */
        if (engaged && rect) {
            springs.top.target = rect.top - offset;
            springs.bottom.target = rect.bottom + offset;
            springs.left.target = rect.left - offset;
            springs.right.target = rect.right + offset;
        }

        if (reducedMotion.matches) {
            Object.values(springs).forEach((s) => {
                s.value = s.target;
                s.velocity = 0;
            });
            spreadSpring.value = 0;
            spreadSpring.velocity = 0;
        } else {
            Object.values(springs).forEach((s) => s.update());
            spreadSpring.update();
        }

        apply(rect, clamp(spreadSpring.value, -0.25, 1.2));
        requestAnimationFrame(frame);
    }

    /* Инициализация: если intro — стартуем из центра и поднимаем z-index,
       чтобы прицел был виден поверх лоадера */
    if (intro) {
        root.classList.add('crosshair--intro');
        placeAtCenter();
    } else {
        snap();
    }

    window.addEventListener('resize', snap);
    requestAnimationFrame(frame);

    return { snap, kick, engage };
}