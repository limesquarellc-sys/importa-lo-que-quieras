import { put, list } from '@vercel/blob';

export const config = { runtime: 'edge' };

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const pub = await request.json();
        
        // Obtener publicaciones existentes
        let pubs = [];
        try {
            const { blobs } = await list({ prefix: 'publications.json' });
            if (blobs.length > 0) {
                const res = await fetch(blobs[0].url);
                pubs = await res.json();
            }
        } catch (e) {
            pubs = [];
        }
        
        // Agregar nueva publicación al inicio
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
        
        return new Response(JSON.stringify({ success: true, count: pubs.length }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
