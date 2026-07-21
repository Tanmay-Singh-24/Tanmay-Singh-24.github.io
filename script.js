/* ================================================================
   TANMAY SINGH — CASE #01 · v2.1
   preloader · heat field · flow figures · pixel marquee ·
   particle portrait · smiley · scramble · cursor
   ================================================================ */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let preloadDone = false;

const PAL = {
  bg: "#181817",
  paper: "#f1f2ee",
  ink: "#0c0c0e",
  navy: "#171a2e",
  cold: "#2a3163",
  blue: "#2333ff",
  blueHi: "#5060ff",
  aqua: "#37e0c8",
  lime: "#d4ff3f",
  violet: "#a855f7",
  indigo: "#7c6cff",
  sky: "#7fb0ff",
  alert: "#ff5230",
};

/* ---------------------------------------------------------------
   HAPTICS
   Android/Chrome expose the Vibration API. iOS Safari does not — it
   has never shipped navigator.vibrate — so there we fall back to the
   iOS 17.4+ trick of clicking an offscreen <input type="checkbox" switch>,
   which the system answers with a light tap. Anything older is silent.
   --------------------------------------------------------------- */
const haptic = (() => {
  const canVibrate = typeof navigator.vibrate === "function";
  const isTouch = window.matchMedia("(hover: none)").matches;
  let sw = null;

  function tap() {
    if (!sw) {
      sw = document.createElement("input");
      sw.type = "checkbox";
      sw.setAttribute("switch", "");     // iOS 17.4+ only; inert elsewhere
      sw.setAttribute("aria-hidden", "true");
      sw.tabIndex = -1;
      sw.style.cssText =
        "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
      document.body.appendChild(sw);
    }
    try { sw.click(); } catch (e) { /* unsupported — stay silent */ }
  }

  return function haptic(pattern, taps) {
    if (reducedMotion) return;
    if (canVibrate) { try { navigator.vibrate(pattern); } catch (e) {} return; }
    if (!isTouch) return;
    // no pattern support on iOS: approximate it with spaced taps
    const n = taps || 1;
    for (let i = 0; i < n; i++) setTimeout(tap, i * 85);
  };
})();

/* runs a module's frame only while its canvas is on screen */
function onScreen(el, cb) {
  let act = false;
  new IntersectionObserver(
    (es) => es.forEach((e) => { act = e.isIntersecting; cb && cb(act); }),
    { rootMargin: "80px" }
  ).observe(el);
  return () => act;
}

/* ---------------------------------------------------------------
   PRELOADER
   --------------------------------------------------------------- */
(function preloader() {
  const el = document.getElementById("preloader");
  const count = document.getElementById("preloaderCount");
  const bar = document.getElementById("preloaderBar");
  let p = 0;

  function pad(n) { return String(n).padStart(3, "0") + "%"; }
  function finish() { el.classList.add("done"); preloadDone = true; }
  function tick() {
    p += Math.floor(Math.random() * 12) + 2;
    if (p >= 100) p = 100;
    count.textContent = pad(p);
    bar.style.width = p + "%";
    if (p < 100) setTimeout(tick, 60 + Math.random() * 140);
    else setTimeout(finish, 350);
  }
  if (reducedMotion) { finish(); return; }
  setTimeout(tick, 300);
})();

/* ---------------------------------------------------------------
   PIXEL HEAT FIELD — hero
   --------------------------------------------------------------- */
(function heatField() {
  const canvas = document.getElementById("field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);

  const BANDS = [
    [0.78, PAL.lime],
    [0.62, PAL.aqua],
    [0.46, PAL.blue],
    [0.30, PAL.cold],
  ];
  const LINES = ["TANMAY", "SINGH"];

  let cell = 12, BRUSH = 8;
  let W = 0, H = 0, cols = 0, rows = 0;
  let heat = null;
  let t = 0, typeT = 0;
  const SEED = Math.random() * 1000;
  let waves = [];
  let mx = -1, my = -1, pmx = -1, pmy = -1;

  const tmask = document.createElement("canvas");
  const tmc = tmask.getContext("2d");
  const smask = document.createElement("canvas");
  const smc = smask.getContext("2d");
  let sData = null, TB = null;
  let ghostA = null, ghostL = null, glitchT = 0;

  function tint(src, color) {
    const c = document.createElement("canvas");
    c.width = src.width; c.height = src.height;
    const g = c.getContext("2d");
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  function heroRect() { return canvas.getBoundingClientRect(); }

  function size() {
    // layout size, immune to the scroll-zoom transform
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    tmask.width = canvas.width; tmask.height = canvas.height;
    tmc.setTransform(DPR, 0, 0, DPR, 0, 0);
    cols = Math.ceil(W / cell) + 1;
    rows = Math.ceil(H / cell) + 1;
    heat = new Float32Array(cols * rows);
    smask.width = cols; smask.height = rows;
    measureType();
  }

  function measureType() {
    let fs = Math.min((W * 0.82) / 3.5, H * 0.24);
    tmc.font = `700 ${fs}px "PP Neue Montreal", "Inter Tight", sans-serif`;
    const wmax = Math.max(...LINES.map((ln) => tmc.measureText(ln).width));
    if (wmax > W * 0.94) fs *= (W * 0.94) / wmax;
    const lh = fs * 0.94;
    const cy = H * 0.46;
    TB = { fs, lh, y0: cy - lh / 2 };

    tmc.clearRect(0, 0, W, H);
    tmc.textAlign = "center"; tmc.textBaseline = "middle";
    tmc.fillStyle = PAL.paper;
    tmc.font = `700 ${fs}px "PP Neue Montreal", "Inter Tight", sans-serif`;
    LINES.forEach((ln, i) => tmc.fillText(ln, W / 2, TB.y0 + i * lh));
    ghostA = tint(tmask, PAL.aqua);
    ghostL = tint(tmask, PAL.lime);

    smc.setTransform(1, 0, 0, 1, 0, 0);
    smc.clearRect(0, 0, cols, rows);
    smc.textAlign = "center"; smc.textBaseline = "middle";
    smc.lineJoin = "round"; smc.lineWidth = 2.6;
    smc.strokeStyle = "#000"; smc.fillStyle = "#000";
    smc.font = `700 ${fs / cell}px "PP Neue Montreal", "Inter Tight", sans-serif`;
    LINES.forEach((ln, i) => {
      smc.strokeText(ln, (W / 2) / cell, (TB.y0 + i * lh) / cell);
      smc.fillText(ln, (W / 2) / cell, (TB.y0 + i * lh) / cell);
    });
    sData = smc.getImageData(0, 0, cols, rows).data;
  }

  function hsh(c, r) {
    const n = Math.sin(c * 127.1 + r * 311.7 + SEED * 0.13) * 43758.5453;
    return n - Math.floor(n);
  }

  function ambient(nx, ny, tt) {
    const v =
      Math.sin(nx * 5.6 + SEED * 1.3 + tt * 0.3) *
        Math.cos(ny * 4.7 - SEED * 0.7 + tt * 0.22) +
      Math.sin((nx * 1.4 + ny * 1.7) * 4.1 - SEED + tt * 0.16) +
      Math.sin(ny * 9 + SEED * 2.1 + nx * 3) * 0.5;
    const n = 0.5 + 0.5 * (v / 2.5);
    return n > 0.8 ? 0.3 + (n - 0.8) * 1.4 : 0;
  }

  function dep(x, y, amt, sig) {
    const cc = x / cell, cr = y / cell;
    const rad = Math.ceil(sig * 1.6);
    const inv = 1 / (2 * sig * sig * 0.18);
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        const c = (cc + dc) | 0, r = (cr + dr) | 0;
        if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
        const dx = c + 0.5 - cc, dy = r + 0.5 - cr;
        const w = Math.exp(-(dx * dx + dy * dy) * inv);
        if (w < 0.02) continue;
        const id = r * cols + c;
        const v = heat[id] + amt * w;
        heat[id] = v > 1 ? 1 : v;
      }
    }
  }

  function follow(x, y) {
    if (pmx < 0) { pmx = x; pmy = y; }
    const dx = x - pmx, dy = y - pmy;
    const dl = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.min(48, Math.round(dl / (cell * 0.8))));
    for (let s = 1; s <= steps; s++) {
      const f = s / steps;
      dep(pmx + dx * f, pmy + dy * f, 0.22, BRUSH * 0.55);
    }
    pmx = x; pmy = y;
  }

  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  function clearAt(x, y) {
    const tl = clamp01((380 - x) / 150) * clamp01((215 - y) / 130);
    const tr = clamp01((x - (W - 360)) / 150) * clamp01((215 - y) / 130);
    const bl = clamp01((W * 0.45 - x) / 170) * clamp01((y - (H - 230)) / 130);
    const br = clamp01((x - (W - 300)) / 150) * clamp01((y - (H - 140)) / 100);
    return Math.max(tl, tr, bl, br);
  }

  function bandColor(v) {
    for (let i = 0; i < BANDS.length; i++) if (v >= BANDS[i][0]) return BANDS[i][1];
    return null;
  }

  const TBLOCK = 7, RSPREAD = 1.15, RLEAD = 0.18;
  const tfx = document.createElement("canvas");
  const tfc = tfx.getContext("2d");
  function drawType() {
    if (!TB) return;
    if (typeT >= RSPREAD + RLEAD) {
      ctx.drawImage(tmask, 0, 0, W, H);
      // periodic signal glitch: horizontal slices ghost out in aqua/lime
      if (!reducedMotion && glitchT <= 0 && t % 240 === 0) glitchT = 12;
      if (glitchT > 0) {
        glitchT--;
        for (let i = 0; i < 3; i++) {
          const gy = TB.y0 - TB.fs * 0.55 + hsh(i, Math.floor(t / 3)) * TB.lh * 2.1;
          const gh = TB.fs * (0.12 + hsh(i + 9, Math.floor(t / 2)) * 0.2);
          const gx = (hsh(i + 4, Math.floor(t / 2)) - 0.5) * 26;
          const src = i === 0 ? ghostA : i === 1 ? ghostL : tmask;
          ctx.drawImage(
            src,
            0, Math.max(0, gy * DPR), tmask.width, Math.max(1, gh * DPR),
            gx, gy, W, gh
          );
        }
      }
      return;
    }
    tfx.width = canvas.width; tfx.height = canvas.height;
    tfc.setTransform(DPR, 0, 0, DPR, 0, 0);
    tfc.fillStyle = PAL.paper;
    const n = Math.ceil(W / TBLOCK), nr = Math.ceil(H / TBLOCK);
    const tick = Math.floor(typeT * 16);
    for (let c = 0; c < n; c++) {
      const ra = (c / n) * RSPREAD;
      if (typeT >= ra) {
        tfc.fillRect(c * TBLOCK, 0, TBLOCK, H);
      } else if (typeT > ra - RLEAD) {
        const prob = 0.25 + 0.75 * (1 - (ra - typeT) / RLEAD);
        for (let r = 0; r < nr; r++) {
          if (hsh(c + tick * 0.7, r) < prob) tfc.fillRect(c * TBLOCK, r * TBLOCK, TBLOCK, TBLOCK);
        }
      }
    }
    tfc.globalCompositeOperation = "destination-in";
    tfc.drawImage(tmask, 0, 0, W, H);
    tfc.globalCompositeOperation = "source-over";
    ctx.drawImage(tfx, 0, 0, W, H);
  }

  addEventListener("pointermove", (e) => {
    const r = heroRect();
    if (r.bottom < 0) return;
    const k = r.width / (canvas.offsetWidth || 1); // undo the scroll-zoom scale
    mx = (e.clientX - r.left) / k;
    my = (e.clientY - r.top) / k;
    if (my >= 0 && my <= H) follow(mx, my);
  });
  addEventListener("pointerdown", (e) => {
    const r = heroRect();
    const k = r.width / (canvas.offsetWidth || 1);
    const x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k;
    if (y < 0 || y > H) return;
    if (e.target.closest(".pxctl, a, button")) return;
    waves.push({ x, y, t0: t });
  });

  const pxctl = document.getElementById("pxctl");
  if (pxctl) {
    pxctl.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.cell) {
        cell = +b.dataset.cell;
        pxctl.querySelectorAll("[data-cell]").forEach((x) => x.classList.toggle("on", x === b));
        size();
      }
      if (b.dataset.brush) {
        BRUSH = +b.dataset.brush;
        pxctl.querySelectorAll("[data-brush]").forEach((x) => x.classList.toggle("on", x === b));
      }
    });
  }

  const visible = onScreen(canvas);
  let introFired = false;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible() && typeT >= RSPREAD + RLEAD) return;
    t += 1;
    if (preloadDone && typeT < RSPREAD + RLEAD + 1) typeT += 0.016;
    if (preloadDone && !introFired) {
      introFired = true;
      waves.push({ x: W * 0.28, y: H * 0.62, t0: t });
      waves.push({ x: W * 0.74, y: H * 0.3, t0: t + 10 });
    }

    waves = waves.filter((wv) => t - wv.t0 < 40);
    waves.forEach((wv) => {
      const age = t - wv.t0;
      if (age < 0) return;
      const rad = age * cell * 0.9;
      const n = Math.max(10, Math.round(rad * 0.5));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        dep(wv.x + Math.cos(a) * rad, wv.y + Math.sin(a) * rad, 0.09, 2.2);
      }
    });

    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, W, H);

    const tt = reducedMotion ? 0 : t * 0.012;
    const inset = cell > 10 ? 1 : 0.5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = r * cols + c;
        let v = heat[id];
        heat[id] = v * 0.974;
        const nx = c / cols, ny = r / rows;
        const amb = reducedMotion ? 0 : ambient(nx * 3, ny * 3, tt);
        if (amb > v) v = amb;
        if (v < 0.3) continue;
        if (sData && sData[id * 4 + 3] > 40) continue;
        const x = c * cell, y = r * cell;
        v *= 1 - clearAt(x, y);
        const col = bandColor(v);
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x, y, cell - inset, cell - inset);
      }
    }

    drawType();
  }

  function boot() {
    size();
    if (reducedMotion) typeT = RSPREAD + RLEAD + 1;
    requestAnimationFrame(frame);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('700 100px "Inter Tight"').then(() => document.fonts.ready).then(boot);
  } else {
    boot();
  }

  let lastW = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth !== lastW || Math.abs(canvas.offsetHeight - H) > 120) {
      lastW = innerWidth;
      size();
    }
  });
})();

/* ---------------------------------------------------------------
   WARP — pinned pixel hyperspace, scrubbed by scroll.
   Cells stream outward through the heat bands; scroll velocity
   feeds the tunnel; the center message decodes as you travel;
   lime ellipse rings expand on the way out.
   --------------------------------------------------------------- */
(function warpSequence() {
  const section = document.getElementById("warp");
  const canvas = document.getElementById("warpCanvas");
  if (!section || !canvas) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const msgEl = document.getElementById("warpMsg");
  const lines = [...section.querySelectorAll(".warp-lines span")];
  /* the syllogism: premise → premise → ∴ conclusion */
  const MSGS = ["AGENTS RUN ON SYSTEMS.", "SYSTEMS RUN ON METAL.", "∴ I LEARNED THE METAL."];
  const CELL = 6;

  let W = 0, H = 0, cx = 0, cy = 0, maxR = 0;
  let stars = [];
  let p = 0, vel = 0, lastY = scrollY, warp = 0.3;
  let msgIdx = -1, decodeTimer = null;
  let wt = 0, glitchN = 0;

  function makeStar(init) {
    return {
      a: Math.random() * Math.PI * 2,
      d: init ? Math.random() : 0.02 + Math.random() * 0.08,
      s: 0.4 + Math.random() * 1.2,
    };
  }

  function size() {
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = H / 2;
    maxR = Math.hypot(cx, cy);
    stars = [];
    const N = Math.round(Math.min(320, Math.max(160, W * 0.22)));
    for (let i = 0; i < N; i++) stars.push(makeStar(true));
  }

  function starColor(d) {
    if (d > 0.85) return PAL.lime;
    if (d > 0.62) return PAL.aqua;
    if (d > 0.38) return PAL.blue;
    return PAL.cold;
  }

  function setMsg(text) {
    msgEl.textContent = text;
    msgEl.dataset.text = text; // ghosts mirror the visible text
  }
  function decodeMsg(text) {
    const CH = "▚▞#%&@$0123456789";
    let i = 0;
    clearInterval(decodeTimer);
    msgEl.classList.add("glitching");
    decodeTimer = setInterval(() => {
      setMsg(
        text
          .split("")
          .map((c, idx) => (c === " " ? " " : idx < i ? c : CH[(Math.random() * CH.length) | 0]))
          .join("")
      );
      if (++i > text.length) {
        clearInterval(decodeTimer);
        setMsg(text);
        msgEl.classList.remove("glitching");
      }
    }, 26);
  }

  function progress() {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    return Math.max(0, Math.min(1, -r.top / (total || 1)));
  }

  function frame() {
    if (reducedMotion) { p = 0.5; }
    else {
      vel += scrollY - lastY; lastY = scrollY; vel *= 0.9;
      p = progress();
    }
    const targetWarp = 0.12 + p * p * 2.6 + Math.min(2.4, Math.abs(vel) * 0.006);
    warp += (targetWarp - warp) * 0.08;

    const mi = p < 0.3 ? 0 : p < 0.6 ? 1 : 2;
    if (mi !== msgIdx) {
      msgIdx = mi;
      if (reducedMotion) setMsg(MSGS[mi]);
      else decodeMsg(MSGS[mi]);
    }
    // random micro-glitch bursts between transitions
    wt++;
    if (!reducedMotion) {
      if (glitchN > 0) {
        if (--glitchN === 0) msgEl.classList.remove("glitching");
      } else if (wt % 200 === 0) {
        glitchN = 14;
        msgEl.classList.add("glitching");
      }
    }
    const local = p < 0.3 ? p / 0.3 : p < 0.6 ? (p - 0.3) / 0.3 : (p - 0.6) / 0.4;
    const fade = Math.min(1, Math.min(local, 1 - local) * 6 + 0.25);
    msgEl.style.opacity = String(0.25 + fade * 0.75);
    msgEl.style.transform = `translate(-50%, -50%) scale(${0.96 + local * 0.08})`;

    lines.forEach((el, i) => el.classList.toggle("on", p > 0.62 + i * 0.07));

    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, W, H);

    for (const st of stars) {
      st.d += st.s * warp * 0.006;
      if (st.d >= 1) { Object.assign(st, makeStar(false)); continue; }
      const col = starColor(st.d);
      const trail = Math.min(4, 1 + Math.floor(warp * 1.4));
      for (let k = 0; k < trail; k++) {
        const dd = st.d - k * 0.012 * warp;
        if (dd <= 0) break;
        const rr = Math.pow(dd, 1.8) * maxR;
        const qx = cx + Math.cos(st.a) * rr;
        const qy = cy + Math.sin(st.a) * rr;
        ctx.globalAlpha = k === 0 ? 1 : Math.max(0.15, 0.6 - k * 0.16);
        ctx.fillStyle = col;
        const big = st.d > 0.78 ? 2 : 1;
        ctx.fillRect(Math.floor(qx / CELL) * CELL, Math.floor(qy / CELL) * CELL, CELL * big - 1, CELL * big - 1);
      }
      ctx.globalAlpha = 1;
    }

    // lime ellipse rings on the way out
    if (p > 0.6) {
      const q = (p - 0.6) / 0.4;
      for (let ri = 0; ri < 3; ri++) {
        const rr = q * 1.3 - ri * 0.18;
        if (rr <= 0.02) continue;
        const R = rr * maxR;
        const n = Math.max(26, Math.round(R * 0.16));
        ctx.fillStyle = PAL.lime;
        ctx.globalAlpha = Math.max(0, 0.8 - rr * 0.55);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2;
          const qx = cx + Math.cos(a) * R * 1.18;
          const qy = cy + Math.sin(a) * R * 0.82;
          ctx.fillRect(Math.floor(qx / CELL) * CELL, Math.floor(qy / CELL) * CELL, CELL - 1, CELL - 1);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  const visible = onScreen(section);
  function loop() {
    requestAnimationFrame(loop);
    if (!visible() || reducedMotion) return;
    frame();
  }
  size();
  if (reducedMotion) {
    for (let i = 0; i < 400; i++) {
      for (const st of stars) {
        st.d += st.s * 0.007;
        if (st.d >= 1) Object.assign(st, makeStar(false));
      }
    }
    frame();
    setMsg(MSGS[2]);
    lines.forEach((el) => el.classList.add("on"));
  }
  requestAnimationFrame(loop);
  addEventListener("resize", () => {
    if (Math.abs(canvas.offsetWidth - W) > 4) size();
  });
})();

/* ---------------------------------------------------------------
   FLOW FIGURES — one particle story per project
   pipeline: chaos → embed band → converge → answer burst
   ledger:   chaos → validate rows → commit lanes → settled grid
   seats:    racing threads → mutex funnel → seat grid → locked
   Rejects turn signal-red. Cursor stirs; click detonates.
   --------------------------------------------------------------- */
(function flowFigures() {
  const canvases = document.querySelectorAll(".work-canvas[data-flow]");
  if (!canvases.length) return;

  // shared scroll velocity: fast scrolling makes every flow rush
  let scrollVel = 0, lastScrollY = scrollY;
  addEventListener("scroll", () => {
    scrollVel += scrollY - lastScrollY;
    lastScrollY = scrollY;
  }, { passive: true });
  let speedK = 1;
  function tickVelocity() {
    scrollVel *= 0.88;
    speedK = 1 + Math.min(2.2, Math.abs(scrollVel) * 0.012);
    requestAnimationFrame(tickVelocity);
  }
  requestAnimationFrame(tickVelocity);

  canvases.forEach((canvas) => {
    const mode = canvas.dataset.flow;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(devicePixelRatio || 1, 2);
    const SCOLS = 9, SROWS = 6;
    let W = 0, H = 0, cell = 8;
    let parts = [], seats = null;
    let mx = -1e4, my = -1e4;
    let t = 0;

    function make(init) {
      const p = {
        x: init ? Math.random() * W : -20 - Math.random() * 80,
        y: H * 0.08 + Math.random() * H * 0.84,
        vx: 0.5 + Math.random() * 0.7,
        vy: 0,
        s: Math.random(),
        s2: Math.random(),
        st: 0,            // 0 flow · 1 reject · 2 locked seat
        a: 1,
        seat: -1,
        timer: 0,
      };
      if (mode === "seats") p.vx = 0.9 + Math.random() * 0.9;
      return p;
    }
    function respawn(p) { Object.assign(p, make(false)); }

    function size() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cell = W > 900 ? 8 : 7;
      const N = Math.round(Math.min(950, Math.max(360, W * 0.6)));
      parts = [];
      for (let i = 0; i < N; i++) parts.push(make(true));
      seats = new Array(SCOLS * SROWS).fill(-1);
    }

    function steer(p) {
      const z = p.x / W;

      if (p.st === 1) { // rejected: fall / bounce out, fading
        if (mode === "pipeline") { p.x += p.vx * 1.4; p.y += p.vy; p.vy += 0.02; p.a -= 0.008; }
        else if (mode === "ledger") { p.x += p.vx * 0.3; p.y += p.vy; p.vy += 0.12; p.a -= 0.006; }
        else { p.x += p.vx; p.y += p.vy; p.a -= 0.012; }
        if (p.a <= 0 || p.y > H + 30 || p.x > W + 40 || p.x < -80) respawn(p);
        return;
      }
      if (p.st === 2) { // seated & locked
        p.timer--;
        if (p.timer <= 0) { seats[p.seat] = -1; respawn(p); }
        return;
      }

      let ty = H * 0.5, k = 0.02, sp = p.vx;

      if (mode === "pipeline") {
        if (z < 0.26) { ty = H * 0.5 + Math.sin(p.s * 43 + t * 0.02 + p.x * 0.015) * H * 0.36; k = 0.008; }
        else if (z < 0.5) { ty = H * 0.36 + p.s * H * 0.24 + Math.sin(t * 0.01 + p.s * 20) * 4; k = 0.03; }
        else if (z < 0.74) {
          ty = H * 0.5 + (p.s - 0.5) * H * 0.16 * (1 - ((z - 0.5) / 0.24) * 0.8); k = 0.05;
          if (z > 0.7 && p.s2 < 0.085) { p.st = 1; p.vy = (p.s - 0.3) * 2.4; return; }
        } else { ty = H * 0.5 + (p.s - 0.5) * H * (0.24 + (z - 0.74) * 2.6); k = 0.04; sp = p.vx * 1.5; }
      }

      if (mode === "ledger") {
        if (z < 0.24) { ty = H * 0.5 + Math.sin(p.s * 39 + t * 0.016) * H * 0.34; k = 0.008; }
        else if (z < 0.5) {
          ty = H * (0.16 + 0.68 * Math.floor(p.s * 7) / 6); k = 0.06;
          if (z > 0.44 && p.s2 < 0.07) { p.st = 1; p.vy = 0.4; return; }
        }
        else if (z < 0.74) { ty = H * (0.3 + 0.2 * Math.floor(p.s * 3)); k = 0.05; }
        else { ty = H * (0.16 + 0.68 * Math.floor(p.s * 7) / 6); k = 0.08; sp = p.vx * 0.55; }
      }

      if (mode === "seats") {
        if (z < 0.3) { ty = H * 0.5 + Math.sin(p.s * 47 + t * 0.03) * H * 0.36; k = 0.01; sp = p.vx * 1.25; }
        else if (z < 0.52) {
          ty = H * 0.5 + (p.s - 0.5) * 10; k = 0.09; sp = 0.55 + p.s * 0.2;
          if (z > 0.46 && p.s2 < 0.1) { p.st = 1; p.vx = -(1 + p.s * 1.5); p.vy = (p.s - 0.5) * 1.6; return; }
        } else {
          if (p.seat < 0) {
            let idx = Math.floor(p.s * SCOLS * SROWS), tries = 0;
            while (seats[idx] >= 0 && tries < SCOLS * SROWS) { idx = (idx + 7) % (SCOLS * SROWS); tries++; }
            if (tries >= SCOLS * SROWS) { p.st = 1; p.vx = -(1.2 + p.s); p.vy = (p.s - 0.5) * 2; return; }
            seats[idx] = 1; p.seat = idx;
          }
          const sc = p.seat % SCOLS, sr = Math.floor(p.seat / SCOLS);
          const sx = W * (0.64 + 0.31 * sc / (SCOLS - 1));
          const sy = H * (0.16 + 0.68 * sr / (SROWS - 1));
          const dx = sx - p.x, dy = sy - p.y;
          if (Math.abs(dx) < 2 && Math.abs(dy) < 2) { p.st = 2; p.x = sx; p.y = sy; p.timer = 260 + p.s * 340; return; }
          p.x += dx * 0.06 + 0.2; p.y += dy * 0.06;
          return;
        }
      }

      p.vy += (ty - p.y) * k;
      p.vy *= 0.86;
      p.y += p.vy;
      p.x += sp * speedK;

      const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 4900) { const d = Math.sqrt(d2) || 1, f = (1 - d / 70) * 3.2; p.x += (dx / d) * f; p.y += (dy / d) * f; }

      if (p.x > W + 20) respawn(p);
      if (p.y < -30) p.y = -30;
      if (p.y > H + 30) p.y = H + 30;
    }

    function colorOf(p) {
      if (p.st === 1) return PAL.alert;
      if (p.st === 2) return PAL.lime;
      const z = p.x / W;
      if (mode === "seats") {
        if (z < 0.3) return PAL.cold;
        if (z < 0.52) return PAL.blue;
        return PAL.aqua;
      }
      if (z < 0.26) return PAL.cold;
      if (z < 0.5) return PAL.blue;
      if (z < 0.74) return PAL.aqua;
      return PAL.lime;
    }

    function frame() {
      t++;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        steer(p);
        if (p.a < 1) ctx.globalAlpha = Math.max(0, p.a);
        ctx.fillStyle = colorOf(p);
        ctx.fillRect(Math.floor(p.x / cell) * cell, Math.floor(p.y / cell) * cell, cell - 1, cell - 1);
        if (p.a < 1) ctx.globalAlpha = 1;
      }
    }

    const art = canvas.closest(".work-art") || canvas;
    art.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    });
    art.addEventListener("pointerleave", () => { mx = -1e4; my = -1e4; });
    art.addEventListener("pointerdown", (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      for (const p of parts) {
        if (p.st === 2) continue;
        const dx = p.x - x, dy = p.y - y, d2 = dx * dx + dy * dy;
        if (d2 < 14400) { const d = Math.sqrt(d2) || 1, f = (1 - d / 120) * 26; p.x += (dx / d) * f; p.y += (dy / d) * f; }
      }
    });

    const visible = onScreen(canvas);
    function loop() {
      requestAnimationFrame(loop);
      if (!visible() || reducedMotion) return;
      frame();
    }

    size();
    if (reducedMotion) { for (let i = 0; i < 700; i++) { t++; parts.forEach(steer); } frame(); }
    requestAnimationFrame(loop);
    addEventListener("resize", () => {
      const r = canvas.getBoundingClientRect();
      if (Math.abs(r.width - W) > 4) { size(); if (reducedMotion) { for (let i = 0; i < 700; i++) { t++; parts.forEach(steer); } frame(); } }
    });
  });
})();

/* ---------------------------------------------------------------
   PIXEL MARQUEE — giant type as multicolour cells, cursor smears
   --------------------------------------------------------------- */
(function marquee() {
  const canvas = document.getElementById("marqueeCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const PHRASE = "YES, I CAN BUILD THAT — ";
  const ROWS = 26;
  let W = 0, H = 0, cellM = 6, bit = null, bw = 0, off = 0;
  let mx = -1e4, my = -1e4;

  function build() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cellM = Math.max(4, Math.floor(H / ROWS));

    const o = document.createElement("canvas");
    const oc = o.getContext("2d");
    const fpx = ROWS - 5;
    oc.font = `700 ${fpx}px "PP Neue Montreal", "Inter Tight", sans-serif`;
    const mw = Math.ceil(oc.measureText(PHRASE).width);
    o.width = mw + 4; o.height = ROWS;
    oc.font = `700 ${fpx}px "PP Neue Montreal", "Inter Tight", sans-serif`;
    oc.textBaseline = "middle"; oc.fillStyle = "#000";
    oc.fillText(PHRASE, 2, ROWS / 2 + 1);
    const d = oc.getImageData(0, 0, o.width, ROWS).data;
    bw = o.width;
    bit = new Uint8Array(bw * ROWS);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < bw; x++)
        bit[y * bw + x] = d[(y * bw + x) * 4 + 3] > 120 ? 1 : 0;
  }

  function hcol(cx, cy) {
    const n = Math.sin(cx * 127.1 + cy * 311.7) * 43758.5453;
    const v = n - Math.floor(n);
    if (v < 0.58) return PAL.blue;
    if (v < 0.74) return PAL.cold;
    if (v < 0.88) return PAL.aqua;
    if (v < 0.97) return PAL.lime;
    return PAL.alert;
  }

  let lastSY = scrollY;
  let chomp = 0, bite = 0, crumbs = [];

  function frame() {
    if (!bit) return;
    ctx.clearRect(0, 0, W, H);
    if (!reducedMotion) {
      // base drift + scroll velocity coupling
      const sy = scrollY;
      const kick = Math.max(-1.4, Math.min(1.4, (sy - lastSY) * 0.03));
      lastSY = sy;
      off += 0.32 + kick;
      chomp += 0.17;
    }
    const colsVis = Math.ceil(W / cellM) + 1;
    const y0 = Math.floor((H - ROWS * cellM) / 2);

    /* Pac-Man parks at the far left and the type scrolls into his mouth.
       He's sized so the open jaw is about as tall as the capitals —
       R*2*sin(maxMouth) ≈ cap height — otherwise the letters look too
       big to swallow. */
    const pacR = cellM * 13;
    const pacCX = pacR + cellM * 1.5;
    const pacCY = y0 + (ROWS * cellM) / 2;
    const mouth = reducedMotion ? 0.5 : 0.06 + 0.88 * Math.abs(Math.sin(chomp));
    const CHEW = pacR * 1.3;                            // shredding zone

    for (let c = 0; c < colsVis; c++) {
      const sc = ((Math.floor(c + off) % bw) + bw) % bw;
      for (let r2 = 0; r2 < ROWS; r2++) {
        if (!bit[r2 * bw + sc]) continue;
        let x = c * cellM, y = y0 + r2 * cellM;
        if (x + cellM / 2 < pacCX) continue;            // already swallowed
        let col = hcol(sc, r2);

        // being chewed: the closer to the jaw, the more it shakes apart
        if (!reducedMotion) {
          const cdx = x - pacCX, cdy = y - pacCY;
          const cd = Math.hypot(cdx, cdy);
          if (cd < CHEW) {
            const bitten = 1 - cd / CHEW;
            if (Math.random() < bitten * 0.4) continue;  // torn off
            x += (Math.random() - 0.5) * bitten * cellM * 3;
            y += (Math.random() - 0.5) * bitten * cellM * 3;
            if (Math.random() < bitten * 0.7) col = Math.random() < 0.55 ? PAL.lime : PAL.alert;
          }
        }

        const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
        if (d2 < 6400) {
          const d = Math.sqrt(d2) || 1, f = 1 - d / 80;
          if (f > 0.72) continue;                       // knock cells out at the center
          x += (dx / d) * f * 20; y += (dy / d) * f * 20;
        }
        ctx.fillStyle = col;
        ctx.fillRect(x, y, cellM - 1, cellM - 1);
      }
    }

    // debris sprayed out of the jaw as it works
    if (!reducedMotion) {
      const b = Math.floor(chomp / Math.PI);
      const closing = b !== bite;
      if (closing) bite = b;
      const n = closing ? 7 : 2;                        // extra burst on each snap
      for (let i = 0; i < n; i++) {
        const a = (Math.random() - 0.5) * mouth * 2;
        crumbs.push({
          x: pacCX + Math.cos(a) * pacR * 0.85,
          y: pacCY + Math.sin(a) * pacR * 0.85,
          vx: 0.4 + Math.random() * 1.6,
          vy: (Math.random() - 0.5) * 2.6,
          a: 1,
          c: Math.random() < 0.5 ? PAL.lime : PAL.alert,
        });
      }
      crumbs = crumbs.filter((p) => p.a > 0);
      for (const p of crumbs) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.a -= 0.055;
        ctx.globalAlpha = Math.max(0, p.a);
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.floor(p.x / cellM) * cellM, Math.floor(p.y / cellM) * cellM, cellM - 1, cellM - 1);
      }
      ctx.globalAlpha = 1;
    }

    // the man himself, drawn on the same cell grid — and the cursor
    // shoves his pixels around exactly like it does the type
    const c0 = Math.floor((pacCX - pacR) / cellM), c1 = Math.ceil((pacCX + pacR) / cellM);
    const r0 = Math.floor((pacCY - pacR - y0) / cellM), r1 = Math.ceil((pacCY + pacR - y0) / cellM);
    for (let rr = r0; rr <= r1; rr++) {
      for (let cc = c0; cc <= c1; cc++) {
        let gx = cc * cellM, gy = y0 + rr * cellM;
        const ddx = gx + cellM / 2 - pacCX, ddy = gy + cellM / 2 - pacCY;
        if (Math.hypot(ddx, ddy) > pacR) continue;
        const isEye =
          Math.abs(ddx + cellM) < cellM * 1.2 &&
          Math.abs(ddy + pacR * 0.45) < cellM * 1.2;
        if (!isEye && Math.abs(Math.atan2(ddy, ddx)) < mouth) continue;  // open jaw
        const dx = gx - mx, dy = gy - my, d2 = dx * dx + dy * dy;
        if (d2 < 6400) {
          const d = Math.sqrt(d2) || 1, f = 1 - d / 80;
          if (f > 0.72) continue;                       // cursor punches through him
          gx += (dx / d) * f * 20; gy += (dy / d) * f * 20;
        }
        ctx.fillStyle = isEye ? PAL.bg : PAL.lime;
        ctx.fillRect(gx, gy, cellM - 1, cellM - 1);
      }
    }
  }

  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
  });
  canvas.addEventListener("pointerleave", () => { mx = -1e4; my = -1e4; });

  const visible = onScreen(canvas);
  function loop() {
    requestAnimationFrame(loop);
    if (!visible() || reducedMotion) return;
    frame();
  }
  function boot() { build(); frame(); requestAnimationFrame(loop); }
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('700 40px "Inter Tight"').then(() => document.fonts.ready).then(boot);
  } else boot();
  addEventListener("resize", () => { build(); frame(); });
})();

/* ---------------------------------------------------------------
   THE OBSERVER — two pixel eyes that track the cursor anywhere
   on the page. Heat-band irises, natural blinks, dilation on
   approach, idle wandering, wink on click.
   --------------------------------------------------------------- */
(function observer() {
  const canvas = document.getElementById("portraitCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const GW = 44;
  let W = 0, H = 0, cell = 8, GH = 58;
  let eyes = [];
  let mx = innerWidth / 2, my = innerHeight / 2, lastMove = 0;
  let wander = { x: 0, y: 0 }, wanderT = 0;
  let hover = false;
  let t = 0, nextBlink = 140;

  function size() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cell = W / GW;
    GH = Math.ceil(H / cell);
    const ew = 13, eh = 15;
    const cy = Math.round(GH * 0.42);
    eyes = [
      { cx: GW * 0.3, cy, ew, eh, px: 0, py: 0, lid: 0, blink: -1, wink: 0 },
      { cx: GW * 0.7, cy, ew, eh, px: 0, py: 0, lid: 0, blink: -1, wink: 0 },
    ];
  }

  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    lastMove = performance.now();
  });
  const wrap = canvas.closest(".about-portrait") || canvas;
  wrap.addEventListener("pointerenter", () => { hover = true; });
  wrap.addEventListener("pointerleave", () => { hover = false; });
  wrap.addEventListener("pointerdown", () => { eyes[0].wink = 26; });

  function drawEye(e) {
    const x0 = e.cx - e.ew / 2, y0 = e.cy - e.eh / 2;
    const pr = hover ? 2.7 : 2.1;
    for (let gy = 0; gy < e.eh; gy++) {
      for (let gx = 0; gx < e.ew; gx++) {
        const nx = ((gx + 0.5) / e.ew) * 2 - 1;
        const ny = ((gy + 0.5) / e.eh) * 2 - 1;
        if (Math.pow(Math.abs(nx), 2.6) + Math.pow(Math.abs(ny), 2.6) > 1) continue;
        const cx0 = x0 + gx, cy0 = y0 + gy;
        let col;
        if ((gy + 0.5) / e.eh < e.lid) {
          col = "#1d1e24"; // closed lid, barely lighter than the panel
        } else {
          const pdx = gx + 0.5 - (e.ew / 2 + e.px);
          const pdy = gy + 0.5 - (e.eh / 2 + e.py);
          const pd = Math.hypot(pdx, pdy);
          if (pd < pr * 0.55) col = PAL.lime;
          else if (pd < pr) col = PAL.aqua;
          else if (pd < pr + 1) col = PAL.blue;
          else {
            const h = Math.sin(cx0 * 127.1 + cy0 * 311.7) * 43758.5453;
            const v = h - Math.floor(h);
            col = v > 0.94 ? "#d9dad4" : PAL.paper;
          }
        }
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(cx0 * cell), Math.round(cy0 * cell), Math.ceil(cell) - 1, Math.ceil(cell) - 1);
      }
    }
  }

  function frame() {
    t++;
    if (t >= nextBlink) {
      eyes.forEach((e) => { e.blink = 0; });
      nextBlink = t + 140 + Math.random() * 260;
      if (Math.random() < 0.18) nextBlink = t + 30; // occasional double blink
    }
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(0, 0, W, H);

    const rect = canvas.getBoundingClientRect();
    const idle = performance.now() - lastMove > 4000;
    if (idle) {
      wanderT--;
      if (wanderT <= 0) {
        wander = { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 };
        wanderT = 60 + Math.random() * 100;
      }
    }

    for (const e of eyes) {
      if (e.blink >= 0) {
        e.blink++;
        e.lid = e.blink < 5 ? e.blink / 5 : Math.max(0, 1 - (e.blink - 5) / 5);
        if (e.blink > 10) e.blink = -1;
      } else e.lid = 0;
      if (e.wink > 0) {
        e.wink--;
        e.lid = Math.max(e.lid, e.wink > 18 ? (26 - e.wink) / 8 : Math.min(1, e.wink / 12));
      }

      const ex = rect.left + e.cx * cell, ey = rect.top + e.cy * cell;
      let dx, dy;
      if (idle) { dx = wander.x; dy = wander.y; }
      else {
        const a = Math.atan2(my - ey, mx - ex);
        const rr = Math.min(1, Math.hypot(mx - ex, my - ey) / 320);
        dx = Math.cos(a) * rr; dy = Math.sin(a) * rr;
      }
      const tx = dx * (e.ew / 2 - 3.4);
      const ty = dy * (e.eh / 2 - 3.9);
      e.px += (tx - e.px) * 0.14;
      e.py += (ty - e.py) * 0.14;
      drawEye(e);
    }
  }

  const visible = onScreen(canvas);
  function loop() {
    requestAnimationFrame(loop);
    if (!visible() || reducedMotion) return;
    frame();
  }
  size();
  frame(); // static first paint / reduced-motion state
  requestAnimationFrame(loop);
  addEventListener("resize", () => {
    const r = canvas.getBoundingClientRect();
    if (Math.abs(r.width - W) > 4) { size(); frame(); }
  });
})();

/* ---------------------------------------------------------------
   PIXEL SMILEY — blinks; scatters under the cursor
   --------------------------------------------------------------- */
(function smiley() {
  const canvas = document.getElementById("smiley");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const G = 16;
  let S = 84, cell = S / G, t = 0, hover = false;

  const cells = [];
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      let kind = 0;
      if (d <= 6) kind = 1;                     // face — lime
      else if (d <= 7.4) kind = 2;              // ring — blue
      if ([[5, 6], [10, 6]].some(([ex, ey]) => x === ex && y === ey)) kind = 3;  // eyes
      if ([[5, 10], [6, 11], [7, 11], [8, 11], [9, 11], [10, 10]].some(([sx, sy]) => x === sx && y === sy)) kind = 3; // mouth
      if ((x === 3 && y === 8) || (x === 12 && y === 8)) kind = 4;               // cheeks
      if (kind) cells.push({ x, y, kind, s: Math.random() });
    }
  }

  function size() {
    const r = canvas.getBoundingClientRect();
    S = r.width || 84;
    canvas.width = Math.round(S * DPR);
    canvas.height = Math.round(S * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cell = S / G;
  }

  function frame() {
    t++;
    ctx.clearRect(0, 0, S, S);
    const blink = !reducedMotion && (t % 240) < 14;
    for (const c of cells) {
      let { x, y } = c;
      let px = x * cell, py = y * cell;
      if (hover && !reducedMotion) {
        px += Math.sin(c.s * 87 + t * 0.3) * 3;
        py += Math.cos(c.s * 53 + t * 0.27) * 3;
      }
      let col =
        c.kind === 1 ? PAL.lime :
        c.kind === 2 ? PAL.blue :
        c.kind === 4 ? PAL.alert : PAL.ink;
      if (c.kind === 3 && c.y === 6 && blink) col = PAL.lime;
      ctx.fillStyle = col;
      ctx.fillRect(px, py, cell - 1, cell - 1);
    }
  }

  canvas.addEventListener("pointerenter", () => { hover = true; });
  canvas.addEventListener("pointerleave", () => { hover = false; });

  const visible = onScreen(canvas);
  function loop() {
    requestAnimationFrame(loop);
    if (!visible() || reducedMotion) return;
    frame();
  }
  size();
  frame();
  requestAnimationFrame(loop);
  addEventListener("resize", () => { size(); frame(); });
})();

/* ---------------------------------------------------------------
   SNAKE://RETRIEVAL — the about-section playground
   The snake is a heat trail: head lime, body cooling through
   aqua → ultramarine → cold. Eat paper context chunks; red
   hallucinations are fatal. Autopilot drives until you take over.
   --------------------------------------------------------------- */
(function snakeGame() {
  const canvas = document.getElementById("snakeCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const scoreEl = document.getElementById("playScore");
  const bestEl = document.getElementById("playBest");
  const modeEl = document.getElementById("playMode");

  let W = 0, H = 0, cell = 14, cols = 0, rows = 0;
  let snake = [], dir = { x: 1, y: 0 }, pendingDir = null, grow = 0;
  let food = null, corrupt = null, corruptTTL = 0;
  let score = 0, dead = false, manual = false;
  let tickMs = 115, acc = 0, lastT = 0;
  let burst = [];
  let best = +localStorage.getItem("snakeBest") || 0;

  function occ(x, y) { return snake.some((s) => s.x === x && s.y === y); }

  function spawnCell() {
    let p, guard = 0;
    do {
      p = { x: (Math.random() * cols) | 0, y: (Math.random() * rows) | 0 };
      guard++;
    } while ((occ(p.x, p.y) || (food && p.x === food.x && p.y === food.y)) && guard < 500);
    return p;
  }

  function updateHud() {
    scoreEl.textContent = "TOKENS " + String(score).padStart(4, "0");
    bestEl.textContent = "BEST " + String(best).padStart(4, "0");
    modeEl.textContent = dead
      ? "CRASHED — SPACE / TAP TO RETRY"
      : manual ? "" : "AUTOPILOT — ARROWS / SWIPE TO DRIVE";
    modeEl.style.display = modeEl.textContent ? "" : "none";
  }

  function reset(attract) {
    snake = [];
    const sx = (cols >> 1) - 2, sy = rows >> 1;
    for (let i = 0; i < 6; i++) snake.push({ x: sx - i, y: sy });
    dir = { x: 1, y: 0 }; pendingDir = null; grow = 0;
    food = spawnCell(); corrupt = null; corruptTTL = 0;
    score = 0; dead = false; tickMs = 115;
    if (attract) manual = false;
    updateHud();
  }

  function size() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cell = W > 720 ? 14 : 12;
    cols = Math.max(10, Math.floor(W / cell));
    rows = Math.max(8, Math.floor(H / cell));
    reset(!manual);
  }

  /* greedy autopilot: head toward the chunk, don't eat yourself */
  function autopilot() {
    const cand = [];
    const dx = food.x - snake[0].x, dy = food.y - snake[0].y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx) cand.push({ x: Math.sign(dx), y: 0 });
      if (dy) cand.push({ x: 0, y: Math.sign(dy) });
    } else {
      if (dy) cand.push({ x: 0, y: Math.sign(dy) });
      if (dx) cand.push({ x: Math.sign(dx), y: 0 });
    }
    cand.push(dir, { x: -dir.y, y: dir.x }, { x: dir.y, y: -dir.x });
    for (const c of cand) {
      if (c.x === -dir.x && c.y === -dir.y) continue;
      const nx = (snake[0].x + c.x + cols) % cols;
      const ny = (snake[0].y + c.y + rows) % rows;
      if (!occ(nx, ny) && !(corrupt && nx === corrupt.x && ny === corrupt.y)) return c;
    }
    return dir;
  }

  function die(nx, ny) {
    dead = true;
    for (let i = 0; i < 30; i++) {
      burst.push({
        x: nx * cell, y: ny * cell,
        vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7,
        a: 1, c: i % 3,
      });
    }
    updateHud();
    if (!manual) setTimeout(() => { if (!manual && dead) reset(true); }, 1600);
  }

  function step() {
    if (dead) return;
    if (!manual) dir = autopilot();
    else if (pendingDir) {
      if (!(pendingDir.x === -dir.x && pendingDir.y === -dir.y)) dir = pendingDir;
      pendingDir = null;
    }
    const nx = (snake[0].x + dir.x + cols) % cols;
    const ny = (snake[0].y + dir.y + rows) % rows;
    if (occ(nx, ny) || (corrupt && nx === corrupt.x && ny === corrupt.y)) { die(nx, ny); return; }
    snake.unshift({ x: nx, y: ny });
    if (nx === food.x && ny === food.y) {
      score += 10; grow += 2;
      food = spawnCell();
      if (score > best) { best = score; localStorage.setItem("snakeBest", best); }
      tickMs = Math.max(68, tickMs - 1.6);
      updateHud();
    }
    if (grow > 0) grow--; else snake.pop();
    if (corrupt) { corruptTTL--; if (corruptTTL <= 0) corrupt = null; }
    else if (score >= 20 && Math.random() < 0.02) { corrupt = spawnCell(); corruptTTL = 45; }
  }

  function draw(t) {
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(241, 242, 238, 0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= cols; x++) { ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, rows * cell); }
    for (let y = 0; y <= rows; y++) { ctx.moveTo(0, y * cell); ctx.lineTo(cols * cell, y * cell); }
    ctx.stroke();

    const pulse = 0.72 + 0.28 * Math.sin(t * 0.006);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = PAL.paper;
    ctx.fillRect(food.x * cell, food.y * cell, cell - 1, cell - 1);
    ctx.globalAlpha = 1;

    if (corrupt) {
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 0.02);
      ctx.fillStyle = PAL.alert;
      ctx.fillRect(corrupt.x * cell, corrupt.y * cell, cell - 1, cell - 1);
      ctx.globalAlpha = 1;
    }

    const n = snake.length;
    for (let i = 0; i < n; i++) {
      const s = snake[i], f = i / n;
      ctx.fillStyle = i === 0 ? PAL.lime : f < 0.3 ? PAL.aqua : f < 0.65 ? PAL.blue : PAL.cold;
      ctx.fillRect(s.x * cell, s.y * cell, cell - 1, cell - 1);
    }

    burst = burst.filter((b) => b.a > 0);
    for (const b of burst) {
      b.x += b.vx; b.y += b.vy; b.a -= 0.03;
      ctx.globalAlpha = Math.max(0, b.a);
      ctx.fillStyle = b.c === 0 ? PAL.alert : b.c === 1 ? PAL.lime : PAL.aqua;
      ctx.fillRect(b.x, b.y, cell * 0.5, cell * 0.5);
    }
    ctx.globalAlpha = 1;

    if (dead && manual) {
      ctx.fillStyle = "rgba(11, 13, 20, 0.6)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = PAL.paper;
      ctx.font = '500 16px "IBM Plex Mono", monospace';
      ctx.fillText("RUN TERMINATED", W / 2, H / 2 - 12);
      ctx.fillStyle = PAL.aqua;
      ctx.font = '400 11px "IBM Plex Mono", monospace';
      ctx.fillText("TOKENS " + String(score).padStart(4, "0") + " — SPACE / TAP TO RETRY", W / 2, H / 2 + 12);
    }
  }

  const visible = onScreen(canvas);
  function loop(t) {
    requestAnimationFrame(loop);
    if (!visible()) { lastT = t; return; }
    if (reducedMotion && !manual) { draw(t); lastT = t; return; }
    const dt = Math.min(100, t - lastT || 16);
    lastT = t;
    acc += dt;
    while (acc >= tickMs) { step(); acc -= tickMs; }
    draw(t);
  }

  const KEYMAP = {
    ArrowUp: [0, -1], KeyW: [0, -1],
    ArrowDown: [0, 1], KeyS: [0, 1],
    ArrowLeft: [-1, 0], KeyA: [-1, 0],
    ArrowRight: [1, 0], KeyD: [1, 0],
  };
  addEventListener("keydown", (e) => {
    if (!visible()) return;
    const m = KEYMAP[e.code];
    if (m) {
      if (e.code.startsWith("Arrow")) e.preventDefault();
      if (dead) reset(false);
      if (!manual) manual = true;
      pendingDir = { x: m[0], y: m[1] };
      updateHud();
    } else if ((e.code === "Space" || e.code === "Enter") && dead) {
      e.preventDefault();
      reset(false); manual = true; updateHud();
    }
  });
  canvas.addEventListener("pointerdown", () => {
    if (dead) { reset(false); manual = true; updateHud(); }
  });

  let tx = null, ty = null;
  canvas.addEventListener("touchstart", (e) => {
    const t0 = e.touches[0];
    tx = t0.clientX; ty = t0.clientY;
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (tx === null) return;
    const t0 = e.touches[0];
    const dx = t0.clientX - tx, dy = t0.clientY - ty;
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
    e.preventDefault();
    if (dead) reset(false);
    if (!manual) manual = true;
    pendingDir = Math.abs(dx) > Math.abs(dy)
      ? { x: Math.sign(dx), y: 0 }
      : { x: 0, y: Math.sign(dy) };
    updateHud();
    tx = t0.clientX; ty = t0.clientY;
  }, { passive: false });

  size();
  requestAnimationFrame(loop);
  addEventListener("resize", () => {
    const r = canvas.getBoundingClientRect();
    if (Math.abs(r.width - W) > 4) size();
  });
})();

/* ---------------------------------------------------------------
   SCRAMBLE TEXT
   --------------------------------------------------------------- */
(function scramble() {
  const CHARS = "▚▞#%&@$0123456789<>/\\|";
  const els = [];

  document.querySelectorAll(".scramble").forEach((el) => {
    const original = el.dataset.text
      ? el.dataset.text.replace(/&nbsp;/g, " ")
      : el.textContent;
    let timer = null;

    function run() {
      if (reducedMotion) return;
      let i = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        el.textContent = original
          .split("")
          .map((ch, idx) => {
            if (ch === " " || ch === " ") return ch;
            if (idx < i) return ch;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("");
        i += 1;
        if (i > original.length) {
          clearInterval(timer);
          el.textContent = original;
        }
      }, 35);
    }
    function stop() {
      clearInterval(timer);
      el.textContent = original;
    }

    el.addEventListener("mouseenter", run);
    el.addEventListener("mouseleave", stop);
    els.push({ el, run });
  });

  // decode-in once, the first time each one scrolls into view
  const seen = new WeakSet();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting || seen.has(e.target)) return;
      seen.add(e.target);
      const m = els.find((x) => x.el === e.target);
      if (m) setTimeout(m.run, 120);
      io.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  els.forEach(({ el }) => io.observe(el));
})();

/* ---------------------------------------------------------------
   CURSOR — crosshair + box + contextual label
   --------------------------------------------------------------- */
(function cursor() {
  const root = document.getElementById("cursor");
  if (!root || window.matchMedia("(hover: none)").matches) return;
  const h = root.querySelector(".cursor-h");
  const v = root.querySelector(".cursor-v");
  const px = document.getElementById("cursorPx");
  const pctx = px.getContext("2d");
  const label = document.getElementById("cursorLabel");
  const coords = document.getElementById("coords");

  /* pixel sprites — X is a filled cell, hx/hy is the hotspot */
  const SPRITES = {
    plus: { g: ["..X..", "..X..", "XXXXX", "..X..", "..X.."], hx: 2, hy: 2 },
    /* O = ink outline, X = fill. The outline is what makes it read as a
       cursor over the bright figure cells instead of a coloured smudge. */
    arrow: {
      g: [
        "O...........",
        "OXO.........",
        "OXXO........",
        "OXXXO.......",
        "OXXXXO......",
        "OXXXXXO.....",
        "OXXXXXXO....",
        "OXXXXXXXO...",
        "OXXXXXXXXO..",
        "OXXXXXXXXXO.",
        "OXXXXXXOOOOO",
        "OXXXOXXO....",
        "OXXO.OXXO...",
        "OXO..OXXO...",
        "OO....OXXO..",
        "......OOOO..",
      ],
      hx: 0, hy: 0,
    },
    diamond: { g: ["..X..", ".XXX.", "XXXXX", ".XXX.", "..X.."], hx: 2, hy: 2 },
    eye: {
      g: ["..XXX..", ".X...X.", "X..X..X", "X.XXX.X", "X..X..X", ".X...X.", "..XXX.."],
      hx: 3, hy: 3,
    },
    mail: {
      g: ["XXXXXXX", "XX...XX", "X.X.X.X", "X..X..X", "XXXXXXX"],
      hx: 3, hy: 2,
    },
    dot: { g: ["XX", "XX"], hx: 1, hy: 1 },
  };
  const CELL = 8;              // buffer px per sprite cell
  const CSSCELL = 3;           // 160px buffer shown at 60px CSS

  let curName = "dot", curColor = PAL.paper, phase = 0;

  /* The silhouette stays solid — only a couple of fill cells catch a
     highlight each beat, so it feels alive without dissolving. */
  function paint(name, color) {
    const s = SPRITES[name];
    if (!s) return;
    curName = name; curColor = color;
    pctx.clearRect(0, 0, px.width, px.height);
    for (let r = 0; r < s.g.length; r++) {
      for (let c = 0; c < s.g[r].length; c++) {
        const ch = s.g[r][c];
        if (ch === ".") continue;
        if (ch === "O") {
          pctx.fillStyle = PAL.ink;
        } else {
          const n = Math.sin((c * 12.9898 + r * 78.233 + phase) * 43758.5453);
          const v = n - Math.floor(n);
          pctx.fillStyle = v > 0.93 ? PAL.paper : color;
        }
        pctx.fillRect(c * CELL, r * CELL, CELL - 1, CELL - 1);
      }
    }
  }

  /* the sprite is chosen by whatever section the cursor is over */
  function spriteFor(el) {
    const sec = el && el.closest ? el.closest("section, footer, .marquee") : null;
    if (!sec) return ["dot", PAL.paper];
    if (sec.id === "hero") return ["plus", PAL.blueHi];
    if (sec.id === "warp") return ["diamond", PAL.aqua];
    if (sec.id === "works") return ["arrow", PAL.lime];
    if (sec.id === "about") return ["eye", PAL.blue];
    if (sec.id === "contact") return ["mail", PAL.aqua];
    if (sec.classList.contains("marquee")) return ["dot", PAL.lime];
    return ["dot", PAL.paper];
  }

  let lx = -1, ly = -1;          // pointer
  let sx = -1, sy = -1;          // sprite (lags behind, springy)
  let wantName = "dot", wantColor = PAL.paper, active = false;

  function place(x, y, el) {
    h.style.top = y + "px";
    v.style.left = x + "px";
    label.style.left = x + "px";
    label.style.top = y + "px";
    if (coords) {
      coords.textContent =
        String(x).padStart(4, "0") + " X · " + String(y).padStart(4, "0") + " Y";
    }

    const target = el && el.closest ? el.closest("[data-cursor], a, button") : null;
    const [name, color] = spriteFor(el);
    wantName = name;
    wantColor = target ? PAL.lime : color;
    active = !!target;
    if (target) {
      root.classList.add("active");
      label.textContent = target.dataset.cursor || "GO";
    } else {
      root.classList.remove("active");
      label.textContent = "";
    }
  }

  addEventListener("pointermove", (e) => {
    lx = e.clientX; ly = e.clientY;
    if (sx < 0) { sx = lx; sy = ly; }
    place(lx, ly, e.target);
  });

  // scrolling changes the section under a stationary cursor — re-evaluate
  addEventListener("scroll", () => {
    if (lx < 0) return;
    place(lx, ly, document.elementFromPoint(lx, ly));
  }, { passive: true });

  /* spring toward the pointer + shimmer beat */
  let beat = 0;
  function loop() {
    requestAnimationFrame(loop);
    if (lx < 0) return;
    const k = reducedMotion ? 1 : 0.24;
    sx += (lx - sx) * k;
    sy += (ly - sy) * k;

    if (!reducedMotion && ++beat % 5 === 0) {
      phase += 1.7;
      paint(wantName, wantColor);
    } else if (wantName !== curName || wantColor !== curColor) {
      paint(wantName, wantColor);
    }

    const s = SPRITES[wantName] || SPRITES.dot;
    // drift a hair toward the travel direction, so it feels dragged along
    const dx = (lx - sx) * 0.35, dy = (ly - sy) * 0.35;
    const scale = active ? 1.3 : 1;
    px.style.transform =
      `translate(${sx - s.hx * CSSCELL + dx}px, ${sy - s.hy * CSSCELL + dy}px) scale(${scale})`;
    px.style.transformOrigin = `${s.hx * CSSCELL}px ${s.hy * CSSCELL}px`;
  }
  requestAnimationFrame(loop);
})();

/* ---------------------------------------------------------------
   PIXEL FLOOD — click anywhere in ABOUT and the screen floods with
   heat cells from the click point, holds, then dissolves away.
   --------------------------------------------------------------- */
(function pixelFlood() {
  const canvas = document.getElementById("flood");
  const about = document.getElementById("about");
  if (!canvas || !about) return;
  const ctx = canvas.getContext("2d");

  const CELL = 14;
  let W = 0, H = 0, cols = 0, rows = 0, seed = null;
  let state = null;

  function size() {
    W = innerWidth; H = innerHeight;
    canvas.width = W; canvas.height = H;
    cols = Math.ceil(W / CELL) + 1;
    rows = Math.ceil(H / CELL) + 1;
    seed = new Float32Array(cols * rows);
    for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
  }
  size();
  addEventListener("resize", size);

  /* Choreography, lifted from the reference:
     CHARGE  — an orb swells at the cursor, concentric rings at its rim
     RUMBLE  — at saturation the whole field shudders
     WAVE2   — a second front sweeps through, flipping the body to red
     GLITCH  — the field shatters into red static and thins to nothing  */
  const CHARGE = 150, RUMBLE = 16, WAVE2 = 90, GLITCH = 52;
  const P = { CHARGE: 0, RUMBLE: 1, WAVE2: 2, HOLD: 3, GLITCH: 4 };

  function release() { if (state) state.held = false; }

  function start(x, y, touch) {
    // fresh dither each time so no two floods look alike
    for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
    state = { x, y, t: 0, ph: P.CHARGE, k: 0, held: true, touch };
    canvas.classList.add("on");
    haptic(10, 1);                       // the orb catches
  }

  /* Touch fires pointerdown the instant a finger lands, so a plain
     press would fire while scrolling. On touch we require a deliberate
     long press that hasn't drifted; any movement cancels it. Mouse
     keeps the immediate click. */
  const LONGPRESS = 300, DRIFT = 10, DRAG_OUT = 60;
  let armed = null;

  if (window.matchMedia("(hover: none)").matches) {
    const hint = document.querySelector(".about-flood-hint");
    if (hint) hint.textContent = "PRESS & HOLD ANYWHERE IN THIS SECTION — IT FLOODS THE SCREEN";
  }

  function disarm() {
    if (!armed) return;
    clearTimeout(armed.timer);
    armed = null;
  }

  about.addEventListener("pointerdown", (e) => {
    // the Observer winks and the playground is playable — neither should
    // get buried under a full-screen flood
    if (e.target.closest("a, button, .about-portrait, .playground")) return;
    if (reducedMotion) return;
    if (e.pointerType === "mouse") { start(e.clientX, e.clientY, false); return; }
    disarm();
    armed = { x: e.clientX, y: e.clientY };
    armed.timer = setTimeout(() => {
      if (armed) { start(armed.x, armed.y, true); armed = null; }
    }, LONGPRESS);
  });

  about.addEventListener("pointermove", (e) => {
    // a finger that travels is a scroll, not a press
    if (armed && Math.hypot(e.clientX - armed.x, e.clientY - armed.y) > DRIFT) disarm();
    // dragging well away after it opened drains it, so scrolling frees the screen
    if (state && state.held && state.touch &&
        Math.hypot(e.clientX - state.x, e.clientY - state.y) > DRAG_OUT) release();
  }, { passive: true });

  // let go anywhere and it drains
  addEventListener("pointerup", () => { disarm(); release(); });
  addEventListener("pointercancel", () => { disarm(); release(); });
  addEventListener("blur", () => { disarm(); release(); });
  addEventListener("scroll", disarm, { passive: true });

  function frame() {
    requestAnimationFrame(frame);
    if (!state) return;

    const maxR = Math.hypot(
      Math.max(state.x, W - state.x),
      Math.max(state.y, H - state.y)
    );
    const s = state;
    s.t++; s.k++;

    /* advance the choreography */
    if (s.ph === P.CHARGE) {
      // letting go before it saturates skips straight to the shatter
      if (!s.held) { s.ph = P.GLITCH; s.k = 0; haptic([12, 18, 12, 18, 34], 4); }
      else if (s.k >= CHARGE) { s.ph = P.RUMBLE; s.k = 0; haptic([26, 30, 26, 30, 46], 3); }
    } else if (s.ph === P.RUMBLE) {
      if (s.k >= RUMBLE) { s.ph = P.WAVE2; s.k = 0; haptic(20, 1); }
    } else if (s.ph === P.WAVE2) {
      // let the second wave finish sweeping even if released mid-way
      if (s.k >= WAVE2) { s.ph = P.HOLD; s.k = 0; haptic(14, 1); }
    } else if (s.ph === P.HOLD) {
      // sits fully taken over until the button comes up
      if (!s.held) { s.ph = P.GLITCH; s.k = 0; haptic([12, 18, 12, 18, 34], 4); }
    } else if (s.ph === P.GLITCH && s.k >= GLITCH) {
      state = null;
      canvas.classList.remove("on");
      ctx.clearRect(0, 0, W, H);
      return;
    }

    const ease = (u) => 1 - Math.pow(1 - Math.min(1, u), 3);
    // orb swells the whole time it's held, saturating right at the end
    const grow = s.ph === P.CHARGE
      ? ease(s.k / CHARGE) * maxR * 1.05
      : maxR * 1.05;
    // second front sweeps once the field has saturated, then stays put
    const grow2 =
      s.ph === P.WAVE2 ? ease(s.k / WAVE2) * maxR * 1.05 :
      (s.ph === P.HOLD || s.ph === P.GLITCH) ? maxR * 1.05 : -1;
    const boil = s.t * 0.05;

    /* It shudders from saturation onward and keeps rattling for as long
       as the button is down — the shaking only stops when you let go. */
    let shx = 0, shy = 0;
    const amp =
      s.ph === P.RUMBLE ? CELL * 2.2 :
      s.ph === P.WAVE2 ? CELL * 0.9 :
      s.ph === P.HOLD ? CELL * 0.95 : 0;
    if (amp) {
      // a driven vibration with noise on top, rather than pure jitter
      shx = (Math.sin(s.t * 1.9) * 0.55 + (Math.random() - 0.5)) * amp;
      shy = (Math.cos(s.t * 2.3) * 0.55 + (Math.random() - 0.5)) * amp;
    }

    const gk = s.ph === P.GLITCH ? s.k / GLITCH : 0;

    ctx.clearRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = r * cols + c;
        const x = c * CELL, y = r * CELL;
        const d = Math.hypot(x + CELL / 2 - s.x, y + CELL / 2 - s.y);
        // dithered leading edge so the front reads organic, not circular
        if (d - seed[id] * CELL * 3.4 > grow) continue;

        let col;
        if (s.ph === P.GLITCH) {
          /* shatter: the field breaks into static that thins to nothing,
             carrying the same violet/blue it had when it broke */
          if (Math.random() < gk * 1.15) continue;
          const v = Math.random();
          col = v > 0.95 ? PAL.cold : v > 0.88 ? PAL.aqua
              : v > 0.6 ? PAL.violet : v > 0.3 ? PAL.indigo : PAL.sky;
        } else {
          /* Colour rides the FRONT, not the radius: a navy vanguard leads,
             then blue, aqua and a thin red, with a solid body behind. */
          const edge = grow - d + Math.sin(boil + seed[id] * 6.283) * CELL * 0.9;
          if (edge < CELL * 3.5) col = PAL.cold;
          else if (edge < CELL * 7) col = PAL.blue;
          else if (edge < CELL * 10.5) col = PAL.aqua;
          else if (edge < CELL * 13.5) col = PAL.alert;
          else col = seed[id] > 0.99 ? PAL.aqua : PAL.lime;

          /* Second wave repaints the body behind an aqua-edged front —
             a dithered violet→light-blue ramp, purple at the core cooling
             out toward the rim, so it stays in the site's register. */
          if (grow2 >= 0 && d - seed[id] * CELL * 3.4 < grow2) {
            const e2 = grow2 - d;
            if (e2 < CELL * 3) col = PAL.cold;
            else if (e2 < CELL * 5.5) col = PAL.aqua;
            else {
              /* three concentric bands so it reads as an even orb —
                 purple core, indigo shoulder, light-blue rim. The dither
                 is kept small so the rings stay legible as rings. */
              const q = d / maxR + (seed[id] - 0.5) * 0.1
                + Math.sin(boil * 0.5 + seed[id] * 6.283) * 0.02;
              col = q < 0.3 ? PAL.violet : q < 0.58 ? PAL.indigo : PAL.sky;
              if (seed[id] > 0.991) col = PAL.aqua;
            }
          }
        }
        ctx.fillStyle = col;
        ctx.fillRect(x + shx, y + shy, CELL - 1, CELL - 1);
      }
    }
  }
  requestAnimationFrame(frame);
})();

/* ---------------------------------------------------------------
   SCROLL FRAMES — scroll-scrubbed cinematography
   The hero zooms out behind you; each project's title slides in
   and its figure wipes open like a frame, driven by scroll.
   --------------------------------------------------------------- */
(function scrollFrames() {
  if (reducedMotion) return;
  const heroCanvas = document.getElementById("field");
  const works = [...document.querySelectorAll(".work")].map((el, i) => ({
    title: el.querySelector(".work-title"),
    art: el.querySelector(".work-art"),
    no: el.querySelector(".work-no"),
    el,
    dirn: i % 2 ? 1 : -1,
  }));

  let ticking = false;
  function update() {
    ticking = false;
    const vh = innerHeight;

    // hero: zoom through the field as it leaves
    if (heroCanvas) {
      const f = Math.max(0, Math.min(1, scrollY / vh));
      heroCanvas.style.transform = `scale(${1 + f * 0.35})`;
      heroCanvas.style.opacity = String(1 - f * 0.85);
    }

    for (const w of works) {
      const r = w.el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.6)));
      const e = 1 - Math.pow(1 - p, 3);
      if (w.title) {
        w.title.style.transform =
          `translateX(${(1 - e) * w.dirn * 90}px) skewX(${(1 - e) * w.dirn * -7}deg)`;
        w.title.style.opacity = String(0.1 + e * 0.9);
      }
      if (w.no) w.no.style.transform = `translateY(${(1 - e) * 34}px)`;
      if (w.art) {
        // the wipe tracks the figure itself, so it opens as you reach it
        const ar = w.art.getBoundingClientRect();
        const pa = Math.max(0, Math.min(1, (vh - ar.top) / (vh * 0.55)));
        const ea = 1 - Math.pow(1 - pa, 3);
        w.art.style.clipPath = w.dirn < 0
          ? `inset(0 ${(1 - ea) * 100}% 0 0)`
          : `inset(0 0 0 ${(1 - ea) * 100}%)`;
      }
    }
  }
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  addEventListener("resize", update);
  update();
})();

/* ---------------------------------------------------------------
   CLOCK + DATE + YEAR
   --------------------------------------------------------------- */
(function chrono() {
  const clock = document.getElementById("clock");
  const heroDate = document.getElementById("heroDate");
  const year = document.getElementById("year");

  function update() {
    const now = new Date();
    clock.textContent = now.toISOString().slice(11, 19) + " UTC";
  }
  update();
  setInterval(update, 1000);

  const now = new Date();
  heroDate.textContent = now.toISOString().slice(0, 10).replace(/-/g, ".");
  year.textContent = now.getFullYear();
})();

/* ---------------------------------------------------------------
   REVEAL ON SCROLL
   --------------------------------------------------------------- */
(function reveal() {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
