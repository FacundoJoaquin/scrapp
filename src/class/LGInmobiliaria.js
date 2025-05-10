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

class LGInmobiliaria extends Scraper {
    constructor() {
        super(`https://lginmobiliaria.com.ar/propiedades-encontradas/?status=alquiler`);
        this.selector = 'article.property-item';
        // Configure pagination
        this.configurePagination({
            enabled: true,
            type: 'url',
            selector: '.pagination.rh_pagination_classic a.real-btn',
            urlTemplate: 'https://lginmobiliaria.com.ar/propiedades-encontradas/page/{{PAGE}}/?status=alquiler',
            maxPages: 5
        });
    }

    async scrapePage(page) {
        const elements = await page.$$(this.selector);
        const properties = await Promise.all(elements.map(async el => {
                        const titleElement = await el.$('h4 > a');
            const locationElement = await el.$('.detail > p');
            const priceElement = await el.$('h5.price');
            const imgUrlElement = await el.$('.attachment-property-thumb-image.size-property-thumb-image.wp-post-image');
            const urlElement = await el.$('a.more-details');

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

            
            // Create property object with fallbacks for missing values
            return { 
                title: title || '', 
                location: location || '',
                imgUrl: imgUrl || '',
                link: url || '',
                price: price || '',
                company: "LGInmobiliaria" 
            };
        }));
        
        // Filter out invalid properties (those missing critical data)
        return properties.filter(prop => {
            // At minimum, require a link or title to consider a property valid
            return prop.link || prop.title;
        });
    }
}

module.exports = LGInmobiliaria;
