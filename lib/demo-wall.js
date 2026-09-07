// Placeholder wall entries shown on the live site ONLY until the real
// Google Sheets/Drive backend is connected (see lib/google.js isConfigured).
// Once real credentials are set, this is bypassed entirely — getWallEntries
// only reaches for this when there are zero real rows to show yet.
// Photos are the real staff stills already committed under /assets; there's
// no publicly hosted video for these yet, so clicking a card shows the
// still photo instead of playing a video.
const DEMO_ENTRIES = [
  { name: 'Laura Jackson', title: 'Team Member', question: "Question 1: What helps you do your best work here?", thumbnailUrl: 'assets/staff-recording.jpg', videoUrl: null },
  { name: 'Aisayah McCray', title: 'Team Member', question: "Question 2: When have you felt really supported here?", thumbnailUrl: 'assets/staff-aisayah.jpg', videoUrl: null },
  { name: 'Flo Jo', title: 'Team Member', question: "Question 3: In what way is ABT's level of care superior?", thumbnailUrl: 'assets/staff-flojo.jpg', videoUrl: null },
  { name: 'Jake Adkisson', title: 'Team Member', question: "Question 4: Does your voice matter here?", thumbnailUrl: 'assets/staff-jake.jpg', videoUrl: null },
];

module.exports = { DEMO_ENTRIES };
