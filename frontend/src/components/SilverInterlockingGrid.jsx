import { useEffect, useRef } from 'react';

/**
 * Interactive canvas background rendering a silver square interlocking grid
 * that smoothly reacts to cursor movement with illumination, tilt, and parallax.
 */
export default function SilverInterlockingGrid({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Mouse coordinates with smooth lerping
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
    };

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
      height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const isMobile = () => window.innerWidth < 768;

    const handleMouseMove = (e) => {
      // Disable cursor follow animation on mobile devices, only keep for PC / tablet
      if (isMobile()) {
        mouse.active = false;
        mouse.targetX = -1000;
        mouse.targetY = -1000;
        return;
      }

      // Check if cursor is hovering over any foreground element (card, button, link, heading, badge, header, footer)
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isOverForeground = el && (
        el.closest('button') ||
        el.closest('a') ||
        el.closest('input') ||
        el.closest('.landing-card') ||
        el.closest('.feature-card') ||
        el.closest('.badge-pill') ||
        el.closest('.emblem-box') ||
        el.closest('[data-interactive="true"]') ||
        el.closest('header') ||
        el.closest('footer') ||
        el.closest('h1') ||
        el.closest('h2') ||
        el.closest('h3') ||
        el.closest('p')
      );

      if (isOverForeground) {
        mouse.active = false;
        mouse.targetX = -1000;
        mouse.targetY = -1000;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      if (!mouse.active) {
        // Prevent jarring sweep across canvas when re-entering open space
        mouse.x = currentX;
        mouse.y = currentY;
      }

      mouse.targetX = currentX;
      mouse.targetY = currentY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    handleResize();

    // Grid configuration
    const TILE_SIZE = 58;
    const SQ_SIZE = 38;
    const CORNER_RADIUS = 7;
    const MAX_DIST = 260;

    let time = 0;

    const render = () => {
      time += 0.018;

      // Smooth mouse follow (lerp)
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.12;
        mouse.y += (mouse.targetY - mouse.y) * 0.12;
      } else {
        mouse.x += (-1000 - mouse.x) * 0.05;
        mouse.y += (-1000 - mouse.y) * 0.05;
      }

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / TILE_SIZE) + 2;
      const rows = Math.ceil(height / TILE_SIZE) + 2;
      const offsetX = (width % TILE_SIZE) / 2;
      const offsetY = (height % TILE_SIZE) / 2;

      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          const baseX = c * TILE_SIZE + offsetX;
          const baseY = r * TILE_SIZE + offsetY;

          // Proximity to cursor
          const dx = baseX - mouse.x;
          const dy = baseY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let proxFactor = 0;
          if (mouse.active && dist < MAX_DIST) {
            proxFactor = Math.pow(1 - dist / MAX_DIST, 1.8);
          }

          // Ambient wave displacement when idle or subtle wave
          const wave = Math.sin(time * 1.4 + (c + r) * 0.35) * 0.5 + 0.5;

          // Magnetic deflection
          const pushAngle = Math.atan2(dy, dx);
          const pushDist = proxFactor * 12;
          const cx = baseX + Math.cos(pushAngle) * pushDist;
          const cy = baseY + Math.sin(pushAngle) * pushDist;

          // Silver color calculations:
          // Base: sleek dark slate/silver (#475569)
          // Highlight near cursor: gleaming bright chrome/silver (#f1f5f9)
          const baseAlpha = 0.12 + wave * 0.08;
          const highlightAlpha = Math.min(0.92, baseAlpha + proxFactor * 0.8);
          const silverR = Math.round(148 + proxFactor * 95); // 148 -> 243
          const silverG = Math.round(163 + proxFactor * 85); // 163 -> 248
          const silverB = Math.round(184 + proxFactor * 65); // 184 -> 249

          const currentSize = SQ_SIZE + proxFactor * 5;
          const currentRadius = CORNER_RADIUS;

          ctx.save();
          ctx.translate(cx, cy);

          // Subtle interactive rotation near cursor
          if (proxFactor > 0.01) {
            const rot = (proxFactor * 0.12) * Math.sin(time * 2 + (c - r));
            ctx.rotate(rot);
          }

          // 1. Draw Interlocking crossover connector bars to adjacent cells
          ctx.strokeStyle = `rgba(${silverR}, ${silverG}, ${silverB}, ${Math.max(0.06, highlightAlpha * 0.45)})`;
          ctx.lineWidth = 1 + proxFactor * 1.2;

          // Horizontal right link
          ctx.beginPath();
          ctx.moveTo(currentSize / 2, 0);
          ctx.lineTo(TILE_SIZE - currentSize / 2, 0);
          ctx.stroke();

          // Vertical bottom link
          ctx.beginPath();
          ctx.moveTo(0, currentSize / 2);
          ctx.lineTo(0, TILE_SIZE - currentSize / 2);
          ctx.stroke();

          // 2. Outer Interlocking Silver Square
          ctx.strokeStyle = `rgba(${silverR}, ${silverG}, ${silverB}, ${highlightAlpha})`;
          ctx.lineWidth = 1.2 + proxFactor * 1.5;

          if (proxFactor > 0.15) {
            ctx.shadowColor = 'rgba(226, 232, 240, 0.4)';
            ctx.shadowBlur = proxFactor * 14;
          }

          ctx.beginPath();
          ctx.roundRect(
            -currentSize / 2,
            -currentSize / 2,
            currentSize,
            currentSize,
            currentRadius
          );
          ctx.stroke();

          // 3. Inner Concentric Square (Silver Mesh Accent)
          const innerSize = currentSize * 0.48;
          ctx.strokeStyle = `rgba(${silverR}, ${silverG}, ${silverB}, ${highlightAlpha * 0.55})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.roundRect(
            -innerSize / 2,
            -innerSize / 2,
            innerSize,
            innerSize,
            currentRadius * 0.5
          );
          ctx.stroke();

          // 4. Center Specular Micro-Rivet
          if (proxFactor > 0.1 || wave > 0.85) {
            ctx.fillStyle = `rgba(255, 255, 255, ${proxFactor * 0.9 + wave * 0.15})`;
            ctx.beginPath();
            ctx.arc(0, 0, 1.2 + proxFactor * 1.2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      // Soft vignette gradient near cursor
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        const radGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          MAX_DIST * 1.2
        );
        radGlow.addColorStop(0, 'rgba(199, 210, 254, 0.07)'); // subtle silver-indigo sheen
        radGlow.addColorStop(0.5, 'rgba(226, 232, 240, 0.03)');
        radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, MAX_DIST * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none select-none z-0 ${className}`}
    />
  );
}
