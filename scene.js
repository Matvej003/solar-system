// ── Scene Setup ──────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // WebXR für Meta Quest

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

// Camera Rig — für VR-Locomotion (Thumbstick-Bewegung)
// In Non-VR: Rig bleibt bei (0,0,0), Camera wird normal gesetzt
// In VR:     Rig wird per Thumbstick bewegt, Headset kontrolliert Camera-Rotation
const cameraRig = new THREE.Group();
cameraRig.add(camera);
camera.position.set(0, 8, 30);

window.addEventListener('resize', _onResize);
window.addEventListener('orientationchange', () => setTimeout(_onResize, 200));

function _onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ── Shared references (filled by buildScene) ─────────────────────────────────
let sunMesh      = null;
let sunLight     = null;
const planetMeshes = [];

// Moon
let moonMesh  = null;
let moonAngle = 0;
const MOON = {
  radius:      0.25,
  orbitR:      2.2,   // orbit radius around Earth
  speed:       0.05,  // orbit speed
  selfRotSpeed: 0.005,
};

// ── Sterne, Milchstraße & Nebel ──────────────────────────────────────────────
function createStars() {
  _makeStarField(5000, 0.6,  0.9);   // viele kleine Sterne
  _makeStarField(1200, 1.4,  1.0);   // mittlere Sterne
  _makeStarField(220,  3.2,  1.0);   // helle Sterne
  _makeGlowingStars(55);             // leuchtende Glow-Sprites
  _makeMilkyWay();
  _makeNebulae();
}

function _makeStarField(count, size, opacity) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const colors = [
    [0.6,  0.75, 1.0],
    [0.78, 0.88, 1.0],
    [1.0,  1.0,  0.95],
    [1.0,  0.95, 0.8],
    [1.0,  0.82, 0.55],
    [1.0,  0.58, 0.35],
    [0.85, 0.9,  1.0],
  ];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 740 + Math.random() * 260;
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
    const c = colors[Math.floor(Math.random() * colors.length)];
    col[i*3] = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size, vertexColors: true, sizeAttenuation: true,
    transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
}

function _makeGlowingStars(count) {
  const types = [
    { rgb: [180, 210, 255], scale: 14 },
    { rgb: [255, 255, 245], scale: 12 },
    { rgb: [255, 235, 160], scale: 11 },
    { rgb: [255, 160, 80],  scale: 10 },
    { rgb: [210, 230, 255], scale: 13 },
  ];
  for (let i = 0; i < count; i++) {
    const t = types[Math.floor(Math.random() * types.length)];
    const [r, g, b] = t.rgb;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const ctx = cv.getContext('2d');
    const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0,    `rgba(${r},${g},${b},1.0)`);
    gr.addColorStop(0.08, `rgba(${r},${g},${b},0.9)`);
    gr.addColorStop(0.3,  `rgba(${r},${g},${b},0.35)`);
    gr.addColorStop(0.65, `rgba(${r},${g},${b},0.08)`);
    gr.addColorStop(1.0,  `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const rad   = 750 + Math.random() * 200;
    sprite.position.set(
      rad * Math.sin(phi) * Math.cos(theta),
      rad * Math.sin(phi) * Math.sin(theta),
      rad * Math.cos(phi)
    );
    const s = t.scale * (0.7 + Math.random() * 0.6);
    sprite.scale.set(s, s, 1);
    scene.add(sprite);
  }
}

function _makeMilkyWay() {
  const count = 6000;
  const pos   = new Float32Array(count * 3);
  const col   = new Float32Array(count * 3);
  const tilt  = Math.PI / 3;
  for (let i = 0; i < count; i++) {
    const lon  = Math.random() * Math.PI * 2;
    const lat  = (Math.random() - 0.5 + Math.random() - 0.5) * 0.35;
    const r    = 770 + Math.random() * 180;
    const x0   = r * Math.cos(lat) * Math.cos(lon);
    const y0   = r * Math.sin(lat);
    const z0   = r * Math.cos(lat) * Math.sin(lon);
    pos[i*3]   = x0;
    pos[i*3+1] = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
    pos[i*3+2] = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
    col[i*3]   = 0.65 + Math.random() * 0.35;
    col[i*3+1] = 0.72 + Math.random() * 0.28;
    col[i*3+2] = 0.85 + Math.random() * 0.15;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(col, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.5, vertexColors: true, sizeAttenuation: true,
    transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));
}

function _makeNebulae() {
  const defs = [
    // Bestehende
    { color: [60,  90,  255], o: 0.38, x:  230, y:  120, z: -530, sx: 420, sy: 300 },
    { color: [150, 30,  220], o: 0.32, x: -340, y:  -60, z: -430, sx: 380, sy: 270 },
    { color: [255, 70,  20],  o: 0.28, x: -160, y:  220, z:  470, sx: 450, sy: 310 },
    { color: [20,  210, 160], o: 0.30, x:  420, y: -160, z:  330, sx: 340, sy: 250 },
    { color: [210, 20,  110], o: 0.25, x: -400, y:   80, z: -230, sx: 400, sy: 290 },
    { color: [30,  70,  255], o: 0.28, x:   90, y: -300, z:  520, sx: 520, sy: 380 },
    { color: [255, 140, 20],  o: 0.20, x:  500, y:  200, z: -100, sx: 300, sy: 220 },
    // Neue
    { color: [80,  180, 255], o: 0.30, x: -600, y:  300, z:  200, sx: 480, sy: 340 },
    { color: [255, 50,  150], o: 0.26, x:  350, y: -350, z: -400, sx: 360, sy: 260 },
    { color: [100, 255, 180], o: 0.22, x: -200, y: -400, z: -500, sx: 440, sy: 300 },
    { color: [200, 100, 255], o: 0.28, x:  600, y:  -80, z:  400, sx: 390, sy: 280 },
    { color: [255, 200, 50],  o: 0.18, x: -500, y:  400, z:  350, sx: 320, sy: 240 },
    { color: [50,  120, 255], o: 0.32, x:  100, y:  500, z: -300, sx: 500, sy: 360 },
    { color: [255, 80,  80],  o: 0.22, x: -300, y: -500, z:  150, sx: 350, sy: 260 },
    { color: [120, 255, 220], o: 0.20, x:  550, y:  350, z:  500, sx: 410, sy: 300 },
  ];
  defs.forEach(n => {
    [1.0, 0.45].forEach(scale => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 256;
      const g = cv.getContext('2d');
      const [r, gv, b] = n.color;
      const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      const a = scale === 1.0 ? n.o * 2.2 : n.o * 0.8;
      gr.addColorStop(0,    `rgba(${r},${gv},${b},${Math.min(a, 0.95)})`);
      gr.addColorStop(0.35, `rgba(${r},${gv},${b},${a * 0.55})`);
      gr.addColorStop(0.7,  `rgba(${r},${gv},${b},${a * 0.15})`);
      gr.addColorStop(1.0,  `rgba(${r},${gv},${b},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      sprite.position.set(n.x, n.y, n.z);
      sprite.scale.set(n.sx * scale, n.sy * scale, 1);
      scene.add(sprite);
    });
  });
}

// ── Sun glow sprite ───────────────────────────────────────────────────────────
function createSunGlow(r) {
  const c    = document.createElement('canvas');
  c.width    = c.height = 128;
  const g    = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0,   'rgba(255,200,80,0.6)');
  grad.addColorStop(0.3, 'rgba(255,120,0,0.25)');
  grad.addColorStop(1,   'rgba(255,60,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);

  const mat    = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c),
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(r * 8, r * 8, 1);
  return sprite;
}

// ── Planet label sprite ───────────────────────────────────────────────────────
function makeLabelSprite(text) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 64);
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.font      = 'bold 28px -apple-system,sans-serif';
  g.textAlign = 'center';
  g.fillText(text, 128, 40);
  const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(g.canvas), transparent: true, depthWrite: false });
  const s   = new THREE.Sprite(mat);
  s.scale.set(3, 0.75, 1);
  return s;
}

// ── Material helper ───────────────────────────────────────────────────────────
function makePlanetMaterial(data) {
  const tex = textures[data.tex] || null;
  return new THREE.MeshStandardMaterial({
    map:              tex,
    color:            tex ? 0xffffff : new THREE.Color(data.color),
    emissive:         data.isSun ? new THREE.Color('#ff6600') : new THREE.Color('#000000'),
    emissiveIntensity: data.isSun ? 0.3 : 0,
    roughness: 0.8,
    metalness: 0,
  });
}

// ── Build entire scene ────────────────────────────────────────────────────────
function buildScene() {
  scene.add(cameraRig); // Rig in Szene
  createStars();

  // Lights
  scene.add(new THREE.AmbientLight(0x111133, 0.1)); // realistisch: Schattenseite dunkel
  sunLight = new THREE.PointLight(0xfff5e0, 4.5, 600); // stärker für klaren Tag/Nacht-Effekt
  scene.add(sunLight);

  // Sun mesh
  const sunGeo = new THREE.SphereGeometry(SUN_DATA.radius, 64, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    map:   textures.sun || null,
    color: textures.sun ? 0xffffff : new THREE.Color(SUN_DATA.color),
  });
  sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.userData = { ...SUN_DATA, selfRot: 0 };
  scene.add(sunMesh);
  scene.add(createSunGlow(SUN_DATA.radius));

  // Planets
  PLANET_DATA.forEach(pdata => {
    // Orbit line
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * pdata.orbitR, 0, Math.sin(a) * pdata.orbitR));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts);
    scene.add(new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 })));

    // Planet sphere
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(pdata.radius, 48, 24), makePlanetMaterial(pdata));
    mesh.userData = pdata;

    // Atmosphere
    if (pdata.atm) {
      const cols   = pdata.atm.match(/[\d.]+/g);
      const atmMat = new THREE.MeshBasicMaterial({
        color:       new THREE.Color(`rgb(${cols[0]},${cols[1]},${cols[2]})`),
        transparent: true, opacity: parseFloat(cols[3] || 0.15),
        side: THREE.FrontSide, depthWrite: false,
      });
      mesh.add(new THREE.Mesh(new THREE.SphereGeometry(pdata.radius * 1.12, 32, 16), atmMat));
    }

    // Saturn rings
    if (pdata.rings) {
      const ringGeo = new THREE.RingGeometry(pdata.radius * 2.0, pdata.radius * 3.5, 128);
      // Remap UVs from inner to outer edge (u: 0=inner, 1=outer)
      const pos = ringGeo.attributes.position;
      const uv  = ringGeo.attributes.uv;
      const v3  = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        uv.setXY(i, (v3.length() - pdata.radius * 2.0) / (pdata.radius * 1.5), 0.5);
      }
      const ringTex = textures.saturnRing || null;
      const ringMat = new THREE.MeshBasicMaterial({
        map:         ringTex,
        color:       ringTex ? 0xffffff : 0xd4c080,
        side:        THREE.DoubleSide,
        transparent: true,
        opacity:     ringTex ? 1.0 : 0.6,
        depthWrite:  false,
        alphaMap:    ringTex,  // use same texture as alpha so black = transparent
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      mesh.add(ringMesh);
    }

    // Initial position
    mesh.position.set(Math.cos(pdata.angle) * pdata.orbitR, 0, Math.sin(pdata.angle) * pdata.orbitR);

    scene.add(mesh);
    planetMeshes.push(mesh);
  });

  // ── Moon (orbits Earth) ──────────────────────────────────────────────────
  const moonGeo = new THREE.SphereGeometry(MOON.radius, 32, 16);
  const moonMat = new THREE.MeshStandardMaterial({
    map:      textures.moon || null,
    color:    textures.moon ? 0xffffff : 0xaaaaaa,
    roughness: 0.9,
    metalness: 0,
  });
  moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.userData = { name: 'Mond', isMoon: true };

  scene.add(moonMesh);
}
