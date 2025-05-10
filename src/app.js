const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const Promise = require('bluebird'); 
const ArmandoConstanza = require('./class/ArmandoConstanza');
const Arnoldi = require('./class/Arnoldi');
const Bounos = require('./class/Bounos');
const Mallemacci = require('./class/Mallemacci');
const Salcovsky = require('./class/Salcovsky');
const Surwal = require('./class/Surwal');
const ZZDeptos = require('./class/ZZDeptos');
const LGInmobiliaria = require('./class/LGInmobiliaria2');
const RaquelInmobiliaria = require('./class/RaquelInmobiliaria');
const Zuchelli = require('./class/Zuchelli');


const { scrapeAndRespond } = require('./functions');
const MemoryBankManager = require('./utils/memoryBankManager');
const ScraperFactory = require('./utils/scraperFactory');
const MemoryCollector = require('../memory_bank/utils/memory_collector');

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

// Basic routes
app.get('/', (req, res) => {
  res.json('Api is working.');
});

// Scraper routes
app.get('/armando', async (req, res) => {
  scrapeAndRespond(ArmandoConstanza, res);
});
app.get('/arnoldi', async (req, res) => {
  scrapeAndRespond(Arnoldi, res);
});
app.get('/bounos', async (req, res) => {
  scrapeAndRespond(Bounos, res);
});
app.get('/mallemacci', async (req, res) => {
  scrapeAndRespond(Mallemacci, res);
});
app.get('/salcovsky', async (req, res) => {
  scrapeAndRespond(Salcovsky, res);
});
app.get('/surwal', async (req, res) => {
  scrapeAndRespond(Surwal, res);
});
app.get('/zz', async (req, res) => {
  scrapeAndRespond(ZZDeptos, res);
});
app.get('/lginmobiliaria', async (req, res) => {
  scrapeAndRespond(LGInmobiliaria, res);
});
app.get('/raquelinmobiliaria', async (req, res) => {
  scrapeAndRespond(RaquelInmobiliaria, res);
});
app.get('/zuchelli', async (req, res) => {
  scrapeAndRespond(Zuchelli, res);
});



// New Memory Bank routes
app.get('/memory-bank', async (req, res) => {
  try {
    const documents = await MemoryBankManager.listDocuments();
    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: 'Error listing memory bank documents', details: error.toString() });
  }
});

app.get('/memory-bank/:document', async (req, res) => {
  try {
    const content = await MemoryBankManager.readDocument(req.params.document);
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Error reading memory bank document', details: error.toString() });
  }
});

app.post('/memory-bank/:document', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    await MemoryBankManager.writeDocument(req.params.document, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error writing to memory bank document', details: error.toString() });
  }
});

app.post('/memory-bank/:document/append', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    await MemoryBankManager.appendToDocument(req.params.document, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error appending to memory bank document', details: error.toString() });
  }
});

// Memory Collector routes
app.get('/memory-bank/summary/generate', async (req, res) => {
  try {
    const summary = await MemoryCollector.generateSummary();
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: 'Error generating memory bank summary', details: error.toString() });
  }
});

app.get('/memory-bank/stats', async (req, res) => {
  try {
    const stats = await MemoryCollector.generateScraperStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error generating scraper statistics', details: error.toString() });
  }
});

app.get('/memory-bank/report', async (req, res) => {
  try {
    const report = await MemoryCollector.generateStatusReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Error generating memory bank report', details: error.toString() });
  }
});

// New Scraper Creation Endpoint
app.post('/scrapers', async (req, res) => { 
  try {
    const { name, url, selector, mappings, pagination } = req.body;
    
    // Validate required fields
    if (!name || !url || !selector || !mappings) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['name', 'url', 'selector', 'mappings'] 
      });
    }
    
    // Create the scraper
    const filePath = await ScraperFactory.createScraper(name, url, selector, mappings, pagination);
    
    // Add a route for the new scraper
    const className = name.replace(/[^a-zA-Z0-9]/g, '');
    const ScraperClass = require(filePath);
    app.get(`/${className.toLowerCase()}`, async (reqInner, resInner) => {
      scrapeAndRespond(ScraperClass, resInner);
    });
    
    res.json({ 
      success: true, 
      message: `Created scraper ${name}`,
      endpoint: `/${className.toLowerCase()}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating scraper', details: error.toString() });
  }
});

module.exports = app;