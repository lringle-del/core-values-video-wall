const CAP = Number(process.env.SUBMISSION_CAP || 150);
const DAYS = Number(process.env.CAMPAIGN_DAYS || 10);

function getDeadline() {
  if (!process.env.CAMPAIGN_START_DATE) return null;
  const start = new Date(process.env.CAMPAIGN_START_DATE);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + DAYS * 24 * 60 * 60 * 1000);
}

function isWithinWindow() {
  const deadline = getDeadline();
  return !deadline || Date.now() < deadline.getTime();
}

// The cap is 150 PEOPLE, not 150 videos — one person can submit up to 4
// videos (one per question) and only takes one cap slot. New people stop
// getting spins once the cap is hit; someone already counted keeps getting
// spins for their remaining videos as long as the day-window is still open.
function isOpen(uniqueParticipantCount) {
  return isWithinWindow() && uniqueParticipantCount < CAP;
}

function canSpin({ uniqueParticipantCount, isExistingParticipant }) {
  if (!isWithinWindow()) return false;
  return isExistingParticipant || uniqueParticipantCount < CAP;
}

module.exports = { CAP, DAYS, getDeadline, isWithinWindow, isOpen, canSpin };
