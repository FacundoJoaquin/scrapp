# Guía de Desarrollo

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