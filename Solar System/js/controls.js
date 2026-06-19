// ── Controls: Mouse · Touch · Gyroscope ─────────────────────────────────────

// System view camera orbit
let camTheta = 0.3;
let camPhi   = Math.PI / 2 - 0.3;
let camDist  = 30;

// Drag state
let isDragging = false;
let lastX = 0, lastY = 0;
let clickStartX = 0, clickStartY = 0;

// Pinch zoom
let pinchStart = 0;

// VR / Gyro
let vrMode      = false;
let gyroEnabled = false;
let deviceAlpha = 0, deviceBeta = 90, deviceGamma = 0;

// Gyro offset — touch drag adds to this in VR mode
let gyroOffsetTheta = 0;  // horizontal correction
let gyroOffsetPhi   = 0;  // vertical correction

const euler = new THREE.Euler();
const quat  = new THREE.Quaternion();

// ── Gyroscope ─────────────────────────────────────────────────────────────────
function toggleVR() {
  vrMode = !vrMode;
  document.getElementById('vrToggle').classList.toggle('active', vrMode);
  document.getElementById('crosshair').classList.toggle('active', vrMode);
  document.getElementById('hint').textContent = vrMode
    ? '🥽 Handy drehen = Kamera · Wischen = Feinkorrektur · Tippen = Planet'
    : 'Klick auf Planet/Sonne = Detailansicht · Scroll = Zoom · Ziehen = Schwenken';

  // Reset gyro offsets when toggling
  gyroOffsetTheta = 0;
  gyroOffsetPhi   = 0;

  if (vrMode && !gyroEnabled && typeof DeviceOrientationEvent !== 'undefined') {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      document.getElementById('gyroBtn').style.display = 'block';
    } else {
      enableGyro();
    }
  }
  if (!vrMode) document.getElementById('gyroBtn').style.display = 'none';
}

function requestGyro() {
  DeviceOrientationEvent.requestPermission()
    .then(state => {
      if (state === 'granted') {
        enableGyro();
        document.getElementById('gyroBtn').style.display = 'none';
      }
    })
    .catch(console.error);
}

function enableGyro() {
  window.addEventListener('deviceorientation', e => {
    deviceAlpha = e.alpha || 0;
    deviceBeta  = e.beta  || 90;
    deviceGamma = e.gamma || 0;
  });
  gyroEnabled = true;
}

// ── Camera update (called every frame) ───────────────────────────────────────
function updateCamera() {
  if (renderer.xr.isPresenting) return; // VR Headset kontrolliert Kamera
  if (flyState !== 'idle') return; // fly animation has control
  if (view === 'system') {
    if (vrMode && gyroEnabled) {
      // Gyro base + touch offset
      euler.set(
        THREE.MathUtils.degToRad(deviceBeta - 90) + gyroOffsetPhi,
        THREE.MathUtils.degToRad(deviceAlpha)     + gyroOffsetTheta,
        THREE.MathUtils.degToRad(-deviceGamma),
        'YXZ'
      );
      quat.setFromEuler(euler);
      camera.quaternion.slerp(quat, 0.1);
    } else {
      const x = camDist * Math.sin(camPhi) * Math.sin(camTheta);
      const y = camDist * Math.cos(camPhi);
      const z = camDist * Math.sin(camPhi) * Math.cos(camTheta);
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
    }

  } else if (view === 'detail' && detailTarget) {
    const r         = detailTarget.isSun ? SUN_DATA.radius : detailTarget.radius;
    const dist      = r * 3.5;
    const targetPos = detailTarget.isSun
      ? new THREE.Vector3(0, 0, 0)
      : (planetMeshes.find(m => m.userData.name === detailTarget.name)?.position.clone() || new THREE.Vector3());

    if (vrMode && gyroEnabled) {
      // Gyro base + touch drag offset for fine control
      euler.set(
        THREE.MathUtils.degToRad(deviceBeta - 90) + gyroOffsetPhi,
        THREE.MathUtils.degToRad(deviceAlpha)     + gyroOffsetTheta,
        THREE.MathUtils.degToRad(-deviceGamma),
        'YXZ'
      );
      quat.setFromEuler(euler);
      camera.quaternion.slerp(quat, 0.1);
      camera.position.copy(targetPos).add(new THREE.Vector3(dist, r * 0.3, 0));
    } else {
      // Desktop: pure drag orbit
      const camX = targetPos.x + dist * Math.sin(detailCamPhi) * Math.sin(detailCamTheta);
      const camY = targetPos.y + dist * Math.cos(detailCamPhi);
      const camZ = targetPos.z + dist * Math.sin(detailCamPhi) * Math.cos(detailCamTheta);
      camera.position.set(camX, camY, camZ);
      camera.lookAt(targetPos);
    }
  }
}

// ── Drag helpers ──────────────────────────────────────────────────────────────
function applyDrag(dx, dy) {
  if (vrMode && gyroEnabled) {
    // In VR mode: touch drag adjusts gyro offset for fine correction
    gyroOffsetTheta -= dx * 0.003;
    gyroOffsetPhi   += dy * 0.003;
  } else if (view === 'system') {
    camTheta -= dx * 0.005;
    camPhi    = Math.max(0.1, Math.min(Math.PI - 0.1, camPhi + dy * 0.005));
  } else if (view === 'detail') {
    detailCamTheta += dx * 0.005;
    detailCamPhi    = Math.max(0.1, Math.min(Math.PI - 0.1, detailCamPhi - dy * 0.005));
  }
}

// ── Raycaster / Click ─────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

function handleClick(cx, cy) {
  if (Math.hypot(cx - clickStartX, cy - clickStartY) > 8) return;
  mouse.x =  (cx / window.innerWidth)  * 2 - 1;
  mouse.y = -(cy / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects([sunMesh, ...planetMeshes], false);
  if (hits.length > 0 && hits[0].object.userData.name) {
    const pdata = hits[0].object.userData;
    if (typeof flyToDetail === 'function') {
      flyToDetail(pdata);
    } else {
      enterDetail(pdata);
    }
  }
}

// ── Mouse ─────────────────────────────────────────────────────────────────────
const canvas3d = document.getElementById('c');

canvas3d.addEventListener('mousedown', e => {
  isDragging  = true;
  lastX       = e.clientX; lastY = e.clientY;
  clickStartX = e.clientX; clickStartY = e.clientY;
});
canvas3d.addEventListener('mousemove', e => {
  if (!isDragging) return;
  applyDrag(e.clientX - lastX, e.clientY - lastY);
  lastX = e.clientX; lastY = e.clientY;
});
canvas3d.addEventListener('mouseup', e => {
  handleClick(e.clientX, e.clientY);
  isDragging = false;
});
canvas3d.addEventListener('mouseleave', () => isDragging = false);
canvas3d.addEventListener('wheel', e => {
  e.preventDefault();
  camDist = Math.max(5, Math.min(120, camDist * (e.deltaY > 0 ? 1.1 : 0.91)));
}, { passive: false });

// ── Touch ─────────────────────────────────────────────────────────────────────
canvas3d.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    isDragging  = true;
    lastX       = e.touches[0].clientX; lastY = e.touches[0].clientY;
    clickStartX = e.touches[0].clientX; clickStartY = e.touches[0].clientY;
  }
  if (e.touches.length === 2) {
    pinchStart = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: false });

canvas3d.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    applyDrag(dx, dy);
  }
  if (e.touches.length === 2) {
    const pinchNow = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    camDist    = Math.max(5, Math.min(120, camDist * (pinchStart / pinchNow)));
    pinchStart = pinchNow;
  }
}, { passive: false });

canvas3d.addEventListener('touchend', e => {
  if (e.changedTouches.length === 1) {
    handleClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }
  isDragging = false;
});

// ── Keyboard ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 's') setMode('stop');
  if (e.key.toLowerCase() === 'a') setMode('fast');
  if (e.key.toLowerCase() === 'd') setMode('reverse');
  if (e.key === ' ') { e.preventDefault(); setMode('normal'); }
  if (e.key === 'Escape' && view === 'detail') exitDetail();
});