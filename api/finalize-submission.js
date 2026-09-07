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
    // Only 150 PEOPLE total, not 150 videos — someone already in the sheet
    // keeps submitting their remaining videos (up to 4) even after the cap
    // fills for new people. Once closed, new submissions are rejected
    // outright — every accepted video guarantees a prize, no exceptions.
    const existingEmails = await getParticipantEmails();
    const normalizedEmail = email.toLowerCase();
    const isExistingParticipant = existingEmails.map((e) => (e || '').toLowerCase()).includes(normalizedEmail);
    const uniqueParticipantCount = new Set(existingEmails.map((e) => (e || '').toLowerCase())).size;
    const eligible = canSpin({ uniqueParticipantCount, isExistingParticipant });

    if (!eligible) {
      return res.status(403).json({ closed: true, error: 'All 150 spots are filled and submissions are closed.' });
    }

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
    const prizeIndex = Number.isInteger(shownPrizeIndex) && PRIZES[shownPrizeIndex] ? shownPrizeIndex : pickPrizeIndex();
    const prize = PRIZES[prizeIndex].label;

    await appendSubmission([
      new Date().toISOString(),
      name,
      title,
      email,
      question,
      driveFileId,
      thumbnailFileId || '',
      prize,
      'no',
    ]);

    await Promise.all([
      sendConfirmationEmail({ toEmail: email, name, question, prize }),
      sendTeamNotification({ name, title, question, prize, isTestimonialOnly: false }),
    ]);

    res.status(200).json({ prize, prizeIndex, prizes: PRIZES });
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
