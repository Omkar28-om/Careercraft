import { useEffect, useId, useRef, useState, useCallback } from "react";
import defaultMascot from "../assets/minion_s2.png";
import "./PageMascot.css";

const MAX = 12;

// [x, y, minionIndex]
// 0: Kevin (tall center-left, 2 eyes)
// 1: Stuart (one-eyed left)
// 2: Bob (two-eyed right)
const EYES = [
  [256, 170, 0],
  [318, 173, 0],
  [163, 331, 1],
  [395, 326, 2],
  [462, 332, 2],
];

// [lid, cheek, pupilScale]
const MOODS = {
  idle: [0, 0, 1],
  happy: [0, 0.9, 1.05],
  surprised: [0, 0, 0.7],
  sleepy: [0.5, 0, 1],
  closed: [1, 0, 1],
};

export default function PageMascot({
  src = defaultMascot,
  mood = "idle",
  caption = "Career Companion · Active",
  celebrate = false,
  mobile = "above",
  className = "",
}) {
  const pmRef = useRef(null);
  const stageRef = useRef(null);
  const svgRef = useRef(null);
  const eyeRefs = useRef([]);
  const pupRefs = useRef([]);

  const rawId = useId();
  const instanceId = rawId ? rawId.replace(/[^a-zA-Z0-9_-]/g, "") : "m1";

  const [reduced, setReduced] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  const reducedRef = useRef(reduced);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const baseRef = useRef(mood || "idle");
  const reactionRef = useRef(null);
  const hoverRef = useRef(false);
  const blinkRef = useRef(false);
  const tRef = useRef([]);

  const stRef = useRef(EYES.map(() => ({ x: 0, y: 0, tx: 0, ty: 0 })));
  const runRef = useRef(false);
  const lastMoveRef = useRef(0);
  const rafTickRef = useRef(0);
  const tickRef = useRef(null);

  const spRef = useRef({
    x: 0,
    r: 0,
    y: 0,
    sy: 1,
    xv: 0,
    rv: 0,
    yv: 0,
    syv: 0,
    tx: 0,
    tr: 0,
  });

  // Render CSS variables for eyelids, cheeks, and pupil scale
  const render = useCallback(() => {
    const currentReaction = reactionRef.current;
    const currentHover = hoverRef.current;
    const currentBase = baseRef.current;
    const currentBlink = blinkRef.current;

    const n = currentReaction || (currentHover && currentBase === "idle" ? "happy" : currentBase);
    const m = MOODS[n] || MOODS.idle;

    eyeRefs.current.forEach((e) => {
      if (e) {
        e.style.setProperty("--l", currentBlink ? "1" : String(m[0]));
        e.style.setProperty("--c", String(m[1]));
        e.style.setProperty("--p", String(m[2]));
      }
    });
  }, []);

  // Update base mood when prop changes
  useEffect(() => {
    baseRef.current = mood || "idle";
    if (mood === "closed" || mood === "happy") {
      reactionRef.current = null;
      tRef.current.forEach(clearTimeout);
    }
    render();
  }, [mood, render]);

  // Reduced motion media query listener
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => {
      setReduced(e.matches);
      reducedRef.current = e.matches;
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Smooth pupil lerp loop
  const tick = useCallback(() => {
    let mv = false;
    const pups = pupRefs.current;
    stRef.current.forEach((s, i) => {
      s.x += (s.tx - s.x) * 0.18;
      s.y += (s.ty - s.y) * 0.18;
      if (Math.abs(s.tx - s.x) > 0.02 || Math.abs(s.ty - s.y) > 0.02) mv = true;
      if (pups[i]) {
        pups[i].style.transform = `translate(${s.x}px,${s.y}px)`;
      }
    });
    if (mv && tickRef.current) {
      rafTickRef.current = requestAnimationFrame(tickRef.current);
    } else {
      runRef.current = false;
    }
  }, []);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const kick = useCallback(() => {
    if (!runRef.current && tickRef.current) {
      runRef.current = true;
      rafTickRef.current = requestAnimationFrame(tickRef.current);
    }
  }, []);

  // Pointer move eye tracking & stage physics nudge
  useEffect(() => {
    if (reduced) return undefined;

    const onPointerMove = (e) => {
      lastMoveRef.current = Date.now();
      const nx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2));
      const sp = spRef.current;
      sp.tr = nx * 3.5;
      sp.tx = nx * 10;
      sp.rv += Math.max(-40, Math.min(40, e.movementX || 0)) * 0.15;

      if (!svgRef.current) return;
      const r = svgRef.current.getBoundingClientRect();
      const k = r.width / 631;

      EYES.forEach(([x, y], i) => {
        const dx = e.clientX - (r.left + x * k);
        const dy = e.clientY - (r.top + y * k);
        const d = Math.hypot(dx, dy) || 1;
        const s = Math.min(1, d / 160);
        stRef.current[i].tx = (dx / d) * MAX * s;
        stRef.current[i].ty = (dy / d) * MAX * s;
      });
      kick();
    };

    const onMouseLeave = () => {
      stRef.current.forEach((s) => {
        s.tx = 0;
        s.ty = 0;
      });
      spRef.current.tr = 0;
      spRef.current.tx = 0;
      kick();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      if (rafTickRef.current) cancelAnimationFrame(rafTickRef.current);
    };
  }, [reduced, kick]);

  // Idle glancing interval when mouse is inactive
  useEffect(() => {
    if (reduced) return undefined;
    const interval = setInterval(() => {
      if (Date.now() - lastMoveRef.current > 3000) {
        const a = (Math.random() * 2 - 1) * MAX * 0.8;
        const b = (Math.random() * 2 - 1) * MAX * 0.5;
        stRef.current.forEach((s) => {
          s.tx = a;
          s.ty = b;
        });
        kick();
      }
    }, 2200);

    return () => clearInterval(interval);
  }, [reduced, kick]);

  // Natural blinking loop
  useEffect(() => {
    if (reduced) return undefined;
    let active = true;
    let timer1;
    let timer2;

    const loop = () => {
      if (!active) return;
      const delay = 3000 + Math.random() * 3000;
      timer1 = setTimeout(() => {
        if (!active) return;
        blinkRef.current = true;
        render();
        timer2 = setTimeout(() => {
          if (!active) return;
          blinkRef.current = false;
          render();
          loop();
        }, 160);
      }, delay);
    };

    loop();

    return () => {
      active = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [reduced, render]);

  // Physics spring simulation loop on the stage element
  useEffect(() => {
    if (reduced) return undefined;
    let last = performance.now();
    let rafId;

    const sg = (p, v, t, k, c, dt) => {
      v += ((t - p) * k - v * c) * dt;
      return [p + v * dt, v];
    };

    const ph = (n) => {
      const dt = Math.min(0.033, (n - last) / 1000);
      last = n;
      const sp = spRef.current;
      [sp.x, sp.xv] = sg(sp.x, sp.xv, sp.tx, 90, 9, dt);
      [sp.r, sp.rv] = sg(sp.r, sp.rv, sp.tr, 110, 8, dt);
      [sp.y, sp.yv] = sg(sp.y, sp.yv, 0, 160, 10, dt);
      [sp.sy, sp.syv] = sg(sp.sy, sp.syv, 1, 200, 11, dt);

      if (stageRef.current) {
        stageRef.current.style.translate = `${sp.x}px ${sp.y}px`;
        stageRef.current.style.rotate = `${sp.r}deg`;
        stageRef.current.style.scale = `${1 + (1 - sp.sy) * 0.5} ${sp.sy}`;
      }
      rafId = requestAnimationFrame(ph);
    };

    rafId = requestAnimationFrame(ph);
    return () => cancelAnimationFrame(rafId);
  }, [reduced]);

  // Confetti generator
  const spawnConfetti = useCallback((n = 14) => {
    if (reducedRef.current || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const c = ["#facc15", "#22d3ee", "#a78bfa", "#f472b6", "#4ade80"];

    for (let i = 0; i < n; i++) {
      const d = document.createElement("i");
      d.className = "cf";
      d.style.left = `${r.left + r.width * (0.25 + Math.random() * 0.5)}px`;
      d.style.top = `${r.top + r.height * 0.3}px`;
      d.style.background = c[i % 5];
      document.body.appendChild(d);

      if (d.animate) {
        d.animate(
          [
            { transform: "translate(0,0) rotate(0)", opacity: 1 },
            {
              transform: `translate(${(Math.random() - 0.5) * 320}px, ${-90 - Math.random() * 110}px) rotate(${Math.random() * 360}deg)`,
              opacity: 1,
              offset: 0.45,
            },
            {
              transform: `translate(${(Math.random() - 0.5) * 420}px, ${260 + Math.random() * 120}px) rotate(${Math.random() * 720}deg)`,
              opacity: 0,
            },
          ],
          { duration: 1500 + Math.random() * 600, easing: "ease-out" }
        ).onfinish = () => d.remove();
      } else {
        setTimeout(() => d.remove(), 1800);
      }
    }
  }, []);

  // Poke reaction on clicking the mascot
  const poke = () => {
    tRef.current.forEach(clearTimeout);
    reactionRef.current = "surprised";
    render();
    tRef.current = [
      setTimeout(() => {
        reactionRef.current = "happy";
        render();
      }, 350),
      setTimeout(() => {
        reactionRef.current = null;
        render();
      }, 1700),
    ];
    if (!reducedRef.current && spRef.current) {
      spRef.current.yv -= 420;
      spRef.current.syv -= 3;
    }
  };

  // Trigger celebration bounce & confetti on successful login
  const triggerCheer = useCallback(() => {
    tRef.current.forEach(clearTimeout);
    tRef.current = [];
    reactionRef.current = "happy";
    render();
    [0, 380, 760].forEach((d, i) => {
      tRef.current.push(
        setTimeout(() => {
          if (!reducedRef.current && spRef.current) {
            spRef.current.yv -= 520;
            spRef.current.syv -= 3.5;
            spRef.current.rv += (i % 2 ? -1 : 1) * 140;
          }
          spawnConfetti(14);
        }, d)
      );
    });
    tRef.current.push(
      setTimeout(() => {
        reactionRef.current = null;
        render();
      }, 2600)
    );
  }, [render, spawnConfetti]);

  // Watch celebrate prop
  const prevCelebrateRef = useRef(false);
  useEffect(() => {
    if (celebrate && !prevCelebrateRef.current) {
      triggerCheer();
    }
    prevCelebrateRef.current = celebrate;
  }, [celebrate, triggerCheer]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      tRef.current.forEach(clearTimeout);
    };
  }, []);

  const mobileClass = mobile === "hide" ? "page-mascot--mobile-hide" : "page-mascot--mobile-above";

  return (
    <div
      ref={pmRef}
      className={`pm page-mascot ${mobileClass} ${className}`}
      id="pm"
      aria-hidden="true"
      onClick={poke}
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") {
          hoverRef.current = true;
          render();
        }
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
        render();
      }}
    >
      <div ref={stageRef} className="st page-mascot__stage" id="st">
        <img src={src} alt="Three Minions" draggable="false" className="page-mascot__image" />
        <svg ref={svgRef} id="svg" viewBox="0 0 631 631" className="page-mascot__eyes" focusable="false">
          <defs>
            <radialGradient id={`${instanceId}-s`} cx="45%" cy="42%" r="65%">
              <stop offset="0" stopColor="#fffdf6" />
              <stop offset="1" stopColor="#f1e3c8" />
            </radialGradient>
            <linearGradient id={`${instanceId}-h`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#46280a" stopOpacity="0.28" />
              <stop offset="0.4" stopColor="#46280a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${instanceId}-k`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f8cd2a" />
              <stop offset="1" stopColor="#edb40f" />
            </linearGradient>
            <clipPath id={`${instanceId}-c`}>
              <circle r="30" />
            </clipPath>
          </defs>
          {EYES.map(([x, y, m], i) => (
            <g
              key={i}
              ref={(el) => {
                eyeRefs.current[i] = el;
              }}
              className="eye"
              transform={`translate(${x} ${y})`}
              style={{ "--d": `${m * 35}ms` }}
            >
              <circle r="30" fill={`url(#${instanceId}-s)`} />
              <g clipPath={`url(#${instanceId}-c)`}>
                <g
                  ref={(el) => {
                    pupRefs.current[i] = el;
                  }}
                  id={`pm${i}`}
                >
                  <g className="pup">
                    <circle r="13" fill="#6b4423" />
                    <circle r="8" fill="#24150a" />
                    <circle cx="-4" cy="-5" r="3.5" fill="#fff" opacity="0.95" />
                  </g>
                </g>
                <circle r="30" fill={`url(#${instanceId}-h)`} />
                <path className="lid" d="M-34 -72H34V30Q0 40 -34 30Z" fill={`url(#${instanceId}-k)`} />
                <path className="chk" d="M-36 84V10Q0 -16 36 10V84Z" fill={`url(#${instanceId}-k)`} />
              </g>
            </g>
          ))}
        </svg>
      </div>
      {caption && (
        <div className="cap page-mascot__caption" id="cap">
          {caption}
        </div>
      )}
    </div>
  );
}
