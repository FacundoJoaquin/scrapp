const Scraper = require('./Scraper.js')

class Salcovsky extends Scraper {
    constructor() {
        super(`https://msestudio.com.ar/inmobiliaria/propiedades-en-alquiler/`);
        this.selector = '.property-item';
    }

    async scrapePage(page) {
        const elements = await page.$$(this.selector);
        const properties = await Promise.all(elements.map(async el => {
            const titleAndUrlElement = await el.$('h4 a');
            const imgElement = await el.$eval('figure a img', img => img.dataset.src);
            const title = await page.evaluate(el => el.textContent, titleAndUrlElement);
            const link = await page.evaluate(el => el.getAttribute('href'), titleAndUrlElement);
            return { title, location: false, price: 'Sin precio', imgUrl: imgElement || false, link, company: 'Salcovsky' };
        }));
        return properties;
    }
}



async function scrapeProperties() {
    const scraper = new Salcovsky();
    const properties = await scraper.scrape();
    console.log(properties);
}


module.exports = Salcovsky;