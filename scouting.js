const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

async function extraerNumeroDesdeRolling(page) {
    await page.waitForTimeout(500); // Espera adicional para render completo

    const numeros = await page.$$eval(
        'yt-animated-rolling-number > animated-rolling-character',
        (caracteres) => {
            return caracteres.map((char) => {
                const divs = Array.from(char.querySelectorAll('div'));
                const visible = divs.find(div => div && div.offsetHeight && div.offsetTop === 0);
                return visible ? visible.textContent.trim() : '';
            }).filter(Boolean);
        }
    );

    return parseInt(numeros.join('').replace(/\D/g, ''), 10);
}

async function scoutViewers(url) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
        timeout: 0
    });

    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('yt-animated-rolling-number', { timeout: 25000 });

        const viewers = await extraerNumeroDesdeRolling(page);

        if (isNaN(viewers) || viewers === 0) {
            console.log(`>> ${url} | Fuera del aire (no número detectado)`);
        } else {
            console.log(`>> ${url} | Audiencia ahora: ${viewers}`);
        }
    } catch (err) {
        console.log(`>> ${url} | Fuera del aire (view-count no encontrado)`);
    } finally {
        await browser.close();
    }
}

async function startScouting() {
    console.log('>> Iniciando scouting de canales...');

    const endpoint = 'https://panoptico.whitetec.org/wp-json/orus/v1/canales-stream';

    try {
        const res = await fetch(endpoint);
        const canales = await res.json();

        for (let i = 0; i < canales.length; i++) {
            await scoutViewers(canales[i]);
            console.log('>> Esperando antes de procesar el siguiente canal...');
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

    } catch (err) {
        console.log('>> Error al obtener lista de canales:', err.message);
    }

    console.log('>> Scouting finalizado.');
}

startScouting();