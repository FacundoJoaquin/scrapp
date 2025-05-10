const fs = require('fs');
const path = require('path');
const util = require('util');

const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const appendFileAsync = util.promisify(fs.appendFile);

const MEMORY_BANK_DIR = path.join(__dirname, '../../memory_bank');

/**
 * Memory Bank Manager to provide access to documentation and context
 */
class MemoryBankManager {
  /**
   * Read a document from the memory bank
   * @param {string} fileName - The file name to read from memory bank
   * @returns {Promise<string>} - The content of the file
   */
  static async readDocument(fileName) {
    try {
      const filePath = path.join(MEMORY_BANK_DIR, fileName);
      return await readFileAsync(filePath, 'utf8');
    } catch (error) {
      console.error(`Error reading memory bank file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Write or update a document in the memory bank
   * @param {string} fileName - The file name to write to
   * @param {string} content - The content to write
   * @returns {Promise<void>}
   */
  static async writeDocument(fileName, content) {
    try {
      const filePath = path.join(MEMORY_BANK_DIR, fileName);
      await writeFileAsync(filePath, content, 'utf8');
    } catch (error) {
      console.error(`Error writing to memory bank file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Append content to an existing document
   * @param {string} fileName - The file name to append to
   * @param {string} content - The content to append
   * @returns {Promise<void>}
   */
  static async appendToDocument(fileName, content) {
    try {
      const filePath = path.join(MEMORY_BANK_DIR, fileName);
      await appendFileAsync(filePath, content, 'utf8');
    } catch (error) {
      console.error(`Error appending to memory bank file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Get all available documents in the memory bank
   * @returns {Promise<string[]>} - Array of file names
   */
  static async listDocuments() {
    try {
      const files = fs.readdirSync(MEMORY_BANK_DIR)
        .filter(file => file.endsWith('.md'));
      return files;
    } catch (error) {
      console.error('Error listing memory bank documents:', error);
      throw error;
    }
  }

  /**
   * Add a new real estate source to the sources documentation
   * @param {string} name - Name of the real estate agency
   * @param {string} url - Base URL of the agency
   * @param {string} description - Short description of what's being scraped
   * @returns {Promise<void>}
   */
  static async addRealEstateSource(name, url, description) {
    const content = `\n## ${name}\n- URL: ${url}\n- Description: ${description}\n- Added: ${new Date().toISOString().split('T')[0]}\n`;
    await this.appendToDocument('sources.md', content);
  }

  /**
   * Create a new note in the notes directory
   * @param {string} title - Note title
   * @param {string} content - Note content
   * @returns {Promise<void>}
   */
  static async createNote(title, content) {
    const notesDir = path.join(MEMORY_BANK_DIR, 'notes');
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir, { recursive: true });
    }
    
    const fileName = `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.md`;
    const filePath = path.join(notesDir, fileName);
    
    const noteContent = `# ${title}\n\nCreated: ${new Date().toISOString()}\n\n${content}`;
    await writeFileAsync(filePath, noteContent, 'utf8');
    return fileName;
  }
}

module.exports = MemoryBankManager; 