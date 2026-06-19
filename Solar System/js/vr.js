// ── WebXR VR — Meta Quest 2/3 ────────────────────────────────────────────────

let vrActive      = false;
let hoveredObject = null;
const MOVE_SPEED  = 0.12;

let controllerRight = null;
let controllerLeft  = null;
let aBtnWasPressed  = false;
let bBtnWasPressed  = false;
let trigWasPressed  = false;

// Sanftes Gleiten
const _glideTarget = new THREE.Vector3();
let   _gliding     = false;

// ── VR-Button ─────────────────────────────────────────────────────────────────
function initVR() {
  if (!navigator.xr) { console.log('WebXR nicht verfügbar'); return; }
  navigator.xr.isSessionSupported('immersive-vr').then(supported => {
    const btn = document.createElement('button');
    btn.id = 'questBtn';
    Object.assign(btn.style, {
      position: 'fixed', bottom: '16px', right: '16px', zIndex: '20',
      background: 'rgba(0,0,20,0.8)',
      border: '0.5px solid rgba(255,255,255,0.3)',
      color: supported ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
      padding: '6px 16px', borderRadius: '20px',
      fontSize: '12px', cursor: supported ? 'pointer' : 'default',
      transition: 'all 0.15s',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      opacity: supported ? '1' : '0.5',
    });
    btn.textContent = supported ? '🥽 Quest VR' : 'VR nicht verfügbar';
    if (supported) btn.addEventListener('click', toggleVRSession);
    document.body.appendChild(btn);
  });
  setupControllers();
}

// ── Session ───────────────────────────────────────────────────────────────────
function toggleVRSession() {
  if (vrActive) { renderer.xr.getSession()?.end(); return; }
  navigator.xr.requestSession('immersive-vr', {
    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
  }).then(session => {
    renderer.xr.setSession(session);
    vrActive = true;
    const btn = document.getElementById('questBtn');
    if (btn) { btn.textContent = '✕ VR beenden'; btn.style.color = 'rgba(80,220,100,1)'; btn.style.borderColor = 'rgba(80,180,100,0.6)'; }
    cameraRig.position.set(0, 0, 18);
    session.addEventListener('end', () => {
      vrActive = false;
      controllerRight = null; controllerLeft = null;
      hidePlanetMenu();
      const btn = document.getElementById('questBtn');
      if (btn) { btn.textContent = '🥽 Quest VR'; btn.style.color = 'rgba(255,255,255,0.8)'; btn.style.borderColor = 'rgba(255,255,255,0.3)'; }
      cameraRig.position.set(0, 0, 0);
      camera.position.set(0, 8, 30);
    });
  }).catch(console.error);
}

// ── Controller Setup ──────────────────────────────────────────────────────────
function setupControllers() {
  for (let i = 0; i <= 1; i++) {
    const ctrl = renderer.xr.getController(i);
    cameraRig.add(ctrl);
    ctrl.addEventListener('connected', e => {
      if (e.data.handedness === 'right') {
        controllerRight = ctrl;
        if (!ctrl.getObjectByName('aimRay')) {
          const ray = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-20),
            ]),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
          );
          ray.name = 'aimRay';
          ctrl.add(ray);
        }
      } else if (e.data.handedness === 'left') {
        controllerLeft = ctrl;
      }
    });
    ctrl.addEventListener('disconnected', () => {
      if (ctrl === controllerRight) controllerRight = null;
      if (ctrl === controllerLeft)  controllerLeft  = null;
    });
  }
}

// ── Planet auswählen ──────────────────────────────────────────────────────────
function selectWithController(ctrl) {
  ctrl.updateWorldMatrix(true, false);
  const rc = new THREE.Raycaster();
  rc.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
  rc.ray.direction.set(0, 0, -1).transformDirection(ctrl.matrixWorld);

  // Planeten-Rad offen → Planet im Rad antippen
  if (menuVisible && menuGroup) {
    const items = menuGroup.children.filter(c => c.isMesh && c.userData?.name);
    const hits  = rc.intersectObjects(items, false);
    if (hits.length > 0) {
      hidePlanetMenu();
      _moveToVR(hits[0].object.userData);
    } else {
      hidePlanetMenu();
    }
    return;
  }

  // Planet direkt antippen
  const hits = rc.intersectObjects([sunMesh, ...planetMeshes], false);
  if (hits.length > 0 && hits[0].object.userData?.name) {
    _moveToVR(hits[0].object.userData);
  }
}

// ── Zu Planet gleiten (VR) ────────────────────────────────────────────────────
function _moveToVR(pdata) {
  const r   = pdata.isSun ? SUN_DATA.radius : pdata.radius;
  const pos = pdata.isSun
    ? new THREE.Vector3(0, 0, 0)
    : (planetMeshes.find(m => m.userData.name === pdata.name)?.position.clone() || new THREE.Vector3());
  _glideTarget.set(pos.x + r * 4, pos.y, pos.z + r * 4);
  _gliding = true;
  if (typeof enterDetail === 'function') enterDetail(pdata);
  if (typeof showInfoPanel3D === 'function') showInfoPanel3D(pdata);
}

function updateVRGlide() {
  if (!_gliding || !renderer.xr.isPresenting) return;
  cameraRig.position.lerp(_glideTarget, 0.06);
  if (cameraRig.position.distanceTo(_glideTarget) < 0.05) {
    cameraRig.position.copy(_glideTarget);
    _gliding = false;
  }
}

// ── Hover-Highlight ───────────────────────────────────────────────────────────
function updateControllerHover() {
  if (!renderer.xr.isPresenting) return;
  const ctrlsToCheck = [
    controllerRight || renderer.xr.getController(0),
    controllerLeft  || renderer.xr.getController(1),
  ];
  if (hoveredObject) { hoveredObject.scale.setScalar(1.0); hoveredObject = null; }
  for (const ctrl of ctrlsToCheck) {
    ctrl.updateWorldMatrix(true, false);
    const rc = new THREE.Raycaster();
    rc.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
    rc.ray.direction.set(0, 0, -1).transformDirection(ctrl.matrixWorld);
    const objects = (menuVisible && menuGroup)
      ? menuGroup.children.filter(c => c.isMesh && c.userData?.name)
      : [sunMesh, ...planetMeshes];
    const hits = rc.intersectObjects(objects, false);
    if (hits.length > 0) {
      hoveredObject = hits[0].object;
      hoveredObject.scale.setScalar(1.15);
      break;
    }
  }
}

// ── Planeten-Rad (B-Button) ───────────────────────────────────────────────────
let menuVisible = false;
let menuGroup   = null;

function showPlanetMenu() {
  if (menuGroup) return;
  menuVisible = true;
  menuGroup   = new THREE.Group();

  const items = [SUN_DATA, ...PLANET_DATA];
  items.forEach((pdata, i) => {
    const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * 2.8;
    const y = Math.sin(angle) * 2.8;

    // Farbige Kugel
    const col = pdata.isSun
      ? 0xffcc00
      : new THREE.Color(pdata.color).getHex();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 8),
      new THREE.MeshBasicMaterial({ color: col })
    );
    sphere.position.set(x, y, 0);
    sphere.userData = pdata;
    menuGroup.add(sphere);

    // Label
    const lbl = _makeMenuLabel(pdata.name);
    lbl.position.set(x, y + 0.58, 0);
    menuGroup.add(lbl);
  });

  // Dekorativer Ring
  menuGroup.add(new THREE.Mesh(
    new THREE.RingGeometry(2.55, 2.65, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.08,
      side: THREE.DoubleSide, depthWrite: false,
    })
  ));

  // Vor Kamera positionieren
  const camPos = new THREE.Vector3();
  camera.getWorldPosition(camPos);
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  fwd.y = 0; fwd.normalize();
  menuGroup.position.copy(camPos).addScaledVector(fwd, 4.5);
  menuGroup.position.y = camPos.y;
  menuGroup.lookAt(camPos);
  scene.add(menuGroup);
}

function hidePlanetMenu() {
  if (!menuGroup) return;
  scene.remove(menuGroup);
  menuGroup   = null;
  menuVisible = false;
}

function _makeMenuLabel(text) {
  const c = document.createElement('canvas');
  c.width = 200; c.height = 56;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 200, 56);
  g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 8;
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.font = 'bold 26px sans-serif';
  g.textAlign = 'center';
  g.fillText(text, 100, 38);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false,
  }));
  s.scale.set(2.2, 0.62, 1);
  return s;
}

// ── Bewegung + Buttons ────────────────────────────────────────────────────────
function updateVRMovement() {
  if (!renderer.xr.isPresenting) return;
  const session = renderer.xr.getSession();
  if (!session) return;

  for (const source of session.inputSources) {
    if (!source.gamepad) continue;

    if (source.handedness === 'right') {
      // Trigger (alle möglichen Indizes) = Planet / Rad auswählen
      let anyTrig = false;
      for (let bi = 0; bi <= 1; bi++) {
        if (source.gamepad.buttons[bi]?.pressed) { anyTrig = true; break; }
      }
      if (anyTrig && !trigWasPressed) {
        const ctrl = controllerRight || renderer.xr.getController(0);
        if (ctrl) selectWithController(ctrl);
      }
      trigWasPressed = anyTrig;

      // A-Button (4) = Freeze / Unfreeze
      const aBtn = source.gamepad.buttons[4];
      if (aBtn) {
        if (aBtn.pressed && !aBtnWasPressed && typeof setMode === 'function') {
          setMode(timeMode === 'stop' ? 'normal' : 'stop');
        }
        aBtnWasPressed = aBtn.pressed;
      }

      // B-Button (5) = Planeten-Rad / Zurück
      const bBtn = source.gamepad.buttons[5];
      if (bBtn) {
        if (bBtn.pressed && !bBtnWasPressed) {
          if (view === 'detail') {
            hidePlanetMenu();
            if (typeof flyBack === 'function') flyBack();
            else if (typeof exitDetail === 'function') exitDetail();
          } else {
            menuVisible ? hidePlanetMenu() : showPlanetMenu();
          }
        }
        bBtnWasPressed = bBtn.pressed;
      }
    }

    // Thumbstick Bewegung
    const axes   = source.gamepad.axes;
    const stickX = axes[2] ?? axes[0] ?? 0;
    const stickY = axes[3] ?? axes[1] ?? 0;
    if (Math.abs(stickX) < 0.12 && Math.abs(stickY) < 0.12) continue;

    if (source.handedness === 'left') {
      const fwd = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
      fwd.y = 0; fwd.normalize();
      const right = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
      right.y = 0; right.normalize();
      cameraRig.position.addScaledVector(fwd,  -stickY * MOVE_SPEED);
      cameraRig.position.addScaledVector(right,  stickX * MOVE_SPEED);
    }
    if (source.handedness === 'right') {
      cameraRig.position.y -= stickY * MOVE_SPEED;
    }
  }
}
