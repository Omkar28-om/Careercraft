import { useEffect } from "react";

export default function useCanvasCursor() {
  useEffect(() => {
    // Respect touch devices and reduced-motion preferences.
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const particles = [];
    const colors = ["#a855f7", "#06b6d4", "#818cf8", "#ec4899"];

    function resizeCanvas() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function handleMouseMove(event) {
      particles.push({
        x: event.clientX,
        y: event.clientY,
        radius: Math.random() * 3 + 1,
        alpha: 0.9,
        color: colors[Math.floor(Math.random() * colors.length)],
      });

      if (particles.length > 100) particles.shift();
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.alpha -= 0.025;
        particle.radius *= 0.98;

        if (particle.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(
          particle.x,
          particle.y,
          particle.radius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationId = window.requestAnimationFrame(animate);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      ctx.clearRect(0, 0, width, height);
    };
  }, []);
}
