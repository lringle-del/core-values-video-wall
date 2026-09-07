const Wall = (() => {
  async function load() {
    const grid = document.getElementById('wall-grid');
    const empty = document.getElementById('wall-empty');
    try {
      const res = await fetch('/api/wall');
      const { entries } = await res.json();
      grid.innerHTML = '';
      empty.hidden = entries.length > 0;
      entries.forEach((entry) => grid.appendChild(renderCard(entry)));
    } catch (err) {
      grid.innerHTML = '';
      empty.hidden = false;
      empty.textContent = 'Could not load the wall right now. Try again shortly.';
    }
  }

  function renderCard(entry) {
    const card = document.createElement('button');
    card.className = 'wall-card';
    card.innerHTML = `
      <img src="${entry.thumbnailUrl || 'assets/brand/logo.png'}" alt="${escapeHtml(entry.name)}'s video thumbnail" loading="lazy">
      <div class="meta">
        <strong>${escapeHtml(entry.name)}</strong>
        <span class="role">${escapeHtml(entry.title)}</span>
        <span class="quote">"${escapeHtml(entry.question)}"</span>
      </div>
    `;
    card.addEventListener('click', () => openLightbox(entry));
    return card;
  }

  function openLightbox(entry) {
    const backdrop = document.getElementById('lightbox');
    const box = document.getElementById('lightbox-box');
    const caption = document.getElementById('lightbox-caption');

    if (entry.videoUrl && entry.videoUrl.includes('drive.google.com')) {
      box.innerHTML = `<iframe src="${entry.videoUrl}" allow="autoplay" allowfullscreen></iframe>`;
    } else if (entry.videoUrl) {
      box.innerHTML = `<video src="${entry.videoUrl}" controls autoplay playsinline></video>`;
    } else {
      box.innerHTML = `<img src="${entry.thumbnailUrl || 'assets/brand/logo.png'}" alt="Thumbnail preview">`;
    }
    caption.textContent = `${entry.name}, ${entry.title}`;
    backdrop.hidden = false;
  }

  function closeLightbox() {
    document.getElementById('lightbox').hidden = true;
    document.getElementById('lightbox-box').innerHTML = '';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });

  return { load };
})();
