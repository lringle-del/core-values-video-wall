const QUESTIONS = [
  {
    id: 1,
    text: "What helps you do your best work here?",
    samples: "Trainings that taught you something new. Tuition assistance. Workflow improvements. Getting recognized for going above and beyond.",
  },
  {
    id: 2,
    text: "When have you felt really supported here?",
    samples: "Times the admin side made your job easier. A moment you got celebrated. A time your work-life balance was actually respected.",
  },
  {
    id: 3,
    text: "In what way is ABT's level of care superior?",
    samples: "An example that shows care comes first here. Why you're proud to be part of it.",
  },
  {
    id: 4,
    text: "Does your voice matter here?",
    samples: "Yes or no, and how. A time speaking up actually changed something.",
  },
];

const STORAGE_KEY = 'cv_answered_questions';
let campaignStatus = { open: true, spotsLeft: null, deadlineISO: null };
let selectedQuestion = null;

// What the last spin revealed, carried through question selection + upload
// so the prize they claim always matches the one they were shown.
let pendingSpin = null; // { isTestimonialOnly, prizeIndex, prize, prizes }

function getAnswered() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function markAnswered(id) {
  const answered = getAnswered();
  if (!answered.includes(id)) answered.push(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(answered));
}

function daysLeftText(deadlineISO) {
  const msLeft = new Date(deadlineISO).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return 'Last day!';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

// ---------------- status ----------------
async function loadStatus() {
  try {
    const res = await fetch('/api/status');
    campaignStatus = await res.json();
  } catch {
    campaignStatus = { open: true, spotsLeft: null, deadlineISO: null };
  }
  renderStatusPills();
  renderCountdownBar();
}

function renderCountdownBar() {
  const bar = document.getElementById('countdown-bar');
  bar.hidden = false;
  if (!campaignStatus.open) {
    bar.classList.add('closing');
    bar.textContent = 'This campaign is now closed. Thanks to everyone who recorded a video!';
    return;
  }
  bar.classList.remove('closing');
  const dayTxt = campaignStatus.deadlineISO ? daysLeftText(campaignStatus.deadlineISO) : null;
  bar.innerHTML = `Only <strong>150 spots</strong> total, ${campaignStatus.spotsLeft ?? '...'} left` + (dayTxt ? ` &middot; <strong>${dayTxt}</strong> to record your video` : '');
}

function renderStatusPills() {
  const pills = document.getElementById('status-pills');
  pills.hidden = false;
  if (campaignStatus.open) {
    const deadlineTxt = campaignStatus.deadlineISO ? daysLeftText(campaignStatus.deadlineISO) : '';
    pills.innerHTML = `
      <span class="pill"><strong>${campaignStatus.spotsLeft ?? '...'}</strong> of ${campaignStatus.cap ?? 150} spots left</span>
      ${deadlineTxt ? `<span class="pill pill-countdown"><strong>${deadlineTxt}</strong></span>` : ''}
    `;
  } else {
    pills.innerHTML = `<span class="pill pill-closed">All 150 spots are filled. Submissions are closed.</span>`;
  }
}

// ---------------- step 1: spin ----------------
function resetSpinCard() {
  const answered = getAnswered();
  const spinCard = document.getElementById('spin-card');
  const spinTitle = document.getElementById('spin-title');
  const spinNote = document.getElementById('spin-note');
  const canvas = document.getElementById('wheel-canvas');
  const reveal = document.getElementById('spin-prize-reveal');
  const spinBtn = document.getElementById('spin-btn');
  const continueBtn = document.getElementById('spin-continue-btn');

  pendingSpin = null;
  document.getElementById('question-picker-card').hidden = true;
  document.getElementById('upload-card').hidden = true;

  if (answered.length >= QUESTIONS.length) {
    spinCard.hidden = false;
    canvas.hidden = true;
    reveal.hidden = true;
    spinBtn.hidden = true;
    continueBtn.hidden = true;
    spinTitle.textContent = 'You\'re 4 for 4!';
    spinNote.textContent = 'Thank you for being part of this. Check the wall below to see yourself alongside your teammates.';
    return;
  }

  spinCard.hidden = false;
  spinTitle.textContent = 'Spin to win!';
  spinNote.textContent = 'Everybody wins something good. Spin now, then record your video to claim it.';
  canvas.hidden = false;
  SpinWheel.draw(canvas, DEFAULT_WHEEL_PRIZES, 0);
  reveal.hidden = true;
  spinBtn.hidden = false;
  spinBtn.disabled = false;
  spinBtn.textContent = 'Spin now';
  continueBtn.hidden = true;
  continueBtn.classList.remove('btn-huge');
}

// Mirrors lib/prizes.js — shown before the real spin so the reels look
// like a real machine from the start instead of a placeholder.
const DEFAULT_WHEEL_PRIZES = [
  { label: '$10 Gift Card', weight: 3 },
  { label: '$25 Gift Card', weight: 1 },
  { label: 'Company Swag Pack', weight: 3 },
  { label: 'Extra PTO Hour', weight: 1 },
  { label: 'Coffee Gift Card', weight: 3 },
  { label: 'Mystery Prize', weight: 2 },
];

document.getElementById('spin-btn').addEventListener('click', async () => {
  const spinBtn = document.getElementById('spin-btn');
  const spinTitle = document.getElementById('spin-title');
  const spinNote = document.getElementById('spin-note');
  const canvas = document.getElementById('wheel-canvas');
  const reveal = document.getElementById('spin-prize-reveal');
  const continueBtn = document.getElementById('spin-continue-btn');

  spinBtn.disabled = true;
  spinBtn.textContent = 'Spinning…';

  try {
    const res = await fetch('/api/spin');
    const data = await res.json();

    if (!data.open) {
      pendingSpin = null;
      canvas.hidden = true;
      spinBtn.hidden = true;
      continueBtn.hidden = true;
      spinTitle.textContent = 'This campaign is closed';
      spinNote.textContent = 'All 150 spots have been filled. Thanks to everyone who recorded a video!';
      return;
    }

    pendingSpin = { prizeIndex: data.prizeIndex, prize: data.prize, prizes: data.prizes };
    SpinWheel.draw(canvas, data.prizes, 0);
    spinTitle.textContent = 'Spinning…';
    SpinWheel.spinTo(canvas, data.prizes, data.prizeIndex, () => {
      spinTitle.textContent = 'You won!';
      reveal.hidden = false;
      reveal.textContent = data.prize;
      spinNote.textContent = 'A confirmation email goes out once you submit your video.';
      spinBtn.hidden = true;
      continueBtn.hidden = false;
      continueBtn.classList.add('btn-huge');
      continueBtn.textContent = 'Record your video to claim your prize';
    });
  } catch {
    spinBtn.disabled = false;
    spinBtn.textContent = 'Spin now';
    spinNote.textContent = 'Something went wrong. Please try again.';
  }
});

document.getElementById('spin-continue-btn').addEventListener('click', () => {
  document.getElementById('spin-card').hidden = true;
  document.getElementById('question-picker-card').hidden = false;
  renderQuestionGrid();
});

// ---------------- step 2: question picker ----------------
function renderQuestionGrid() {
  const grid = document.getElementById('question-grid');
  const answered = getAnswered();
  grid.innerHTML = '';
  QUESTIONS.forEach((q) => {
    const done = answered.includes(q.id);
    const btn = document.createElement('button');
    btn.className = 'question-card';
    btn.disabled = done;
    btn.innerHTML = `<span class="q-num">Question ${String(q.id).padStart(2, '0')}</span><p>${q.text}</p>${done ? '<span class="done-badge">✓ Submitted</span>' : ''}`;
    btn.addEventListener('click', () => selectQuestion(q));
    grid.appendChild(btn);
  });
}

function selectQuestion(q) {
  selectedQuestion = q;
  document.getElementById('question-picker-card').hidden = true;
  document.getElementById('upload-card').hidden = false;
  document.getElementById('selected-question-text').textContent = `Question ${q.id}: ${q.text}`;
  document.getElementById('sample-ideas').textContent = q.samples ? `Ideas to spark it: ${q.samples}` : '';
  resetUploadForm();
}

function resetUploadForm() {
  document.getElementById('upload-form').hidden = false;
  document.getElementById('submit-success').hidden = true;
  document.getElementById('upload-form').reset();
  document.getElementById('record-btn').hidden = false;
  document.getElementById('video-chosen').hidden = true;
  document.getElementById('details-fields').hidden = true;
  document.getElementById('form-error').hidden = true;
}

document.getElementById('cancel-btn').addEventListener('click', () => {
  document.getElementById('question-picker-card').hidden = false;
  document.getElementById('upload-card').hidden = true;
});

// ---------------- step 3: record & submit ----------------
document.getElementById('record-btn').addEventListener('click', () => {
  document.getElementById('video-file').click();
});

document.getElementById('retake-btn').addEventListener('click', () => {
  resetUploadForm();
});

document.getElementById('video-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById('record-btn').hidden = true;
  document.getElementById('video-chosen').hidden = false;
  document.getElementById('details-fields').hidden = false;

  try {
    const { dataUrl } = await Uploader.captureThumbnail(file);
    document.getElementById('thumb-preview').src = dataUrl;
  } catch {
    // Thumbnail capture is a nice-to-have; ignore failures silently.
  }
});

document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('video-file').files[0];
  const name = document.getElementById('field-name').value.trim();
  const title = document.getElementById('field-title').value.trim();
  const email = document.getElementById('field-email').value.trim();
  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');
  errorEl.hidden = true;

  if (!file || !name || !title || !email) {
    errorEl.textContent = 'Please fill out every field and choose a video.';
    errorEl.hidden = false;
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Uploading…';
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  progressBar.hidden = false;
  progressFill.style.width = '0%';

  try {
    const thumb = await Uploader.captureThumbnail(file).catch(() => null);
    const driveFileId = await Uploader.uploadVideo(file, (pct) => { progressFill.style.width = pct + '%'; });

    submitBtn.textContent = 'Finishing up…';
    const res = await fetch('/api/finalize-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driveFileId,
        thumbnailBase64: thumb ? thumb.base64 : null,
        name, title, email,
        question: `Question ${selectedQuestion.id}: ${selectedQuestion.text}`,
        prizeIndex: pendingSpin ? pendingSpin.prizeIndex : undefined,
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Submission failed. Please try again.');

    markAnswered(selectedQuestion.id);
    loadStatus();
    Wall.load();
    showSubmitSuccess(result);
  } catch (err) {
    errorEl.textContent = err.message || 'Something went wrong. Please try again.';
    errorEl.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Upload & claim your prize';
    progressBar.hidden = true;
  }
});

function showSubmitSuccess(result) {
  document.getElementById('upload-form').hidden = true;
  document.getElementById('submit-success').hidden = false;
  const textEl = document.getElementById('submit-success-text');
  const noteEl = document.getElementById('submit-success-note');
  const continueBtn = document.getElementById('submit-success-continue-btn');
  textEl.textContent = result.prize;
  noteEl.textContent = 'Claimed! A confirmation email is on its way to you.';
  continueBtn.textContent = getAnswered().length >= QUESTIONS.length
    ? 'See the wall'
    : 'Spin again & record another video';
}

document.getElementById('submit-success-continue-btn').addEventListener('click', () => {
  document.getElementById('upload-card').hidden = true;
  resetSpinCard();
});

// ---------------- init ----------------
loadStatus();
resetSpinCard();
Wall.load();
