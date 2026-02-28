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

    const API_URL = 'https://xxsdwlnvpbnhmjgniisy.supabase.co/functions/v1/api-publish';
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
        
        // Actualizar mensaje de loading
        let dots = 0;
        const messages = [
            'Buscando producto en Amazon...',
            'Extrayendo información...',
            'Creando publicación en MercadoLibre...',
            'Casi listo, solo unos segundos más...'
        ];
        let msgIndex = 0;
        
        const loadingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            if (loadingText) {
                loadingText.textContent = messages[msgIndex] + '.'.repeat(dots);
            }
        }, 500);
        
        const messageInterval = setInterval(() => {
            msgIndex = Math.min(msgIndex + 1, messages.length - 1);
        }, 20000);
        
        try {
            const productData = extractAsin(productValue);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min timeout
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...productData,
                    mlAccountId: ML_ACCOUNT_ID,
                    sites: [countryValue]
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            clearInterval(loadingInterval);
            clearInterval(messageInterval);
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'No se pudo crear la publicación');
            }
            
            const countryResult = data.results[countryValue];
            
            if (!countryResult || !countryResult.success) {
                throw new Error(countryResult?.error || 'Error en la publicación');
            }
            
            loading.classList.add('hidden');
            result.classList.remove('hidden');
            resultLink.href = countryResult.permalink;
            resultLink.textContent = countryResult.permalink;
            
            if (resultPrice && countryResult.ml_price) {
                resultPrice.textContent = 'Precio: $' + countryResult.ml_price.toLocaleString();
                resultPrice.classList.remove('hidden');
            }
            
        } catch (error) {
            clearInterval(loadingInterval);
            clearInterval(messageInterval);
            loading.classList.add('hidden');
            
            if (error.name === 'AbortError') {
                alert('La publicación está tardando demasiado. Por favor intentá de nuevo en unos minutos.');
            } else {
                alert('Error: ' + error.message);
            }
            console.error('Error:', error);
        } finally {
            submitBtn.disabled = false;
        }
    });
});
