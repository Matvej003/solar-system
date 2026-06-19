// ── Weltraum-Ambient Sound ────────────────────────────────────────────────────

let _audioCtx   = null;
let _gainNode   = null;

function initAudio() {
  const start = () => {
    if (_audioCtx) return;
    _buildAudio();
    document.removeEventListener('click',     start);
    document.removeEventListener('touchstart', start);
    document.removeEventListener('keydown',    start);
  };
  document.addEventListener('click',     start);
  document.addEventListener('touchstart', start);
  document.addEventListener('keydown',    start);
}

function _buildAudio() {
  _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  _gainNode = _audioCtx.createGain();
  _gainNode.gain.setValueAtTime(0.0, _audioCtx.currentTime);
  _gainNode.gain.linearRampToValueAtTime(0.55, _audioCtx.currentTime + 4);
  _gainNode.connect(_audioCtx.destination);

  // MP3 laden und als Loop abspielen
  fetch('space-ambient.mp3')
    .then(r => r.arrayBuffer())
    .then(buf => _audioCtx.decodeAudioData(buf))
    .then(decoded => {
      const src  = _audioCtx.createBufferSource();
      src.buffer = decoded;
      src.loop   = true;   // nahtloser Loop
      src.connect(_gainNode);
      src.start(0);
    })
    .catch(err => console.warn('Audio konnte nicht geladen werden:', err));
}

function setAudioVolume(v) {
  if (!_gainNode) return;
  _gainNode.gain.setTargetAtTime(
    Math.max(0, Math.min(1, v)) * 0.55,
    _audioCtx.currentTime, 1.5
  );
}
