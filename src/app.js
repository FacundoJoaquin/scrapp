const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const scraperClasses = [];

const scraperFolderPath = path.join(__dirname, 'class');
const scraperFiles = fs.readdirSync(scraperFolderPath).filter(file => file.endsWith('.js') && file !== 'Scraper.js');

for (const file of scraperFiles) {
  const module = require(path.join(scraperFolderPath, file));
  scraperClasses.push(module.default || module);
}

app.get('/', (req, res) => {
  res.json('Api is working.');
});

app.get('/scrape', async (req, res) => {
  try {
    const scrapePromises = scraperClasses.map(async (ScraperClass) => {
      const scraper = new ScraperClass();
      return Promise.race([
        scraper.scrape(), // Scraper
        new Promise((resolve, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)) // Timeout de 5 segundos
      ]);
    });

    const results = await Promise.all(scrapePromises);

    const output = results.reduce((acc, curr) => acc.concat(curr), []);

    res.json(output);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: 'Error en la automatización del navegador', details: err.toString() });
  }
});



module.exports = app;