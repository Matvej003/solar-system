// ── 3D Info Panel — schwebt neben dem Planeten in der Quest ──────────────────

let infoPanelMesh    = null;
let infoPanelPlanet  = null; // welcher Planet gerade angezeigt wird

// ── Textur aus Planetendaten rendern ─────────────────────────────────────────
function _createInfoTexture(pdata) {
  const W = 512, H = 420;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Hintergrund mit abgerundeten Ecken
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(4, 8, 28, 0.96)';
  _rrect(ctx, 0, 0, W, H, 28); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = 1.5;
  _rrect(ctx, 1, 1, W-2, H-2, 28); ctx.stroke();

  const d   = pdata.details || {};
  const pad = 30;

  // Planetenname
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(pdata.name, pad, 68);

  // Typ
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.font = '20px sans-serif';
  ctx.fillText((d.typ || '').toUpperCase(), pad, 98);

  // Trennlinie
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, 116); ctx.lineTo(W-pad, 116); ctx.stroke();

  // Stats
  const stats = [];
  if (d.durchmesser) stats.push(['Durchmesser', d.durchmesser]);
  if (d.entfernung)  stats.push(['Entfernung',  d.entfernung]);
  if (d.temperatur)  stats.push(['Temperatur',  d.temperatur]);
  if (d.monde)       stats.push(['Monde',       d.monde]);
  if (d.umlaufzeit)  stats.push(['Umlaufzeit',  d.umlaufzeit]);

  let y = 154;
  stats.forEach(([label, val]) => {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '19px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, pad, y);

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = 'bold 19px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, W - pad, y);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, y+11); ctx.lineTo(W-pad, y+11); ctx.stroke();
    y += 40;
  });

  // Fakt (gelb, kursiv, mit Zeilenumbruch)
  if (d.fakt) {
    ctx.fillStyle = 'rgba(255,200,80,0.78)';
    ctx.font = 'italic 17px sans-serif';
    ctx.textAlign = 'left';
    _wrapText(ctx, '💡 ' + d.fakt, pad, y + 18, W - pad * 2, 22);
  }

  return canvas;
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
function _rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

function _wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, y);
      line = word + ' ';
      y += lineH;
    } else {
      line = test;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, y);
}

// ── Panel anzeigen / verstecken ───────────────────────────────────────────────
function showInfoPanel3D(pdata) {
  // Toggle: gleicher Planet → schließen
  if (infoPanelPlanet === pdata && infoPanelMesh) {
    hideInfoPanel3D();
    return;
  }

  hideInfoPanel3D();
  infoPanelPlanet = pdata;

  const canvas  = _createInfoTexture(pdata);
  const texture = new THREE.CanvasTexture(canvas);

  const r      = pdata.isSun ? SUN_DATA.radius : pdata.radius;
  const panelH = Math.max(r * 2.8, 1.8);
  const panelW = panelH * (512 / 420);

  const geo = new THREE.PlaneGeometry(panelW, panelH);
  const mat = new THREE.MeshBasicMaterial({
    map: texture, transparent: true,
    side: THREE.DoubleSide, depthWrite: false,
  });

  infoPanelMesh = new THREE.Mesh(geo, mat);
  scene.add(infoPanelMesh);
}

function hideInfoPanel3D() {
  if (!infoPanelMesh) return;
  scene.remove(infoPanelMesh);
  infoPanelMesh.material.map?.dispose();
  infoPanelMesh.material.dispose();
  infoPanelMesh.geometry.dispose();
  infoPanelMesh   = null;
  infoPanelPlanet = null;
}

// ── Position & Billboard (jeden Frame) ───────────────────────────────────────
function updateInfoPanel3D() {
  if (!infoPanelMesh || !infoPanelPlanet) return;

  const mesh = infoPanelPlanet.isSun
    ? sunMesh
    : planetMeshes.find(m => m.userData.name === infoPanelPlanet.name);
  if (!mesh) return;

  const r      = infoPanelPlanet.isSun ? SUN_DATA.radius : infoPanelPlanet.radius;
  const panelH = Math.max(r * 2.8, 1.8);
  const panelW = panelH * (512 / 420);

  // Kamera-Weltposition
  const camPos = new THREE.Vector3();
  camera.getWorldPosition(camPos);

  // Rechts vom Planeten relativ zur Kamera
  const dirToCamera = camPos.clone().sub(mesh.position).normalize();
  const up    = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, dirToCamera).normalize();

  infoPanelMesh.position.copy(mesh.position);
  infoPanelMesh.position.addScaledVector(right, r + panelW / 2 + 0.4);

  // Immer zur Kamera drehen (Billboard)
  infoPanelMesh.lookAt(camPos);
}
