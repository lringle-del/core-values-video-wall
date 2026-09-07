const { google } = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
];

let cachedAuth = null;

// Returns null in dev mode when no service account is configured, so callers
// can fall back to mock behavior instead of crashing.
function getAuth() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return null;
  if (cachedAuth) return cachedAuth;

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  cachedAuth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  return cachedAuth;
}

function isConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.DRIVE_FOLDER_ID && process.env.SHEET_ID);
}

async function getDrive() {
  const auth = getAuth();
  return google.drive({ version: 'v3', auth });
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

const SHEET_TAB = 'Submissions';
const SHEET_HEADER = ['Timestamp', 'Name', 'Title', 'Email', 'Question', 'DriveFileId', 'ThumbnailFileId', 'Prize', 'TestimonialOnly'];

const COMMENTS_TAB = 'Comments';
const COMMENTS_HEADER = ['Timestamp', 'Name', 'Comment'];

module.exports = { getAuth, getDrive, getSheets, isConfigured, SHEET_TAB, SHEET_HEADER, COMMENTS_TAB, COMMENTS_HEADER };
