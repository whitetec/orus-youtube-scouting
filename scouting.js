const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

async function scoutViewers(browser, url) {
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        await page.waitForFunction(() => {
            const el = document.querySelector('#view-count');
            return el && el.getAttribute('aria-label') && el.getAttribute('aria-label').length > 0;
        }, { timeout: 15000 });

        const rawText = await page.$eval('#view-count', el => el.getAttribute('aria-label') || '');
        const digitsOnly = rawText.replace(/[^\d]/g, '');
        const viewersNumber = digitsOnly ? parseInt(digitsOnly, 10) : null;

        if (viewersNumber !== null && !isNaN(viewersNumber)) {
            console.log(`>> ${url} | Viewers detected: ${viewersNumber}`);
        } else {
            console.log(`\x1b[31m>> ${url} | Offline (invalid number)\x1b[0m`);
        }

    } catch (err) {
        console.log(`\x1b[31m>> ${url} | Offline (no viewers or error)\x1b[0m`);
    }

    await page.close();
}

async function startScouting() {
    console.log('>> Starting channel scouting...');

    const endpoint = 'https://panoptico.whitetec.org/wp-json/orus/v1/canales-stream';
    const batchSize = 3;
    const pauseBetweenBatchesMs = 10000;

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new'
    });

    try {
        const res = await fetch(endpoint);
        const canales = await res.json();

        for (let i = 0; i < canales.length; i += batchSize) {
            const batch = canales.slice(i, i + batchSize);

            await Promise.all(batch.map(async (canalUrl) => {
                try {
                    await scoutViewers(browser, canalUrl);
                } catch (err) {
                    console.log(`\x1b[31m>> ${canalUrl} | Critical error processing channel\x1b[0m`);
                }
            }));

            if (i + batchSize < canales.length) {
                console.log('>> Waiting before next batch...');
                await new Promise(resolve => setTimeout(resolve, pauseBetweenBatchesMs));
            }
        }

    } catch (err) {
        console.log('>> Error fetching channel list:', err.message);
    }

    await browser.close();
    console.log('>> Scouting finished.');
}

startScouting();
