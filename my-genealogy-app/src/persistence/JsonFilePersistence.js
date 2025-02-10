import { PersistenceLayer } from './PersistenceLayer';

export class JsonFilePersistence extends PersistenceLayer {
  constructor(filename = 'genealogy-data.json') {
    super();
    this.filename = filename;
  }

  async save(data) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      // Using the File System Access API
      const handle = await window.showSaveFilePicker({
        suggestedName: this.filename,
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  async load() {
    try {
      // Using the File System Access API
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Error loading data:', error);
      return null;
    }
  }
}
