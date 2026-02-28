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

    const API_BASE = 'https://xxsdwlnvpbnhmjgniisy.supabase.co/functions/v1';
    const ML_ACCOUNT_ID = '33d8aef7-c56c-46c4-8911-b7c6d748ccc5';

    function extractAsin(input) {
        if (/^[A-Z0-9]{10}$/i.test(input)) {
            return { asin: input.toUpperCase() };
        }
        const asinMatch = input.match(/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/i);
        if (asinMatch) {
            return { asin: asinMatch[1].toUpperCase() };
        }
        return { url: input };
    }

    async function pollJobStatus(jobId, country) {
        const maxAttempts = 60; // 3 minutos
        let attempts = 0;
        
        const messages = [
            'Buscando producto en Amazon...',
            'Extrayendo información...',
            'Creando publicación en MercadoLibre...',
            'Casi listo, unos segundos más...'
        ];
        
        while (attempts < maxAttempts) {
            const msgIndex = Math.min(Math.floor(attempts / 15), messages.length - 1);
            if (loadingText) loadingText.textContent = messages[msgIndex];
            
            try {
                const res = await fetch(`${API_BASE}/api-job-status?jobId=${jobId}`);
                const data = await res.json();
                
                if (data.job && data.job.is_completed) {
                    return data;
                }
            } catch (e) {
                console.log('Polling...', e);
            }
            
            await new Promise(r => setTimeout(r, 3000));
            attempts++;
        }
        
        throw new Error('Timeout - el proceso tardó demasiado');
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productValue = productInput.value.trim();
        const countryValue = countrySelect.value;
        
        if (!productValue) {
            alert('Por favor, ingresá un link de Amazon o ASIN');
            return;
        }
        
        if (!countryValue) {
            alert('Por favor, seleccioná un país');
            return;
        }
        
        result.classList.add('hidden');
        loading.classList.remove('hidden');
        submitBtn.disabled = true;
        if (loadingText) loadingText.textContent = 'Iniciando...';
        
        try {
            const productData = extractAsin(productValue);
            
            // Iniciar job async
            const startRes = await fetch(`${API_BASE}/api-publish-async`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...productData,
                    mlAccountId: ML_ACCOUNT_ID,
                    sites: [countryValue]
                })
            });
            
            if (!startRes.ok) {
                const errorData = await startRes.json().catch(() => ({}));
                throw new Error(errorData.error || `Error del servidor (${startRes.status})`);
            }
            
            const startData = await startRes.json();
            
            if (!startData || !startData.jobId) {
                throw new Error('No se pudo iniciar el proceso - respuesta inválida del servidor');
            }
            
            // Polling hasta completar
            const data = await pollJobStatus(startData.jobId, countryValue);
            
            // Verificar resultado
            if (!data || !data.items || data.items.length === 0) {
                throw new Error('El servidor no devolvió resultados. Por favor, intentá de nuevo.');
            }
            
            const item = data.items[0];
            
            if (!item) {
                throw new Error('Respuesta inválida del servidor');
            }
            
            if (item.error) {
                throw new Error(item.error);
            }
            
            const permalink = item.permalinks && item.permalinks[countryValue];
            const price = item.ml_prices && item.ml_prices[countryValue];
            
            if (!permalink) {
                throw new Error(item.errors?.[countryValue] || 'No se pudo crear la publicación');
            }
            
            loading.classList.add('hidden');
            result.classList.remove('hidden');
            resultLink.href = permalink;
            resultLink.textContent = permalink;
            
            if (resultPrice && price) {
                resultPrice.textContent = 'Precio: $' + price.toLocaleString();
                resultPrice.classList.remove('hidden');
            }
            
        } catch (error) {
            loading.classList.add('hidden');
            alert('Error: ' + error.message);
            console.error('Error:', error);
        } finally {
            submitBtn.disabled = false;
        }
    });
});

// Cargar publicaciones recientes
async function loadRecentPubs() {
    const container = document.getElementById('recentPubs');
    if (!container) return;
    
    const flags = { MLA: '🇦🇷', MLM: '🇲🇽', MLB: '🇧🇷', MLC: '🇨🇱', MCO: '🇨🇴' };
    
    try {
        const res = await fetch('https://xxsdwlnvpbnhmjgniisy.supabase.co/functions/v1/api-recent-publications?limit=10');
        const data = await res.json();
        
        if (data.publications && data.publications.length > 0) {
            container.innerHTML = data.publications.map(pub => `
                <a href="${pub.permalink}" target="_blank" class="pub-card">
                    <span class="pub-flag">${flags[pub.site] || '🌎'}</span>
                    <div class="pub-info">
                        <div class="pub-title">${pub.title || pub.asin}</div>
                        <div class="pub-meta">
                            <span class="pub-price">$${pub.price?.toLocaleString() || '—'}</span>
                            <span> · hace ${pub.time_ago || 'poco'}</span>
                        </div>
                    </div>
                </a>
            `).join('');
        } else {
            container.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">Las publicaciones aparecerán aquí</p>';
        }
    } catch (e) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">Las publicaciones aparecerán aquí</p>';
    }
}

// Cargar al iniciar
loadRecentPubs();
// Refrescar cada 30 segundos
setInterval(loadRecentPubs, 30000);
