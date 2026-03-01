const API = 'https://xxsdwlnvpbnhmjgniisy.supabase.co/functions/v1';
const ML_ID = '33d8aef7-c56c-46c4-8911-b7c6d748ccc5';

const form = document.getElementById('publishForm');
const loading = document.getElementById('loading');
const result = document.getElementById('result');

function show(el) {
    form.classList.add('hidden');
    loading.classList.add('hidden');
    result.classList.add('hidden');
    el.classList.remove('hidden');
}

async function loadRecent() {
    const c = document.getElementById('recentPubs');
    try {
        const r = await fetch('/api/get-pubs');
        const pubs = await r.json();
        if (pubs?.length) {
            c.innerHTML = pubs.slice(0,6).map(p => `
                <a href="${p.permalink}" target="_blank" class="pub">
                    <span class="pub-flag">${{MLA:'🇦🇷',MLM:'🇲🇽',MLB:'🇧🇷',MLC:'🇨🇱',MCO:'🇨🇴'}[p.site]||'🌎'}</span>
                    <div class="pub-info">
                        <div class="pub-title">${p.title||'Producto'}</div>
                        <div class="pub-meta"><span class="pub-price">$${p.price?.toLocaleString()||'—'}</span></div>
                    </div>
                </a>
            `).join('');
        } else {
            c.innerHTML = '<p class="empty">Las publicaciones aparecerán aquí</p>';
        }
    } catch(e) {
        c.innerHTML = '<p class="empty">Las publicaciones aparecerán aquí</p>';
    }
}

async function poll(jobId) {
    const txt = document.getElementById('loadingText');
    const msgs = ['Buscando producto...', 'Extrayendo información...', 'Creando publicación...', 'Casi listo...'];
    for (let i = 0; i < 60; i++) {
        txt.textContent = msgs[Math.min(Math.floor(i/15), 3)];
        try {
            const r = await fetch(`${API}/api-job-status?jobId=${jobId}`);
            const d = await r.json();
            if (d.job?.is_completed) return d;
        } catch(e) {}
        await new Promise(r => setTimeout(r, 3000));
    }
    throw new Error('Timeout - intentá de nuevo');
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('productInput').value.trim();
    const country = document.getElementById('countrySelect').value;
    if (!input || !country) return alert('Completá todos los campos');

    show(loading);

    try {
        const asin = input.match(/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/i)?.[1] || 
                     (/^[A-Z0-9]{10}$/i.test(input) ? input : null);
        
        const body = asin ? { asin: asin.toUpperCase() } : { url: input };
        body.mlAccountId = ML_ID;
        body.sites = [country];

        const start = await fetch(`${API}/api-publish-async`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(r => r.json());

        if (!start?.jobId) throw new Error('Error al iniciar');

        const data = await poll(start.jobId);
        const item = data.items?.[0];
        if (!item?.permalinks?.[country]) throw new Error(item?.error || 'No se pudo crear');

        await fetch('/api/save-pub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: item.title,
                permalink: item.permalinks[country],
                site: country,
                price: item.ml_prices?.[country]
            })
        });

        const permalink = item.permalinks[country];
        const price = item.ml_prices?.[country];
        const title = item.title;
        
        document.getElementById('resultLink').href = permalink;
        document.getElementById('resultPrice').textContent = price ? `Precio: $${price.toLocaleString()}` : '';
        
        // Enviar WhatsApp si hay número
        const whatsapp = document.getElementById('whatsappInput').value.trim();
        if (whatsapp) {
            fetch('/api/queue-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: whatsapp,
                    link: permalink,
                    title: title,
                    price: price,
                    country: country
                })
            }).catch(e => console.log('WhatsApp queue error:', e));
        }
        
        show(result);
        loadRecent();

    } catch(err) {
        alert('Error: ' + err.message);
        show(form);
    }
});

loadRecent();
