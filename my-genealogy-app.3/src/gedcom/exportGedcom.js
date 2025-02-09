export function exportGedcom(people) {
  let gedcomText = "0 HEAD\n1 CHAR UTF-8\n";

  people.forEach((person, index) => {
    gedcomText += "0 @I" + (index + 1) + "@ INDI\n";
    gedcomText += "1 NAME " + person.firstName + " /" + person.lastName + "/\n";
    if (person.birthDate) {
      gedcomText += "1 BIRT\n2 DATE " + person.birthDate + "\n";
    }
    if (person.deathDate) {
      gedcomText += "1 DEAT\n2 DATE " + person.deathDate + "\n";
    }
  });

  gedcomText += "0 TRLR\n";
  return gedcomText;
}
