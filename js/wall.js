const Wall = (() => {
  async function load() {
    const track = document.getElementById('wall-track');
    const empty = document.getElementById('wall-empty');
    try {
      const res = await fetch('/api/wall');
      const { entries } = await res.json();
      track.innerHTML = '';
      empty.hidden = entries.length > 0;
      track.parentElement.hidden = entries.length === 0;

      if (entries.length > 0) {
        // Render the set twice back to back so the CSS scroll animation can
        // loop seamlessly from the end of the first copy into the second.
        [...entries, ...entries].forEach((entry) => track.appendChild(renderCard(entry)));
        const singleSetWidth = track.scrollWidth / 2;
        track.style.setProperty('--wall-scroll-distance', `-${singleSetWidth}px`);
        const duration = Math.max(20, entries.length * 6);
        track.style.setProperty('--wall-scroll-duration', `${duration}s`);
      }
    } catch (err) {
      track.innerHTML = '';
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
