const Scraper = require('./Scraper.js')

class BounosPropiedades extends Scraper {
    constructor() {
        super(`http://www.bounospropiedades.com.ar/#/search/alquiler`);
        this.selector = '._37LzrYWI87xqyn-wUl3RnL';
        this.pageButtonSelector = '._1RP4C-FkxsnFWkGAwXT615 ._3ncL_XskDk8OIabY9KZQfd';
    }

    async scrapePage(page) {
        const elements = await page.$$(this.selector);
        const properties = await Promise.all(elements.map(async el => {
            const detailsElement = await el.$('._1Q8mDB2ysQC3PtigMw7c5W');
            const locationAndPriceElement = await el.$('._1JLJRMm_6r19DSH_6VvoHR');

            const title = await page.evaluate(el => el.textContent, detailsElement);
            const locationAndPriceText = await page.evaluate(el => el ? el.textContent.trim() : '', locationAndPriceElement);
            const [location, price] = locationAndPriceText.split('|').map(str => str.trim());

            const imgElement = await el.$eval('div._2AASowRfFnpO60CpDxCn7s', div => {
                const style = window.getComputedStyle(div);
                const backgroundImage = style.getPropertyValue('background-image');
                const urlMatch = backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
                return urlMatch ? urlMatch[1] : null;
              });
              

            const parsedPrice = price ? price.replace(/^\$/, '') : false;
            return { title, location, price: parsedPrice, imgUrl: imgElement, link: 'http://www.bounospropiedades.com.ar/#/search/alquiler', company: 'Bounos Propiedades' };
        }));
        return properties;
    }
}

async function scrapeProperties() {
    const scraper = new BounosPropiedades();
    const properties = await scraper.scrape();
    console.log(properties);
}
scrapeProperties()


module.exports = BounosPropiedades