const { put, list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const pub = req.body;
        
        // Obtener publicaciones existentes
        let pubs = [];
        try {
            const { blobs } = await list({ prefix: 'publications.json' });
            if (blobs.length > 0) {
                const response = await fetch(blobs[0].downloadUrl);
                pubs = await response.json();
            }
        } catch (e) {
            pubs = [];
        }
        
        // Agregar nueva publicación
        pubs.unshift({
            ...pub,
            timestamp: Date.now()
        });
        
        // Mantener solo las últimas 15
        pubs = pubs.slice(0, 15);
        
        // Guardar
        await put('publications.json', JSON.stringify(pubs), {
            access: 'public',
            addRandomSuffix: false
        });
        
        return res.status(200).json({ success: true, count: pubs.length });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
