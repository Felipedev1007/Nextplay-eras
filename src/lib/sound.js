// Lightweight retro sound generator using Web Audio API
let ctx = null;

const getCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

export const beep = (frequency = 440, duration = 0.1, type = 'square', volume = 0.15) => {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
};

export const playPongHit = () => beep(880, 0.05, 'square', 0.2);
export const playPongScore = () => beep(220, 0.3, 'square', 0.2);

export const playLaser = () => {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(880, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, audio.currentTime + 0.15);
  gain.gain.setValueAtTime(0.15, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.15);
};

export const playExplosion = () => {
  const audio = getCtx();
  if (!audio) return;
  const bufferSize = audio.sampleRate * 0.25;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const gain = audio.createGain();
  gain.gain.value = 0.2;
  noise.connect(gain);
  gain.connect(audio.destination);
  noise.start();
};

export const playCoin = () => {
  beep(988, 0.08, 'square', 0.15);
  setTimeout(() => beep(1318, 0.12, 'square', 0.15), 80);
};

export const playJump = () => {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(330, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, audio.currentTime + 0.1);
  gain.gain.setValueAtTime(0.12, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.1);
};

export const playChomp = () => beep(440, 0.04, 'square', 0.1);

export const playGunshot = () => {
  const audio = getCtx();
  if (!audio) return;
  const bufferSize = audio.sampleRate * 0.1;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.8;
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const gain = audio.createGain();
  gain.gain.value = 0.15;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  noise.start();
};

export const playSuccess = () => {
  beep(523, 0.1, 'square', 0.15);
  setTimeout(() => beep(659, 0.1, 'square', 0.15), 100);
  setTimeout(() => beep(784, 0.2, 'square', 0.15), 200);
};