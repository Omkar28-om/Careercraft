import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import defaultMascot from "../assets/minion_s2.png";
import "./PageMascot.css";

const EYES = [
  { id: "kevin-left", x: 256, y: 170 },
  { id: "kevin-right", x: 318, y: 173 },
  { id: "stuart", x: 163, y: 331 },
  { id: "bob-left", x: 395, y: 326 },
  { id: "bob-right", x: 462, y: 332 },
];

const MOODS = {
  idle: { lid: 1, pupil: 1, cheek: 0 },
  happy: { lid: 0.72, pupil: 1.05, cheek: 0.42 },
  surprised: { lid: 1, pupil: 0.72, cheek: 0 },
  sleepy: { lid: 0.52, pupil: 0.9, cheek: 0.12 },
  closed: { lid: 0, pupil: 1, cheek: 0 },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function PageMascot({
  src = defaultMascot,
  mood = "idle",
  caption = "Career Companion · Active",
  mobile = "above",
  className = "",
  celebrate = false,
}) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const eyePositions = useRef(EYES.map(() => ({ x: 0, y: 0, targetX: 0, targetY: 0 })));
  const frameRef = useRef(0);
  const lastPointerMoveRef = useRef(Date.now());
  const reactionTimers = useRef([]);
  const confettiTimer = useRef(null);
  const confettiId = useRef(0);
  const [renderedEyes, setRenderedEyes] = useState(EYES.map(() => ({ x: 0, y: 0 })));
  const [hovered, setHovered] = useState(false);
  const [blinkingEyes, setBlinkingEyes] = useState(EYES.map(() => false));
  const [clickMood, setClickMood] = useState(null);
  const [bouncing, setBouncing] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const bodyX = useMotionValue(0);
  const bodyRotate = useMotionValue(0);
  const springX = useSpring(bodyX, { stiffness: 150, damping: 16, mass: 0.7 });
  const springRotate = useSpring(bodyRotate, { stiffness: 125, damping: 14, mass: 0.8 });
  const currentMood = clickMood || (hovered && mood === "idle" ? "happy" : mood);
  const expression = MOODS[currentMood] || MOODS.idle;

  const startEyeAnimation = useCallback(() => {
    if (prefersReducedMotion || frameRef.current) return;

    const tick = () => {
      let moving = false;
      const next = eyePositions.current.map((eye) => {
        eye.x += (eye.targetX - eye.x) * 0.2;
        eye.y += (eye.targetY - eye.y) * 0.2;
        if (Math.abs(eye.targetX - eye.x) > 0.03 || Math.abs(eye.targetY - eye.y) > 0.03) moving = true;
        return { x: eye.x, y: eye.y };
      });
      setRenderedEyes(next);

      if (moving) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = 0;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const onPointerMove = (event) => {
      lastPointerMoveRef.current = Date.now();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width * 0.5;
      const nx = clamp((event.clientX - centerX) / (window.innerWidth * 0.45), -1, 1);
      bodyX.set(nx * 8);
      bodyRotate.set(nx * 3.5);

      const scale = rect.width / 631;
      eyePositions.current.forEach((eye, index) => {
        const eyeX = rect.left + EYES[index].x * scale;
        const eyeY = rect.top + EYES[index].y * scale;
        const dx = event.clientX - eyeX;
        const dy = event.clientY - eyeY;
        const distance = Math.hypot(dx, dy) || 1;
        eye.targetX = (dx / distance) * 12;
        eye.targetY = (dy / distance) * 12;
      });
      startEyeAnimation();
    };

    const onDocumentLeave = () => {
      eyePositions.current.forEach((eye) => {
        eye.targetX = 0;
        eye.targetY = 0;
      });
      bodyX.set(0);
      bodyRotate.set(0);
      startEyeAnimation();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onDocumentLeave);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onDocumentLeave);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [bodyRotate, bodyX, prefersReducedMotion, startEyeAnimation]);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const timers = new Set();
    const later = (callback, delay) => {
      let timer;
      timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
    };
    const scheduleBlink = () => {
      later(() => {
        const groups = [[0, 1], [2], [3, 4]];
        groups.forEach((indices, groupIndex) => {
          const offset = groupIndex * 70;
          later(() => {
            setBlinkingEyes((previous) => previous.map((isBlinking, index) => indices.includes(index) || isBlinking));
          }, offset);
          later(() => {
            setBlinkingEyes((previous) => previous.map((isBlinking, index) => indices.includes(index) ? false : isBlinking));
          }, offset + 150);
        });
        later(scheduleBlink, 3000 + Math.random() * 3000 + 290);
      }, 3000 + Math.random() * 3000);
    };
    scheduleBlink();
    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const wanderTimer = window.setInterval(() => {
      if (Date.now() - lastPointerMoveRef.current < 3000 || mood !== "idle") return;
      const x = (Math.random() * 2 - 1) * 8;
      const y = (Math.random() * 2 - 1) * 5;
      eyePositions.current.forEach((eye) => {
        eye.targetX = x;
        eye.targetY = y;
      });
      startEyeAnimation();
    }, 1000);
    return () => window.clearInterval(wanderTimer);
  }, [mood, prefersReducedMotion, startEyeAnimation]);

  useEffect(() => () => {
    reactionTimers.current.forEach(window.clearTimeout);
    if (confettiTimer.current) window.clearTimeout(confettiTimer.current);
  }, []);

  const makeConfetti = useCallback(() => {
    const colors = ["#22d3ee", "#8b5cf6", "#facc15", "#f472b6", "#4ade80"];
    setConfetti(Array.from({ length: 24 }, (_, index) => ({
      id: ++confettiId.current,
      x: (Math.random() - 0.5) * 250,
      y: -40 - Math.random() * 90,
      drift: (Math.random() - 0.5) * 150,
      color: colors[index % colors.length],
      delay: Math.random() * 180,
    })));
    if (confettiTimer.current) window.clearTimeout(confettiTimer.current);
    confettiTimer.current = window.setTimeout(() => setConfetti([]), 1500);
  }, []);

  useEffect(() => {
    if (!celebrate) return;
    setBouncing(true);
    makeConfetti();
    const timer = window.setTimeout(() => setBouncing(false), 1250);
    return () => window.clearTimeout(timer);
  }, [celebrate, makeConfetti]);

  const handlePoke = () => {
    reactionTimers.current.forEach(window.clearTimeout);
    setClickMood("surprised");
    setBouncing(true);
    reactionTimers.current = [
      window.setTimeout(() => setClickMood("happy"), 350),
      window.setTimeout(() => {
        setClickMood(null);
        setBouncing(false);
      }, 1500),
    ];
  };

  const mobileClass = mobile === "hide" ? "page-mascot--mobile-hide" : "page-mascot--mobile-above";
  const instanceId = useMemo(() => `mascot-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div
      ref={containerRef}
      className={`page-mascot ${mobileClass} ${className}`}
      aria-hidden="true"
    >
      <motion.div className="page-mascot__body" style={{ x: springX, rotate: springRotate }}>
        <div
          className={`page-mascot__art ${hovered ? "is-hovered" : ""} ${bouncing ? "is-bouncing" : ""}`}
          onClick={handlePoke}
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") setHovered(true);
          }}
          onPointerLeave={() => setHovered(false)}
        >
          <img src={src} alt="" draggable="false" className="page-mascot__image" />
          <svg className="page-mascot__eyes" viewBox="0 0 631 631" focusable="false">
            <defs>
              <radialGradient id={`${instanceId}-sclera`} cx="42%" cy="38%" r="72%">
                <stop offset="0" stopColor="#fffdf6" />
                <stop offset="1" stopColor="#eadcc4" />
              </radialGradient>
              <radialGradient id={`${instanceId}-iris`} cx="36%" cy="34%" r="70%">
                <stop offset="0" stopColor="#c77835" />
                <stop offset="0.58" stopColor="#76401c" />
                <stop offset="1" stopColor="#241308" />
              </radialGradient>
              <linearGradient id={`${instanceId}-skin`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f8d131" />
                <stop offset="1" stopColor="#e8aa0a" />
              </linearGradient>
              {EYES.map((eye) => (
                <clipPath key={eye.id} id={`${instanceId}-${eye.id}-clip`}>
                  <circle cx={eye.x} cy={eye.y} r="29" />
                </clipPath>
              ))}
            </defs>
            {EYES.map((eye, index) => {
              const position = renderedEyes[index] || { x: 0, y: 0 };
              const pupilScale = expression.pupil;
              const lidOpen = blinkingEyes[index] ? 0 : expression.lid;
              return (
                <g
                  key={eye.id}
                  transform={`translate(${eye.x} ${eye.y})`}
                  clipPath={`url(#${instanceId}-${eye.id}-clip)`}
                >
                  <circle r="29" fill={`url(#${instanceId}-sclera)`} />
                  <g transform={`translate(${position.x} ${position.y}) scale(${pupilScale})`}>
                    <circle r="14" fill={`url(#${instanceId}-iris)`} stroke="#301707" strokeWidth="1.4" />
                    <circle r="8" fill="#180d07" />
                    <circle cx="-3" cy="-4" r="3.2" fill="#fff" opacity="0.96" />
                    <circle cx="3" cy="3" r="1.8" fill="#fff" opacity="0.72" />
                  </g>
                  <path
                    d="M-36 -62H36V60Q0 66 -36 60Z"
                    fill={`url(#${instanceId}-skin)`}
                    transform={`translate(0 ${-lidOpen * 4 * 29})`}
                  />
                  <path
                    d="M-36 64V34Q0 26 36 34V64Z"
                    fill={`url(#${instanceId}-skin)`}
                    transform={`translate(0 ${-expression.cheek * 24})`}
                  />
                </g>
              );
            })}
          </svg>
          {confetti.map((piece) => (
            <i
              key={piece.id}
              className="page-mascot__confetti"
              style={{
                left: "50%",
                top: "38%",
                backgroundColor: piece.color,
                "--confetti-x": `${piece.x}px`,
                "--confetti-y": `${piece.y}px`,
                "--confetti-drift": `${piece.drift}px`,
                animationDelay: `${piece.delay}ms`,
              }}
            />
          ))}
        </div>
      </motion.div>
      {caption && <div className="page-mascot__caption">{caption}</div>}
    </div>
  );
}
