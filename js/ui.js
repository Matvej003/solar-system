// ── UI: Zeit-Controls · Detail · Info-Symbol · Info-Card ─────────────────────

let timeMode = 'normal';
const speedMap = { normal: 1, fast: 5, stop: 0, reverse: -1 };

let view         = 'system';
let detailTarget = null;

let detailCamTheta = 0;
let detailCamPhi   = Math.PI / 2 - 0.2;

// ── Zeitmodus ─────────────────────────────────────────────────────────────────
function setMode(m) {
  timeMode = m;
  ['btnR','btnS','btnN','btnF'].forEach(id => {
    const b = document.getElementById(id);
    if (!b) return;
    b.style.background  = 'transparent';
    b.style.color       = 'rgba(255,255,255,0.65)';
    b.style.borderColor = 'rgba(255,255,255,0.2)';
  });
  const btnMap = { reverse:'btnR', stop:'btnS', normal:'btnN', fast:'btnF' };
  const colors = { normal:'rgba(80,180,100,', fast:'rgba(100,160,255,', stop:'rgba(200,200,200,', reverse:'rgba(255,120,100,' };
  const c = colors[m];
  document.getElementById(btnMap[m]).style.background  = c + '0.15)';
  document.getElementById(btnMap[m]).style.color       = c + '1)';
  document.getElementById(btnMap[m]).style.borderColor = c + '0.5)';
  const labels = { normal:'▶ Normal', fast:'⏩ ×5 Schnell', stop:'⏸ Gestoppt', reverse:'⏪ Rückwärts' };
  const lbl = document.getElementById('modeLabel');
  lbl.textContent = labels[m];
  lbl.style.color = c + '0.9)';
}

// ── Detail-Ansicht ────────────────────────────────────────────────────────────
function enterDetail(pdata) {
  view           = 'detail';
  detailTarget   = pdata;
  detailCamTheta = 0;
  detailCamPhi   = Math.PI / 2 - 0.2;
  document.getElementById('backBtn').style.display = 'block';
  document.getElementById('hint').textContent      = 'Ziehen = Kamera drehen · S = Stop · Zurück = Übersicht';
  // Symbol wird von updateInfoSymbolPosition() eingeblendet
}

function exitDetail() {
  view         = 'system';
  detailTarget = null;
  document.getElementById('backBtn').style.display = 'none';
  document.getElementById('hint').textContent      = 'Klick auf Planet/Sonne = Detailansicht · Scroll = Zoom · Ziehen = Schwenken';
  hideInfoSymbol();
  hideInfoCard();
}

// ── ℹ Symbol ──────────────────────────────────────────────────────────────────
function showInfoSymbol() {
  const sym = document.getElementById('infoSymbol');
  if (sym) sym.classList.add('visible');
}

function hideInfoSymbol() {
  const sym = document.getElementById('infoSymbol');
  if (sym) {
    sym.classList.remove('visible');
    sym.classList.remove('active');
  }
}

// ── Info Card Toggle ──────────────────────────────────────────────────────────
let cardOpen = false;

function toggleInfoCard() {
  if (cardOpen) {
    hideInfoCard();
  } else {
    if (detailTarget) showInfoCard(detailTarget);
  }
}

function showInfoCard(pdata) {
  cardOpen = true;
  document.getElementById('infoSymbol').classList.add('active');

  const d = pdata.details || {};
  document.getElementById('infoCardName').textContent = pdata.name;
  document.getElementById('infoCardType').textContent = d.typ || '';

  const stats = [];
  if (d.durchmesser) stats.push(['Durchmesser', d.durchmesser]);
  if (d.entfernung)  stats.push(['Entfernung',  d.entfernung]);
  if (d.temperatur)  stats.push(['Temperatur',  d.temperatur]);
  if (d.monde)       stats.push(['Monde',       d.monde]);
  if (d.umlaufzeit)  stats.push(['Umlaufzeit',  d.umlaufzeit]);
  if (d.alter)       stats.push(['Alter',       d.alter]);

  document.getElementById('infoCardStats').innerHTML = stats.map(([l, v]) =>
    `<div class="stat-row">
      <span class="stat-label">${l}</span>
      <span class="stat-value">${v}</span>
    </div>`
  ).join('');
  document.getElementById('infoCardFakt').textContent = d.fakt ? `💡 ${d.fakt}` : '';

  // Initiale Position rechts — wird dann per Frame präzisiert
  const card = document.getElementById('infoCard');
  card.style.left      = (window.innerWidth - 250) + 'px';
  card.style.top       = '50%';
  card.style.transform = 'translateY(-50%)';
  card.style.right     = 'auto';
  card.classList.add('visible');
}

function hideInfoCard() {
  cardOpen = false;
  document.getElementById('infoCard').classList.remove('visible');
  const sym = document.getElementById('infoSymbol');
  if (sym) sym.classList.remove('active');
}

// ── Positionen per Frame aktualisieren ───────────────────────────────────────
function _getPlanetScreenPos(pdata) {
  const mesh = pdata.isSun
    ? sunMesh
    : planetMeshes.find(m => m.userData.name === pdata.name);
  if (!mesh) return null;

  const center = mesh.position.clone();
  center.project(camera);
  const cx = (center.x * 0.5 + 0.5) * window.innerWidth;
  const cy = (-(center.y * 0.5) + 0.5) * window.innerHeight;

  // Screen-Radius aus Planet-3D-Radius
  const r    = pdata.isSun ? SUN_DATA.radius : pdata.radius;
  const edge = mesh.position.clone();
  edge.x += r;
  edge.project(camera);
  const ex = (edge.x * 0.5 + 0.5) * window.innerWidth;
  const sr = Math.abs(ex - cx);

  return { cx, cy, sr };
}

function updateInfoSymbolPosition() {
  const sym = document.getElementById('infoSymbol');
  if (!sym) {
    console.warn('infoSymbol element not found!');
    return;
  }

  const flyDone = (typeof flyState === 'undefined' || flyState === 'idle');
  const inDetail = (view === 'detail' && detailTarget != null);

  if (inDetail && flyDone) {
    // Inline styles — CSS-unabhängig, garantiert sichtbar
    sym.style.cssText = [
      'position:fixed',
      'right:20px',
      'top:50%',
      'transform:translateY(-50%)',
      'width:40px',
      'height:40px',
      'background:rgba(20,30,80,0.95)',
      'border:2px solid rgba(255,255,255,0.8)',
      'border-radius:50%',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:18px',
      'cursor:pointer',
      'z-index:9999',
      'color:white',
      'opacity:1',
      'pointer-events:all',
      'user-select:none',
    ].join(';');
    sym.textContent = 'ℹ';
    sym.onclick = toggleInfoCard;
  } else {
    sym.style.cssText = 'opacity:0;pointer-events:none;position:fixed';
    if (!inDetail) hideInfoCard();
  }
}

function updateInfoCardPosition() {
  if (!cardOpen) return;
  const card = document.getElementById('infoCard');
  if (!card.classList.contains('visible')) return;
  if (!detailTarget) return;

  const p    = _getPlanetScreenPos(detailTarget);
  if (!p) return;

  const W     = window.innerWidth;
  const H     = window.innerHeight;
  const cardW = Math.min(210, W - 20);
  const cardH = card.offsetHeight || 220;

  // Rechts versuchen
  let left = p.cx + p.sr + 50;
  let top  = p.cy - cardH / 2;

  // Rechts kein Platz → links
  if (left + cardW > W - 10) left = p.cx - p.sr - 50 - cardW;

  // Auch links kein Platz (schmales Handy) → unten zentriert
  if (left < 10) {
    left = (W - cardW) / 2;
    top  = H - cardH - 75;
  }

  // Immer innerhalb Bildschirm
  left = Math.max(10, Math.min(W - cardW - 10, left));
  top  = Math.max(10, Math.min(H - cardH - 10, top));

  card.style.width     = cardW + 'px';
  card.style.left      = left + 'px';
  card.style.top       = top  + 'px';
  card.style.right     = 'auto';
  card.style.transform = 'none';
}

// ── Init ──────────────────────────────────────────────────────────────────────
setMode('normal');

window.setMode        = setMode;
window.exitDetail     = exitDetail;
window.hideInfoCard   = hideInfoCard;
window.toggleInfoCard = toggleInfoCard;
window.showInfoCard   = showInfoCard;
