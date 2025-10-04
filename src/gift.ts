// ---------- TIPOS ----------
export type Ticket = {
    band: string; tour: string; city: string; venue: string;
    date: string; sector: string; seat: string; code: string;
    pdfUrl: string;
  };
  
  // ---------- DOM ----------
  const revealBtn = document.getElementById('revealBtn') as HTMLButtonElement;
  const ticketsEl = document.getElementById('tickets') as HTMLElement;
  const yt = document.getElementById('yt') as HTMLIFrameElement;
  const gateEl = document.getElementById('gate') as HTMLElement;
  const giftEl = document.getElementById('gift') as HTMLElement;
  const posterEl = document.getElementById('poster') as HTMLElement;
  // ---------- AUDIO ----------
  function playYouTube() {
    yt.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
      '*'
    );
  }
  
  // ---------- DATA ----------
  async function loadTickets(): Promise<Ticket[]> {
    const res = await fetch('/tickets.json');
    if (!res.ok) throw new Error('No se pudieron cargar las entradas');
    return res.json() as Promise<Ticket[]>;
  }
  
  function ticketCard(t: Ticket): string {
    const date = new Date(t.date);
    const when = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
          <a class="download" href="${t.pdfUrl}" download rel="noopener">
            Descargar entrada (PDF)
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
  
      ticketsEl.innerHTML = data.map(ticketCard).join('');
      ticketsEl.hidden = false;
      
      document.body.classList.add('revealed');
      if (posterEl) {
        posterEl.hidden = false;
        // aseguramos que la transición corre (reflow)
        requestAnimationFrame(() => posterEl.classList.add('visible'));
      }

      if (revealBtn) {
        revealBtn.classList.add('fading');
        setTimeout(() => revealBtn.remove(), 700);
      }
  
      const linksTimer = setTimeout(() => {
        const hidden = document.querySelectorAll<HTMLElement>('.actions.hidden');
        hidden.forEach((el) => el.classList.remove('hidden'));
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
  
    giftEl.classList.remove('visible');
    void giftEl.offsetWidth;
    giftEl.classList.add('visible');
    document.body.classList.add('revealing');

  }
  
  // ---------- INIT (binding del botón) ----------
  function onClickReveal() {
    reveal().catch(console.error);
  }
  
  (function initGift() {
    // oculto al cargar; el juego lo mostrará cuando ganes
    giftEl.hidden = true;
    revealBtn?.addEventListener('click', onClickReveal);
  })();
  