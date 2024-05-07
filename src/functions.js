async function scrapeAndRespond(ClassType, res) {
    try {
        // Crear una instancia de la clase proporcionada
        const scraperInstance = new ClassType();

        // Realizar scraping utilizando la instancia creada
        const data = await scraperInstance.scrape();

        // Enviar la data como respuesta
        res.json(data);
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({ error: 'Error en la automatización del navegador', details: err.toString() });
    }
}

module.exports = {
    scrapeAndRespond: scrapeAndRespond
};