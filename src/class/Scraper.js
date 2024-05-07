const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const edgeChromium = require('chrome-aws-lambda');

class Scraper {
  constructor(url) {
    this.url = url;
  }

  async scrape() {
    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      executablePath,
      args: chromium.args,
      headless: chromium.headless,
    });


    const page = await browser.newPage();
    await page.goto(this.url);
    await page.waitForSelector(this.selector);
    const data = await this.scrapePage(page);
    await browser.close();
    return data;
  }

  async scrapePage(page) {
    throw new Error('scrapePage() must be implemented by subclasses');
  }
}

module.exports = Scraper;
