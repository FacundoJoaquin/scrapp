const Scraper = require('./Scraper.js')

class Surwal extends Scraper {
    constructor() {
        super(`https://propiedades.surwal.com/alquiler`);
        this.selector = '.resultados-list > li';
    }

    async scrapePage(page) {
        const elements = await page.$$(this.selector);
        const properties = await Promise.all(elements.map(async el => {
            const titleAndAddressElement = await el.$('.prop-desc');
            const roomsElement = await el.$('.prop-data2 > div');
            const imgElement = await el.$('.prop-img > img');
            const urlElement = await el.$('#propiedades > li > a');
            const priceElement = await el.$('.prop-valor-nro')
            console.log('URL------------------------>', urlElement)
            
            const title = await page.evaluate(el => el.querySelector('.prop-desc-tipo-ub').textContent, titleAndAddressElement);
            const address = await page.evaluate(el => el.querySelector('.prop-desc-dir').textContent, titleAndAddressElement);
            const rooms = await page.evaluate(el => el.textContent, roomsElement);
            const location = `${address} - ${rooms} Ambientes`;
            const imgUrl = await page.evaluate(el => el.src, imgElement)
            const url = await page.evaluate(el => el.href, urlElement)
            const price = await page.evaluate(el => el.textContent, priceElement);
            const priceRegex = /[\d,\.]+/; 
            const match = price.match(priceRegex); 
            const parsedPrice = match ? match[0].replace(',', '') : null; 

            return { title, location, imgUrl, link: url, price: parsedPrice, company: "Surwal" };
        }));
        return properties;
    }
}

async function scrapeProperties() {
    const scraper = new Surwal();
    const properties = await scraper.scrape();
    console.log(properties);
}

module.exports = Surwal;