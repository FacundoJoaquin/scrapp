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
const { scrapeAndRespond } = require('./functions');

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






module.exports = app;