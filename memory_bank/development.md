# Guías de Desarrollo

Este documento contiene guías y mejores prácticas para el desarrollo del scraper de inmobiliarias.

## Estructura de un Scraper

Cada scraper debe seguir esta estructura básica:

```javascript
const Scraper = require('./Scraper.js');

class NombreInmobiliaria extends Scraper {
  constructor() {
    super('https://url-de-la-inmobiliaria.com');
    this.selector = '.selector-principal';
    
    // Configuración opcional de paginación
    this.configurePagination({
      enabled: true,
      type: 'url', // o 'button'
      selector: '.paginacion a',
      urlTemplate: 'https://url-de-la-inmobiliaria.com/pagina/{{PAGE}}',
      maxPages: 5
    });
  }

  async scrapePage(page) {
    // Implementación específica para esta inmobiliaria
    // ...
  }
}

module.exports = NombreInmobiliaria;
```

## Creación de un nuevo scraper

### Método manual

1. Crear un nuevo archivo en `src/class/` con el nombre de la inmobiliaria
2. Implementar la clase siguiendo la estructura anterior
3. Añadir la importación y el endpoint en app.js

### Método automatizado (recomendado)

1. Enviar un POST a `/scrapers` con la configuración:

```json
{
  "name": "NombreInmobiliaria",
  "url": "https://ejemplo-inmobiliaria.com/alquileres",
  "selector": ".selector-principal",
  "mappings": {
    "title": ".titulo",
    "location": ".ubicacion",
    "price": ".precio",
    "imgUrl": ".imagen img",
    "url": ".detalles a"
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

2. El sistema generará automáticamente:
   - El archivo de clase para el scraper
   - Actualizará app.js con el import y el endpoint
   - Documentará la inmobiliaria en el memory bank

## Sistema de Paginación

### Tipos de paginación

El sistema soporta dos tipos principales de paginación:

#### 1. Paginación por URL (`type: 'url'`)

Navega directamente a URLs construidas con un patrón definido:

```javascript
this.configurePagination({
  enabled: true,
  type: 'url',
  selector: '.paginacion a', // Para determinar cuántas páginas hay
  urlTemplate: 'https://ejemplo.com/propiedades/pagina/{{PAGE}}',
  maxPages: 5 // 0 para todas las páginas disponibles
});
```

El sistema:
1. Reemplaza `{{PAGE}}` con el número de página actual
2. Navega directamente a esa URL
3. Extrae propiedades de la página
4. Determina si hay más páginas analizando los enlaces de paginación

#### 2. Paginación por botón (`type: 'button'`)

Hace clic en un botón "siguiente" para navegar entre páginas:

```javascript
this.configurePagination({
  enabled: true,
  type: 'button',
  nextButtonSelector: '.pagination .next',
  maxPages: 5
});
```

El sistema:
1. Busca el botón definido por `nextButtonSelector`
2. Hace clic en él y espera a que se cargue la página
3. Extrae propiedades de la página
4. Repite hasta que no encuentre más botones o llegue al límite

### Parámetros de configuración

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| enabled | boolean | Activa/desactiva la paginación |
| type | string | 'url' o 'button' |
| selector | string | Selector para detectar enlaces de paginación |
| urlTemplate | string | Plantilla de URL con marcador {{PAGE}} |
| maxPages | number | Límite de páginas (0 = sin límite) |
| nextButtonSelector | string | Selector del botón "siguiente" |

## Actualizaciones Automáticas de app.js

Cuando se crea un nuevo scraper a través de la API, el sistema actualiza automáticamente el archivo app.js:

1. Añade la importación del nuevo scraper:
```javascript
const NuevoScraper = require('./class/NuevoScraper');
```

2. Añade el endpoint para acceder al scraper:
```javascript
app.get('/nuevoscraper', async (req, res) => {
  scrapeAndRespond(NuevoScraper, res);
});
```

El sistema es inteligente y:
- Mantiene el estilo y formato del código existente
- Evita duplicaciones verificando si el código ya existe
- Añade las líneas en las ubicaciones correctas

## Debugging

Para depurar un scraper:

1. Establece headless: false en el archivo Scraper.js para ver el navegador:
```javascript
const browser = await puppeteer.launch({
  executablePath,
  args: chromium.args,
  headless: false,
});
```

2. Usa console.log para rastrear el progreso:
```javascript
console.log('Elementos encontrados:', elements.length);
console.log('Primer elemento:', await page.evaluate(el => el.outerHTML, elements[0]));
```

3. Para problemas de paginación, verifica:
   - Que el selector de paginación sea correcto
   - Que el marcador {{PAGE}} esté correctamente posicionado en urlTemplate
   - Que el botón "siguiente" sea accesible (para type: 'button')

## Pruebas

Puedes usar el archivo `tests/inmobiliarias.http` para probar los endpoints si usas VS Code con la extensión REST Client.

## Configuración del Entorno

### Requisitos
- Node.js >= 18
- npm >= 9
- MongoDB >= 6
- Redis (opcional, para caché)

### Instalación
```bash
# Clonar repositorio
git clone [URL]

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

## Estructura del Proyecto
```
src/
├── core/           # Núcleo del scraper
├── sources/        # Módulos por inmobiliaria
├── models/         # Modelos de datos
├── utils/          # Utilidades comunes
├── config/         # Configuraciones
└── api/            # Endpoints de API
```

## Mejores Prácticas

### Scraping
- Respetar robots.txt
- Implementar rate limiting
- Manejar errores y reintentos
- Validar datos extraídos
- Usar proxies cuando sea necesario

### Código
- Seguir convenciones de ESLint
- Escribir tests unitarios
- Documentar funciones y clases
- Usar TypeScript
- Mantener logs detallados

### Git
- Usar conventional commits
- Crear PRs descriptivas
- Mantener ramas actualizadas
- Revisar código antes de merge

## Testing
```bash
# Tests unitarios
npm test

# Tests de integración
npm run test:integration

# Linting
npm run lint
```

## Debugging
- Usar logs estructurados
- Implementar tracing
- Monitorear métricas
- Revisar errores en producción 

## Manejo de Valores Faltantes

El sistema está diseñado para ser robusto ante valores faltantes durante el scraping:

### Nivel de ScraperFactory

Cuando se genera un nuevo scraper, el código incluye:

1. **Comprobaciones de null/undefined** para cada elemento:
   ```javascript
   if (titleElement) {
     try {
       title = await page.evaluate(el => el.textContent, titleElement);
     } catch (error) {
       console.log(`Error extracting title: ${error.message}`);
     }
   }
   ```

2. **Valores por defecto** al construir el objeto de propiedad:
   ```javascript
   return { 
     title: title || '', 
     location: location || '',
     // ...
   };
   ```

3. **Filtrado de propiedades inválidas** que no tienen información mínima:
   ```javascript
   return properties.filter(prop => {
     // At minimum, require a link or title to consider a property valid
     return prop.link || prop.title;
   });
   ```

### Nivel de Scraper Base

La clase base `Scraper` implementa:

1. **Manejo de errores** durante el proceso de scraping:
   ```javascript
   try {
     // Scraping process
   } catch (error) {
     console.error(`Error scraping: ${error.message}`);
     return []; // Return empty array on error
   }
   ```

2. **Validación de resultados** con el método `validateProperties()`:
   ```javascript
   const validProperties = this.validateProperties(allProperties);
   ```

3. **Normalización de datos** para garantizar una estructura consistente:
   ```javascript
   return {
     title: prop.title || '',
     location: prop.location || '',
     // ...
   };
   ```

### Efectos Prácticos

- Si un selector no encuentra elementos, se devuelve `null` en lugar de fallar
- Si una propiedad no tiene título ni enlace, se filtra automáticamente
- Si hay un error en el scraping de una propiedad, las demás siguen procesándose
- Siempre se devuelve un array (vacío en el peor caso) para evitar errores en la API

Esta robustez permite que el sistema funcione incluso cuando hay:
- Cambios en la estructura HTML de los sitios web
- Elementos que no están disponibles en algunas propiedades
- Errores temporales de conexión o renderizado
- Diferentes formatos de datos entre propiedades 