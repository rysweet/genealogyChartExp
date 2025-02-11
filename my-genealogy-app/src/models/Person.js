export class Person {
  constructor(data = {}) {
    this.id = data.id || '';
    this.gedcomId = data.gedcomId || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.birthDate = data.birthDate || '';
    this.birthPlace = data.birthPlace || '';
    this.deathDate = data.deathDate || '';
    this.deathPlace = data.deathPlace || '';
    this.occupation = data.occupation || '';
    this.parents = data.parents || [];
    this.spouses = data.spouses || [];  // Array of {spouseId, marriageDate, marriagePlace, divorceDate}
    this.siblings = data.siblings || [];
    this.notes = data.notes || '';
    this.sex = data.sex || '';  // M/F/X
    this.sources = data.sources || [];
  }
}
