/**
 * 宇宙神テーマ専用の背景：漆黒の宇宙に、金色の星が瞬き、紫の星雲が漂い、
 * ときどき流れ星が走る。theme === 'cosmos' のときだけ描画する。
 */
import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface Star {
  x: number;
  y: number;
  r: number;
  tw: number;   // 瞬きの位相
  twSpeed: number;
  base: number; // 基本の明るさ
  gold: boolean;
}

interface Shooting {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  len: number;
}

export const CosmosRain: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (theme !== 'cosmos') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: Star[] = [];
    let nebulae: { x: number; y: number; r: number; color: string }[] = [];
    let shooting: Shooting | null = null;
    let shootTimer = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(420, Math.floor((canvas.width * canvas.height) / 2600));
      stars = Array.from({ length: count }, () => {
        const gold = Math.random() > 0.55;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.4 + 0.3,
          tw: Math.random() * Math.PI * 2,
          twSpeed: 0.02 + Math.random() * 0.05,
          base: 0.3 + Math.random() * 0.5,
          gold,
        };
      });
      nebulae = [
        { x: canvas.width * 0.25, y: canvas.height * 0.3, r: canvas.width * 0.5, color: 'rgba(150, 70, 220, 0.10)' },
        { x: canvas.width * 0.8, y: canvas.height * 0.7, r: canvas.width * 0.55, color: 'rgba(255, 120, 200, 0.07)' },
        { x: canvas.width * 0.6, y: canvas.height * 0.15, r: canvas.width * 0.4, color: 'rgba(90, 120, 255, 0.07)' },
      ];
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnShooting = (): Shooting => {
      const fromLeft = Math.random() > 0.5;
      const speed = 9 + Math.random() * 6;
      return {
        x: fromLeft ? -40 : canvas.width + 40,
        y: Math.random() * canvas.height * 0.5,
        vx: (fromLeft ? 1 : -1) * speed,
        vy: speed * 0.5,
        life: 1,
        len: 120 + Math.random() * 120,
      };
    };

    let last = 0;
    const interval = 33; // ~30fps

    const draw = (t: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (t - last < interval) return;
      last = t;

      // 宇宙の黒で塗りつぶす（残像は流れ星だけにしたいので毎フレーム描き直す）
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 星雲（やわらかい色の雲）
      for (const n of nebulae) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, n.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 星（瞬き）
      for (const s of stars) {
        s.tw += s.twSpeed;
        const a = s.base + Math.sin(s.tw) * 0.35;
        const alpha = Math.max(0, Math.min(1, a));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? `rgba(255, 220, 120, ${alpha})`
          : `rgba(200, 210, 255, ${alpha})`;
        ctx.fill();
      }

      // 流れ星
      shootTimer -= interval;
      if (!shooting && shootTimer <= 0) {
        shooting = spawnShooting();
        shootTimer = 2200 + Math.random() * 3500;
      }
      if (shooting) {
        const s = shooting;
        s.x += s.vx;
        s.y += s.vy;
        const tailX = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * s.len;
        const tailY = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * s.len;
        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, 'rgba(255, 240, 200, 0.95)');
        grad.addColorStop(1, 'rgba(255, 240, 200, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        if (s.x < -60 || s.x > canvas.width + 60 || s.y > canvas.height + 60) shooting = null;
      }
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  if (theme !== 'cosmos') return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
    />
  );
};
