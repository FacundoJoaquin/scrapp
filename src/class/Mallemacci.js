const Scraper = require('./Scraper.js')

class BounosPropiedades extends Scraper {
  constructor() {
    super(`https://www.mallemacipropiedades.com/listing?user_id=221&purpose=rent&type=Departamento`);
    this.selector = '.thumbnail_one';
  }

  async scrapePage(page) {
    const elements = await page.$$(this.selector);
    const properties = await Promise.all(elements.map(async el => {
      const titleElement = await el.$('.thum_title h5 a');
      const locationElement = await el.$('.thum_one_content .thum_title p');
      const locationUnparsed = await page.evaluate(el => el.textContent, locationElement);
      const priceElement = await el.$('.area_price .sale');
      const priceUnparsed = await page.evaluate(el => el.textContent, priceElement);
      const imgElement = await el.$('img[itemprop="image"]');
      const anchorElement = await el.$('a[href^="https://www.mallemacipropiedades.com/ad/"]');

      const title = await page.evaluate(el => el.textContent, titleElement);
      const location = locationUnparsed.replace(/\n|\s{2,}/g, ' ').trim();
      const price = priceUnparsed.replace('$', '').replace(/\s/g, '');
      const imgUrl = await page.evaluate(el => el.src, imgElement);
      const link = await page.evaluate(el => el.href, anchorElement);

      return { title, location, price, imgUrl, link, company: "Mallemacci" };
    }));
    return properties;
  }
}

async function scrapeProperties() {
  const scraper = new BounosPropiedades();
  const properties = await scraper.scrape();
  console.log(properties);
}

module.exports = BounosPropiedades