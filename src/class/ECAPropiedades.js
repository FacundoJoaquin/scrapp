const Scraper = require('./Scraper.js');

function parsePrice(rawPrice) {
    if (!rawPrice) return '';
    return rawPrice
        .trim()
        .replace(/^\$/, '')
        .replace(/\./g, '')
        .replace(/\s+/g, '')
        .replace(/CAP.*/, '')
        .replace(/[^\d]/g, '');
}

class ECAPropiedades extends Scraper {
    constructor() {
        super(`https://ecapropiedades.com.ar/propiedades/2/alquiler`);
        this.selector = '.col-md-8';
    }

    async scrapePage(page) {
        const elements = await page.$$(this.selector);
        const properties = await Promise.all(elements.map(async el => {
                        const titleElement = await el.$('.text-white.mb-12');
            const locationElement = await el.$('span:has(span.mr-10)');
            const priceElement = await el.$('.p-tag.bg-lemon');
            const imgUrlElement = await el.$('.property-image img');
            const urlElement = await el.$('.block.dark-hover');

            const title = await page.evaluate(el => el.textContent, titleElement);
            const location = await page.evaluate(el => el.textContent, locationElement);
            const rawPrice = await page.evaluate(el => el.textContent, priceElement);
            const price = parsePrice(rawPrice);
            const imgUrl = await page.evaluate(el => el.src, imgUrlElement);
            const url = await page.evaluate(el => el.href, urlElement);

            
            return { 
                title, 
                location, 
                imgUrl, 
                link: url, 
                price, 
                company: "ECAPropiedades" 
            };
        }));
        return properties;
    }
}

module.exports = ECAPropiedades;
