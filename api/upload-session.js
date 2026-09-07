const { getAuth, isConfigured } = require('../lib/google');

// Opens a Google Drive v3 resumable-upload session and hands the browser
// only the one-time session URL — never our service account's bearer token.
// The browser then PUTs the video bytes straight to Google, so the video
// never passes through this function (avoids Vercel's ~4.5MB body limit).
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { filename, mimeType, sizeBytes } = req.body || {};
  if (!filename || !mimeType || !sizeBytes) {
    return res.status(400).json({ error: 'filename, mimeType, and sizeBytes are required.' });
  }

  if (!isConfigured()) {
    // Dev/local fallback: no real Drive session, client will skip the
    // direct-to-Google PUT and just simulate progress.
    return res.status(200).json({ devMode: true, fakeFileId: `dev-${Date.now()}` });
  }

  try {
    const auth = getAuth();
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();

    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(sizeBytes),
      },
      body: JSON.stringify({ name: filename, parents: [process.env.DRIVE_FOLDER_ID] }),
    });

    if (!initRes.ok) {
      const text = await initRes.text();
      console.error('Drive session init failed', initRes.status, text);
      return res.status(502).json({ error: 'Could not start the upload with Google Drive.' });
    }

    const uploadUrl = initRes.headers.get('location');
    res.status(200).json({ uploadUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create upload session.' });
  }
};
