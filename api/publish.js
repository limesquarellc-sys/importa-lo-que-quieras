module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { asin, url, country } = req.body;

    if (!asin && !url) {
      return res.status(400).json({ error: 'Se requiere ASIN o URL' });
    }

    if (!country) {
      return res.status(400).json({ error: 'Se requiere país' });
    }

    const payload = {
      mlAccountId: '33d8aef7-c56c-46c4-8911-b7c6d748ccc5',
      sites: [country]
    };

    if (asin) {
      payload.asin = asin;
    } else {
      payload.url = url;
    }

    const response = await fetch(
      'https://xxsdwlnvpbnhmjgniisy.supabase.co/functions/v1/api-publish',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    return res.status(response.ok ? 200 : 400).json(data);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno: ' + error.message });
  }
};
