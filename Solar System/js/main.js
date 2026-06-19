// ── Main: Init + Animation Loop ──────────────────────────────────────────────

function animate() {

  const spd = speedMap[timeMode];

  // Rotate sun
  if (sunMesh) sunMesh.rotation.y += SUN_DATA.selfRotSpeed * spd;

  // Update planet positions & rotation
  PLANET_DATA.forEach((pdata, i) => {
    const mesh    = planetMeshes[i];
    pdata.angle  += pdata.speed * spd * 0.5;
    pdata.selfRot += pdata.selfRotSpeed * spd;
    mesh.position.set(
      Math.cos(pdata.angle) * pdata.orbitR,
      0,
      Math.sin(pdata.angle) * pdata.orbitR
    );
    mesh.rotation.y = pdata.selfRot;
  });

  // Animate moon around Earth
  if (moonMesh) {
    const earthMesh = planetMeshes.find(m => m.userData.name === 'Erde');
    if (earthMesh) {
      moonAngle += MOON.speed * spd * 0.5;
      moonMesh.position.set(
        earthMesh.position.x + Math.cos(moonAngle) * MOON.orbitR,
        earthMesh.position.y,
        earthMesh.position.z + Math.sin(moonAngle) * MOON.orbitR
      );
      moonMesh.rotation.y += MOON.selfRotSpeed * spd;
    }
  }

  if (typeof updateShootingStars   === 'function') updateShootingStars();
  if (typeof updateVRMovement      === 'function') updateVRMovement();
  if (typeof updateVRGlide         === 'function') updateVRGlide();
  if (typeof updateControllerHover === 'function') updateControllerHover();
  if (typeof updateInfoPanel3D     === 'function') updateInfoPanel3D();
  updateFly();
  updateCamera();
  updateInfoSymbolPosition();
  updateInfoCardPosition();
  renderer.render(scene, camera);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
loadTextures(() => {
  buildScene();
  if (typeof create3DLabels === 'function') create3DLabels();
  initVR();
  if (typeof initAudio === 'function') initAudio();

  const screen = document.getElementById('loadingScreen');
  screen.classList.add('hidden');
  setTimeout(() => screen.style.display = 'none', 800);

  renderer.setAnimationLoop(animate);
});
