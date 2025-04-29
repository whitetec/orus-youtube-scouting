const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

async function scoutViewers(url) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new'
    });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('#view-count', { timeout: 15000 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Delay de carga

        const rawText = await page.$eval('#view-count', el => el.getAttribute('aria-label') || '');
        const digitsOnly = rawText.replace(/[^\d]/g, '');
        const viewersNumber = digitsOnly ? parseInt(digitsOnly, 10) : null;

        if (viewersNumber !== null && !isNaN(viewersNumber)) {
            console.log(`>> ${url} | Viewers detectados: ${viewersNumber}`);
        } else {
            console.log(`\x1b[31m>> ${url} | Fuera del aire\x1b[0m`);
        }

    } catch (err) {
        console.log(`\x1b[31m>> ${url} | Fuera del aire\x1b[0m`);
    }

    await browser.close();
}

async function startScouting() {
    console.log('>> Iniciando scouting de canales...');

    const endpoint = 'https://panoptico.whitetec.org/wp-json/orus/v1/canales-stream';

    try {
        const res = await fetch(endpoint);
        const canales = await res.json();

        // Procesar todos en paralelo
        await Promise.all(
            canales.map(canalUrl => scoutViewers(canalUrl))
        );

    } catch (err) {
        console.log('>> Error al obtener lista de canales:', err.message);
    }

    console.log('>> Scouting finalizado.');
}

startScouting();
