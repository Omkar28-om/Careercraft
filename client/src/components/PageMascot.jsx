import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import defaultMascot from "../assets/minion_s2.png";
import "./PageMascot.css";

const EYES = [
  { id: "kevin-left", x: 256, y: 170, travel: 9 },
  { id: "kevin-right", x: 318, y: 173, travel: 9 },
  { id: "stuart", x: 163, y: 331, travel: 11 },
  { id: "bob-left", x: 395, y: 326, travel: 9 },
  { id: "bob-right", x: 462, y: 332, travel: 9 },
];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function TrackedEye({ eye, pointerX, pointerY, idleX, idleY, blink, instanceId }) {
  const targetX = useTransform([pointerX, idleX], ([x, idle]) => clamp((x - eye.x) * 0.035 + idle, -eye.travel, eye.travel));
  const targetY = useTransform([pointerY, idleY], ([y, idle]) => clamp((y - eye.y) * 0.035 + idle, -eye.travel * 0.72, eye.travel * 0.72));
  const x = useSpring(targetX, { stiffness: 105, damping: 23, mass: 0.8 });
  const y = useSpring(targetY, { stiffness: 105, damping: 23, mass: 0.8 });

  return <g transform={`translate(${eye.x} ${eye.y})`} clipPath={`url(#${instanceId}-${eye.id}-clip)`}>
    <circle r="29" fill={`url(#${instanceId}-sclera)`} />
    <motion.g style={{ x, y, opacity: blink ? 0 : 1 }}>
      <circle r="14" fill={`url(#${instanceId}-iris)`} stroke="#301707" strokeWidth="1.4" />
      <circle r="8" fill="#180d07" />
      <circle cx="-3" cy="-4" r="3.2" fill="#fff" opacity=".96" />
      <circle cx="3" cy="3" r="1.8" fill="#fff" opacity=".72" />
    </motion.g>
    {blink && <motion.path d="M-26 0 Q0 12 26 0" fill="none" stroke="#655844" strokeWidth="2.8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.08 }} />}
  </g>;
}

export default function PageMascot({ src = defaultMascot, caption = "Career Companion · Active", mobile = "above", className = "" }) {
  const artRef = useRef(null);
  const pointerX = useMotionValue(315);
  const pointerY = useMotionValue(315);
  const idleX = useMotionValue(0);
  const idleY = useMotionValue(0);
  const reducedMotion = useReducedMotion();
  const [blink, setBlink] = useState(false);
  const blinkTimer = useRef(null);
  const idleTimers = useRef([]);
  const lastPointerMoveRef = useRef(performance.now());
  const instanceId = useMemo(() => `mascot-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    let lastPointerMove = performance.now();
    const onPointerMove = (event) => {
      const rect = artRef.current?.getBoundingClientRect();
      if (!rect) return;
      lastPointerMoveRef.current = performance.now();
      idleX.set(0);
      idleY.set(0);
      pointerX.set(((event.clientX - rect.left) / rect.width) * 631);
      pointerY.set(((event.clientY - rect.top) / rect.height) * 631);
    };
    const reset = () => { pointerX.set(315); pointerY.set(315); };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", reset);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", reset);
    };
  }, [pointerX, pointerY]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const scheduleGlance = () => {
      const timer = window.setTimeout(() => {
        if (performance.now() - lastPointerMoveRef.current > 2500) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 2 + Math.random() * 3;
          idleX.set(Math.cos(angle) * distance);
          idleY.set(Math.sin(angle) * distance);
        }
        scheduleGlance();
      }, 1800);
      idleTimers.current.push(timer);
    };
    scheduleGlance();
    return () => idleTimers.current.forEach(window.clearTimeout);
  }, [idleX, idleY, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    let timer;
    const scheduleBlink = () => {
      timer = window.setTimeout(() => {
        setBlink(true);
        timer = window.setTimeout(() => { setBlink(false); scheduleBlink(); }, 155);
      }, 3800 + Math.random() * 2800);
    };
    scheduleBlink();
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  const poke = () => {
    setBlink(true);
    window.clearTimeout(blinkTimer.current);
    blinkTimer.current = window.setTimeout(() => setBlink(false), 170);
  };
  useEffect(() => () => window.clearTimeout(blinkTimer.current), []);
  const mobileClass = mobile === "hide" ? "page-mascot--mobile-hide" : "page-mascot--mobile-above";

  return <div className={`page-mascot ${mobileClass} ${className}`} aria-hidden="true">
    <div className="page-mascot__body">
      <div ref={artRef} className="page-mascot__art" onClick={poke}>
        <img src={src} alt="" draggable="false" className="page-mascot__image" />
        <svg className="page-mascot__eyes" viewBox="0 0 631 631" focusable="false">
          <defs>
            <radialGradient id={`${instanceId}-sclera`} cx="42%" cy="38%" r="72%"><stop offset="0" stopColor="#fffdf6" /><stop offset="1" stopColor="#eadcc4" /></radialGradient>
            <radialGradient id={`${instanceId}-iris`} cx="36%" cy="34%" r="70%"><stop offset="0" stopColor="#c77835" /><stop offset="0.58" stopColor="#76401c" /><stop offset="1" stopColor="#241308" /></radialGradient>
            <linearGradient id={`${instanceId}-skin`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8d131" /><stop offset="1" stopColor="#e8aa0a" /></linearGradient>
            {EYES.map((eye) => <clipPath key={eye.id} id={`${instanceId}-${eye.id}-clip`}><circle cx={eye.x} cy={eye.y} r="29" /></clipPath>)}
          </defs>
          {EYES.map((eye) => <TrackedEye key={eye.id} eye={eye} pointerX={pointerX} pointerY={pointerY} idleX={idleX} idleY={idleY} blink={blink} instanceId={instanceId} />)}
          <g className="page-mascot__smiles" fill={`url(#${instanceId}-skin)`}>
            <path d="M277 260 Q309 271 346 258 Q340 296 311 298 Q284 295 277 260Z" />
            <path d="M92 386 Q130 396 173 385 Q164 418 135 423 Q105 418 92 386Z" />
            <path d="M372 395 Q414 405 460 392 Q454 428 419 435 Q386 430 372 395Z" />
          </g>
          <g className="page-mascot__smile-lines" fill="none" stroke="#80551b" strokeWidth="3" strokeLinecap="round">
            <path d="M286 276 Q311 285 337 275" /><path d="M101 400 Q134 408 165 399" /><path d="M383 409 Q417 417 450 405" />
          </g>
        </svg>
      </div>
    </div>
    {caption && <div className="page-mascot__caption">{caption}</div>}
  </div>;
}



