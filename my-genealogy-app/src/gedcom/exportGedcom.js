export function exportGedcom(people) {
  let gedcomText = "0 HEAD\n1 CHAR UTF-8\n1 GEDC\n2 VERS 7.0\n";
  const families = new Map();

  // First pass: Generate individual records and collect family relationships
  people.forEach((person, index) => {
    const id = `@I${index + 1}@`;
    gedcomText += `0 ${id} INDI\n`;
    gedcomText += `1 NAME ${person.firstName || ""} /${person.lastName || ""}/\n`;
    
    if (person.sex) gedcomText += `1 SEX ${person.sex}\n`;
    
    if (person.birthDate || person.birthPlace) {
      gedcomText += "1 BIRT\n";
      if (person.birthDate) gedcomText += `2 DATE ${person.birthDate}\n`;
      if (person.birthPlace) gedcomText += `2 PLAC ${person.birthPlace}\n`;
    }

    if (person.deathDate || person.deathPlace) {
      gedcomText += "1 DEAT\n";
      if (person.deathDate) gedcomText += `2 DATE ${person.deathDate}\n`;
      if (person.deathPlace) gedcomText += `2 PLAC ${person.deathPlace}\n`;
    }

    if (person.occupation) gedcomText += `1 OCCU ${person.occupation}\n`;
    
    person.sources.forEach(source => {
      gedcomText += `1 SOUR ${source}\n`;
    });

    if (person.notes) gedcomText += `1 NOTE ${person.notes}\n`;

    // Collect family relationships
    person.spouses.forEach(marriage => {
      const famId = `F${index}_${marriage.spouseId}`;
      families.set(famId, {
        husband: person.sex === 'F' ? marriage.spouseId : person.id,
        wife: person.sex === 'F' ? person.id : marriage.spouseId,
        marriageDate: marriage.marriageDate,
        marriagePlace: marriage.marriagePlace,
        divorceDate: marriage.divorceDate
      });
    });
  });

  // Second pass: Generate family records
  families.forEach((fam, famId) => {
    gedcomText += `0 @${famId}@ FAM\n`;
    if (fam.husband) gedcomText += `1 HUSB @${fam.husband}@\n`;
    if (fam.wife) gedcomText += `1 WIFE @${fam.wife}@\n`;
    if (fam.marriageDate || fam.marriagePlace) {
      gedcomText += "1 MARR\n";
      if (fam.marriageDate) gedcomText += `2 DATE ${fam.marriageDate}\n`;
      if (fam.marriagePlace) gedcomText += `2 PLAC ${fam.marriagePlace}\n`;
    }
    if (fam.divorceDate) {
      gedcomText += "1 DIV\n";
      gedcomText += `2 DATE ${fam.divorceDate}\n`;
    }
  });

  gedcomText += "0 TRLR\n";
  return gedcomText;
}
