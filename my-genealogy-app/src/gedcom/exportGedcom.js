export function exportGedcom(people) {
  let gedcomText = "0 HEAD\n1 CHAR UTF-8\n1 GEDC\n2 VERS 7.0\n";
  
  // First pass: Export all INDI records
  people.forEach(person => {
    gedcomText += `0 @${person.id}@ INDI\n`;
    gedcomText += `1 NAME ${person.firstName || ""} /${person.lastName || ""}/\n`;
    if (person.birthDate) {
      gedcomText += "1 BIRT\n2 DATE " + person.birthDate + "\n";
    }
    if (person.deathDate) {
      gedcomText += "1 DEAT\n2 DATE " + person.deathDate + "\n";
    }
    // Add FAMC (family where person is a child) references
    if (person.parents && person.parents.length > 0) {
      const famId = `F${person.parents.sort().join('_')}`;
      gedcomText += `1 FAMC @${famId}@\n`;
    }
    // Add FAMS (family where person is a spouse) references
    if (person.families) {
      person.families.forEach(famId => {
        gedcomText += `1 FAMS @${famId}@\n`;
      });
    }
  });

  // Second pass: Export FAM records
  const processedFamilies = new Set();
  
  people.forEach(person => {
    if (person.parents && person.parents.length > 0) {
      const familyId = `F${person.parents.sort().join('_')}`;
      
      if (!processedFamilies.has(familyId)) {
        processedFamilies.add(familyId);
        
        gedcomText += `0 @${familyId}@ FAM\n`;
        // Add husband reference
        if (person.parents[0]) {
          gedcomText += `1 HUSB @${person.parents[0]}@\n`;
        }
        // Add wife reference
        if (person.parents[1]) {
          gedcomText += `1 WIFE @${person.parents[1]}@\n`;
        }
        
        // Add all children
        people.forEach(potentialChild => {
          if (potentialChild.parents &&
              potentialChild.parents.length === person.parents.length &&
              potentialChild.parents.every(p => person.parents.includes(p))) {
            gedcomText += `1 CHIL @${potentialChild.id}@\n`;
          }
        });
      }
    }
  });

  gedcomText += "0 TRLR\n";
  return gedcomText;
}
