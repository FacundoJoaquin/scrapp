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
   * @param {Object} pagination - Optional pagination configuration
   * @returns {Promise<string>} - The path to the created file
   */
  static async createScraper(name, url, selector, mappings, pagination = null) {
    // Create class name (remove spaces and special characters)
    const className = name.replace(/[^a-zA-Z0-9]/g, '');
    
    // Create the scraper file content
    const content = this.generateScraperClass(className, url, selector, mappings, pagination);
    
    // Write the file
    const filePath = path.join(__dirname, '../class', `${className}.js`);
    fs.writeFileSync(filePath, content);
    
    // Update app.js to add the endpoint permanently
    this.updateAppJsWithEndpoint(className);
    
    // Update memory bank
    await MemoryBankManager.addRealEstateSource(
      name, 
      url, 
      `Scraper for ${name} real estate agency`
    );
    
    // Add pagination info to the note if available
    let paginationInfo = "";
    if (pagination && pagination.enabled) {
      paginationInfo = `\n- Pagination type: ${pagination.type}`;
      if (pagination.urlTemplate) {
        paginationInfo += `\n- URL template: ${pagination.urlTemplate}`;
      }
      if (pagination.selector) {
        paginationInfo += `\n- Pagination selector: ${pagination.selector}`;
      }
    }
    
    // Create a note about the new scraper
    await MemoryBankManager.createNote(
      `New Scraper: ${name}`,
      `Added new scraper for ${name} on ${new Date().toISOString().split('T')[0]}.\n\n` +
      `- URL: ${url}\n` +
      `- Main selector: ${selector}\n` +
      `- Class file: ${className}.js${paginationInfo}\n` +
      `- Endpoint: /${className.toLowerCase()}`
    );
    
    return filePath;
  }
  
  /**
   * Updates app.js to add a new scraper endpoint permanently
   * @param {string} className - The class name of the scraper
   * @private
   */
  static updateAppJsWithEndpoint(className) {
    const appJsPath = path.join(__dirname, '../app.js');
    
    try {
      // Read the current app.js content
      let appJsContent = fs.readFileSync(appJsPath, 'utf8');
      
      // Check if the import and endpoint already exist
      const importPattern = new RegExp(`const\\s+${className}\\s+=\\s+require\\(.*${className}.*\\);`);
      const endpointPattern = new RegExp(`app\\.get\\('\\/${className.toLowerCase()}'`);
      
      // If both already exist, no need to update
      if (importPattern.test(appJsContent) && endpointPattern.test(appJsContent)) {
        console.log(`Endpoints for ${className} already exist in app.js`);
        return;
      }
      
      // Add import statement if needed
      if (!importPattern.test(appJsContent)) {
        // Find the last import of a scraper
        const lastScraperImportRegex = /const\s+([A-Za-z0-9]+)\s+=\s+require\('\.\/class\/[A-Za-z0-9]+'\);(?!\s*const\s+[A-Za-z0-9]+\s+=\s+require\('\.\/class\/)/;
        const importMatch = appJsContent.match(lastScraperImportRegex);
        
        if (importMatch) {
          const importStatement = `const ${className} = require('./class/${className}');\n`;
          appJsContent = appJsContent.replace(
            importMatch[0],
            `${importMatch[0]}\n${importStatement}`
          );
        } else {
          console.error('Could not find a suitable position to add import statement');
        }
      }
      
      // Add endpoint if needed
      if (!endpointPattern.test(appJsContent)) {
        // Find the last scraper endpoint
        const lastEndpointRegex = /app\.get\('\/[a-z]+', async \(req, res\) => {\s*scrapeAndRespond\([A-Za-z0-9]+, res\);\s*}\);(?!\s*app\.get\('\/[a-z]+)/;
        const endpointMatch = appJsContent.match(lastEndpointRegex);
        
        if (endpointMatch) {
          const endpointStatement = `app.get('/${className.toLowerCase()}', async (req, res) => {\n  scrapeAndRespond(${className}, res);\n});\n`;
          appJsContent = appJsContent.replace(
            endpointMatch[0],
            `${endpointMatch[0]}\n${endpointStatement}`
          );
        } else {
          console.error('Could not find a suitable position to add endpoint');
        }
      }
      
      // Write the updated content back to app.js
      fs.writeFileSync(appJsPath, appJsContent);
      console.log(`Updated app.js with endpoint for ${className}`);
      
    } catch (error) {
      console.error(`Error updating app.js: ${error}`);
      // Don't throw the error, as this shouldn't block the scraper creation
    }
  }
  
  /**
   * Generate the code for a new scraper class
   * @private
   */
  static generateScraperClass(className, url, selector, mappings, pagination) {
    const paginationSetup = pagination ? this.generatePaginationCode(pagination) : '';

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
        ${paginationSetup}
    }

    async scrapePage(page) {
        const elements = await page.$$(this.selector);
        const properties = await Promise.all(elements.map(async el => {
            ${this.generateMappingCode(mappings)}
            
            // Create property object with fallbacks for missing values
            return { 
                title: title || '', 
                location: location || '',
                imgUrl: imgUrl || '',
                link: url || '',
                price: price || '',
                company: "${className}" 
            };
        }));
        
        // Filter out invalid properties (those missing critical data)
        return properties.filter(prop => {
            // At minimum, require a link or title to consider a property valid
            return prop.link || prop.title;
        });
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
    
    code += '\n            // Extracting values with null-safety\n';
    
    // Generate property extraction code with null checks
    Object.entries(mappings).forEach(([field, selector]) => {
      if (field === 'price') {
        code += `            let rawPrice = null;\n`;
        code += `            let price = null;\n`;
        code += `            if (${field}Element) {\n`;
        code += `                try {\n`;
        code += `                    rawPrice = await page.evaluate(el => el.textContent, ${field}Element);\n`;
        code += `                    price = parsePrice(rawPrice);\n`;
        code += `                } catch (error) {\n`;
        code += `                    console.log(\`Error extracting price: \${error.message}\`);\n`;
        code += `                }\n`;
        code += `            }\n`;
      } else if (field === 'imgUrl') {
        code += `            let ${field} = null;\n`;
        code += `            if (${field}Element) {\n`;
        code += `                try {\n`;
        code += `                    ${field} = await page.evaluate(el => el.src, ${field}Element);\n`;
        code += `                } catch (error) {\n`;
        code += `                    console.log(\`Error extracting ${field}: \${error.message}\`);\n`;
        code += `                }\n`;
        code += `            }\n`;
      } else if (field === 'url') {
        code += `            let url = null;\n`;
        code += `            if (${field}Element) {\n`;
        code += `                try {\n`;
        code += `                    url = await page.evaluate(el => el.href, ${field}Element);\n`;
        code += `                } catch (error) {\n`;
        code += `                    console.log(\`Error extracting url: \${error.message}\`);\n`;
        code += `                }\n`;
        code += `            }\n`;
      } else {
        code += `            let ${field} = null;\n`;
        code += `            if (${field}Element) {\n`;
        code += `                try {\n`;
        code += `                    ${field} = await page.evaluate(el => el.textContent, ${field}Element);\n`;
        code += `                } catch (error) {\n`;
        code += `                    console.log(\`Error extracting ${field}: \${error.message}\`);\n`;
        code += `                }\n`;
        code += `            }\n`;
      }
    });
    
    return code;
  }

  /**
   * Generate code for pagination configuration
   * @private
   */
  static generatePaginationCode(pagination) {
    if (!pagination || !pagination.enabled) {
      return '';
    }

    let code = `// Configure pagination
        this.configurePagination({
            enabled: true,
            type: '${pagination.type}'`;
    
    // Add other pagination properties if they exist
    if (pagination.selector) {
      code += `,\n            selector: '${pagination.selector}'`;
    }
    if (pagination.urlTemplate) {
      code += `,\n            urlTemplate: '${pagination.urlTemplate}'`;
    }
    if (pagination.maxPages) {
      code += `,\n            maxPages: ${pagination.maxPages}`;
    }
    if (pagination.nextButtonSelector) {
      code += `,\n            nextButtonSelector: '${pagination.nextButtonSelector}'`;
    }
    
    code += '\n        });';
    return code;
  }
}

module.exports = ScraperFactory; 