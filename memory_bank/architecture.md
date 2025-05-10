# Arquitectura del Sistema

## Visión General
El sistema es un scraper de Node.js diseñado para extraer información de propiedades de diferentes inmobiliarias.

## Componentes Principales

### 1. Scraper Core
- Motor principal de scraping
- Gestión de colas y rate limiting
- Manejo de errores y reintentos

### 2. Fuentes de Datos
- Módulos específicos para cada inmobiliaria
- Adaptadores para diferentes formatos de datos
- Sistema de validación de datos

### 3. Almacenamiento
- Base de datos para persistencia
- Sistema de caché
- Backup y recuperación

### 4. API y Monitoreo
- Endpoints para consulta de datos
- Dashboard de monitoreo
- Sistema de alertas

## Flujo de Datos
1. Programación de tareas de scraping
2. Extracción de datos de las fuentes
3. Procesamiento y normalización
4. Almacenamiento en base de datos
5. Disponibilidad a través de API

## Consideraciones Técnicas
- Rate limiting por fuente
- Manejo de sesiones y cookies
- Proxy rotation
- Validación de datos
- Logging y monitoreo 