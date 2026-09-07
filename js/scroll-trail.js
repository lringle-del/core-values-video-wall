// As people scroll, real staff photos pop up briefly at the edge of the
// screen — a constant "people are already doing this" reminder that works
// on touch devices too (the cursor-trail effect only fires with a mouse).
(() => {
  const FALLBACK_PHOTOS = [
    { url: 'assets/staff-recording.jpg', name: 'Laura' },
    { url: 'assets/staff-aisayah.jpg', name: 'Aisayah' },
    { url: 'assets/staff-flojo.jpg', name: 'Flo Jo' },
    { url: 'assets/staff-jake.jpg', name: 'Jake' },
  ];

  let photos = FALLBACK_PHOTOS;

  fetch('/api/wall').then((r) => r.json()).then((data) => {
    const submitted = (data.entries || [])
      .filter((e) => e.thumbnailUrl)
      .map((e) => ({ url: e.thumbnailUrl, name: (e.name || '').split(' ')[0] }));
    if (submitted.length) photos = submitted.concat(FALLBACK_PHOTOS);
  }).catch(() => {});

  let lastY = window.scrollY;
  let lastSpawn = 0;
  const MIN_DELTA = 70;
  const MIN_INTERVAL = 350;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const now = performance.now();
    if (Math.abs(y - lastY) < MIN_DELTA || now - lastSpawn < MIN_INTERVAL) return;
    lastY = y;
    lastSpawn = now;
    spawnPopup();
  }, { passive: true });

  function spawnPopup() {
    const photo = photos[Math.floor(Math.random() * photos.length)];
    const fromLeft = Math.random() < 0.5;
    const top = 90 + Math.random() * (window.innerHeight - 220);

    const el = document.createElement('div');
    el.className = 'scroll-trail-photo' + (fromLeft ? ' from-left' : ' from-right');
    el.style.top = top + 'px';
    el.innerHTML = `
      <span class="avatar"><img src="${photo.url}" alt=""></span>
      <span>${photo.name ? escapeHtml(photo.name) + ' just recorded!' : 'Someone just recorded!'}</span>
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => el.classList.remove('in'), 1800);
    setTimeout(() => el.remove(), 2400);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
