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

class RaquelInmobiliaria extends Scraper {
    constructor() {
        super(`https://raquelinmobiliaria.com.ar/blog/category/alquileres/`);
        this.selector = 'article.post';
        
    }

    async scrapePage(page) {
        const elements = await page.$$(this.selector);
        const properties = await Promise.all(elements.map(async el => {
                        const titleElement = await el.$('.entry-title a');
            const locationElement = await el.$('xdxd');
            const priceElement = await el.$('xdxd');
            const imgUrlElement = await el.$('.entry-thumb img');
            const urlElement = await el.$('.entry-title a');
            const companyElement = await el.$('xd');

            // Extracting values with null-safety
            let title = null;
            if (titleElement) {
                try {
                    title = await page.evaluate(el => el.textContent, titleElement);
                } catch (error) {
                    console.log(`Error extracting title: ${error.message}`);
                }
            }
            let location = null;
            if (locationElement) {
                try {
                    location = await page.evaluate(el => el.textContent, locationElement);
                } catch (error) {
                    console.log(`Error extracting location: ${error.message}`);
                }
            }
            let rawPrice = null;
            let price = null;
            if (priceElement) {
                try {
                    rawPrice = await page.evaluate(el => el.textContent, priceElement);
                    price = parsePrice(rawPrice);
                } catch (error) {
                    console.log(`Error extracting price: ${error.message}`);
                }
            }
            let imgUrl = null;
            if (imgUrlElement) {
                try {
                    imgUrl = await page.evaluate(el => el.src, imgUrlElement);
                } catch (error) {
                    console.log(`Error extracting imgUrl: ${error.message}`);
                }
            }
            let url = null;
            if (urlElement) {
                try {
                    url = await page.evaluate(el => el.href, urlElement);
                } catch (error) {
                    console.log(`Error extracting url: ${error.message}`);
                }
            }
            let company = null;
            if (companyElement) {
                try {
                    company = await page.evaluate(el => el.textContent, companyElement);
                } catch (error) {
                    console.log(`Error extracting company: ${error.message}`);
                }
            }

            
            // Create property object with fallbacks for missing values
            return { 
                title: title || '', 
                location: location || '',
                imgUrl: imgUrl || '',
                link: url || '',
                price: price || '',
                company: "RaquelInmobiliaria" 
            };
        }));
        
        // Filter out invalid properties (those missing critical data)
        return properties.filter(prop => {
            // At minimum, require a link or title to consider a property valid
            return prop.link || prop.title;
        });
    }
}

module.exports = RaquelInmobiliaria;
