const { getDrive, isConfigured } = require('../lib/google');
const { getParticipantEmails, appendSubmission } = require('../lib/data');
const { canSpin } = require('../lib/campaign');
const { PRIZES, pickPrizeIndex } = require('../lib/prizes');
const { sendConfirmationEmail, sendTeamNotification } = require('../lib/email');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { driveFileId, thumbnailBase64, name, title, email, question, prizeIndex: shownPrizeIndex } = req.body || {};
  if (!driveFileId || !name || !title || !email || !question) {
    return res.status(400).json({ error: 'name, title, email, question, and driveFileId are required.' });
  }

  try {
    // The 150 cap is per PERSON, not per video — someone already in the
    // sheet keeps getting spins for their remaining videos even if new
    // people are now locked out.
    const existingEmails = await getParticipantEmails();
    const normalizedEmail = email.toLowerCase();
    const isExistingParticipant = existingEmails.map((e) => (e || '').toLowerCase()).includes(normalizedEmail);
    const uniqueParticipantCount = new Set(existingEmails.map((e) => (e || '').toLowerCase())).size;
    const eligible = canSpin({ uniqueParticipantCount, isExistingParticipant });
    const isTestimonialOnly = !eligible;

    let thumbnailFileId = null;
    if (thumbnailBase64) {
      thumbnailFileId = await uploadThumbnail(thumbnailBase64, `${name}-thumb.jpg`);
    }

    if (isConfigured() && !driveFileId.startsWith('dev-')) {
      await makePubliclyViewable(driveFileId);
    }

    // Honor the prize already shown to them at spin time (before they
    // recorded anything) so what they see matches what they get. Only
    // rolls a fresh one if none was passed along.
    let prizeIndex = null;
    let prize = null;
    if (!isTestimonialOnly) {
      prizeIndex = Number.isInteger(shownPrizeIndex) && PRIZES[shownPrizeIndex] ? shownPrizeIndex : pickPrizeIndex();
      prize = PRIZES[prizeIndex].label;
    }

    await appendSubmission([
      new Date().toISOString(),
      name,
      title,
      email,
      question,
      driveFileId,
      thumbnailFileId || '',
      prize || '',
      isTestimonialOnly ? 'yes' : 'no',
    ]);

    await Promise.all([
      !isTestimonialOnly ? sendConfirmationEmail({ toEmail: email, name, question, prize }) : Promise.resolve(),
      sendTeamNotification({ name, title, question, prize, isTestimonialOnly }),
    ]);

    res.status(200).json({ isTestimonialOnly, prize, prizeIndex, prizes: PRIZES });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to finalize submission.' });
  }
};

async function makePubliclyViewable(fileId) {
  const drive = await getDrive();
  await drive.permissions.create({ fileId, requestBody: { role: 'reader', type: 'anyone' } });
}

async function uploadThumbnail(base64, filename) {
  if (!isConfigured()) return `data:image/jpeg;base64,${base64}`;

  const drive = await getDrive();
  const buffer = Buffer.from(base64, 'base64');
  const { Readable } = require('stream');

  const file = await drive.files.create({
    requestBody: { name: filename, parents: [process.env.DRIVE_FOLDER_ID] },
    media: { mimeType: 'image/jpeg', body: Readable.from(buffer) },
    fields: 'id',
  });
  const fileId = file.data.id;

  // Public-readable so the wall page can render it via the thumbnail URL.
  await drive.permissions.create({ fileId, requestBody: { role: 'reader', type: 'anyone' } });

  return fileId;
}
