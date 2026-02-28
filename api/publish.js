export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { asin, url, country } = body;

    if (!asin && !url) {
      return new Response(JSON.stringify({ error: 'Se requiere ASIN o URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!country) {
      return new Response(JSON.stringify({ error: 'Se requiere país' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = {
      mlAccountId: '33d8aef7-c56c-46c4-8911-b7c6d748ccc5',
      sites: [country],
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
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.ok ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
