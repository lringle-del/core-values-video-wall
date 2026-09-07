const { Resend } = require('resend');

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function getClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendConfirmationEmail({ toEmail, name, question, prize }) {
  if (!isConfigured()) {
    console.log(`[dev] would email ${toEmail}: won "${prize}" for answering "${question}"`);
    return;
  }
  const resend = getClient();
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `You won: ${prize}! 🎉`,
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thanks for sharing your Above &amp; Beyond core values story! Your spin landed on:</p>
      <h2>${escapeHtml(prize)}</h2>
      <p>Someone from our team will follow up with you on how to redeem it.</p>
      <p>Thanks for being part of Above &amp; Beyond ABA Therapy!</p>
    `,
  });
}

async function sendTeamNotification({ name, title, question, prize, isTestimonialOnly }) {
  const recipients = (process.env.TEAM_NOTIFY_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!isConfigured() || recipients.length === 0) {
    console.log(`[dev] would notify team about submission from ${name} (${title})`);
    return;
  }
  const resend = getClient();
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: recipients,
    subject: `New core values video: ${name}`,
    html: `
      <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(title)}) just submitted a video.</p>
      <p><strong>Question:</strong> ${escapeHtml(question)}</p>
      <p><strong>Result:</strong> ${isTestimonialOnly ? 'Testimonial only, no spin (campaign closed)' : `Won "${escapeHtml(prize)}"`}</p>
    `,
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = { isConfigured, sendConfirmationEmail, sendTeamNotification };
