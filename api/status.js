const { getUniqueParticipantCount } = require('../lib/data');
const { CAP, isOpen, getDeadline } = require('../lib/campaign');

module.exports = async (req, res) => {
  try {
    const participantCount = await getUniqueParticipantCount();
    const deadline = getDeadline();
    res.status(200).json({
      open: isOpen(participantCount),
      participantCount,
      cap: CAP,
      spotsLeft: Math.max(0, CAP - participantCount),
      deadlineISO: deadline ? deadline.toISOString() : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load campaign status.' });
  }
};
