import { PersistenceLayer } from './PersistenceLayer';

export class LocalStoragePersistence extends PersistenceLayer {
  constructor(key = 'genealogy-data') {
    super();
    this.storageKey = key;
  }

  async save(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  async load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }
}
