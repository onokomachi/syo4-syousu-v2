/**
 * 深海テーマ専用の背景：漆黒の海を、シアンの生物発光（バイオルミネッセンス）の
 * 粒子が下から上へゆらめきながら昇っていく。theme === 'deep' のときだけ描画する。
 */
import React, { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface Particle {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
  sway: number;
  alpha: number;
}

export const DeepSeaRain: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (theme !== 'deep') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];

    const spawn = (): Particle => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * canvas.height,
      r: 1 + Math.random() * 2.6,
      speed: 0.25 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      sway: 8 + Math.random() * 24,
      alpha: 0.35 + Math.random() * 0.5,
    });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(120, Math.floor(canvas.width / 9));
      particles = Array.from({ length: count }, spawn);
    };
    resize();
    window.addEventListener('resize', resize);

    let last = 0;
    const interval = 33; // ~30fps

    const draw = (t: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (t - last < interval) return;
      last = t;

      // 深い海色へフェード（残像で「ゆらぎ」を出す）
      ctx.fillStyle = 'rgba(0, 8, 20, 0.20)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        p.y -= p.speed;
        p.phase += 0.02;
        const x = p.x + Math.sin(p.phase) * p.sway;
        const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(120, 245, 255, ${p.alpha})`);
        g.addColorStop(0.5, `rgba(0, 200, 230, ${p.alpha * 0.5})`);
        g.addColorStop(1, 'rgba(0, 120, 160, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
        if (p.y < -10) Object.assign(p, spawn(), { y: canvas.height + 10 });
      }
      ctx.globalCompositeOperation = 'source-over';
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  if (theme !== 'deep') return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 opacity-60"
      style={{ willChange: 'transform', transform: 'translateZ(0)' }}
    />
  );
};
