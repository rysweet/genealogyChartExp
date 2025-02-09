export async function importGedcomFile(file) {
  const text = await file.text();
  // Very naive GEDCOM parsing stub
  const lines = text.split(/\\r?\\n/);
  let people = [];
  let currentPerson = null;

  lines.forEach((line) => {
    if (line.match(/^0 @I/)) {
      if (currentPerson) {
        people.push(currentPerson);
      }
      currentPerson = { id: "", firstName: "", lastName: "", birthDate: "", deathDate: "", parents: [] };
      const match = line.match(/^0 @(.+?)@/);
      if (match) {
        currentPerson.id = match[1];
      }
    } else if (currentPerson && line.includes("GIVN")) {
      currentPerson.firstName = line.split("GIVN ")[1] || "";
    } else if (currentPerson && line.includes("SURN")) {
      currentPerson.lastName = line.split("SURN ")[1] || "";
    } else if (currentPerson && line.includes("BIRT")) {
      // we'll skip or wait for the date line
    } else if (currentPerson && line.includes("DATE") && line.includes("BIRT")) {
      currentPerson.birthDate = line.split("DATE ")[1] || "";
    } else if (currentPerson && line.includes("DEAT")) {
      // skip or wait for date
    } else if (currentPerson && line.includes("DATE") && line.includes("DEAT")) {
      currentPerson.deathDate = line.split("DATE ")[1] || "";
    }
    // Real GEDCOM would require deeper parsing for parent relationships (FAM, HUSB, WIFE, etc.)
  });

  if (currentPerson) {
    people.push(currentPerson);
  }

  return people;
}
