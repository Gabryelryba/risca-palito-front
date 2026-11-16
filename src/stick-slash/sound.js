// Procedurally synthesized slash/snap sounds via Web Audio API, so the
// scaffold makes noise with zero external asset files. Swap in real
// samples later by replacing playSlash()/playSnap() with buffer playback.

let ctx = null;
let noiseBuffer = null;

function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function getNoiseBuffer(audioCtx) {
  if (noiseBuffer) return noiseBuffer;
  const length = audioCtx.sampleRate * 0.3;
  noiseBuffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

// A quick whoosh-and-snap, used whenever one or more sticks get crossed.
export function playSlash(intensity = 1) {
  const audioCtx = getContext();
  const now = audioCtx.currentTime;

  const noise = audioCtx.createBufferSource();
  noise.buffer = getNoiseBuffer(audioCtx);

  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.Q.value = 0.7;
  bandpass.frequency.setValueAtTime(4200, now);
  bandpass.frequency.exponentialRampToValueAtTime(600, now + 0.16);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.5 * intensity, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

  noise.connect(bandpass).connect(gain).connect(audioCtx.destination);
  noise.start(now);
  noise.stop(now + 0.22);

  const snap = audioCtx.createOscillator();
  snap.type = "square";
  snap.frequency.setValueAtTime(180, now + 0.03);
  snap.frequency.exponentialRampToValueAtTime(60, now + 0.09);

  const snapGain = audioCtx.createGain();
  snapGain.gain.setValueAtTime(0.0001, now + 0.03);
  snapGain.gain.exponentialRampToValueAtTime(0.3 * intensity, now + 0.045);
  snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  snap.connect(snapGain).connect(audioCtx.destination);
  snap.start(now + 0.03);
  snap.stop(now + 0.13);
}

// A low, ominous thud — used for the one stick whose crossing ends the
// game (distinct from the light whoosh-and-snap of a normal slash).
export function playFatalCross() {
  const audioCtx = getContext();
  const now = audioCtx.currentTime;

  const gong = audioCtx.createOscillator();
  gong.type = "sine";
  gong.frequency.setValueAtTime(220, now);
  gong.frequency.exponentialRampToValueAtTime(65, now + 0.5);

  const gongGain = audioCtx.createGain();
  gongGain.gain.setValueAtTime(0.0001, now);
  gongGain.gain.exponentialRampToValueAtTime(0.4, now + 0.03);
  gongGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  gong.connect(gongGain).connect(audioCtx.destination);
  gong.start(now);
  gong.stop(now + 0.65);

  const thud = audioCtx.createBufferSource();
  thud.buffer = getNoiseBuffer(audioCtx);

  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.setValueAtTime(900, now);
  lowpass.frequency.exponentialRampToValueAtTime(180, now + 0.3);

  const thudGain = audioCtx.createGain();
  thudGain.gain.setValueAtTime(0.0001, now);
  thudGain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  thud.connect(lowpass).connect(thudGain).connect(audioCtx.destination);
  thud.start(now);
  thud.stop(now + 0.3);
}

// A short descending tone for game-over (misere loss/win).
export function playGameOver(won) {
  const audioCtx = getContext();
  const now = audioCtx.currentTime;
  const notes = won ? [523, 659, 784] : [392, 330, 262];

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const gain = audioCtx.createGain();
    const start = now + i * 0.14;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + 0.32);
  });
}
