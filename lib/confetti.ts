export async function triggerConfetti() {
  if (typeof window === 'undefined') {
    return;
  }

  const { default: confetti } = await import('canvas-confetti');

  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 100,
  };

  const duration = 3000;
  const animationEnd = Date.now() + duration;

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = window.setInterval(() => {
    const remaining = animationEnd - Date.now();

    if (remaining <= 0) {
      window.clearInterval(interval);
      return;
    }

    const particleCount = 50 * (remaining / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}
