const { getComments, appendComment } = require('../lib/data');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const comments = await getComments();
      return res.status(200).json({ comments });
    }

    if (req.method === 'POST') {
      const { name, comment } = req.body || {};
      if (!name || !comment) {
        return res.status(400).json({ error: 'name and comment are required.' });
      }
      if (comment.length > 500) {
        return res.status(400).json({ error: 'Comment is too long (500 characters max).' });
      }
      await appendComment(name, comment);
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load or save comments.' });
  }
};
