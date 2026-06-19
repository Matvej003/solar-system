// ── Camera Animation: Fly-to Planet ─────────────────────────────────────────
// Smoothly flies the camera from the system view to a planet and back.

let flyState = 'idle'; // 'idle' | 'flying-in' | 'flying-out'
let flyProgress = 0;   // 0 → 1
const FLY_SPEED = 0.018;

// Stored positions for interpolation
let flyFromPos = new THREE.Vector3();
let flyToPos   = new THREE.Vector3();
let flyFromTarget = new THREE.Vector3();
let flyToTarget   = new THREE.Vector3();

// Easing — smooth start and end
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Call this instead of enterDetail directly
function flyToDetail(pdata) {
  if (flyState !== 'idle') return;

  // Snapshot current camera position as start
  flyFromPos.copy(camera.position);
  flyFromTarget.set(0, 0, 0); // system view looks at origin

  // Calculate destination
  const r         = pdata.isSun ? SUN_DATA.radius : pdata.radius;
  const dist      = r * 3.5;
  const targetPos = pdata.isSun
    ? new THREE.Vector3(0, 0, 0)
    : (planetMeshes.find(m => m.userData.name === pdata.name)?.position.clone() || new THREE.Vector3());

  // Arrive slightly in front of the planet
  flyToTarget.copy(targetPos);
  flyToPos.set(
    targetPos.x + dist * Math.sin(Math.PI / 2) * Math.sin(0),
    targetPos.y + dist * Math.cos(Math.PI / 2 - 0.2),
    targetPos.z + dist * Math.sin(Math.PI / 2) * Math.cos(0)
  );

  flyState    = 'flying-in';
  flyProgress = 0;

  // Enter detail mode immediately so planet keeps animating
  enterDetail(pdata);
}

function flyBack() {
  if (flyState !== 'idle') return;

  // Snapshot current camera as start
  flyFromPos.copy(camera.position);

  const r         = detailTarget?.isSun ? SUN_DATA.radius : (detailTarget?.radius || 1);
  const targetPos = detailTarget?.isSun
    ? new THREE.Vector3(0, 0, 0)
    : (planetMeshes.find(m => m.userData.name === detailTarget?.name)?.position.clone() || new THREE.Vector3());
  flyFromTarget.copy(targetPos);

  // Fly back to system overview position
  flyToPos.set(
    camDist * Math.sin(camPhi) * Math.sin(camTheta),
    camDist * Math.cos(camPhi),
    camDist * Math.sin(camPhi) * Math.cos(camTheta)
  );
  flyToTarget.set(0, 0, 0);

  flyState    = 'flying-out';
  flyProgress = 0;

  // Exit detail mode at the end (handled in updateFly)
}

// Called every frame from main.js
function updateFly() {
  if (flyState === 'idle') return;

  flyProgress = Math.min(1, flyProgress + FLY_SPEED);
  const t = easeInOut(flyProgress);

  // Interpolate position
  camera.position.lerpVectors(flyFromPos, flyToPos, t);

  // Interpolate look-at target
  const lookAt = new THREE.Vector3().lerpVectors(flyFromTarget, flyToTarget, t);
  camera.lookAt(lookAt);

  // Update detail cam angles to match arrival position when done flying in
  if (flyProgress >= 1) {
    if (flyState === 'flying-in') {
      flyState = 'idle';
      // Sync detailCamTheta/Phi to current arrived position
      detailCamTheta = 0;
      detailCamPhi   = Math.PI / 2 - 0.2;
    } else if (flyState === 'flying-out') {
      flyState = 'idle';
      exitDetail();
    }
  }
}
