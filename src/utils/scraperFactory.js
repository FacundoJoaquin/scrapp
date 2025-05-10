const fs = require('fs');
const path = require('path');
const MemoryBankManager = require('./memoryBankManager');

/**
 * Factory for creating and registering new scrapers
 */
class ScraperFactory {
  /**
   * Register a new scraper by creating the class file
   * @param {string} name - Name of the real estate agency
   * @param {string} url - Base URL for scraping
   * @param {string} selector - Main CSS selector for properties
   * @param {Object} mappings - Mapping of property data fields to selectors
   * @returns {Promise<string>} - The path to the created file
   */
  static async createScraper(name, url, selector, mappings) {
    // Create class name (remove spaces and special characters)
    const className = name.replace(/[^a-zA-Z0-9]/g, '');
    
    // Create the scraper file content
    const content = this.generateScraperClass(className, url, selector, mappings);
    
    // Write the file
    const filePath = path.join(__dirname, '../class', `${className}.js`);
    fs.writeFileSync(filePath, content);
    
    // Update memory bank
    await MemoryBankManager.addRealEstateSource(
      name, 
      url, 
      `Scraper for ${name} real estate agency`
    );
    
    // Create a note about the new scraper
    await MemoryBankManager.createNote(
      `New Scraper: ${name}`,
      `Added new scraper for ${name} on ${new Date().toISOString().split('T')[0]}.\n\n` +
      `- URL: ${url}\n` +
      `- Main selector: ${selector}\n` +
      `- Class file: ${className}.js`
    );
    
    return filePath;
  }
  
  /**
   * Generate the code for a new scraper class
   * @private
   */
  static generateScraperClass(className, url, selector, mappings) {
    return `const Scraper = require('./Scraper.js');

function parsePrice(rawPrice) {
    if (!rawPrice) return '';
    return rawPrice
        .trim()
        .replace(/^\\$/, '')
        .replace(/\\./g, '')
        .replace(/\\s+/g, '')
        .replace(/CAP.*/, '')
        .replace(/[^\\d]/g, '');
}

class ${className} extends Scraper {
    constructor() {
        super(\`${url}\`);
        this.selector = '${selector}';
    }

    async scrapePage(page) {
        const elements = await page.$$(this.selector);
        const properties = await Promise.all(elements.map(async el => {
            ${this.generateMappingCode(mappings)}
            
            return { 
                title, 
                location, 
                imgUrl, 
                link: url, 
                price, 
                company: "${className}" 
            };
        }));
        return properties;
    }
}

module.exports = ${className};
`;
  }
  
  /**
   * Generate code for property mappings
   * @private
   */
  static generateMappingCode(mappings) {
    let code = '';
    
    // Generate element selection code
    Object.entries(mappings).forEach(([field, selector]) => {
      code += `            const ${field}Element = await el.$('${selector}');\n`;
    });
    
    code += '\n';
    
    // Generate property extraction code
    Object.entries(mappings).forEach(([field, selector]) => {
      if (field === 'price') {
        code += `            const rawPrice = await page.evaluate(el => el.textContent, ${field}Element);\n`;
        code += `            const price = parsePrice(rawPrice);\n`;
      } else if (field === 'imgUrl') {
        code += `            const imgUrl = await page.evaluate(el => el.src, ${field}Element);\n`;
      } else if (field === 'url') {
        code += `            const url = await page.evaluate(el => el.href, ${field}Element);\n`;
      } else {
        code += `            const ${field} = await page.evaluate(el => el.textContent, ${field}Element);\n`;
      }
    });
    
    return code;
  }
}

module.exports = ScraperFactory; 