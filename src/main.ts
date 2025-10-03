type Ticket = {
  band: string; tour: string; city: string; venue: string;
  date: string; sector: string; seat: string; code: string;
};

const revealBtn = document.getElementById('revealBtn') as HTMLButtonElement;
const ticketsEl = document.getElementById('tickets') as HTMLElement;
const yt = document.getElementById('yt') as HTMLIFrameElement;

function playYouTube() {
  yt.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
    '*'
  );
}

async function loadTickets(): Promise<Ticket[]> {
  // En Vite, todo lo que pongas en /public cuelga de la raíz /
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
        <div>${t.sector} · ${t.seat}</div>
      </div>
      <!-- QR se puede generar luego con una lib; de momento marcamos el código -->
      <div class="code">${t.code}</div>
    </article>`;
}

async function reveal() {
  const data = await loadTickets();
  setTimeout(() => {
    ticketsEl.innerHTML = data.map(ticketCard).join('');
    ticketsEl.hidden = false;
    document.body.classList.add('revealed');
  }, 65000);
  playYouTube();
}

revealBtn.addEventListener('click', reveal);
