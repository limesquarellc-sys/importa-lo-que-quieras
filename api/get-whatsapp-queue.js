import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { blobs } = await list({ prefix: 'whatsapp-queue/' });
        
        const pending = [];
        for (const blob of blobs) {
            try {
                const response = await fetch(blob.url);
                const data = await response.json();
                if (!data.sent) {
                    pending.push({
                        ...data,
                        blobUrl: blob.url,
                        pathname: blob.pathname
                    });
                }
            } catch (e) {
                console.error('Error reading blob:', e);
            }
        }

        return res.status(200).json(pending);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
