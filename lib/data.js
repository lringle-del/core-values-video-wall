// Google Sheet acts as the submissions "database" — one tab, one row per
// submission. Falls back to an in-memory list when Google isn't configured
// (local/dev mode) so the whole flow is still testable without real creds.
const { getSheets, isConfigured, SHEET_TAB, SHEET_HEADER } = require('./google');
const { DEMO_ENTRIES } = require('./demo-wall');

const devRows = [];

async function ensureHeader(sheets) {
  const sheetId = process.env.SHEET_ID;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${SHEET_TAB}!A1:I1` });
  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [SHEET_HEADER] },
    });
  }
}

// The 150 cap counts unique PEOPLE (by email), not videos — one person can
// submit up to 4 videos (one per question) and only occupies one cap slot.
async function getParticipantEmails() {
  if (!isConfigured()) return devRows.map((row) => row[3]);
  const sheets = await getSheets();
  await ensureHeader(sheets);
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: `${SHEET_TAB}!D2:D` });
  return (res.data.values || []).map((row) => row[0]);
}

async function getUniqueParticipantCount() {
  const emails = await getParticipantEmails();
  return new Set(emails.map((e) => (e || '').toLowerCase())).size;
}

async function appendSubmission(row) {
  // row: [timestamp, name, title, email, question, driveFileId, thumbnailFileId, prize, testimonialOnly]
  if (!isConfigured()) {
    devRows.unshift(row);
    return;
  }
  const sheets = await getSheets();
  await ensureHeader(sheets);
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: `${SHEET_TAB}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

async function getWallEntries() {
  if (!isConfigured()) {
    // No real backend connected yet. Show real submissions from this warm
    // serverless instance if there are any, otherwise fall back to the
    // placeholder demo set so the wall isn't empty while setup is pending.
    return devRows.length ? devRows.map(rowToWallEntry) : DEMO_ENTRIES;
  }
  const sheets = await getSheets();
  await ensureHeader(sheets);
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: process.env.SHEET_ID, range: `${SHEET_TAB}!A2:I` });
  const rows = res.data.values || [];
  return rows.map(rowToWallEntry).reverse(); // newest first
}

function rowToWallEntry(row) {
  const [timestamp, name, title, , question, driveFileId, thumbnailFileId] = row;
  return {
    timestamp,
    name,
    title,
    question,
    videoFileId: driveFileId,
    thumbnailUrl: thumbnailFileId ? `https://drive.google.com/thumbnail?id=${thumbnailFileId}&sz=w600` : null,
    videoUrl: driveFileId ? `https://drive.google.com/file/d/${driveFileId}/preview` : null,
  };
}

module.exports = { getParticipantEmails, getUniqueParticipantCount, appendSubmission, getWallEntries };
