const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

async function scoutViewers(browser, url) {
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos para carga

        const exists = await page.$('#view-count');
        if (!exists) {
            console.log(`\x1b[31m>> ${url} | Fuera del aire (view-count no encontrado)\x1b[0m`);
            await page.close();
            return;
        }

        const rawText = await page.$eval('#view-count', el => el.getAttribute('aria-label') || '');
        const digitsOnly = rawText.replace(/[^\d]/g, '');
        const viewersNumber = digitsOnly ? parseInt(digitsOnly, 10) : null;

        if (viewersNumber !== null && !isNaN(viewersNumber)) {
            console.log(`>> ${url} | Viewers detectados: ${viewersNumber}`);
        } else {
            console.log(`\x1b[31m>> ${url} | Fuera del aire (no número detectado)\x1b[0m`);
        }

    } catch (err) {
        console.log(`\x1b[31m>> ${url} | Fuera del aire (error de carga)\x1b[0m`);
    }

    await page.close();
}

async function startScouting() {
    console.log('>> Iniciando scouting de canales...');

    const endpoint = 'https://panoptico.whitetec.org/wp-json/orus/v1/canales-stream';
    const batchSize = 3; // 🔥 Procesar 3 canales en paralelo máximo

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new'
    });

    try {
        const res = await fetch(endpoint);
        const canales = await res.json();

        for (let i = 0; i < canales.length; i += batchSize) {
            const batch = canales.slice(i, i + batchSize);
            await Promise.all(batch.map(canalUrl => scoutViewers(browser, canalUrl)));
        }

    } catch (err) {
        console.log('>> Error al obtener lista de canales:', err.message);
    }

    await browser.close();
    console.log('>> Scouting finalizado.');
}

startScouting();
