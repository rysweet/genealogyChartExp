export async function importGedcomFile(file) {
  try {
    console.log("Reading GEDCOM file...");
    const text = await file.text();
    console.log("GEDCOM file contents (first 200 chars):", text.substring(0, 200));

    // Basic GEDCOM validation
    if (!text.includes('0 HEAD') || !text.includes('0 @')) {
      throw new Error('File does not appear to be valid GEDCOM format');
    }

    const lines = text.split('\n').map(line => line.trim());
    console.log(`Processing ${lines.length} lines of GEDCOM data`);

    // First pass: collect all individuals and families
    const people = new Map();
    const families = new Map();
    let currentRecord = null;
    let currentType = null;

    for (const line of lines) {
      const level = parseInt(line.charAt(0));
      const parts = line.substring(2).split(' ');
      
      // New record
      if (level === 0) {
        if (line.includes('INDI')) {
          const id = parts[0].replace(/@/g, '');
          currentRecord = { id, firstName: '', lastName: '', birthDate: '', deathDate: '', parents: [] };
          currentType = 'INDI';
          people.set(id, currentRecord);
        } else if (line.includes('FAM')) {
          const famId = parts[0].replace(/@/g, '');
          currentRecord = { id: famId, children: [], parents: [] };
          currentType = 'FAM';
          families.set(famId, currentRecord);
        } else {
          currentRecord = null;
          currentType = null;
        }
        continue;
      }

      if (!currentRecord) continue;

      // Process individual records
      if (currentType === 'INDI') {
        if (line.includes('1 NAME')) {
          const nameParts = line.substring(7).split('/').map(p => p.trim().replace(/@/g, ''));
          currentRecord.firstName = nameParts[0] || '';
          currentRecord.lastName = nameParts[1] || '';
        } else if (line.includes('2 DATE') && lines[lines.indexOf(line) - 1]?.includes('1 BIRT')) {
          currentRecord.birthDate = line.substring(7).trim();
        } else if (line.includes('2 DATE') && lines[lines.indexOf(line) - 1]?.includes('1 DEAT')) {
          currentRecord.deathDate = line.substring(7).trim();
        }
      }
      // Process family records
      else if (currentType === 'FAM') {
        if (line.includes('1 HUSB')) {
          const husbId = parts[1].replace(/@/g, '');
          currentRecord.parents.push(husbId);
        } else if (line.includes('1 WIFE')) {
          const wifeId = parts[1].replace(/@/g, '');
          currentRecord.parents.push(wifeId);
        } else if (line.includes('1 CHIL')) {
          const childId = parts[1].replace(/@/g, '');
          currentRecord.children.push(childId);
        }
      }
    }

    // Second pass: link children to parents
    for (const family of families.values()) {
      for (const childId of family.children) {
        const child = people.get(childId);
        if (child) {
          child.parents = family.parents;
        }
      }
    }

    console.log('Parsed people:', Array.from(people.values()));
    console.log('Parsed families:', Array.from(families.values()));
    
    return Array.from(people.values());

  } catch (err) {
    console.error("GEDCOM parsing error:", err);
    throw new Error(`GEDCOM parsing failed: ${err.message}`);
  }
}
