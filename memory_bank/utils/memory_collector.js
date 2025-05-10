/**
 * Memory Collector
 * 
 * Utilidad para analizar, recopilar y sintetizar información del memory bank.
 * Permite generar resúmenes, hacer seguimiento de cambios y mantener un historial
 * de evolución del scraper.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

const MEMORY_BANK_DIR = path.join(__dirname, '../');
const SUMMARY_FILE = 'memory_summary.md';

/**
 * Clase para recopilar, analizar y sintetizar información del memory bank
 */
class MemoryCollector {
  /**
   * Genera un resumen de todo el memory bank
   * @returns {Promise<string>} - Resumen generado
   */
  static async generateSummary() {
    try {
      // Leer archivos principales
      const files = [
        'architecture.md',
        'sources.md',
        'data_model.md',
        'development.md'
      ];
      
      let summaryContent = '# Memory Bank Summary\n\n';
      summaryContent += `Generated: ${new Date().toISOString()}\n\n`;
      
      // Procesar cada archivo
      for (const file of files) {
        const content = await this.readFile(file);
        const fileTitle = this.extractTitle(content);
        const summary = this.summarizeContent(content);
        
        summaryContent += `## ${fileTitle}\n\n${summary}\n\n`;
      }
      
      // Añadir resumen de las notas
      summaryContent += await this.summarizeNotes();
      
      // Escribir el resumen a un archivo
      const summaryPath = path.join(MEMORY_BANK_DIR, SUMMARY_FILE);
      await writeFileAsync(summaryPath, summaryContent, 'utf8');
      
      return summaryContent;
    } catch (error) {
      console.error('Error generating memory bank summary:', error);
      throw error;
    }
  }
  
  /**
   * Leer un archivo del memory bank
   * @private
   */
  static async readFile(fileName) {
    const filePath = path.join(MEMORY_BANK_DIR, fileName);
    return await readFileAsync(filePath, 'utf8');
  }
  
  /**
   * Extraer el título de un documento markdown
   * @private
   */
  static extractTitle(content) {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1] : 'Untitled';
  }
  
  /**
   * Generar un resumen del contenido (primeros párrafos)
   * @private
   */
  static summarizeContent(content) {
    // Eliminar el título principal
    const withoutTitle = content.replace(/^#\s+(.+)$/m, '').trim();
    
    // Tomar los primeros 2-3 párrafos
    const paragraphs = withoutTitle.split('\n\n');
    const summary = paragraphs.slice(0, 3).join('\n\n');
    
    // Si hay más párrafos, indicarlo
    if (paragraphs.length > 3) {
      return summary + '\n\n*[...contenido adicional omitido]*';
    }
    
    return summary;
  }
  
  /**
   * Resumir notas disponibles
   * @private
   */
  static async summarizeNotes() {
    const notesDir = path.join(MEMORY_BANK_DIR, 'notes');
    
    if (!fs.existsSync(notesDir)) {
      return '## Notes\n\nNo hay notas disponibles.';
    }
    
    const noteFiles = fs.readdirSync(notesDir)
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => {
        // Ordenar por timestamp descendente (más reciente primero)
        const timestampA = a.match(/_(\d+)\.md$/);
        const timestampB = b.match(/_(\d+)\.md$/);
        
        if (timestampA && timestampB) {
          return parseInt(timestampB[1]) - parseInt(timestampA[1]);
        }
        
        return a.localeCompare(b);
      });
    
    let notesContent = '## Notas recientes\n\n';
    
    if (noteFiles.length === 0) {
      return notesContent + 'No hay notas disponibles.';
    }
    
    // Mostrar las 5 notas más recientes
    const recentNotes = noteFiles.slice(0, 5);
    
    for (const noteFile of recentNotes) {
      const notePath = path.join(notesDir, noteFile);
      const noteContent = await readFileAsync(notePath, 'utf8');
      
      const title = this.extractTitle(noteContent);
      const date = noteFile.match(/_(\d+)\.md$/) 
        ? new Date(parseInt(noteFile.match(/_(\d+)\.md$/)[1])).toISOString().split('T')[0]
        : 'Fecha desconocida';
      
      notesContent += `### ${title} (${date})\n\n`;
      
      // Añadir un breve resumen de la nota
      const firstParagraph = noteContent
        .replace(/^#\s+(.+)$/m, '')
        .trim()
        .split('\n\n')[0];
      
      notesContent += firstParagraph + '\n\n';
    }
    
    // Si hay más notas, mencionarlo
    if (noteFiles.length > 5) {
      notesContent += `*[... y ${noteFiles.length - 5} notas más]*\n\n`;
    }
    
    return notesContent;
  }
  
  /**
   * Analizar y generar estadísticas de scrapers
   * @returns {Promise<Object>} - Estadísticas de scrapers
   */
  static async generateScraperStats() {
    try {
      const sourcesContent = await this.readFile('sources.md');
      
      // Extraer las fuentes listadas
      const sources = sourcesContent.match(/^##\s+(.+)$/gm);
      const sourceCount = sources ? sources.length : 0;
      
      // Extraer detalles de cada fuente
      const sourceDetails = [];
      if (sources) {
        for (const source of sources) {
          const name = source.replace(/^##\s+/, '').trim();
          const urlMatch = sourcesContent.match(new RegExp(`##\\s+${name}[\\s\\S]*?URL:\\s*([^\\n]+)`));
          const url = urlMatch ? urlMatch[1].trim() : 'N/A';
          
          // Buscar fecha de adición
          const dateMatch = sourcesContent.match(new RegExp(`##\\s+${name}[\\s\\S]*?Added:\\s*([^\\n]+)`));
          const dateAdded = dateMatch ? dateMatch[1].trim() : 'N/A';
          
          sourceDetails.push({ name, url, dateAdded });
        }
      }
      
      return {
        totalScrapers: sourceCount,
        scrapers: sourceDetails
      };
    } catch (error) {
      console.error('Error generating scraper statistics:', error);
      throw error;
    }
  }
  
  /**
   * Genera y guarda un informe de estado del memory bank
   * @returns {Promise<Object>} - Informe generado 
   */
  static async generateStatusReport() {
    try {
      const stats = await this.generateScraperStats();
      const report = {
        generatedAt: new Date().toISOString(),
        memoryBankStatus: {
          totalDocuments: fs.readdirSync(MEMORY_BANK_DIR)
            .filter(file => file.endsWith('.md')).length,
          totalNotes: fs.existsSync(path.join(MEMORY_BANK_DIR, 'notes')) 
            ? fs.readdirSync(path.join(MEMORY_BANK_DIR, 'notes'))
                .filter(file => file.endsWith('.md')).length
            : 0
        },
        scraperStats: stats
      };
      
      // Guardar el informe como JSON
      const reportPath = path.join(MEMORY_BANK_DIR, 'status_report.json');
      await writeFileAsync(reportPath, JSON.stringify(report, null, 2), 'utf8');
      
      return report;
    } catch (error) {
      console.error('Error generating status report:', error);
      throw error;
    }
  }
}

module.exports = MemoryCollector; 