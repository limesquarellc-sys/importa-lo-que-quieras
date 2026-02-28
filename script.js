const API_BASE = 'https://xxsdwlnvpbnhmjgniisy.supabase.co/functions/v1';
const ML_ACCOUNT_ID = '33d8aef7-c56c-46c4-8911-b7c6d748ccc5';

async function savePub(pub) {
    try {
        await fetch('/api/save-pub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pub)
        });
        loadRecentPubs();
    } catch (e) {
        console.error('Error saving pub:', e);
    }
}

async function loadRecentPubs() {
    const container = document.getElementById('recentPubs');
    if (!container) return;
    
    const flags = { MLA: '🇦🇷', MLM: '🇲🇽', MLB: '🇧🇷', MLC: '🇨🇱', MCO: '🇨🇴' };
    
    try {
        const res = await fetch('/api/get-pubs');
        const pubs = await res.json();
        
        if (pubs && pubs.length > 0) {
            container.innerHTML = pubs.map(pub => `
                <a href="${pub.permalink}" target="_blank" class="pub-card">
                    <span class="pub-flag">${flags[pub.site] || '🌎'}</span>
                    <div class="pub-info">
                        <div class="pub-title">${pub.title || 'Producto'}</div>
                        <div class="pub-meta">
                            <span class="pub-price">$${pub.price?.toLocaleString() || '—'}</span>
                            <span> · ${getTimeAgo(pub.timestamp)}</span>
                        </div>
                    </div>
                </a>
            `).join('');
        } else {
            container.innerHTML = '<p class="empty-message">Las publicaciones aparecerán aquí</p>';
        }
    } catch (e) {
        container.innerHTML = '<p class="empty-message">Las publicaciones aparecerán aquí</p>';
    }
}

function getTimeAgo(timestamp) {
    if (!timestamp) return 'hace poco';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'hace segundos';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
}

function extractAsin(input) {
    if (/^[A-Z0-9]{10}$/i.test(input)) return { asin: input.toUpperCase() };
    const match = input.match(/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/i);
    return match ? { asin: match[1].toUpperCase() } : { url: input };
}

async function pollJobStatus(jobId, loadingText) {
    const messages = ['Buscando en Amazon...', 'Extrayendo información...', 'Creando publicación...', 'Casi listo...'];
    const steps = ['step1', 'step2', 'step3', 'step4'];
    for (let i = 0; i < 60; i++) {
        const stepIndex = Math.min(Math.floor(i / 15), 3);
        if (loadingText) loadingText.textContent = messages[stepIndex];
        // Animar pasos
        steps.forEach((id, idx) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('active', idx <= stepIndex);
        });
        try {
            const res = await fetch(`${API_BASE}/api-job-status?jobId=${jobId}`);
            const data = await res.json();
            if (data.job?.is_completed) return data;
        } catch (e) {}
        await new Promise(r => setTimeout(r, 3000));
    }
    throw new Error('Timeout');
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('publishForm');
    const productInput = document.getElementById('productInput');
    const countrySelect = document.getElementById('countrySelect');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const resultLink = document.getElementById('resultLink');
    const resultPrice = document.getElementById('resultPrice');
    const submitBtn = document.getElementById('submitBtn');
    const loadingText = document.getElementById('loadingText');

    loadRecentPubs();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productValue = productInput.value.trim();
        const countryValue = countrySelect.value;
        
        if (!productValue || !countryValue) {
            alert('Completá todos los campos');
            return;
        }
        
        form.style.display = 'none';
        result.classList.add('hidden');
        loading.classList.remove('hidden');
        submitBtn.disabled = true;
        
        try {
            const productData = extractAsin(productValue);
            
            const startRes = await fetch(`${API_BASE}/api-publish-async`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...productData, mlAccountId: ML_ACCOUNT_ID, sites: [countryValue] })
            });
            
            if (!startRes.ok) throw new Error('Error del servidor');
            
            const startData = await startRes.json();
            if (!startData?.jobId) throw new Error('No se pudo iniciar');
            
            const data = await pollJobStatus(startData.jobId, loadingText);
            const item = data.items?.[0];
            if (!item || item.error) throw new Error(item?.error || 'Sin resultados');
            
            const permalink = item.permalinks?.[countryValue];
            const price = item.ml_prices?.[countryValue];
            const title = item.title || productData.asin;
            
            if (!permalink) throw new Error('No se pudo crear la publicación');
            
            savePub({ title, permalink, site: countryValue, price });
            
            loading.classList.add('hidden');
            result.classList.remove('hidden');
            resultLink.href = permalink;
            
            if (price) {
                resultPrice.textContent = 'Precio: $' + price.toLocaleString();
                resultPrice.classList.remove('hidden');
            }
            
            productInput.value = '';
            
        } catch (error) {
            loading.classList.add('hidden');
            form.style.display = 'block';
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
        }
    });
});
