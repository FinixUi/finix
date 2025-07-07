const axios = require('axios');

module.exports = function(app) {
  app.get('/ai/islam', async (req, res) => {
    try {
      const { text } = req.query;
      if (!text) {
        return res.status(400).json({ status: false, error: 'Parameter "text" wajib diisi' });
      }
      
      const response = await axios.get(`https://apizell.web.id/ai/islam?text=${encodeURIComponent(text)}`);
      
      res.status(200).json({
        status: true,
        result: response.data.result || response.data
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.message
      });
    }
  });
};