const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

// Array simple de User-Agents reales de navegador
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
];

async function scoutViewers(url) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Setear un User-Agent aleatorio por cada scouting
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUA);

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        await page.waitForSelector('yt-animated-rolling-number', { timeout: 15000 });

        const viewersNumber = await page.$$eval('yt-animated-rolling-number div', divs => {
            const digits = divs
                .map(div => div.textContent.trim())
                .filter(text => /^\d$/.test(text));
            return parseInt(digits.join(''), 10);
        });

        if (viewersNumber && viewersNumber > 0) {
            console.log(`>> ${url} | Viewers detectados: ${viewersNumber}`);
        } else {
            console.log(`>> ${url} | Offline (no viewers o error)`);
        }
    } catch (err) {
        console.log(`>> ${url} | Offline (no viewers o error: ${err.message})`);
    }

    await browser.close();
}

async function startScouting() {
    console.log('>> Starting channel scouting...');

    const endpoint = 'https://panoptico.whitetec.org/wp-json/orus/v1/canales-stream';

    try {
        const res = await fetch(endpoint);
        const canales = await res.json();

        for (const canalUrl of canales) {
            await scoutViewers(canalUrl);
            console.log('>> Waiting before next channel...');
            await new Promise(resolve => setTimeout(resolve, 20000)); // 20 segundos de pausa
        }
    } catch (err) {
        console.log('>> Error al obtener lista de canales:', err.message);
    }

    console.log('>> Scouting finished.');
}

// Iniciar
startScouting();
