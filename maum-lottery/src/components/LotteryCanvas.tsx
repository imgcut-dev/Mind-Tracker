import React, { useEffect, useRef, useState } from 'react';
import { EMOTIONS, EmotionBall } from '../data/emotions';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  emotion: EmotionBall;
  index: number;
}

interface FlyingBall {
  id: string;
  emotion: EmotionBall;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  radius: number;
}

interface LotteryCanvasProps {
  selectedEmotions: EmotionBall[];
  onPickEmotion: (emotion: EmotionBall) => void;
  onUnpickEmotion: (emotion: EmotionBall) => void;
  maxSelection?: number;
  disabled?: boolean;
}

export const LotteryCanvas: React.FC<LotteryCanvasProps> = ({
  selectedEmotions,
  onPickEmotion,
  onUnpickEmotion,
  maxSelection = 3,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  const ballsRef = useRef<Ball[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const isHoveringRef = useRef(false);

  const [flyingBalls, setFlyingBalls] = useState<FlyingBall[]>([]);
  const [size, setSize] = useState(320);

  // Sync available balls when selectedEmotions change
  useEffect(() => {
    const selectedNames = new Set(selectedEmotions.map((e) => e.name));
    const currentBalls = ballsRef.current;
    const S = size;
    const CX = S / 2;
    const CY = S / 2;
    const R = S / 2 - 8;
    const BR = Math.round(S * 0.088);

    // Keep existing balls that are not selected
    const remainingBalls = currentBalls.filter((b) => !selectedNames.has(b.emotion.name));

    // Add back any emotions that were unselected and missing from remainingBalls
    EMOTIONS.forEach((e, idx) => {
      if (!selectedNames.has(e.name) && !remainingBalls.some((b) => b.emotion.name === e.name)) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * R * 0.5;
        remainingBalls.push({
          x: CX + Math.cos(a) * d,
          y: CY + Math.sin(a) * d,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          r: BR,
          emotion: e,
          index: idx,
        });
      }
    });

    ballsRef.current = remainingBalls;
  }, [selectedEmotions, size]);

  // Handle canvas sizing and physics loop
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const newSize = Math.max(260, Math.min(340, width - 24));
        setSize(newSize);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Main canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const S = size;
    const CX = S / 2;
    const CY = S / 2;
    const R = S / 2 - 8;
    const BR = Math.round(S * 0.088);

    // Initialize balls if empty
    if (ballsRef.current.length === 0) {
      const selectedNames = new Set(selectedEmotions.map((e) => e.name));
      ballsRef.current = EMOTIONS.filter((e) => !selectedNames.has(e.name)).map((e, idx) => {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * R * 0.5;
        return {
          x: CX + Math.cos(a) * d,
          y: CY + Math.sin(a) * d,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          r: BR,
          emotion: e,
          index: idx,
        };
      });
    }

    const render = () => {
      const balls = ballsRef.current;
      const ts = isHoveringRef.current ? 0.45 : 1;

      // Physics step
      balls.forEach((b) => {
        const dx = b.x - CX;
        b.vy += 0.035; // gentle gravity

        // Upward bounce from bottom
        if (b.y > CY + R * 0.3) {
          const f = Math.max(0, 1 - Math.abs(dx) / (R * 0.55));
          b.vy -= (0.13 + Math.random() * 0.14) * f;
        }

        b.vx += (Math.random() - 0.5) * 0.09;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > 2.2) {
          b.vx *= 2.2 / sp;
          b.vy *= 2.2 / sp;
        }

        b.x += b.vx * ts;
        b.y += b.vy * ts;

        // Circular boundary collision
        const ddx = b.x - CX;
        const ddy = b.y - CY;
        const d = Math.hypot(ddx, ddy) || 0.01;
        if (d + b.r > R) {
          const nx = ddx / d;
          const ny = ddy / d;
          b.x = CX + nx * (R - b.r);
          b.y = CY + ny * (R - b.r);
          const dot = b.vx * nx + b.vy * ny;
          if (dot > 0) {
            b.vx -= 1.85 * dot * nx;
            b.vy -= 1.85 * dot * ny;
          }
        }
      });

      // Ball to ball collision
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const p = balls[i];
          const q = balls[j];
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const m = p.r + q.r;
          const d2 = dx * dx + dy * dy;
          if (d2 < m * m) {
            const d = Math.sqrt(d2) || 0.01;
            const nx = dx / d;
            const ny = dy / d;
            const ov = m - d;
            p.x -= (nx * ov) / 2;
            p.y -= (ny * ov) / 2;
            q.x += (nx * ov) / 2;
            q.y += (ny * ov) / 2;
            const rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
            if (rel > 0) {
              p.vx -= rel * nx;
              p.vy -= rel * ny;
              q.vx += rel * nx;
              q.vy += rel * ny;
            }
          }
        }
      }

      // Drawing
      ctx.clearRect(0, 0, S, S);

      // Glass globe background gradient
      const globeGrad = ctx.createRadialGradient(CX - R * 0.3, CY - R * 0.3, R * 0.1, CX, CY, R);
      globeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      globeGrad.addColorStop(0.7, 'rgba(240, 248, 250, 0.85)');
      globeGrad.addColorStop(1, 'rgba(205, 225, 230, 0.75)');

      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fillStyle = globeGrad;
      ctx.fill();

      // Draw each ball
      balls.forEach((b) => {
        // Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.emotion.color;
        ctx.fill();
        ctx.restore();

        // Stroke
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.stroke();

        // Specular highlight on ball
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        // Emotion label
        ctx.fillStyle = '#161d1e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const fontSize = Math.round(b.r * (b.emotion.name.length > 2 ? 0.52 : 0.65));
        ctx.font = `600 ${fontSize}px "Noto Sans KR", sans-serif`;
        ctx.fillText(b.emotion.name, b.x, b.y + 1);
      });

      // Globe outer glass rim & reflections
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.stroke();

      // Top-left arc light sheen
      ctx.beginPath();
      ctx.arc(CX, CY, R - 8, Math.PI * 1.15, Math.PI * 1.45);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [size, selectedEmotions]);

  // Click & hover hit testing
  const getBallAt = (clientX: number, clientY: number): Ball | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (size / rect.width);
    const py = (clientY - rect.top) * (size / rect.height);

    let best: Ball | null = null;
    let minDist = 1e9;
    ballsRef.current.forEach((b) => {
      const d = Math.hypot(b.x - px, b.y - py);
      if (d < b.r + 8 && d < minDist) {
        best = b;
        minDist = d;
      }
    });
    return best;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    isHoveringRef.current = true;
    const hit = getBallAt(e.clientX, e.clientY);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit ? 'pointer' : 'default';
    }
  };

  const handlePointerLeave = () => {
    isHoveringRef.current = false;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || selectedEmotions.length >= maxSelection) return;
    const hit = getBallAt(e.clientX, e.clientY);
    if (hit) {
      triggerPick(hit);
    }
  };

  const triggerPick = (ball: Ball) => {
    if (selectedEmotions.length >= maxSelection) return;

    // Remove from active physics balls
    ballsRef.current = ballsRef.current.filter((b) => b !== ball);

    // Coordinate calculation for flying animation
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const tray = trayRef.current;

    if (container && canvas && tray) {
      const containerRect = container.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const trayRect = tray.getBoundingClientRect();

      const startX = canvasRect.left - containerRect.left + (ball.x / size) * canvasRect.width;
      const startY = canvasRect.top - containerRect.top + (ball.y / size) * canvasRect.height;

      // Slot index in tray
      const targetSlotIndex = selectedEmotions.length;
      const slotWidth = 56;
      const targetX = trayRect.left - containerRect.left + 28 + targetSlotIndex * (slotWidth + 12);
      const targetY = trayRect.top - containerRect.top + 28;

      const flyId = `${ball.emotion.name}-${Date.now()}`;
      setFlyingBalls((prev) => [
        ...prev,
        {
          id: flyId,
          emotion: ball.emotion,
          startX,
          startY,
          targetX,
          targetY,
          radius: ball.r,
        },
      ]);

      // Complete drop into tray
      setTimeout(() => {
        setFlyingBalls((prev) => prev.filter((f) => f.id !== flyId));
        onPickEmotion(ball.emotion);
      }, 550);
    } else {
      onPickEmotion(ball.emotion);
    }
  };

  const handleRandomPick = () => {
    if (disabled || selectedEmotions.length >= maxSelection || ballsRef.current.length === 0) return;
    const randomIndex = Math.floor(Math.random() * ballsRef.current.length);
    const chosen = ballsRef.current[randomIndex];
    if (chosen) {
      triggerPick(chosen);
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center select-none">
      {/* Globe Canvas Container */}
      <div className="relative group">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onClick={handleCanvasClick}
          className={`rounded-full transition-opacity duration-300 ${
            disabled ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
          aria-label="감정 공 추첨기"
        />

        {/* Base stand of the lottery machine */}
        <div className="w-32 h-4 mx-auto -mt-2 bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 rounded-b-xl shadow-md border-t border-slate-200" />
      </div>

      {/* Flying Balls Overlay */}
      {flyingBalls.map((fb) => (
        <div
          key={fb.id}
          className="absolute z-30 pointer-events-none rounded-full flex items-center justify-center font-bold text-slate-800 shadow-xl transition-all duration-500 ease-in-out"
          style={{
            left: `${fb.targetX - 24}px`,
            top: `${fb.targetY - 24}px`,
            width: '48px',
            height: '48px',
            backgroundColor: fb.emotion.color,
            border: '2px solid rgba(255,255,255,0.7)',
            transform: 'scale(1)',
          }}
        >
          <span className="text-xs">{fb.emotion.name}</span>
        </div>
      ))}

      {/* Tray for picked emotions */}
      <div className="w-full max-w-sm mt-5 p-3.5 bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-inner">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 px-1">
          <span>담은 감정 공</span>
          <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-mono">
            {selectedEmotions.length} / {maxSelection}
          </span>
        </div>

        <div ref={trayRef} className="flex items-center justify-center gap-3 min-h-[56px]">
          {/* Picked Emotion Balls */}
          {selectedEmotions.map((emotion) => (
            <button
              key={emotion.name}
              type="button"
              disabled={disabled}
              onClick={() => onUnpickEmotion(emotion)}
              title={`${emotion.name} 공 꺼내기 (되돌리기)`}
              className="w-13 h-13 rounded-full flex flex-col items-center justify-center font-bold text-slate-800 shadow-md border-2 border-white/80 dark:border-slate-600 transition-transform hover:scale-105 active:scale-95 cursor-pointer relative group"
              style={{ backgroundColor: emotion.color }}
            >
              <span className="text-xs tracking-tight">{emotion.name}</span>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-700 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ×
              </span>
            </button>
          ))}

          {/* Empty Placeholder Slots */}
          {Array.from({ length: maxSelection - selectedEmotions.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-13 h-13 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 text-xs"
            >
              +
            </div>
          ))}
        </div>
      </div>

      {/* Machine Control Buttons */}
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          disabled={disabled || selectedEmotions.length >= maxSelection}
          onClick={handleRandomPick}
          className="px-3.5 py-1.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          아무 공이나 담기
        </button>
      </div>
    </div>
  );
};
