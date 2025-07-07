const axios = require('axios');

module.exports = function(app) {
  app.get('/ai/blackbox', async (req, res) => {
    try {
      const { text } = req.query;
      if (!text) {
        return res.status(400).json({ status: false, error: 'Parameter "text" wajib diisi' });
      }
      
      // Panggil API eksternal
      const { data } = await axios.get(`https://apizell.web.id/ai/blackbox?text=${encodeURIComponent(text)}`);
      
      // Pastikan response-nya sesuai struktur yang diharapkan
      const result = data?.result || data;
      
      res.status(200).json({
        status: true,
        result
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        error: error.response?.data?.message || error.message
      });
    }
  });
};