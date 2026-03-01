const { chromium } = require('playwright');
const path = require('path');

async function captureSlides() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.setViewportSize({ width: 1080, height: 1920 });
    await page.goto(`file://${path.join(__dirname, 'reel-generator.html')}`);
    
    for (let i = 1; i <= 6; i++) {
        // Ocultar todos
        await page.evaluate(() => {
            document.querySelectorAll('.slide').forEach(s => s.style.display = 'none');
        });
        
        // Mostrar actual
        await page.evaluate((num) => {
            const slide = document.querySelector(`.slide-${num}`);
            if (slide) slide.style.display = 'flex';
        }, i);
        
        await page.waitForTimeout(300);
        
        await page.screenshot({
            path: `reel/slide-${i}.png`,
            clip: { x: 0, y: 0, width: 1080, height: 1920 }
        });
        
        console.log(`Captured slide ${i}`);
    }
    
    await browser.close();
    console.log('Done!');
}

captureSlides().catch(console.error);
