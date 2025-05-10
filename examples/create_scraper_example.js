/**
 * Ejemplo de uso: Crear un nuevo scraper de inmobiliaria
 * 
 * Este script demuestra cómo usar la API para crear un nuevo scraper
 * para una inmobiliaria usando el ScraperFactory.
 */

const axios = require('axios');

// Cambiar la URL base si el servidor está en otra dirección
const API_URL = 'http://localhost:4000';

// Datos para crear un nuevo scraper
const nuevaInmobiliaria = {
  name: "PropiedadesVIP",
  url: "https://propiedadesvip.com.ar/alquileres",
  selector: ".properties-list .property-item",
  mappings: {
    title: ".property-title h3",
    location: ".property-location span",
    price: ".property-price .price-tag",
    imgUrl: ".property-image img",
    url: ".property-details a"
  }
};

/**
 * Función para crear un nuevo scraper
 */
async function crearScraper() {
  try {
    console.log('Creando nuevo scraper para:', nuevaInmobiliaria.name);
    
    const response = await axios.post(`${API_URL}/scrapers`, nuevaInmobiliaria);
    
    console.log('Scraper creado exitosamente!');
    console.log('Detalles:', response.data);
    console.log(`Nuevo endpoint disponible en: ${API_URL}${response.data.endpoint}`);
    
    // Consultar el nuevo endpoint
    console.log('\nConsultando el nuevo endpoint para probar...');
    try {
      const scraperResponse = await axios.get(`${API_URL}${response.data.endpoint}`);
      console.log(`El scraper encontró ${scraperResponse.data.length} propiedades.`);
    } catch (error) {
      console.error('Error al consultar el nuevo endpoint:', error.message);
    }
    
  } catch (error) {
    console.error('Error al crear el scraper:', error.response?.data || error.message);
  }
}

/**
 * Consultar el resumen del memory bank
 */
async function consultarMemoryBank() {
  try {
    console.log('\nGenerando resumen del memory bank...');
    
    const response = await axios.get(`${API_URL}/memory-bank/summary/generate`);
    
    console.log('Resumen generado exitosamente!');
    console.log('Consulta el archivo memory_summary.md en el directorio memory_bank.');
    
    // Obtener estadísticas
    const statsResponse = await axios.get(`${API_URL}/memory-bank/stats`);
    console.log('\nEstadísticas de scrapers:');
    console.log(`Total de scrapers: ${statsResponse.data.totalScrapers}`);
    console.log('Scrapers disponibles:');
    statsResponse.data.scrapers.forEach(scraper => {
      console.log(`- ${scraper.name} (añadido: ${scraper.dateAdded})`);
    });
    
  } catch (error) {
    console.error('Error al consultar el memory bank:', error.response?.data || error.message);
  }
}

// Ejecutar las demostraciones
async function ejecutarDemo() {
  await crearScraper();
  await consultarMemoryBank();
  
  console.log('\n¡Demo completada!');
}

// Ejecutar la demo cuando se invoca el script directamente
if (require.main === module) {
  ejecutarDemo().catch(console.error);
}

module.exports = {
  crearScraper,
  consultarMemoryBank
}; 