const puppeteer = require('puppeteer');
const fetch = require('node-fetch'); // Para traer el JSON de WordPress

async function scoutViewers(url) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('div#info-strings yt-formatted-string', { timeout: 15000 });
        const viewers = await page.$eval('div#info-strings yt-formatted-string', el => el.textContent);

        console.log(`>> ${url} | Viewers detectados: ${viewers}`);
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
