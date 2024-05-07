const Scraper = require('./Scraper.js')

class ZZDeptos extends Scraper {
  constructor() {
    super(`https://www.zzpropiedades.com.ar/#/propiedades?type_id=17-Alquileres&child_id=5-Departamentos`);
    this.selector = '.property-simple';
  }

  async scrapePage(page) {
    const elements = await page.$$(this.selector);
    const properties = await Promise.all(elements.map(async el => {
      const titleElement = await el.$('h2 a');
      const locationElement = await el.$('.property-simple-location a span');
      const linkElement = await el.$('.property-simple-title a');

      const title = await page.evaluate(el => el.textContent, titleElement);
      const location = await page.evaluate(el => el.textContent, locationElement);
      const href = await page.evaluate(el => el.getAttribute('href'), linkElement);
      const link = `https://www.zzpropiedades.com.ar/${href}`;

      return { title, location, link, imgUrl: false, company: "ZZ Propiedades", imgUrl: false };
    }));
    return properties;
  }
}

async function scrapeProperties() {
  const scraper = new ZZDeptos();
  const properties = await scraper.scrape();
  console.log(properties);
}

module.exports = ZZDeptos