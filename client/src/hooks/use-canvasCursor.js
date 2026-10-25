import { useEffect } from "react";

const useCanvasCursor = (canvasRef) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const trailCount = 16;
    const nodeCount = 34;
    const pointer = { x: -1000, y: -1000, active: false };
    const strands = [];
    let frame = 0;
    let hue = 205;
    let pixelRatio = 1;

    const makeStrands = () => {
      strands.length = 0;
      for (let i = 0; i < trailCount; i += 1) {
        const nodes = Array.from({ length: nodeCount }, () => ({ x: pointer.x, y: pointer.y, vx: 0, vy: 0 }));
        strands.push({ nodes, spring: 0.31 + (i / trailCount) * 0.025, friction: 0.54 + Math.random() * 0.02 });
      }
    };

    const resize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * pixelRatio);
      canvas.height = Math.round(window.innerHeight * pixelRatio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      makeStrands();
    };

    const move = (event) => {
      const wasInactive = !pointer.active;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (wasInactive) {
        strands.forEach(({ nodes }) => nodes.forEach((node) => {
          node.x = pointer.x;
          node.y = pointer.y;
          node.vx = 0;
          node.vy = 0;
        }));
      }
      pointer.active = true;
      if (!reduceMotion && !frame) frame = requestAnimationFrame(render);
    };
    const leave = () => { pointer.active = false; };

    const render = () => {
      frame = 0;
      if (!pointer.active || document.hidden || reduceMotion) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1;
      let moving = false;

      for (const [index, strand] of strands.entries()) {
        const nodes = strand.nodes;
        let spring = strand.spring;
        for (let i = 0; i < nodes.length; i += 1) {
          const node = nodes[i];
          const target = i === 0 ? pointer : nodes[i - 1];
          node.vx += (target.x - node.x) * spring;
          node.vy += (target.y - node.y) * spring;
          if (i > 0) {
            node.vx += target.vx * 0.22;
            node.vy += target.vy * 0.22;
          }
          node.vx *= strand.friction;
          node.vy *= strand.friction;
          node.x += node.vx;
          node.y += node.vy;
          if (Math.abs(node.vx) + Math.abs(node.vy) > 0.08) moving = true;
          spring *= 0.98;
        }

        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);
        for (let i = 1; i < nodes.length - 1; i += 1) {
          const midpointX = (nodes[i].x + nodes[i + 1].x) / 2;
          const midpointY = (nodes[i].y + nodes[i + 1].y) / 2;
          ctx.quadraticCurveTo(nodes[i].x, nodes[i].y, midpointX, midpointY);
        }
        ctx.lineTo(nodes[nodeCount - 1].x, nodes[nodeCount - 1].y);
        ctx.strokeStyle = `hsla(${(hue + index * 3) % 360}, 65%, 62%, ${0.12 - (index / trailCount) * 0.035})`;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      hue = (hue + 0.25) % 360;
      if (moving) frame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", leave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", leave);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [canvasRef]);
};

export default useCanvasCursor;
