const SUPABASE_URL = 'https://odykvbnkxtgxbeiaqcxz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9keWt2Ym5reHRneGJlaWFxY3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjkxNjEsImV4cCI6MjA4ODA0NTE2MX0.eZKmBG0C-Yu2cjLG2iktFDP8e-obD7aRJ6w5wvxJsGY';

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/publications?select=*&order=timestamp.desc&limit=15`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );
        
        const pubs = await response.json();
        return res.status(200).json(pubs || []);
    } catch (error) {
        console.error('Error:', error);
        return res.status(200).json([]);
    }
};
