document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('publishForm');
    const productInput = document.getElementById('productInput');
    const countrySelect = document.getElementById('countrySelect');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const resultLink = document.getElementById('resultLink');
    const resultPrice = document.getElementById('resultPrice');
    const submitBtn = document.getElementById('submitBtn');

    // API directa de GlobalMelios
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
        
        try {
            const productData = extractAsin(productValue);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...productData,
                    mlAccountId: ML_ACCOUNT_ID,
                    sites: [countryValue]
                })
            });
            
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
            loading.classList.add('hidden');
            alert('Error: ' + error.message);
            console.error('Error:', error);
        } finally {
            submitBtn.disabled = false;
        }
    });
});
