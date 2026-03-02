const SUPABASE_URL = 'https://odykvbnkxtgxbeiaqcxz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWt2Ym5reHRneGJlaWFxY3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjkxNjEsImV4cCI6MjA4ODA0NTE2MX0.eZKmBG0C-Yu2cjLG2iktFDP8e-obD7aRJ6w5wvxJsGY';

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
        
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/publications`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    title: pub.title,
                    permalink: pub.permalink,
                    site: pub.site,
                    price: pub.price,
                    timestamp: Date.now()
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`Supabase error: ${response.status}`);
        }
        
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
