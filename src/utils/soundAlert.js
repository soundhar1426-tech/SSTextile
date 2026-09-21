/**
 * Audio Chime & Browser Push Notification Utility
 * Provides instant sound alerts when new wholesale orders are placed.
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
      console.warn('[Sound Alert] Failed to create AudioContext:', e);
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
      console.warn('[Sound Alert] Audio resume error:', e);
    });
  } else if (ctx.state === 'running') {
    isAudioUnlocked = true;
  }
};

// Attach automatic unlock listeners to the document
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudio();
    // Remove listeners once unlocked
    ['click', 'touchstart', 'keydown', 'pointerdown'].forEach((evt) => {
      document.removeEventListener(evt, handleInteraction);
    });
  };

  ['click', 'touchstart', 'keydown', 'pointerdown'].forEach((evt) => {
    document.addEventListener(evt, handleInteraction, { once: true, passive: true });
  });
}

/**
 * Play pleasant 3-tone chime for incoming wholesale purchase orders
 * Tone 1 (D5 -> A5), Tone 2 (C6 -> D6), Tone 3 (E6 resonant decay)
 */
export const playNewOrderSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: Bright introductory ding (587.33 Hz to 880.00 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5

    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Harmonious middle chime (880.00 Hz to 1174.66 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.00, now + 0.14); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.32); // D6

    gain2.gain.setValueAtTime(0.4, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.6);

    // Tone 3: High crystal sparkle (1318.51 Hz / E6 to 1760.00 Hz / A6)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.51, now + 0.28); // E6
    osc3.frequency.exponentialRampToValueAtTime(1760.00, now + 0.45); // A6

    gain3.gain.setValueAtTime(0.3, now + 0.28);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.28);
    osc3.stop(now + 0.95);

  } catch (err) {
    console.warn('[Audio Alert] Sound playback notice:', err);
  }
};

/**
 * Optional speech announcement fallback
 */
export const announceNewOrder = (orderNumber, customerName) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const text = `New order ${orderNumber ? orderNumber.replace('GTX-', '') : ''} received from ${customerName || 'customer'}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[Speech Alert] Synthesis notice:', e);
    }
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
  announceNewOrder,
  unlockAudio,
  requestNotificationPermission,
  showDesktopNotification,
};
