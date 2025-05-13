const Scraper = require("./Scraper.js");

function parsePrice(rawPrice) {
  if (!rawPrice) return "";
  return rawPrice
    .trim()
    .replace(/^\$/, "")
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/CAP.*/, "")
    .replace(/[^\d]/g, "");
}

class LGInmobiliaria extends Scraper {
  constructor() {
    super(
      `https://lginmobiliaria.com.ar/propiedades-encontradas/?status=alquiler`
    );
    this.selector = "article.property-item";
    
    // Configuramos la paginación usando el nuevo sistema
    this.configurePagination({
      enabled: true,
      type: 'url',
      selector: '.pagination.rh_pagination_classic a.real-btn',
      urlTemplate: 'https://lginmobiliaria.com.ar/propiedades-encontradas/page/{{PAGE}}/?status=venta',
      maxPages: 0 // 0 para todas las páginas disponibles
    });
  }

  async scrapePage(page) {
    const elements = await page.$$(this.selector);
    
    // Procesar las propiedades de esta página
    const properties = await Promise.all(
      elements.map(async (el) => {
        const titleElement = await el.$("h4 > a");
        const locationElement = await el.$(".detail > p");
        const priceElement = await el.$("h5.price");
        const imgUrlElement = await el.$(
          ".attachment-property-thumb-image.size-property-thumb-image.wp-post-image"
        );
        const urlElement = await el.$("a.more-details");

        // Si alguno de los elementos principales no existe, saltamos esta propiedad
        if (!titleElement || !priceElement || !urlElement) {
          console.log("Elemento incompleto, saltando...");
          return null;
        }

        const title = await page.evaluate(
          (el) => el.textContent,
          titleElement
        );
        const location = locationElement
          ? await page.evaluate((el) => el.textContent, locationElement)
          : "";
        const rawPrice = await page.evaluate(
          (el) => el.textContent,
          priceElement
        );
        const price = parsePrice(rawPrice);

        // Para la imagen, verificamos que exista
        let imgUrl = "";
        if (imgUrlElement) {
          imgUrl = await page.evaluate((el) => el.src, imgUrlElement);
        }

        const url = await page.evaluate((el) => el.href, urlElement);

        return {
          title,
          location,
          imgUrl,
          link: url,
          price,
          company: "LGInmobiliaria",
        };
      })
    );

    // Filtrar propiedades null (las que no se pudieron procesar)
    return properties.filter((prop) => prop !== null);
  }
}

module.exports = LGInmobiliaria;
