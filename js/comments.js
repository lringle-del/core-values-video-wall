const Comments = (() => {
  async function load() {
    const list = document.getElementById('comment-list');
    try {
      const res = await fetch('/api/comments');
      const { comments } = await res.json();
      list.innerHTML = comments.length
        ? comments.map(renderComment).join('')
        : '<p class="comment-empty">No comments yet. Be the first!</p>';
    } catch {
      list.innerHTML = '<p class="comment-empty">Could not load comments right now.</p>';
    }
  }

  function renderComment(c) {
    return `
      <div class="comment">
        <strong>${escapeHtml(c.name)}</strong>
        <p>${escapeHtml(c.comment)}</p>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('comment-name').value.trim();
    const comment = document.getElementById('comment-text').value.trim();
    const errorEl = document.getElementById('comment-error');
    const btn = document.getElementById('comment-submit-btn');
    errorEl.hidden = true;

    if (!name || !comment) {
      errorEl.textContent = 'Add your name and a comment first.';
      errorEl.hidden = false;
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Posting…';
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, comment }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Could not post your comment.');

      document.getElementById('comment-form').reset();
      await load();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Post comment';
    }
  });

  return { load };
})();

Comments.load();
