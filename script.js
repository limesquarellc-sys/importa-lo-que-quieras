document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('publishForm');
    const productInput = document.getElementById('productInput');
    const countrySelect = document.getElementById('countrySelect');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const resultLink = document.getElementById('resultLink');
    const resultPrice = document.getElementById('resultPrice');
    const submitBtn = document.getElementById('submitBtn');

    // Configuración API GlobalMelios
    const API_BASE = 'https://xxsdwlnvpbnhmjgniisy.supabase.co/functions/v1';
    const ML_ACCOUNT_ID = '33d8aef7-c56c-46c4-8911-b7c6d748ccc5';

    // Detectar si es ASIN o URL
    function extractAsin(input) {
        // Si es un ASIN directo (10 caracteres alfanuméricos)
        if (/^[A-Z0-9]{10}$/i.test(input)) {
            return { asin: input.toUpperCase() };
        }
        // Si es URL de Amazon, extraer ASIN
        const asinMatch = input.match(/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/i);
        if (asinMatch) {
            return { asin: asinMatch[1].toUpperCase() };
        }
        // Devolver como URL y dejar que la API lo procese
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
        
        // Ocultar resultado anterior y mostrar loading
        result.classList.add('hidden');
        loading.classList.remove('hidden');
        submitBtn.disabled = true;
        
        try {
            const productData = extractAsin(productValue);
            
            const response = await fetch(`${API_BASE}/api-publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...productData,
                    mlAccountId: ML_ACCOUNT_ID,
                    sites: [countryValue]
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error del servidor');
            }
            
            if (!data.success) {
                throw new Error(data.error || 'No se pudo crear la publicación');
            }
            
            // Verificar resultado del país específico
            const countryResult = data.results[countryValue];
            
            if (!countryResult || !countryResult.success) {
                const errorMsg = countryResult?.error || 'Error desconocido';
                throw new Error(`Error en ${countryValue}: ${errorMsg}`);
            }
            
            // Mostrar resultado exitoso
            loading.classList.add('hidden');
            result.classList.remove('hidden');
            resultLink.href = countryResult.permalink;
            resultLink.textContent = countryResult.permalink;
            
            // Mostrar precio si está disponible
            if (resultPrice && countryResult.ml_price) {
                resultPrice.textContent = `Precio: $${countryResult.ml_price.toLocaleString()}`;
                resultPrice.classList.remove('hidden');
            }
            
        } catch (error) {
            loading.classList.add('hidden');
            alert(`Error: ${error.message}`);
            console.error('Error:', error);
        } finally {
            submitBtn.disabled = false;
        }
    });
});
