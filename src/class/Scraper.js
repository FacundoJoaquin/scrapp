const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const edgeChromium = require("chrome-aws-lambda");

class Scraper {
  constructor(url) {
    this.url = url;
    // Configuración de paginación predeterminada (sin paginación)
    this.pagination = {
      enabled: false,
      type: "none", // 'none', 'button', 'url'
      selector: "",
      maxPages: 0,
      urlTemplate: "",
      hasNextSelector: "",
      nextButtonSelector: "",
    };
  }

  /**
   * Configura la paginación para el scraper
   * @param {Object} config - Configuración de paginación
   */
  configurePagination(config) {
    this.pagination = {
      ...this.pagination,
      ...config,
      enabled: true,
    };
  }

  /**
   * Ejecuta el scraping de todas las páginas
   */
  async scrape() {
    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      executablePath,
      args: chromium.args,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    try {
      await page.goto(this.url);

      // Add a timeout to avoid hanging if selector is not found
      try {
        await page.waitForSelector(this.selector, { timeout: 15000 });
      } catch (error) {
        console.error(
          `Error waiting for selector '${this.selector}': ${error.message}`
        );
        return []; // Return empty array if selector not found
      }

      let allProperties = [];

      // Si la paginación está habilitada, recorremos todas las páginas
      if (this.pagination.enabled) {
        allProperties = await this.scrapeAllPages(page);
      } else {
        // Sin paginación, solo scrapeamos la página actual
        allProperties = await this.scrapePage(page);
      }

      // Validate and clean properties
      const validProperties = this.validateProperties(allProperties);

      return validProperties;
    } catch (error) {
      console.error(
        `Error scraping ${this.constructor.name}: ${error.message}`
      );
      return []; // Return empty array on error
    } finally {
      await browser.close();
    }
  }

  /**
   * Scrapers para todas las páginas disponibles
   * @param {Object} page - Página de Puppeteer
   * @returns {Array} - Todas las propiedades de todas las páginas
   */
  async scrapeAllPages(page) {
    let allProperties = [];
    let currentPage = 1;
    let hasMorePages = true;

    console.log(
      `Iniciando scraping con paginación (tipo: ${this.pagination.type})`
    );

    while (
      hasMorePages &&
      (this.pagination.maxPages === 0 ||
        currentPage <= this.pagination.maxPages)
    ) {
      console.log(`Scrapeando página ${currentPage}...`);

      // Si no es la primera página y la paginación es por URL, navegamos directamente
      if (currentPage > 1 && this.pagination.type === "url") {
        const pageUrl = this.pagination.urlTemplate.replace(
          "{{PAGE}}",
          currentPage
        );
        console.log(`Navegando a: ${pageUrl}`);
        await page.goto(pageUrl, { waitUntil: "networkidle0" });
      }

      // Esperar a que los elementos estén cargados
      try {
        await page.waitForSelector(this.selector, { timeout: 10000 });
      } catch (error) {
        console.log(
          `No se encontraron elementos en la página ${currentPage}. Finalizando.`
        );
        break;
      }

      // Obtener propiedades de la página actual
      const propertiesOnPage = await this.scrapePage(page);

      // Si no hay propiedades, terminamos
      if (!propertiesOnPage || propertiesOnPage.length === 0) {
        console.log("No se encontraron propiedades. Finalizando.");
        break;
      }

      allProperties = [...allProperties, ...propertiesOnPage];
      console.log(
        `Se encontraron ${propertiesOnPage.length} propiedades en la página ${currentPage}`
      );

      // Verificar si hay más páginas dependiendo del tipo de paginación
      if (this.pagination.type === "button") {
        try {
          // Buscar el botón de siguiente página
          const nextButton = await page.$(this.pagination.nextButtonSelector);
          if (!nextButton) {
            console.log(
              "No se encontró botón para la siguiente página. Finalizando."
            );
            hasMorePages = false;
          } else {
            // Hacer clic en el botón y esperar a que se cargue la página
            console.log(`Haciendo clic en botón de siguiente página...`);
            await nextButton.click();
            await page.waitForNavigation({ waitUntil: "networkidle0" });
            currentPage++;
          }
        } catch (error) {
          console.error("Error al navegar a la siguiente página:", error);
          hasMorePages = false;
        }
      } else if (this.pagination.type === "url") {
        // Si es paginación por URL, verifica si hay más páginas
        if (this.pagination.selector) {
          try {
            // Buscar todos los enlaces de paginación
            const paginationLinks = await page.$$(this.pagination.selector);

            // Si no hay enlaces de paginación, terminamos
            if (!paginationLinks || paginationLinks.length === 0) {
              console.log(
                "No se encontraron enlaces de paginación. Finalizando."
              );
              hasMorePages = false;
              break;
            }

            // Extraer el número más alto de página para saber cuántas hay en total
            const pageNumbers = await Promise.all(
              paginationLinks.map(async (link) => {
                const text = await page.evaluate(
                  (el) => el.textContent.trim(),
                  link
                );
                const num = parseInt(text, 10);
                return isNaN(num) ? 0 : num;
              })
            );

            const maxPage = Math.max(...pageNumbers);
            console.log(
              `Página actual: ${currentPage}, Máximo de páginas: ${maxPage}`
            );

            // Si ya estamos en la última página, terminamos
            if (currentPage >= maxPage) {
              console.log("Llegamos a la última página. Finalizando.");
              hasMorePages = false;
            } else {
              // Avanzar a la siguiente página
              currentPage++;
            }
          } catch (error) {
            console.error("Error al verificar la paginación:", error);
            hasMorePages = false;
          }
        } else {
          // Si no hay selector para verificar páginas, incrementamos y seguimos
          currentPage++;
        }
      } else {
        // Si no es un tipo de paginación conocido, salimos del bucle
        hasMorePages = false;
      }
    }

    console.log(
      `Total de propiedades encontradas en todas las páginas: ${allProperties.length}`
    );
    return allProperties;
  }

  /**
   * Método para scrapear una sola página
   * Debe ser implementado por las subclases
   */
  async scrapePage(page) {
    throw new Error("scrapePage() must be implemented by subclases");
  }

  /**
   * Validates and cleans properties, removing invalid ones
   * @param {Array} properties - Array of scraped properties
   * @returns {Array} - Array of validated properties
   */
  validateProperties(properties) {
    if (!Array.isArray(properties)) {
      console.error(
        `Expected properties to be an array, got ${typeof properties}`
      );
      return [];
    }

    return properties
      .filter((prop) => {
        // Filter out null/undefined properties
        if (!prop) return false;

        // Ensure object has at least basic required properties
        const hasMinimumData = prop.title || prop.link;
        if (!hasMinimumData) {
          console.log("Filtering out property with insufficient data");
        }
        return hasMinimumData;
      })
      .map((prop) => {
        // Ensure all required fields exist with defaults
        return {
          title: prop.title || "",
          location: prop.location || "",
          imgUrl: prop.imgUrl || "",
          link: prop.link || "",
          price: prop.price || "",
          company: prop.company || this.constructor.name,
        };
      });
  }
}

module.exports = Scraper;
