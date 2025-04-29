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

        // Esperar el componente animado
        await page.waitForSelector('yt-animated-rolling-number', { timeout: 15000 });

        // Extraer solo los primeros dígitos visibles
        const viewersNumber = await page.$$eval(
            'yt-animated-rolling-number animated-rolling-character',
            (columns) => {
              return parseInt(
                columns.map(col => {
                  const offset = parseInt(col.style.marginTop || '0');
                  const index = Math.abs(offset / 20); // cada fila es 20px
                  const digitDivs = Array.from(col.querySelectorAll('div')).filter(div =>
                    /^\d$/.test(div.textContent.trim())
                  );
                  return digitDivs[index]?.textContent.trim() || '';
                }).join(''),
                10
              );
            }
          );
          

        if (viewersNumber) {
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
