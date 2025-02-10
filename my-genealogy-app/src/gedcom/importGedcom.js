export async function importGedcomFile(file) {
  const text = await file.text();
  console.log("Raw file content:", text.substring(0, 200) + "..."); // Show first 200 chars
  
  const peopleById = {};
  const familiesById = {};
  let currentRecord = null;
  let currentType = null;
  
  // Fix the line splitting - remove escaped characters
  const lines = text.split(/\r?\n/);
  console.log("Number of lines split:", lines.length);

  function finishRecord() {
    if (!currentRecord || !currentType) return;
    if (currentType === "INDI") {
      console.log("Parsed individual:", currentRecord);
      peopleById[currentRecord.id] = currentRecord;
    } else if (currentType === "FAM") {
      console.log("Parsed family:", currentRecord);
      familiesById[currentRecord.id] = currentRecord;
    }
    currentRecord = null;
    currentType = null;
  }

  // First pass: Create all people
  lines.forEach((line, index) => {
    console.log(`Line ${index}:`, line);
    const parts = line.trim().split(" ");
    if (parts.length < 2) return;
    const level = parts[0];
    const tagOrId = parts[1];

    if (level === "0" && tagOrId.startsWith("@") && parts.length >= 3) {
      const recordType = parts[2];
      finishRecord();
      const cleanedId = tagOrId.replace(/^@|@$/g, "");
      if (recordType === "INDI") {
        currentRecord = { 
          id: cleanedId, 
          firstName: "", 
          lastName: "", 
          birthDate: "", 
          deathDate: "", 
          parents: [],
          families: [] // Track which families this person belongs to
        };
        currentType = "INDI";
      } else if (recordType === "FAM") {
        currentRecord = { 
          id: cleanedId, 
          husb: null, 
          wife: null, 
          children: [] 
        };
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
      }
    } else if (currentType === "FAM") {
      const rest = line.trim().substring(2).trim();
      if (rest.startsWith("HUSB") || rest.startsWith("WIFE") || rest.startsWith("CHIL")) {
        const tokens = rest.split(" ");
        const refId = tokens[1] ? tokens[1].replace(/^@|@$/g, "") : null;
        if (rest.startsWith("HUSB")) currentRecord.husb = refId;
        else if (rest.startsWith("WIFE")) currentRecord.wife = refId;
        else if (rest.startsWith("CHIL")) currentRecord.children.push(refId);
      }
    }
  });
  finishRecord();

  // Second pass: Establish all relationships
  Object.values(familiesById).forEach((fam) => {
    const father = fam.husb;
    const mother = fam.wife;

    // Add family reference to parents
    if (father && peopleById[father]) {
      peopleById[father].families.push(fam.id);
    }
    if (mother && peopleById[mother]) {
      peopleById[mother].families.push(fam.id);
    }

    // Add parents to children
    fam.children.forEach((childId) => {
      if (peopleById[childId]) {
        peopleById[childId].parents = [];
        if (father) peopleById[childId].parents.push(father);
        if (mother) peopleById[childId].parents.push(mother);
      }
    });
  });

  console.log("People with relationships:", peopleById);
  return Object.values(peopleById);
}
