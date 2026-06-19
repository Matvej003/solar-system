// ── Extras: Asteroiden-Gürtel · Komet · 3D-Labels ───────────────────────────

// ── 3D Labels (sichtbar in Quest VR) ─────────────────────────────────────────
function create3DLabels() {
  // Sonne
  _addLabel3D(SUN_DATA.name, sunMesh, SUN_DATA.radius + 1.8, '#ffdd66');
  // Planeten
  PLANET_DATA.forEach((p, i) => {
    _addLabel3D(p.name, planetMeshes[i], p.radius + 0.7, '#ffffff');
  });
}

function _addLabel3D(text, mesh, yOff, color) {
  const W = 260, H = 72;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.clearRect(0, 0, W, H);

  // Hintergrund-Pill
  g.fillStyle = 'rgba(0,0,0,0.6)';
  g.beginPath();
  const r = 14;
  g.moveTo(r, 10); g.lineTo(W-r, 10);
  g.quadraticCurveTo(W, 10, W, 10+r);
  g.lineTo(W, H-10-r);
  g.quadraticCurveTo(W, H-10, W-r, H-10);
  g.lineTo(r, H-10);
  g.quadraticCurveTo(0, H-10, 0, H-10-r);
  g.lineTo(0, 10+r);
  g.quadraticCurveTo(0, 10, r, 10);
  g.closePath();
  g.fill();

  // Text
  g.shadowColor = 'rgba(0,0,0,0.8)';
  g.shadowBlur  = 6;
  g.fillStyle   = color;
  g.font        = 'bold 34px sans-serif';
  g.textAlign   = 'center';
  g.fillText(text, W / 2, 50);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c),
    transparent: true, depthWrite: false,
  }));
  sprite.scale.set(3.8, 1.05, 1);
  sprite.position.set(0, yOff, 0);
  mesh.add(sprite);
}

// ── Sternschnuppen ────────────────────────────────────────────────────────────
const _shootingStars  = [];
let   _ssTimer        = 0;
let   _ssNextIn       = 5 + Math.random() * 6;

function updateShootingStars() {
  _ssTimer += 1 / 60;
  if (_ssTimer >= _ssNextIn) {
    _ssTimer  = 0;
    _ssNextIn = 4 + Math.random() * 10;
    _spawnShootingStar();
  }

  for (let i = _shootingStars.length - 1; i >= 0; i--) {
    const s = _shootingStars[i];
    s.life -= s.decay;

    if (s.life <= 0) {
      scene.remove(s.line);
      scene.remove(s.head);
      s.line.geometry.dispose();
      s.line.material.dispose();
      s.head.material.dispose();
      _shootingStars.splice(i, 1);
      continue;
    }

    // Kopf vorwärts bewegen
    s.pos.addScaledVector(s.dir, s.speed);
    s.head.position.copy(s.pos);

    // Schweif aktualisieren
    const arr = s.line.geometry.attributes.position.array;
    arr[0] = s.pos.x; arr[1] = s.pos.y; arr[2] = s.pos.z;
    arr[3] = s.pos.x - s.dir.x * s.tailLen;
    arr[4] = s.pos.y - s.dir.y * s.tailLen;
    arr[5] = s.pos.z - s.dir.z * s.tailLen;
    s.line.geometry.attributes.position.needsUpdate = true;

    // Opacity mit Leben verknüpfen — abklingen am Ende
    const fade = s.life < 0.3 ? s.life / 0.3 : 1.0;
    s.line.material.opacity = fade * 0.85;
    s.head.material.opacity = fade;
  }
}

function _spawnShootingStar() {
  // Startpunkt: zufällig auf einer Kugel rund um die Szene
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  const rad   = 500 + Math.random() * 150;
  const sx    = rad * Math.sin(phi) * Math.cos(theta);
  const sy    = rad * Math.sin(phi) * Math.sin(theta) * 0.6; // eher seitlich
  const sz    = rad * Math.cos(phi);

  // Richtung: leicht nach "innen" gerichtet für natürlichen Look
  const dir = new THREE.Vector3(
    -sx * 0.3 + (Math.random() - 0.5) * 200,
    -sy * 0.3 + (Math.random() - 0.5) * 80,
    -sz * 0.3 + (Math.random() - 0.5) * 200
  ).normalize();

  const tailLen = 25 + Math.random() * 35;
  const speed   = 3.5 + Math.random() * 3;

  // Farbe: weiß, blau-weiß oder leicht gelb
  const colors = [
    [255, 255, 255],
    [200, 220, 255],
    [255, 250, 220],
    [180, 210, 255],
  ];
  const [r, g, b] = colors[Math.floor(Math.random() * colors.length)];

  // Schweif-Linie
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([sx, sy, sz, sx, sy, sz], 3));
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: new THREE.Color(r/255, g/255, b/255),
    transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(line);

  // Kopf-Glow
  const cv = document.createElement('canvas');
  cv.width = cv.height = 48;
  const ctx = cv.getContext('2d');
  const gr  = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
  gr.addColorStop(0,   `rgba(${r},${g},${b},1.0)`);
  gr.addColorStop(0.2, `rgba(${r},${g},${b},0.7)`);
  gr.addColorStop(0.5, `rgba(${r},${g},${b},0.2)`);
  gr.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 48, 48);

  const head = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(cv),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const glowSize = 5 + Math.random() * 4;
  head.scale.set(glowSize, glowSize, 1);
  head.position.set(sx, sy, sz);
  scene.add(head);

  _shootingStars.push({
    line, head,
    pos:     new THREE.Vector3(sx, sy, sz),
    dir, speed, tailLen,
    life:  1.0,
    decay: 0.012 + Math.random() * 0.015,
  });
}
