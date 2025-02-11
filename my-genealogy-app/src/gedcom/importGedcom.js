export async function importGedcomFile(file) {
  const text = await file.text();
  const peopleById = {};
  const familiesById = {};
  let currentRecord = null;
  let currentType = null;
  const lines = text.split(/\\r?\\n/);

  function finishRecord() {
    if (!currentRecord || !currentType) return;
    if (currentType === "INDI") {
      peopleById[currentRecord.id] = currentRecord;
    } else if (currentType === "FAM") {
      familiesById[currentRecord.id] = currentRecord;
    }
    currentRecord = null;
    currentType = null;
  }

  function initializeNewRecord(id, type) {
    if (type === "INDI") {
      return {
        id,
        gedcomId: id,
        firstName: "",
        lastName: "",
        birthDate: "",
        birthPlace: "",
        deathDate: "",
        deathPlace: "",
        occupation: "",
        parents: [],
        spouses: [],
        siblings: [],
        notes: "",
        sex: "",
        sources: []
      };
    }
    if (type === "FAM") {
      return { id, husb: null, wife: null, children: [] };
    }
  }

  lines.forEach((line) => {
    const parts = line.trim().split(" ");
    if (parts.length < 2) return;
    const level = parts[0];
    const tagOrId = parts[1];

    if (level === "0" && tagOrId.startsWith("@") && parts.length >= 3) {
      const recordType = parts[2];
      finishRecord();
      if (recordType === "INDI") {
        currentRecord = initializeNewRecord(tagOrId, "INDI");
        currentType = "INDI";
      } else if (recordType === "FAM") {
        currentRecord = initializeNewRecord(tagOrId, "FAM");
        currentType = "FAM";
      }
    } else if (currentType === "INDI") {
      const rest = line.trim().substring(2).trim();
      if (rest.startsWith("NAME")) {
        let nameVal = rest.replace("NAME", "").trim();
        const nameParts = nameVal.split("/");
        if (nameParts.length >= 2) {
          currentRecord.firstName = nameParts[0].trim();
          currentRecord.lastName = nameParts[1].trim();
        } else {
          currentRecord.firstName = nameVal;
        }
      } else if (rest.startsWith("GIVN")) {
        currentRecord.firstName = rest.replace("GIVN", "").trim();
      } else if (rest.startsWith("SURN")) {
        currentRecord.lastName = rest.replace("SURN", "").trim();
      } else if (rest.startsWith("BIRT")) {
      } else if (rest.startsWith("DEAT")) {
      } else if (rest.startsWith("DATE")) {
        if (line.includes("BIRT")) {
          currentRecord.birthDate = rest.replace("DATE", "").trim();
        } else if (line.includes("DEAT")) {
          currentRecord.deathDate = rest.replace("DATE", "").trim();
        } else {
          if (!currentRecord.birthDate) {
            currentRecord.birthDate = rest.replace("DATE", "").trim();
          } else {
            currentRecord.deathDate = rest.replace("DATE", "").trim();
          }
        }
      } else if (rest.startsWith("PLAC")) {
        if (line.includes("BIRT")) {
          currentRecord.birthPlace = rest.replace("PLAC", "").trim();
        } else if (line.includes("DEAT")) {
          currentRecord.deathPlace = rest.replace("PLAC", "").trim();
        }
      } else if (rest.startsWith("SEX")) {
        currentRecord.sex = rest.replace("SEX", "").trim();
      } else if (rest.startsWith("OCCU")) {
        currentRecord.occupation = rest.replace("OCCU", "").trim();
      } else if (rest.startsWith("NOTE")) {
        currentRecord.notes += rest.replace("NOTE", "").trim() + "\n";
      } else if (rest.startsWith("SOUR")) {
        currentRecord.sources.push(rest.replace("SOUR", "").trim());
      }
    } else if (currentType === "FAM") {
      const rest = line.trim().substring(2).trim();
      if (rest.startsWith("HUSB")) {
        const tokens = rest.split(" ");
        if (tokens.length >= 2) {
          currentRecord.husb = tokens[1];
        }
      } else if (rest.startsWith("WIFE")) {
        const tokens = rest.split(" ");
        if (tokens.length >= 2) {
          currentRecord.wife = tokens[1];
        }
      } else if (rest.startsWith("CHIL")) {
        const tokens = rest.split(" ");
        if (tokens.length >= 2) {
          currentRecord.children.push(tokens[1]);
        }
      } else if (rest.startsWith("MARR")) {
        currentRecord.marriageDate = "";
        currentRecord.marriagePlace = "";
      } else if (rest.startsWith("DIV")) {
        currentRecord.divorceDate = "";
      }
    }
  });
  finishRecord();
  Object.values(familiesById).forEach((fam) => {
    const father = fam.husb;
    const mother = fam.wife;
    fam.children.forEach((childId) => {
      if (peopleById[childId]) {
        peopleById[childId].parents = [];
        if (father) peopleById[childId].parents.push(father);
        if (mother) peopleById[childId].parents.push(mother);
      }
    });
  });

  Object.values(familiesById).forEach((fam) => {
    if (fam.husb && fam.wife) {
      const marriage = {
        spouseId: fam.wife,
        marriageDate: fam.marriageDate,
        marriagePlace: fam.marriagePlace,
        divorceDate: fam.divorceDate
      };
      if (peopleById[fam.husb]) {
        peopleById[fam.husb].spouses.push(marriage);
      }
      if (peopleById[fam.wife]) {
        peopleById[fam.wife].spouses.push({
          ...marriage,
          spouseId: fam.husb
        });
      }
    }
    fam.children.forEach((childId) => {
      if (peopleById[childId]) {
        peopleById[childId].siblings = fam.children.filter(id => id !== childId);
      }
    });
  });

  return Object.values(peopleById);
}
