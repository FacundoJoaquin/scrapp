const puppeteer = require('puppeteer-core');
const edgeChromium = require('chrome-aws-lambda');
const LOCAL_CHROME_EXECUTABLE = '/usr/bin/google-chrome';

class Scraper {
  constructor(url) {
    this.url = url;
  }

  async scrape() {
    const executablePath = (await edgeChromium.executablePath) || LOCAL_CHROME_EXECUTABLE;
    const browser = await puppeteer.launch({ executablePath, args: edgeChromium.args, headless: true });
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