const Scraper = require('./Scraper.js')

class Arnoldi extends Scraper {
  constructor() {
    super(`https://www.arnoldipropiedades.com.ar/#/alquileres`);
    this.selector = '.ct-itemProducts';
  }

  async scrapePage(page) {
    const elements = await page.$$(this.selector);
    const properties = await Promise.all(elements.map(async el => {
      const titleElement = await el.$('span[data-ng-bind="item.title"]');
      const locationElement = await el.$('span[data-ng-bind="item.address"]');
      const priceElement = await el.$('.price-alquiler .ng-binding');
      const anchorElement = await el.$('a[data-ng-href]');
      const imgElement = await el.$('.imageAndText > img');

      const title = await page.evaluate(el => el.textContent, titleElement);
      const location = await page.evaluate(el => el.textContent, locationElement);
      let price = await page.evaluate(el => el.textContent, priceElement);
      price = price.replace(/^\$/, '').trim(); 

      const href = await page.evaluate(el => el.getAttribute('href'), anchorElement);
      const link = `https://www.arnoldipropiedades.com.ar${href}`;
      const imgUrl = await page.evaluate(el => el.src, imgElement)

      return { title, location, price, link, imgUrl, company: "Arnoldi Propiedades" };
    }));
    return properties;
  }
}

async function scrapeProperties() {
  const scraper = new Arnoldi();
  const properties = await scraper.scrape();
  console.log(properties);
}

module.exports = Arnoldi;

