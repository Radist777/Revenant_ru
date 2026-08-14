import { useEffect, useRef } from "react";

/**
 * Спокойный пиксельный космос поверх статичного blueprint-слоя.
 * — Низкая плотность, мягкое редкое мерцание, бело-синяя палитра.
 * — Бледные падающие звёзды, «режущие» сетку blueprint.
 * — Ограничение FPS ради производительности.
 * — При prefers-reduced-motion фон полностью статичный (без анимации).
 */

// Приглушённая палитра: в основном белые и голубые, тёплый оттенок — редко.
const STAR_COLORS = ["#FFFFFF", "#DCE7FF", "#AAC4FF", "#FFF3D4"] as const;

const PIXEL = 3; // размер «пикселя» звезды в CSS-пикселях
const STAR_DENSITY_DESKTOP = 0.00011;
const STAR_DENSITY_MOBILE = 0.00007;
const TWINKLE_SHARE = 0.45; // доля мерцающих звёзд
const TARGET_FPS = 40; // выше FPS — плавнее падающие звёзды
const FRAME_INTERVAL = 1000 / TARGET_FPS;

// Падающие звёзды — редко, бледно и плавно
const SHOOTING_MIN_DELAY = 7000;
const SHOOTING_MAX_DELAY = 16000;
const SHOOTING_TRAIL = 22; // длиннее хвост = более гладкая линия

// Возбуждённые ячейки blueprint-сетки под падающей звездой.
const GRID = 40; // ДОЛЖЕН совпадать с шагом мелкой сетки в .blueprint
const CELL_LIFE = 700; // мс до полного затухания ячейки
const CELL_COLOR = "#9BB4FF";

type Star = {
  x: number;
  y: number;
  color: string;
  base: number; // базовая непрозрачность
  twinkle: boolean;
  phase: number;
  speed: number; // угловая скорость мерцания
};

type Shooter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
};

// Ячейка сетки, задетая головой падающей звезды: born — время вспышки,
// jx/jy — случайное смещение «дёрганья», затухает к концу жизни.
type Cell = { gx: number; gy: number; born: number; jx: number; jy: number };

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let shooter: Shooter | null = null;
    let cells: Cell[] = [];
    let nextShootingAt = 0;
    let lastFrame = 0;
    let rafId = 0;

    const isMobile = window.innerWidth < 768;
    const density = isMobile ? STAR_DENSITY_MOBILE : STAR_DENSITY_DESKTOP;

    const initStars = () => {
      const count = Math.floor(width * height * density);
      stars = [];
      for (let i = 0; i < count; i++) {
        const gx = Math.round((Math.random() * width) / PIXEL) * PIXEL;
        const gy = Math.round((Math.random() * height) / PIXEL) * PIXEL;
        stars.push({
          x: gx,
          y: gy,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          base: rand(0.16, 0.5),
          twinkle: Math.random() < TWINKLE_SHARE,
          phase: Math.random() * Math.PI * 2,
          // период мерцания 3–6 c
          speed: (Math.PI * 2) / rand(3000, 6000),
        });
      }
    };

    const drawStars = (time: number) => {
      for (const star of stars) {
        let alpha = star.base;
        if (star.twinkle && !reducedMotion) {
          // Плавное мягкое мерцание: base*0.5 … base
          const t = 0.5 + 0.5 * Math.sin(time * star.speed + star.phase);
          alpha = star.base * (0.5 + 0.5 * t);
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.fillRect(star.x, star.y, PIXEL, PIXEL);
      }
      ctx.globalAlpha = 1;
    };

    const spawnShooter = () => {
      const fromLeft = Math.random() < 0.5;
      // Медленнее за кадр (при 40 FPS это ~110–180 px/с) — движение плавное
      const speed = rand(2.8, 4.4);
      const angle = rand(0.32, 0.5); // радианы вниз (~18–29°)
      shooter = {
        x: fromLeft ? rand(0, width * 0.4) : rand(width * 0.6, width),
        y: rand(-20, height * 0.25),
        vx: (fromLeft ? 1 : -1) * speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        trail: [],
      };
    };

    const updateShooter = () => {
      if (!shooter) return;
      shooter.trail.push({ x: shooter.x, y: shooter.y });
      if (shooter.trail.length > SHOOTING_TRAIL) shooter.trail.shift();
      shooter.x += shooter.vx;
      shooter.y += shooter.vy;

      // ушла за пределы
      if (
        shooter.x < -30 ||
        shooter.x > width + 30 ||
        shooter.y > height + 30
      ) {
        shooter = null;
      }
    };

    const drawShooter = () => {
      if (!shooter) return;
      const { trail } = shooter;
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        // хвост тусклее у хвоста, ярче у головы; общий максимум бледный
        const alpha = (i / trail.length) * 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#CFE0FF";
        ctx.fillRect(p.x, p.y, PIXEL, PIXEL);
      }
      // голова
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(shooter.x, shooter.y, PIXEL, PIXEL);
      ctx.globalAlpha = 1;
    };

    // Голова шутера «зажигает» ячейку сетки, в которой находится.
    const exciteCell = (time: number) => {
      if (!shooter) return;
      const gx = Math.floor(shooter.x / GRID);
      const gy = Math.floor(shooter.y / GRID);
      if (cells.some((c) => c.gx === gx && c.gy === gy)) return;
      cells.push({
        gx,
        gy,
        born: time,
        jx: rand(-2.5, 2.5),
        jy: rand(-2.5, 2.5),
      });
    };

    // Рисуем только живые ячейки; сама сетка — CSS-слой, её не перерисовываем.
    const drawCells = (time: number) => {
      const alive: Cell[] = [];
      ctx.strokeStyle = CELL_COLOR;
      ctx.lineWidth = 1;
      for (const cell of cells) {
        const t = (time - cell.born) / CELL_LIFE;
        if (t >= 1) continue;
        alive.push(cell);
        const fade = 1 - t;
        ctx.globalAlpha = fade * 0.5;
        ctx.strokeRect(
          cell.gx * GRID + cell.jx * fade,
          cell.gy * GRID + cell.jy * fade,
          GRID,
          GRID
        );
      }
      ctx.globalAlpha = 1;
      cells = alive;
    };

    const clear = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);
    };

    const renderStatic = () => {
      clear();
      drawStars(0);
    };

    const loop = (time: number) => {
      rafId = requestAnimationFrame(loop);
      if (time - lastFrame < FRAME_INTERVAL) return;
      lastFrame = time;

      clear();
      drawStars(time);

      if (time >= nextShootingAt && !shooter) {
        spawnShooter();
        nextShootingAt =
          time + rand(SHOOTING_MIN_DELAY, SHOOTING_MAX_DELAY);
      }
      updateShooter();
      exciteCell(time);
      drawCells(time);
      drawShooter();
    };

    const start = () => {
      if (reducedMotion) {
        renderStatic();
        return;
      }
      cancelAnimationFrame(rafId);
      nextShootingAt = performance.now() + rand(3000, 8000);
      lastFrame = 0;
      rafId = requestAnimationFrame(loop);
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      cells = []; // координаты ячеек привязаны к вьюпорту — после ресайза невалидны
      initStars();
      start();
    };

    // Пауза, когда вкладка неактивна — экономим ресурсы
    const handleVisibility = () => {
      if (reducedMotion) return;
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        start();
      }
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);
    resize();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Порядок в DOM = порядок наложения: blueprint снизу, звёзды поверх.
  return (
    <>
      <div
        className="blueprint pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
      />
    </>
  );
}
