const Scraper = require('./Scraper.js');

function parsePrice(rawPrice) {
    if (!rawPrice) return '';
    
    // Si el rawPrice contiene un formato "LOCATION | $PRICE"
    if (rawPrice.includes('|')) {
        const parts = rawPrice.split('|');
        if (parts.length > 1) {
            rawPrice = parts[1].trim(); // Tomar solo la parte del precio
        }
    }
    
    return rawPrice
        .trim()
        .replace(/^\$/, '')
        .replace(/\./g, '')
        .replace(/\s+/g, '')
        .replace(/CAP.*/, '')
        .replace(/[^\d]/g, '');
}

function parseLocation(rawLocation) {
    if (!rawLocation) return '';
    
    if (rawLocation.includes('|')) {
        const parts = rawLocation.split('|');
        return parts[0].trim(); // Tomar solo la parte de la ubicación
    }
    
    return rawLocation.trim();
}

class BounosPropiedades extends Scraper {
    constructor() {
        super(`https://bounospropiedades.com.ar/propiedades/?tipo=Alquiler`);
        this.selector = 'article.propiedades__item';
        // Configure pagination
        this.configurePagination({
            enabled: true,
            type: 'url',
            selector: '.pagination__item a',
            urlTemplate: 'https://bounospropiedades.com.ar/propiedades/{{PAGE}}?tipo=Alquiler',
            maxPages: 3
        });
    }

    async scrapePage(page) {
        const elements = await page.$$(this.selector);
        const properties = await Promise.all(elements.map(async el => {
            const titleElement = await el.$('.propiedades__location__address');
            const locationElement = await el.$('.propiedades__location__address');
            const priceElement = await el.$('.propiedades__location__address');
            const imgUrlElement = await el.$('.relative img');
            const urlElement = await el.$('.propiedades__files a');
            const descriptionElement = await el.$('.propiedades__descripcion p');
            const companyElement = await el.$('Bounos Propiedades');

            // Extracting values with null-safety
            let title = null;
            if (titleElement) {
                try {
                    title = await page.evaluate(el => el.textContent, titleElement);
                } catch (error) {
                    console.log(`Error extracting title: ${error.message}`);
                }
            }
            
            let locationText = null;
            let location = null;
            if (locationElement) {
                try {
                    locationText = await page.evaluate(el => el.textContent, locationElement);
                    location = parseLocation(locationText);
                } catch (error) {
                    console.log(`Error extracting location: ${error.message}`);
                }
            }
            
            let description = null;
            if (descriptionElement) {
                try {
                    description = await page.evaluate(el => el.textContent, descriptionElement);
                    // Limpiar el texto de la descripción
                    description = description.trim().replace(/\s+/g, ' ');
                } catch (error) {
                    console.log(`Error extracting description: ${error.message}`);
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

            // Combinar ubicación con descripción si está disponible
            if (description && location) {
                location = `${location} - ${description}`;
            }

            // Create property object with fallbacks for missing values
            return { 
                title: title || '', 
                location: location || '',
                imgUrl: imgUrl || '',
                link: url || '',
                price: price || '',
                company: "BounosPropiedades" 
            };
        }));
        
        // Filter out invalid properties (those missing critical data)
        return properties.filter(prop => {
            // At minimum, require a link or title to consider a property valid
            return prop.link || prop.title;
        });
    }
}

module.exports = BounosPropiedades;
