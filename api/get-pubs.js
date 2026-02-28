const { list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const { blobs } = await list({ prefix: 'publications.json' });
        
        if (blobs.length === 0) {
            return res.status(200).json([]);
        }
        
        const response = await fetch(blobs[0].downloadUrl);
        const pubs = await response.json();
        
        return res.status(200).json(pubs);
    } catch (error) {
        console.error('Error:', error);
        return res.status(200).json([]);
    }
};
