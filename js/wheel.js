// Canvas spin wheel. Segment sizes come from each prize's `weight`, so the
// wheel *looks* like some prizes are rarer — but the server already decided
// the winning index before we ever start spinning, so the animation just
// has to land there convincingly.
const SpinWheel = (() => {
  const COLORS = ['#1f4e79', '#d9572c', '#5b7fbd', '#b8451f', '#163a5c', '#8a9fc4'];
  let currentAngle = 0;

  function draw(canvas, prizes, angle = 0) {
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = cx - 6;
    const total = prizes.reduce((s, p) => s + p.weight, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    let start = -Math.PI / 2; // 12 o'clock
    prizes.forEach((p, i) => {
      const slice = (p.weight / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();

      ctx.save();
      ctx.rotate(start + slice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Segoe UI, sans-serif';
      wrapText(ctx, p.label, radius - 10, 0, 70, 12);
      ctx.restore();

      start += slice;
    });
    ctx.restore();

    // pointer
    ctx.beginPath();
    ctx.moveTo(cx - 10, 4);
    ctx.lineTo(cx + 10, 4);
    ctx.lineTo(cx, 24);
    ctx.closePath();
    ctx.fillStyle = '#20364a';
    ctx.fill();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    words.forEach((w) => {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line.trim());
        line = w + ' ';
      } else {
        line = test;
      }
    });
    lines.push(line.trim());
    const offset = -((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, y + offset + i * lineHeight));
  }

  function angleForIndex(prizes, index) {
    const total = prizes.reduce((s, p) => s + p.weight, 0);
    let start = 0;
    for (let i = 0; i < index; i++) start += prizes[i].weight;
    const sliceStart = (start / total) * Math.PI * 2;
    const sliceSize = (prizes[index].weight / total) * Math.PI * 2;
    return sliceStart + sliceSize / 2; // center of the winning slice, measured from 12 o'clock
  }

  function spinTo(canvas, prizes, index, onDone) {
    const targetSliceAngle = angleForIndex(prizes, index);
    // We rotate the wheel so the winning slice ends up under the pointer (12 o'clock).
    // Spin several full turns for suspense, then settle exactly on target.
    const fullTurns = 5 + Math.floor(Math.random() * 2);
    const finalAngle = fullTurns * Math.PI * 2 - targetSliceAngle;
    const duration = 3200;
    const start = performance.now();
    const from = currentAngle;
    const delta = finalAngle - from;

    function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const angle = from + delta * easeOutQuint(t);
      draw(canvas, prizes, angle);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        currentAngle = finalAngle % (Math.PI * 2);
        fireConfetti();
        onDone();
      }
    }
    requestAnimationFrame(frame);
  }

  function fireConfetti() {
    const colors = ['#d9572c', '#1f4e79', '#5b7fbd', '#b8451f'];
    for (let i = 0; i < 44; i++) {
      const el = document.createElement('div');
      const size = 6 + Math.random() * 6;
      el.style.position = 'fixed';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.top = '-10px';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.background = colors[i % colors.length];
      el.style.opacity = '0.9';
      el.style.zIndex = '999';
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      el.style.transition = `transform ${1.4 + Math.random()}s ease-out, opacity 1.8s ease-in`;
      document.body.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = `translate(${(Math.random() - 0.5) * 120}px, ${window.innerHeight + 40}px) rotate(${Math.random() * 720}deg)`;
        el.style.opacity = '0';
      });
      setTimeout(() => el.remove(), 2600);
    }
  }

  return { draw, spinTo };
})();
