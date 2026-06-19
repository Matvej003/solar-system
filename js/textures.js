// ── Texture Loader ───────────────────────────────────────────────────────────
// Loads from embedded base64 (textures_b64.js) — no external files needed.

const TEX_NAMES = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'saturnRing', 'moon'];
const textures  = {};

function loadTextures(onReady) {
  const loader = new THREE.TextureLoader();
  let loaded = 0;

  TEX_NAMES.forEach(name => {
    const src = (typeof TEXTURE_B64 !== 'undefined' && TEXTURE_B64[name]) ? TEXTURE_B64[name] : null;

    const onLoad = tex => {
      textures[name] = tex || null;
      loaded++;
      _updateLoadingUI(loaded);
      if (loaded === TEX_NAMES.length && onReady) onReady();
    };

    if (src) {
      loader.load(src, onLoad, undefined, () => onLoad(null));
    } else {
      onLoad(null);
    }
  });
}

function _updateLoadingUI(loaded) {
  const bar   = document.getElementById('loadingBar');
  const label = document.getElementById('loadingLabel');
  if (!bar) return;
  const pct = Math.round((loaded / TEX_NAMES.length) * 100);
  bar.style.width       = pct + '%';
  label.textContent     = `Lade Texturen … ${loaded} / ${TEX_NAMES.length}`;
}
