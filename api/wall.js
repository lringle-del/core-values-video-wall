const { getWallEntries } = require('../lib/data');

module.exports = async (req, res) => {
  try {
    const entries = await getWallEntries();
    res.status(200).json({ entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load the testimonial wall.' });
  }
};
