// ---------- TIPOS ----------
export type Ticket = {
  band: string;
  tour: string;
  city: string;
  venue: string;
  date: string;
  sector: string;
  seat: string;
  code: string;
  pdfUrl: string;
};

// ---------- DOM ----------
const revealBtn = document.getElementById("revealBtn") as HTMLButtonElement;
const ticketsEl = document.getElementById("tickets") as HTMLElement;
const yt = document.getElementById("yt") as HTMLIFrameElement;
const gateEl = document.getElementById("gate") as HTMLElement;
const giftEl = document.getElementById("gift") as HTMLElement;
const posterEl = document.getElementById("poster") as HTMLElement;
type ConfettiOptions = {
  durationMs?: number;
  particles?: number;
  colors?: string[];
};
type BoltsOptions = {
  durationMs?: number;
  bolts?: number;
  waves?: number;
  colorCore?: string;
  colorGlow?: string;
};

let isRevealing = false;
function disableRevealBtn(btn: HTMLButtonElement) {
  btn.disabled = true;
  btn.setAttribute('aria-disabled', 'true');
  btn.classList.add('is-disabled');
  // opcional: feedback de estado
  btn.textContent = 'Cargando…';
}

function enableRevealBtn(btn: HTMLButtonElement) {
  btn.disabled = false;
  btn.setAttribute('aria-disabled', 'false');
  btn.classList.remove('is-disabled');
}
// ---------- AUDIO ----------
function playYouTube() {
  yt.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func: "playVideo", args: [] }),
    "*"
  );
}

// ---------- DATA ----------
async function loadTickets(): Promise<Ticket[]> {
  const res = await fetch("/tickets.json");
  if (!res.ok) throw new Error("No se pudieron cargar las entradas");
  return res.json() as Promise<Ticket[]>;
}

function ticketCard(t: Ticket): string {
  const date = new Date(t.date);
  const when = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  return `
      <article class="ticket fade-in">
        <header>${t.band} — ${t.tour}</header>
        <div class="meta">
          <div>${t.city} · ${t.venue}</div>
          <div>${when}</div>
          <div class="seat">${t.sector} · ${t.seat}</div>
        </div>
        <div class="code">${t.code}</div>
        <div class="actions hidden">
          <a class="download" href="${t.pdfUrl}" download target="_blank" rel="noopener noreferrer">
            Aquí tus entradas
          </a>
        </div>
      </article>`;
}

// ---------- REVEAL ----------
export async function reveal(): Promise<void> {
  // 1) Música al click (gesto usuario)
  playYouTube();

  // 2) Lanza la carga en paralelo (NO esperamos aún)
  const dataPromise = loadTickets();

  // 3) Arranca los temporizadores desde el clic
  const startRevealDelay = 63000;
  const showDownloadsDelay = 46000;

  const revealTimer = setTimeout(async () => {
    const data = await dataPromise;

    ticketsEl.innerHTML = data.map(ticketCard).join("");
    ticketsEl.hidden = false;

    setTimeout(() => {
      launchConfetti({
        durationMs: 5000,
        particles: 260,
        colors: ["#ffffff", "#b71c1c"],
      });
    }, 3500);
    document.body.classList.add("revealed");
    if (posterEl) {
      posterEl.hidden = false;
      // aseguramos que la transición corre (reflow)
      requestAnimationFrame(() => posterEl.classList.add("visible"));
    }

    if (revealBtn) {
      revealBtn.classList.add("fading");
      setTimeout(() => revealBtn.remove(), 700);
    }

    const linksTimer = setTimeout(() => {
      const hidden = document.querySelectorAll<HTMLElement>(".actions.hidden");
      launchBolts({
        durationMs: 1110,
        bolts: 6, // nº de rayos simultáneos por oleada
        waves: 3, // nº de “oleadas” (secuencias)
        colorCore: "#ffffff",
        colorGlow: "#b71c1c",
      });
      hidden.forEach((el) => el.classList.remove("hidden"));
    }, showDownloadsDelay);

    (window as any)._revealTimers = { revealTimer, linksTimer };
  }, startRevealDelay);

  (window as any)._revealTimers = { revealTimer };
}

// ---------- SWAP (reemplazar juego por regalo) ----------
export function mountGiftInPlaceOfGate(): void {
  if (gateEl.parentElement) {
    giftEl.hidden = false;
    gateEl.parentElement.replaceChild(giftEl, gateEl);
  } else {
    gateEl.remove();
    giftEl.hidden = false;
    document.body.appendChild(giftEl);
  }

  giftEl.classList.remove("visible");
  void giftEl.offsetWidth;
  giftEl.classList.add("visible");
  document.body.classList.add("revealing");
}

// ---------- INIT (binding del botón) ----------
function onClickReveal() {
  if (isRevealing) return;                // guard para dobles clics
  if (!revealBtn) return;

  isRevealing = true;
  disableRevealBtn(revealBtn);

  // Música justo al click (gesto de usuario)
  try { playYouTube(); } catch {}

  // Arranca el flujo de revelado
  reveal()
    .catch((err) => {
      console.error('Reveal failed:', err);
      // si algo peta, vuelve a habilitar para reintentar
      isRevealing = false;
      enableRevealBtn(revealBtn);
    });
}

(function initGift() {
  // oculto al cargar; el juego lo mostrará cuando ganes
  giftEl.hidden = true;
  revealBtn?.addEventListener("click", onClickReveal);
})();

function launchConfetti(opts: ConfettiOptions = {}): void {
  // respeta reduce motion
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const durationMs = opts.durationMs ?? 4000;
  const total = opts.particles ?? 220;
  const colors = opts.colors ?? ["#ffffff", "#b71c1c"];

  // crea canvas
  let canvas = document.getElementById(
    "confettiCanvas"
  ) as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "confettiCanvas";
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d")!;
  const DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2)); // cap para móviles
  const resize = () => {
    canvas!.width = Math.floor(window.innerWidth * DPR);
    canvas!.height = Math.floor(window.innerHeight * DPR);
  };
  resize();
  const onResize = () => {
    resize();
  };
  window.addEventListener("resize", onResize);

  // partículas
  type P = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    g: number;
    w: number;
    h: number;
    rot: number;
    vr: number;
    color: string;
    alpha: number;
  };
  const rnd = (min: number, max: number) => Math.random() * (max - min) + min;

  const parts: P[] = Array.from({ length: total }, (): P => {
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft
      ? rnd(0, window.innerWidth * 0.35)
      : rnd(window.innerWidth * 0.65, window.innerWidth);
    const y = -rnd(10, 120);
    const color = colors[Math.floor(Math.random() * colors.length)] ?? "#fff"; // <-- aquí la corrección

    return {
      x: x * DPR,
      y: y * DPR,
      vx: rnd(-0.6, 0.6) * DPR,
      vy: rnd(0.8, 2.0) * DPR,
      g: rnd(0.015, 0.04) * DPR,
      w: rnd(4, 10) * DPR,
      h: rnd(8, 16) * DPR,
      rot: rnd(0, Math.PI * 2),
      vr: rnd(-0.15, 0.15),
      color, // ahora garantizado string
      alpha: 1,
    };
  });

  let start = performance.now();
  let raf = 0;

  const draw = (t: number) => {
    const elapsed = t - start;
    const progress = Math.min(1, elapsed / durationMs);

    ctx.clearRect(0, 0, canvas!.width, canvas!.height);

    for (const p of parts) {
      // actualizar física
      p.vy += p.g;
      p.x += p.vx * (1 - 0.15 * progress); // ligera frenada con el tiempo
      p.y += p.vy;
      p.rot += p.vr;

      // desvanecer hacia el final
      p.alpha = 1 - progress;

      // dibujar “confeti rectángulo”
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (progress < 1) {
      raf = requestAnimationFrame(draw);
    } else {
      // limpieza
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas?.remove();
    }
  };

  raf = requestAnimationFrame(draw);
}
function launchBolts(opts: BoltsOptions = {}): void {
  // respeta reduce motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const durationMs = opts.durationMs ?? 1600;
  const boltsPerWave = opts.bolts ?? 3;
  const waves = opts.waves ?? 2;
  const colorCore = opts.colorCore ?? "#ffffff";
  const colorGlow = opts.colorGlow ?? "#b71c1c";

  // crea canvas (o reutiliza si ya existe)
  let canvas = document.getElementById(
    "boltsCanvas"
  ) as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "boltsCanvas";
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d")!;
  const DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const resize = () => {
    canvas!.width = Math.floor(window.innerWidth * DPR);
    canvas!.height = Math.floor(window.innerHeight * DPR);
  };
  resize();
  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  // Generador de un camino dentado (polilínea) entre dos puntos
  function makeBoltPath(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    segs = 24
  ): Array<{ x: number; y: number }> {
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      // jitter lateral: más fuerte a mitad de camino
      const amp = 18 * DPR * (1 - Math.abs(t - 0.5) * 2);
      const nx = x + (Math.random() - 0.5) * amp;
      const ny = y + (Math.random() - 0.5) * amp * 0.6;
      pts.push({ x: nx, y: ny });
    }
    return pts;
  }

  // Dibuja un rayo con glow (trazo grueso difuso + núcleo fino)
  function strokeBolt(path: Array<any>, alpha: number) {
    if (path.length < 2) return;

    // halo
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha * 0.6);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = colorGlow;
    ctx.lineWidth = 6 * DPR;
    ctx.shadowColor = colorGlow;
    ctx.shadowBlur = 18 * DPR;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.restore();

    // núcleo
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = colorCore;
    ctx.lineWidth = 2.2 * DPR;
    ctx.shadowColor = colorCore;
    ctx.shadowBlur = 6 * DPR;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.restore();
  }

  // Prepara oleadas: cada oleada genera N rayos y se desvanece
  const waveDuration = durationMs / waves;
  const boltsPerWaveArr: Array<{
    start: number;
    end: number;
    paths: Array<Array<{ x: number; y: number }>>;
  }> = [];

  const W = () => canvas!.width;
  const H = () => canvas!.height;

  for (let wv = 0; wv < waves; wv++) {
    const start = wv * waveDuration;
    const end = start + waveDuration;
    const paths: Array<Array<{ x: number; y: number }>> = [];
    for (let i = 0; i < boltsPerWave; i++) {
      // inicio aleatorio por arriba
      const x0 = (0.15 + Math.random() * 0.7) * W();
      const y0 = 0.05 * H();
      // fin aleatorio ~ mitad inferior
      const x1 = x0 + (Math.random() - 0.5) * 0.25 * W();
      const y1 = (0.55 + Math.random() * 0.35) * H();
      paths.push(makeBoltPath(x0, y0, x1, y1));
    }
    boltsPerWaveArr.push({ start, end, paths });
  }

  let startTs = performance.now();
  let raf = 0;

  const tick = (now: number) => {
    const t = now - startTs;
    ctx.clearRect(0, 0, canvas!.width, canvas!.height);

    // dibuja cada oleada con alpha según progreso local
    for (const wave of boltsPerWaveArr) {
      const { start, end, paths } = wave;
      if (t < start) continue;
      if (t > end) continue;
      const local = (t - start) / (end - start); // 0..1
      // pico de brillo en mitad de la oleada, luego cae
      const alpha = 1 - Math.abs(local * 2 - 1); // triangulo 0→1→0
      for (const p of paths) strokeBolt(p, alpha);
    }

    if (t < durationMs) {
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas?.remove();
    }
  };

  raf = requestAnimationFrame(tick);
}
