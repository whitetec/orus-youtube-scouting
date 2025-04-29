const puppeteer = require('puppeteer');
const fetch = require('node-fetch'); // Para consumir el endpoint de WordPress

async function scoutViewers(url) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('#view-count', { timeout: 15000 });

        // Delay manual de 2 segundos
        await new Promise(resolve => setTimeout(resolve, 2000));

        const rawText = await page.$eval('#view-count', el => el.getAttribute('aria-label') || '');
        const match = rawText.match(/\d+/);
        const viewersNumber = match ? parseInt(match[0], 10) : null;

        if (viewersNumber !== null && !isNaN(viewersNumber)) {
            console.log(`>> ${url} | Viewers detectados: ${viewersNumber}`);
            // (Opcional) enviar a WordPress o Google Sheets
            // await enviarViewers(url, viewersNumber);
        } else {
            console.log(`>> ${url} | No se detecta viewers activos o número inválido.`);
        }

    } catch (err) {
        console.log(`>> ${url} | No se detecta transmisión en vivo o error: ${err.message}`);
    }

    await browser.close();
}

async function startScouting() {
    console.log('>> Iniciando scouting de canales...');

    const endpoint = 'https://panoptico.whitetec.org/wp-json/orus/v1/canales-stream';

    try {
        const res = await fetch(endpoint);
        const canales = await res.json();

        for (const canalUrl of canales) {
            await scoutViewers(canalUrl);
        }

    } catch (err) {
        console.log('>> Error al obtener lista de canales:', err.message);
    }

    console.log('>> Scouting finalizado.');
}

// Iniciar el proceso
startScouting();

