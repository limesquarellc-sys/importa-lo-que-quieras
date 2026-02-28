const API_BASE = 'https://xxsdwlnvpbnhmjgniisy.supabase.co/functions/v1';
const ML_ACCOUNT_ID = '33d8aef7-c56c-46c4-8911-b7c6d748ccc5';

const formCard = document.getElementById('formCard');
const loadingCard = document.getElementById('loadingCard');
const resultCard = document.getElementById('resultCard');
const progressFill = document.getElementById('progressFill');
const loadingText = document.getElementById('loadingText');

async function savePub(pub) {
    try {
        await fetch('/api/save-pub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pub)
        });
        loadRecentPubs();
    } catch (e) {}
}

async function loadRecentPubs() {
    const container = document.getElementById('recentPubs');
    if (!container) return;
    
    const flags = { MLA: '🇦🇷', MLM: '🇲🇽', MLB: '🇧🇷', MLC: '🇨🇱', MCO: '🇨🇴' };
    
    try {
        const res = await fetch('/api/get-pubs');
        const pubs = await res.json();
        
        if (pubs && pubs.length > 0) {
            container.innerHTML = pubs.slice(0, 5).map(pub => `
                <a href="${pub.permalink}" target="_blank" class="pub-item">
                    <span class="pub-flag">${flags[pub.site] || '🌎'}</span>
                    <div class="pub-info">
                        <div class="pub-title">${pub.title || 'Producto'}</div>
                        <div class="pub-meta">
                            <span class="pub-price">$${pub.price?.toLocaleString() || '—'}</span>
                            · ${getTimeAgo(pub.timestamp)}
                        </div>
                    </div>
                </a>
            `).join('');
        } else {
            container.innerHTML = '<p class="empty-msg">Las publicaciones aparecerán aquí</p>';
        }
    } catch (e) {
        container.innerHTML = '<p class="empty-msg">Las publicaciones aparecerán aquí</p>';
    }
}

function getTimeAgo(ts) {
    if (!ts) return 'hace poco';
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'ahora';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

function extractAsin(input) {
    if (/^[A-Z0-9]{10}$/i.test(input)) return { asin: input.toUpperCase() };
    const match = input.match(/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/i);
    return match ? { asin: match[1].toUpperCase() } : { url: input };
}

function showCard(card) {
    [formCard, loadingCard, resultCard].forEach(c => c.classList.add('hidden'));
    card.classList.remove('hidden');
}

function updateProgress(percent, text) {
    progressFill.style.width = percent + '%';
    loadingText.textContent = text;
}

async function pollJobStatus(jobId) {
    const steps = [
        [15, 'Buscando en Amazon...'],
        [40, 'Extrayendo información...'],
        [70, 'Creando publicación...'],
        [90, 'Casi listo...']
    ];
    
    let stepIndex = 0;
    updateProgress(steps[0][0], steps[0][1]);
    
    for (let i = 0; i < 60; i++) {
        if (i > 0 && i % 5 === 0 && stepIndex < steps.length - 1) {
            stepIndex++;
            updateProgress(steps[stepIndex][0], steps[stepIndex][1]);
        }
        
        try {
            const res = await fetch(`${API_BASE}/api-job-status?jobId=${jobId}`);
            const data = await res.json();
            if (data.job?.is_completed) {
                updateProgress(100, '¡Listo!');
                return data;
            }
        } catch (e) {}
        
        await new Promise(r => setTimeout(r, 3000));
    }
    throw new Error('Timeout');
}

document.addEventListener('DOMContentLoaded', function() {
    loadRecentPubs();

    document.getElementById('publishForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productValue = document.getElementById('productInput').value.trim();
        const countryValue = document.getElementById('countrySelect').value;
        
        if (!productValue || !countryValue) {
            alert('Completá todos los campos');
            return;
        }
        
        showCard(loadingCard);
        updateProgress(5, 'Iniciando...');
        
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
            
            const data = await pollJobStatus(startData.jobId);
            const item = data.items?.[0];
            if (!item || item.error) throw new Error(item?.error || 'Sin resultados');
            
            const permalink = item.permalinks?.[countryValue];
            const price = item.ml_prices?.[countryValue];
            const title = item.title || productData.asin;
            
            if (!permalink) throw new Error('No se pudo crear');
            
            savePub({ title, permalink, site: countryValue, price });
            
            document.getElementById('resultLink').href = permalink;
            document.getElementById('resultPrice').textContent = price ? `Precio: $${price.toLocaleString()}` : '';
            
            showCard(resultCard);
            
        } catch (error) {
            alert('Error: ' + error.message);
            showCard(formCard);
        }
    });
});
