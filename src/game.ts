import { reveal, mountGiftInPlaceOfGate } from './gift.js';

// ---------- CONFIGURACIÓN ----------
const GAME_CFG = {
  grid: 20,
  canvasSize: 480,
  initialSpeedMs: 180,
  speedGainMs: 12,
  minSpeedMs: 60,
  timeLimit: 24,
  itemsGoal: 11,
};

/*** ====== AUDIO: Web Audio para 11 notas ====== ***/
let audioCtx: AudioContext | null = null;

function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// Convierte nota tipo 'C4', 'G#4' a frecuencia
const A4 = 440;
const NOTE_INDEX: Record<string, number> = {
  'C': -9, 'C#': -8, 'Db': -8, 'D': -7, 'D#': -6, 'Eb': -6,
  'E': -5, 'F': -4, 'F#': -3, 'Gb': -3, 'G': -2, 'G#': -1, 'Ab': -1,
  'A': 0, 'A#': 1, 'Bb': 1, 'B': 2
};
function noteToFreq(note: string): number {
  // Ej: 'G#4' o 'Bb3'
  const m = note.match(/^([A-G][b#]?)(\d)$/);
  
  if (!m) throw new Error(`Nota inválida: ${note}`);
  const [, pitch, octaveStr] = m;
  const octave = parseInt(octaveStr as string, 10);

  if(pitch != undefined && NOTE_INDEX[pitch]) {
    const semisFromA4 = NOTE_INDEX[pitch] + (octave - 4) * 12;
    return A4 * Math.pow(2, semisFromA4 / 12);
  }
  return 0;
}

// 🔔 SECUENCIA DE 11 NOTAS (EDITABLE)
// Sustituye por las notas exactas de tu intro; esto es un ejemplo aproximado:
const INTRO_NOTES: string[] = [
  'G4','F#4','B4','E4','D4','G4','C4','B4','E4','A#4','D4'
];
// Duraciones en milisegundos (puedes ajustar si alguna debe ser más larga/corta)
const INTRO_DUR_MS = 320; // duración base por nota

function playNote(freq: number, durMs = INTRO_DUR_MS) {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  const t1 = t0 + durMs / 1000;

  // Osc + envolvente
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 2800;

  osc.type = 'triangle'; // suena más “pianito” que sine puro
  osc.frequency.value = freq;

  // ataque/decay cortito para evitar clics
  const g = gain.gain;
  g.setValueAtTime(0.0001, t0);
  g.linearRampToValueAtTime(0.8, t0 + 0.01);
  g.exponentialRampToValueAtTime(0.0001, t1);

  osc.connect(gain);
  gain.connect(lowpass);
  lowpass.connect(audioCtx.destination);

  osc.start(t0);
  osc.stop(t1 + 0.02);
}

// Llama esto cuando coma el i-ésimo ítem (i empieza en 1)
function playIntroStep(stepIndex: number) {
  try {
    const idx = stepIndex - 1;
    if (idx >= 0 && idx < INTRO_NOTES.length) {
      const f = noteToFreq(INTRO_NOTES[idx] as any);
      playNote(f);
    }
  } catch (e) {
    console.warn(e);
  }
}

type Cell = { x: number; y: number; };
type Dir = 'up' | 'down' | 'left' | 'right';

// ---------- DOM ----------
const gateEl = document.getElementById('gate') as HTMLElement;
const canvas = document.getElementById('snake') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const startBtn = document.getElementById('startGame') as HTMLButtonElement;
const retryBtn = document.getElementById('retryGame') as HTMLButtonElement;
const timeEl = document.getElementById('time') as HTMLSpanElement;
const itemsEl = document.getElementById('items') as HTMLSpanElement;
const itemsGoalEl = document.getElementById('itemsGoal') as HTMLSpanElement;
const statusMsg = document.getElementById('statusMsg') as HTMLParagraphElement;

itemsGoalEl.textContent = String(GAME_CFG.itemsGoal);

// ---------- ESTADO ----------
let snake: Cell[] = [];
let dir: Dir = 'right';
let nextDir: Dir = 'right';
let apple: Cell = { x: 10, y: 10 };
let items = 0;
let timeLeft = GAME_CFG.timeLimit;
let tickMs = GAME_CFG.initialSpeedMs;
let loopId: number | null = null;
let countdownId: number | null = null;
let running = false;

// ---------- UTILS ----------
function rndCell(max: number): number {
  return Math.floor(Math.random() * max);
}
function cellsEqual(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}
function placeApple() {
  do {
    apple = { x: rndCell(GAME_CFG.grid), y: rndCell(GAME_CFG.grid) };
  } while (snake.some(s => cellsEqual(s, apple)));
}

// ---------- CICLO ----------
function resetGame() {
  const mid = Math.floor(GAME_CFG.grid / 2);
  snake = [{ x: mid - 1, y: mid }, { x: mid - 2, y: mid }];
  dir = 'right';
  nextDir = 'right';
  items = 0;
  timeLeft = GAME_CFG.timeLimit;
  tickMs = GAME_CFG.initialSpeedMs;
  placeApple();
  timeEl.textContent = String(timeLeft);
  itemsEl.textContent = String(items);
  statusMsg.textContent = '';
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cs = canvas.width / GAME_CFG.grid;

  // grid suave
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < GAME_CFG.grid; i++) {
    for (let j = 0; j < GAME_CFG.grid; j++) {
      ctx.fillRect(i * cs, j * cs, cs - 1, cs - 1);
    }
  }
  ctx.globalAlpha = 1;

  // manzana
  ctx.fillStyle = '#b71c1c';
  ctx.fillRect(apple.x * cs, apple.y * cs, cs, cs);

  // serpiente
  ctx.fillStyle = '#ffffff';
  snake.forEach((c, idx) => {
    ctx.globalAlpha = idx === 0 ? 1 : 0.9;
    ctx.fillRect(c.x * cs, c.y * cs, cs, cs);
  });
  ctx.globalAlpha = 1;
}

function step() {
  dir = nextDir;

  const head0 = snake[0];
  if (!head0) return gameOver(false);

  const head: Cell = { x: head0.x, y: head0.y };
  if (dir === 'up') head.y -= 1;
  if (dir === 'down') head.y += 1;
  if (dir === 'left') head.x -= 1;
  if (dir === 'right') head.x += 1;

  // colisiones
  if (head.x < 0 || head.y < 0 || head.x >= GAME_CFG.grid || head.y >= GAME_CFG.grid) {
    return gameOver(false);
  }
  if (snake.some(c => cellsEqual(c, head))) {
    return gameOver(false);
  }

  // mover
  snake.unshift(head);

  // comer
  if (cellsEqual(head, apple)) {
    items++;
    itemsEl.textContent = String(items);
    playIntroStep(items);
    placeApple();

    tickMs = Math.max(GAME_CFG.minSpeedMs, tickMs - GAME_CFG.speedGainMs);
    if (loopId !== null) clearInterval(loopId);
    loopId = window.setInterval(step, tickMs);

    if (items >= GAME_CFG.itemsGoal) return gameOver(true);
  } else {
    snake.pop();
  }

  draw();
}

function startLoop() {
  if (loopId !== null) clearInterval(loopId);
  loopId = window.setInterval(step, tickMs);
}
function stopLoop() {
  if (loopId !== null) clearInterval(loopId);
  loopId = null;
}

function startCountdown() {
  if (countdownId !== null) clearInterval(countdownId);
  timeEl.textContent = String(timeLeft);
  countdownId = window.setInterval(() => {
    timeLeft--;
    timeEl.textContent = String(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(countdownId!);
      countdownId = null;
      gameOver(false);
    }
  }, 1000);
}
function stopCountdown() {
  if (countdownId !== null) clearInterval(countdownId);
  countdownId = null;
}

function gameOver(win: boolean) {
  running = false;
  stopLoop();
  stopCountdown();

  if (win) {
    statusMsg.textContent = '¡Lo lograste! Desbloqueando la sorpresa…';

    // Reemplaza juego por regalo en el DOM
    mountGiftInPlaceOfGate();

  } else {
    statusMsg.textContent = '¡Ups! Se acabó el tiempo o chocaste. Pulsa "Reintentar".';
    retryBtn.hidden = false;
  }
}

function startGame() {
    if (running) return;
    running = true;
    ensureAudioCtx();
    retryBtn.hidden = true;
    resetGame();
    draw();
    startCountdown();
    startLoop();
  }

// ---------- INPUT ----------
window.addEventListener('keydown', (e) => {
  if (!running) return;
  const k = e.key.toLowerCase();
  if ((k === 'arrowup' || k === 'w') && dir !== 'down') nextDir = 'up';
  if ((k === 'arrowdown' || k === 's') && dir !== 'up') nextDir = 'down';
  if ((k === 'arrowleft' || k === 'a') && dir !== 'right') nextDir = 'left';
  if ((k === 'arrowright' || k === 'd') && dir !== 'left') nextDir = 'right';
});

// ---------- INIT ----------
(function initGate() {
  canvas.width = GAME_CFG.canvasSize;
  canvas.height = GAME_CFG.canvasSize;
  resetGame();
  draw();
  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
})();



