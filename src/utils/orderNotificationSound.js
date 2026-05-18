let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

/** Short two-tone chime for new orders (no external audio file). */
export function playNewOrderSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const tones = [
    { freq: 880, start: 0, duration: 0.18 },
    { freq: 1174.66, start: 0.14, duration: 0.22 },
  ];

  for (const { freq, start, duration } of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.62, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
    osc.start(now + start);
    osc.stop(now + start + duration + 0.05);
  }
}

/** Call once after user gesture so browsers allow sound on later polls. */
export function unlockOrderNotificationSound() {
  getAudioContext();
}
