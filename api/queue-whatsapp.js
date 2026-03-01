import { put } from '@vercel/blob';

export default async function handler(req, res) {
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
        const { phone, link, title, price, country } = req.body;

        if (!phone || !link) {
            return res.status(400).json({ error: 'Phone and link required' });
        }

        // Limpiar número
        let cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('00')) {
            cleanPhone = cleanPhone.slice(2);
        }
        
        const notification = {
            phone: cleanPhone,
            link,
            title: title || 'Tu producto',
            price: price || null,
            country: country || 'MLA',
            timestamp: Date.now(),
            sent: false
        };

        // Guardar en cola
        const filename = `whatsapp-queue/${Date.now()}-${cleanPhone}.json`;
        await put(filename, JSON.stringify(notification), {
            contentType: 'application/json',
            access: 'public'
        });

        return res.status(200).json({ success: true, queued: true });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}
