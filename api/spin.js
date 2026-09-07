const { getUniqueParticipantCount } = require('../lib/data');
const { isOpen } = require('../lib/campaign');
const { PRIZES, pickPrizeIndex } = require('../lib/prizes');

// Lets the visitor spin BEFORE recording anything, so they see what they'd
// win right away. Doesn't touch the sheet or reserve a cap slot — that only
// happens for real once they actually submit a video via finalize-submission,
// which is told which prize was already shown so the two stay in sync.
module.exports = async (req, res) => {
  try {
    const participantCount = await getUniqueParticipantCount();
    const open = isOpen(participantCount);
    if (!open) {
      return res.status(200).json({ open: false });
    }
    const prizeIndex = pickPrizeIndex();
    res.status(200).json({ open: true, prizeIndex, prize: PRIZES[prizeIndex].label, prizes: PRIZES });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to spin.' });
  }
};
