import { put } from '@vercel/blob';

const WEBHOOK_URL = 'https://dean-transmitted-neither-manner.trycloudflare.com';
const WEBHOOK_SECRET = 'importalo-ya-webhook-2026';

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
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        
        // Enviar webhook inmediatamente
        try {
            const webhookRes = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${WEBHOOK_SECRET}`
                },
                body: JSON.stringify({
                    phone: cleanPhone,
                    link,
                    title: title || 'Tu producto',
                    price
                })
            });
            
            if (webhookRes.ok) {
                return res.status(200).json({ success: true, sent: true });
            }
        } catch (webhookError) {
            console.error('Webhook error:', webhookError);
        }

        // Si el webhook falla, guardar en cola como backup
        const notification = {
            phone: cleanPhone,
            link,
            title: title || 'Producto',
            price: price || null,
            country: country || 'MLA',
            timestamp: Date.now(),
            sent: false
        };

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
