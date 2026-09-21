/**
 * Audio Pop Sound & Browser Push Notification Utility
 * Provides an instant, crisp, tactile POP sound effect when orders are placed.
 * (No voice/speech synthesis - pure bubble pop sound effect)
 */

let sharedAudioContext = null;
let isAudioUnlocked = false;

// Initialize or get the shared AudioContext
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    try {
      sharedAudioContext = new AudioContext();
    } catch (e) {
      console.warn('[Pop Sound] Failed to create AudioContext:', e);
    }
  }

  return sharedAudioContext;
};

// Unlock AudioContext on first user interaction (bypasses browser autoplay restrictions)
export const unlockAudio = () => {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      isAudioUnlocked = true;
    }).catch((e) => {
      console.warn('[Pop Sound] Audio resume error:', e);
    });
  } else if (ctx.state === 'running') {
    isAudioUnlocked = true;
  }
};

// Attach automatic unlock listeners to the document
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudio();
    ['click', 'touchstart', 'keydown', 'pointerdown'].forEach((evt) => {
      document.removeEventListener(evt, handleInteraction);
    });
  };

  ['click', 'touchstart', 'keydown', 'pointerdown'].forEach((evt) => {
    document.addEventListener(evt, handleInteraction, { once: true, passive: true });
  });
}

/**
 * Play a crisp, modern, satisfying double "POP" / "BUBBLE POP" sound effect
 */
export const playNewOrderSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playTones = (audioCtx) => {
      const now = audioCtx.currentTime;

      // --- POP 1: Low-to-high juicy bubble pop ---
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      // Rapid upward frequency swoop characteristic of a bubble pop
      osc1.frequency.setValueAtTime(450, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      gain1.gain.setValueAtTime(0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.08);

      // --- POP 2: Crisp snappy transient pop (slightly offset for double pop effect) ---
      const pop2Time = now + 0.07;
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      // Higher pitch snap for that tactile message pop
      osc2.frequency.setValueAtTime(750, pop2Time);
      osc2.frequency.exponentialRampToValueAtTime(1800, pop2Time + 0.04);

      gain2.gain.setValueAtTime(0.7, pop2Time);
      gain2.gain.exponentialRampToValueAtTime(0.001, pop2Time + 0.09);

      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(pop2Time);
      osc2.stop(pop2Time + 0.09);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        playTones(ctx);
      }).catch(() => {
        playTones(ctx);
      });
    } else {
      playTones(ctx);
    }
  } catch (err) {
    console.warn('[Pop Sound Alert] Sound playback notice:', err);
  }
};

/**
 * Request desktop push notification permission
 */
export const requestNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (e) {
      console.warn('[Push Notification] Permission request notice:', e);
    }
  }
};

/**
 * Display desktop push notification
 */
export const showDesktopNotification = (title, body) => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    } catch (e) {
      console.warn('[Push Notification] Dispatch notice:', e);
    }
  }
};

export default {
  playNewOrderSound,
  unlockAudio,
  requestNotificationPermission,
  showDesktopNotification,
};
