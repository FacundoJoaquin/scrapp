# Scraper de Inmobiliarias

Servicio API REST que permite scrapear propiedades de múltiples inmobiliarias, con soporte para paginación automática y creación dinámica de scrapers.

## Características

- 🏠 Scraping de múltiples inmobiliarias desde una sola API
- 📝 Sistema Memory Bank para mantener contexto y documentación
- 🔍 Creación dinámica de scrapers sin necesidad de modificar código
- 📑 Soporte para paginación avanzada (por URL y por botones)
- 🔄 Actualizaciones automáticas del código fuente
- 📊 Sistema de reporte y estadísticas

## Comenzando

### Prerrequisitos

- Node.js 20.x o superior
- NPM

### Instalación

```bash
git clone https://github.com/yourusername/scrapp.git
cd scrapp
npm install
```

### Ejecución

```bash
npm run dev
```

## Uso

### Endpoints disponibles

#### Scraper de inmobiliarias
```
GET /armando - Propiedades de Armando Constanza
GET /arnoldi - Propiedades de Arnoldi
GET /bounos - Propiedades de Bounos
GET /mallemacci - Propiedades de Mallemacci
GET /salcovsky - Propiedades de Salcovsky
GET /surwal - Propiedades de Surwal
GET /zz - Propiedades de ZZ Deptos
GET /ecapropiedades - Propiedades de ECA Propiedades
GET /lginmobiliaria - Propiedades de LG Inmobiliaria
```

#### Gestión del Memory Bank
```
GET /memory-bank - Listar documentos
GET /memory-bank/:document - Leer documento
POST /memory-bank/:document - Actualizar documento
POST /memory-bank/:document/append - Añadir contenido
GET /memory-bank/summary/generate - Generar resumen
GET /memory-bank/stats - Obtener estadísticas
GET /memory-bank/report - Generar informe
```

#### Creación de Scrapers
```
POST /scrapers - Crear nuevo scraper
```

### Creación de un nuevo scraper

Para crear un nuevo scraper, envía una solicitud POST a `/scrapers` con la siguiente estructura:

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

El sistema:
1. Creará un archivo de clase para el scraper
2. Actualizará app.js con el endpoint
3. Registrará la inmobiliaria en el memory bank
4. Devolverá un JSON con el endpoint generado

## Documentación

Para más información, consulta la documentación en `/memory_bank` o ejecuta una solicitud GET a `/memory-bank/summary/generate` para obtener un resumen completo.

## Licencia

[MIT](LICENSE)
