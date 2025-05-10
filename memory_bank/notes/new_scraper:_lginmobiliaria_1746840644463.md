# New Scraper: LGInmobiliaria

Created: 2025-05-10T01:30:44.463Z

Added new scraper for LGInmobiliaria on 2025-05-10.

- URL: https://lginmobiliaria.com.ar/propiedades-encontradas/?status=alquiler
- Main selector: article.property-item
- Class file: LGInmobiliaria.js
- Pagination type: url
- URL template: https://lginmobiliaria.com.ar/propiedades-encontradas/page/{{PAGE}}/?status=alquiler
- Pagination selector: .pagination.rh_pagination_classic a.real-btn
- Endpoint: /lginmobiliaria