import { list } from '@vercel/blob';

export const config = { runtime: 'edge' };

export default async function handler(request) {
    try {
        const { blobs } = await list({ prefix: 'publications.json' });
        
        if (blobs.length === 0) {
            return new Response(JSON.stringify([]), {
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
        
        const res = await fetch(blobs[0].url);
        const pubs = await res.json();
        
        return new Response(JSON.stringify(pubs), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify([]), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
