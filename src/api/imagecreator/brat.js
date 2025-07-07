const fetch = require('node-fetch');

async function brat(text) {
    const url = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=false&delay=500`;
    const res = await fetch(url);
    
    if (!res.ok) {
        throw new Error(`Gagal mengambil gambar: ${res.statusText}`);
    }
    
    return await res.buffer();
}

module.exports = function(app) {
    app.get('/imagecreator/brat', async (req, res) => {
        const { text } = req.query;
        
        if (!text) {
            return res.status(400).json({ status: false, error: "Tolong masukkan text-nya" });
        }
        
        try {
            const imageBuffer = await brat(text);
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': imageBuffer.length,
            });
            res.end(imageBuffer);
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });
};