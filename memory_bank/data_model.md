# Modelo de Datos

## Estructura Principal

### Propiedad
```typescript
interface Property {
  id: string;
  source: string;
  sourceId: string;
  title: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    type: 'sale' | 'rent';
  };
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    area: number;
    parking: number;
    type: string;
    status: string;
  };
  images: string[];
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastScraped: Date;
    url: string;
  };
}
```

## Relaciones y Dependencias

### Índices
- `id`: Identificador único
- `source + sourceId`: Identificador único por fuente
- `location.coordinates`: Índice geoespacial
- `price.amount`: Índice para búsquedas por rango
- `features.type`: Índice para filtrado

### Validaciones
- Precios positivos
- Coordenadas válidas
- URLs válidas
- Formatos de contacto

## Evolución del Modelo

### Versión 1.0
- Estructura básica de propiedades
- Información esencial de contacto
- Metadatos de scraping

### Próximas Mejoras
- Historial de precios
- Análisis de tendencias
- Integración con servicios externos 