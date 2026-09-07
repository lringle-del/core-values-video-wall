// As the pointer moves over the hero section (but not over the spin-to-win
// card itself, which needs a normal, uncluttered cursor), leave a trail of
// real staff photos behind it, so the page keeps reminding you people are
// already doing this. The rest of the page uses the scroll-triggered
// pop-ups instead. Touch devices simply never fire enough mousemove events
// for this to matter, so no gate is needed to skip them.
(() => {
  const hero = document.querySelector('.hero');
  const spinCardArea = document.querySelector('.hero-spin');
  if (!hero) return;

  const PHOTOS = [
    'assets/staff-recording.jpg',
    'assets/staff-aisayah.jpg',
    'assets/staff-flojo.jpg',
    'assets/staff-jake.jpg',
  ];

  let lastSpawn = 0;
  let lastX = null;
  let lastY = null;
  const MIN_DISTANCE = 40;
  const MIN_INTERVAL = 100;

  hero.addEventListener('mousemove', (e) => {
    if (spinCardArea && spinCardArea.contains(e.target)) return;
    const now = performance.now();
    if (now - lastSpawn < MIN_INTERVAL) return;
    if (lastX !== null) {
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist < MIN_DISTANCE) return;
    }
    lastSpawn = now;
    lastX = e.clientX;
    lastY = e.clientY;
    spawnTrailPhoto(e.clientX, e.clientY);
  });

  function spawnTrailPhoto(x, y) {
    const el = document.createElement('div');
    el.className = 'cursor-trail-photo';
    el.style.backgroundImage = `url(${PHOTOS[Math.floor(Math.random() * PHOTOS.length)]})`;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.transform = `translate(-50%, -50%) rotate(${(Math.random() * 20 - 10).toFixed(1)}deg)`;
    document.body.appendChild(el);
    // Stay fully visible for a beat before fading, otherwise it never reads as visible.
    setTimeout(() => el.classList.add('fade'), 500);
    setTimeout(() => el.remove(), 1300);
  }
})();
