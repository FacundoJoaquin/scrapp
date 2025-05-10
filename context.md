# Contexto del Proyecto de Scraping de Inmobiliarias

## Descripción General

Este proyecto es un servicio de scraping de inmobiliarias que extrae datos de propiedades (alquileres) de diferentes sitios web de inmobiliarias en Argentina utilizando Puppeteer. El sistema está diseñado como una API REST que expone endpoints para cada inmobiliaria implementada.

## Arquitectura

- **Backend**: Node.js con Express
- **Scraping**: Puppeteer con Chromium headless
- **Estructura**: Patrón de diseño orientado a objetos con clases para cada inmobiliaria
- **Documentación**: Sistema Memory Bank para mantener contexto y documentación

## Componentes Principales

### 1. Scraper Base

El sistema utiliza una clase base `Scraper` que define el comportamiento común para todos los scrapers de inmobiliarias. Cada inmobiliaria específica extiende esta clase e implementa su propia lógica de extracción de datos.

```javascript
// src/class/Scraper.js
class Scraper {
  constructor(url) {
    this.url = url;
    // Configuración de paginación
    this.pagination = {
      enabled: false,
      type: 'none', // 'none', 'button', 'url'
      selector: '',
      maxPages: 0,
      urlTemplate: '',
      hasNextSelector: '',
      nextButtonSelector: '',
    };
  }

  async scrape() {
    // Código común para iniciar navegador, abrir página, etc.
    // ...
    // Si la paginación está habilitada, recorremos todas las páginas
    if (this.pagination.enabled) {
      allProperties = await this.scrapeAllPages(page);
    } else {
      // Sin paginación, solo scrapeamos la página actual
      allProperties = await this.scrapePage(page);
    }
    // ...
    return allProperties;
  }

  async scrapePage(page) {
    // Método abstracto implementado por subclases
    throw new Error('scrapePage() must be implemented by subclasses');
  }
}
```

### 2. Scrapers de Inmobiliarias

Cada inmobiliaria tiene su propio archivo de clase que extiende Scraper:

```javascript
// Ejemplo: src/class/ArmandoConstanza.js
class ArmandoConstanza extends Scraper {
  constructor() {
    super('https://www.armandocostanza.com/Buscar?operation=2&ptypes=2&locations=30446&o=2,2&1=1');
    this.selector = '.resultados-list > li';
    
    // Configuración opcional de paginación
    this.configurePagination({
      enabled: true,
      type: 'url',
      selector: '.pagination a',
      urlTemplate: 'https://www.armandocostanza.com/Buscar/page/{{PAGE}}?operation=2&ptypes=2',
    });
  }

  async scrapePage(page) {
    // Implementación específica para ArmandoConstanza
    // ...
  }
}
```

### 3. API REST

El sistema expone endpoints para cada inmobiliaria:

- `GET /armando` - Scraper para Armando Constanza
- `GET /arnoldi` - Scraper para Arnoldi
- `GET /bounos` - Scraper para Bounos
- `GET /mallemacci` - Scraper para Mallemacci
- `GET /salcovsky` - Scraper para Salcovsky
- `GET /surwal` - Scraper para Surwal
- `GET /zz` - Scraper para ZZ Deptos
- `GET /ecapropiedades` - Scraper para ECA Propiedades
- `GET /lginmobiliaria` - Scraper para LG Inmobiliaria

### 4. Memory Bank

Sistema de documentación y contextualización para mantener información sobre el proyecto:

- **Estructura**: Archivos Markdown en el directorio `memory_bank/`
- **Contenido**: Arquitectura, fuentes de datos, modelo de datos, guías de desarrollo
- **Propósito**: Mantener contexto, facilitar onboarding y documentar cambios

### 5. Utilidades implementadas

#### MemoryBankManager

Gestiona el acceso programático al memory bank:

```javascript
// src/utils/memoryBankManager.js
class MemoryBankManager {
  static async readDocument(fileName) { /* ... */ }
  static async writeDocument(fileName, content) { /* ... */ }
  static async appendToDocument(fileName, content) { /* ... */ }
  static async listDocuments() { /* ... */ }
  static async addRealEstateSource(name, url, description) { /* ... */ }
  static async createNote(title, content) { /* ... */ }
}
```

#### ScraperFactory

Facilita la creación de nuevos scrapers de forma programática:

```javascript
// src/utils/scraperFactory.js
class ScraperFactory {
  static async createScraper(name, url, selector, mappings, pagination = null) { /* ... */ }
  static updateAppJsWithEndpoint(className) { /* ... */ }
  static generateScraperClass(className, url, selector, mappings, pagination) { /* ... */ }
  static generateMappingCode(mappings) { /* ... */ }
  static generatePaginationCode(pagination) { /* ... */ }
}
```

#### MemoryCollector

Recopila y sintetiza información del memory bank:

```javascript
// memory_bank/utils/memory_collector.js
class MemoryCollector {
  static async generateSummary() { /* ... */ }
  static async generateScraperStats() { /* ... */ }
  static async generateStatusReport() { /* ... */ }
}
```

## Proceso para añadir una nueva inmobiliaria

1. **Definir configuración**: Crear un objeto JSON con la configuración:

```json
{
  "name": "NombreInmobiliaria",
  "url": "https://ejemplo-inmobiliaria.com/alquileres",
  "selector": ".contenedor-principal .item-propiedad",
  "mappings": {
    "title": ".titulo-propiedad",
    "location": ".ubicacion-propiedad",
    "price": ".precio-propiedad",
    "imgUrl": ".imagen-propiedad img",
    "url": ".detalle-propiedad a"
  },
  "pagination": {
    "enabled": true,
    "type": "url",
    "selector": ".paginacion a",
    "urlTemplate": "https://ejemplo-inmobiliaria.com/alquileres/pagina/{{PAGE}}",
    "maxPages": 5
  }
}
```

2. **Enviar al API**: Hacer un POST a `/scrapers` con el JSON
3. **El sistema automáticamente**:
   - Crea el archivo de clase para el scraper
   - Actualiza el archivo app.js para añadir el import y el endpoint
   - Documenta la nueva inmobiliaria en el memory bank
4. **Acceder al nuevo endpoint**: Usar el endpoint generado (ej: `/nombreinmobiliaria`)

## Sistema de Paginación

El proyecto incluye un sistema de paginación robusto que permite extraer datos de sitios con múltiples páginas de resultados:

### Tipos de paginación soportados:

1. **Paginación por URL (`type: 'url'`)**:
   - Navega directamente a URLs construidas con un patrón
   - Utiliza un marcador `{{PAGE}}` que se reemplaza por el número de página
   - Ejemplo: `https://ejemplo.com/propiedades/pagina/{{PAGE}}`

2. **Paginación por botón (`type: 'button'`)**:
   - Encuentra y hace clic en un botón de "siguiente página"
   - Requiere un selector para el botón (nextButtonSelector)
   - Espera a que se cargue la nueva página después del clic

### Configuración de paginación:

```javascript
this.configurePagination({
  enabled: true,        // Activa la paginación
  type: 'url',          // Tipo de paginación ('url' o 'button')
  selector: '.pagination a',  // Selector para detectar enlaces de paginación
  urlTemplate: 'https://ejemplo.com/propiedades/pagina/{{PAGE}}',  // Plantilla para URLs
  maxPages: 5,          // Límite máximo de páginas (0 = sin límite)
  nextButtonSelector: '.pagination .next'  // Solo para type: 'button'
});
```

## Actualizaciones Automáticas

El sistema actualiza automáticamente el archivo `app.js` cuando se crea un nuevo scraper:

1. **Añade la importación** del nuevo scraper a la lista de imports
2. **Crea el endpoint** correspondiente para acceder al scraper
3. **Mantiene la consistencia de formato** con el resto del código
4. **Evita duplicaciones** comprobando si el código ya existe

## Endpoints disponibles

### Scrapers de inmobiliarias
- `GET /armando` - Propiedades de Armando Constanza
- `GET /arnoldi` - Propiedades de Arnoldi
- `GET /bounos` - Propiedades de Bounos
- `GET /mallemacci` - Propiedades de Mallemacci
- `GET /salcovsky` - Propiedades de Salcovsky
- `GET /surwal` - Propiedades de Surwal
- `GET /zz` - Propiedades de ZZ Deptos
- `GET /ecapropiedades` - Propiedades de ECA Propiedades
- `GET /lginmobiliaria` - Propiedades de LG Inmobiliaria

### Memory Bank
- `GET /memory-bank` - Listar documentos disponibles
- `GET /memory-bank/:document` - Leer un documento específico
- `POST /memory-bank/:document` - Escribir/actualizar un documento
- `POST /memory-bank/:document/append` - Añadir contenido a un documento

### Memory Collector
- `GET /memory-bank/summary/generate` - Generar resumen del memory bank
- `GET /memory-bank/stats` - Obtener estadísticas de scrapers
- `GET /memory-bank/report` - Generar informe de estado

### Creación de Scrapers
- `POST /scrapers` - Crear un nuevo scraper de inmobiliaria

## Estructura de datos

Cada scraper devuelve un array de objetos con esta estructura:

```json
[
  {
    "title": "Departamento 2 ambientes",
    "location": "Av. Corrientes 1234, CABA",
    "imgUrl": "https://ejemplo.com/imagen.jpg",
    "link": "https://ejemplo.com/propiedad/123",
    "price": "85000",
    "company": "NombreInmobiliaria"
  },
  // ... más propiedades
]
```

## Tecnologías utilizadas

- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **Puppeteer** - Librería de scraping
- **Chromium** - Navegador headless
- **Axios** - Cliente HTTP (para ejemplos y tests)

## Despliegue 

El servicio está configurado para funcionar en Vercel, según se indica en el archivo `vercel.json`.

## Información adicional

El sistema está diseñado para ser fácilmente extensible mediante la API de creación de scrapers, lo que permite añadir nuevas inmobiliarias sin necesidad de modificar el código base. La implementación del sistema de paginación y actualizaciones automáticas garantiza una experiencia fluida al expandir el proyecto con nuevos orígenes de datos. 