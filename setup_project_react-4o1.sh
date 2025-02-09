#!/usr/bin/env bash

# Exit on error
set -e

# 1) Create project structure
mkdir -p my-genealogy-app
cd my-genealogy-app

mkdir -p public
mkdir -p src
mkdir -p src/components
mkdir -p src/data
mkdir -p src/gedcom

# 2) Create package.json
cat << 'EOF' > package.json
{
  "name": "my-genealogy-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "d3": "^7.8.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}
EOF

# 3) Create public/index.html
cat << 'EOF' > public/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Genealogy App</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

# 4) Create src/index.js
cat << 'EOF' > src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
EOF

# 5) Create src/App.jsx
cat << 'EOF' > src/App.jsx
import React, { useState, useEffect } from "react";
import sampleData from "./data/sampleData.json";
import Controls from "./components/Controls";
import GenealogyChart from "./components/GenealogyChart";
import { importGedcomFile } from "./gedcom/importGedcom";
import { exportGedcom } from "./gedcom/exportGedcom";

function App() {
  const [maxGenerations, setMaxGenerations] = useState(5);
  const [people, setPeople] = useState([]);
  const [centerId, setCenterId] = useState("g0_1");

  // Load sample data by default
  useEffect(() => {
    setPeople(sampleData);
    if (sampleData.length > 0) {
      setCenterId(sampleData[0].id);
    }
  }, []);

  const handleImportGedcom = async (file) => {
    try {
      const importedPeople = await importGedcomFile(file);
      if (importedPeople.length > 0) {
        setCenterId(importedPeople[0].id);
      }
      setPeople(importedPeople);
    } catch (err) {
      console.error("Error importing GEDCOM:", err);
    }
  };

  const handleExportGedcom = () => {
    const gedcomText = exportGedcom(people);
    const blob = new Blob([gedcomText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "family.ged";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addGeneration = () => {
    setMaxGenerations((prev) => prev + 1);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <h1>Genealogy Chart</h1>
      <Controls
        onImportGedcom={handleImportGedcom}
        onExportGedcom={handleExportGedcom}
        onAddGeneration={addGeneration}
      />
      <GenealogyChart
        people={people}
        maxGenerations={maxGenerations}
        centerPersonId={centerId}
        onUpdatePeople={setPeople}
      />
    </div>
  );
}

export default App;
EOF

# 6) Create src/components/Controls.jsx
cat << 'EOF' > src/components/Controls.jsx
import React from "react";

export default function Controls({ onImportGedcom, onExportGedcom, onAddGeneration }) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImportGedcom(file);
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <label htmlFor="gedcomFile">Import GEDCOM: </label>
      <input
        id="gedcomFile"
        type="file"
        accept=".ged, text/plain"
        onChange={handleFileUpload}
      />
      <button onClick={onExportGedcom} style={{ marginLeft: "10px" }}>
        Export GEDCOM
      </button>
      <button onClick={onAddGeneration} style={{ marginLeft: "10px" }}>
        + Generation
      </button>
    </div>
  );
}
EOF

# 7) Create src/components/PersonEditForm.jsx
cat << 'EOF' > src/components/PersonEditForm.jsx
import React, { useState } from "react";

export default function PersonEditForm({ person, onSave, onCancel }) {
  const [formData, setFormData] = useState({ ...person });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{
      position: "absolute",
      top: 100,
      left: 100,
      background: "#fff",
      padding: "10px",
      border: "1px solid #000"
    }}>
      <h3>Edit Person</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name: </label>
          <input name="firstName" value={formData.firstName} onChange={handleChange} />
        </div>
        <div>
          <label>Last Name: </label>
          <input name="lastName" value={formData.lastName} onChange={handleChange} />
        </div>
        <div>
          <label>Birth Date: </label>
          <input name="birthDate" value={formData.birthDate} onChange={handleChange} />
        </div>
        <div>
          <label>Death Date: </label>
          <input name="deathDate" value={formData.deathDate} onChange={handleChange} />
        </div>
        <div>
          <label>Parents (IDs, comma-separated): </label>
          <input
            name="parents"
            value={formData.parents ? formData.parents.join(",") : ""}
            onChange={(e) => {
              const ids = e.target.value.split(",").map((s) => s.trim());
              setFormData((prev) => ({ ...prev, parents: ids }));
            }}
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <button type="submit">Save</button>
          <button type="button" onClick={onCancel} style={{ marginLeft: "10px" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
EOF

# 8) Create src/components/GenealogyChart.jsx
cat << 'EOF' > src/components/GenealogyChart.jsx
import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import PersonEditForm from "./PersonEditForm";

// Geometry
const RING_WIDTH = 60;
const ARC_PADDING = 0;
const CENTER_RADIUS = 30;

// Text
const DEFAULT_FONT_SIZE = 8;
const LINE_SPACING = 10;

/**
 * Create a color scale from very dark green (#002200) to a lighter green (#99ff99).
 */
function createColorScale(maxGenerations) {
  return d3.scaleLinear()
    .domain([0, maxGenerations - 1])
    .range(["#002200", "#99ff99"]);
}

export default function GenealogyChart({
  people,
  maxGenerations,
  centerPersonId,
  onUpdatePeople
}) {
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!people || people.length === 0) return;
    drawChart();
  }, [people, maxGenerations]);

  function approximateTextWidth(str, fontSize = DEFAULT_FONT_SIZE) {
    const avgCharWidth = fontSize * 0.6;
    return str.length * avgCharWidth;
  }

  function wrapTextToWidth(str, arcLength, fontSize = DEFAULT_FONT_SIZE) {
    const words = str.split(" ");
    const lines = [];
    let currentLineWords = [];
    for (let i = 0; i < words.length; i++) {
      const testLine = [...currentLineWords, words[i]].join(" ");
      const testWidth = approximateTextWidth(testLine, fontSize);
      if (testWidth <= arcLength) {
        currentLineWords.push(words[i]);
      } else {
        lines.push(currentLineWords.join(" "));
        currentLineWords = [words[i]];
      }
    }
    if (currentLineWords.length > 0) {
      lines.push(currentLineWords.join(" "));
    }
    return lines;
  }

  function drawChart() {
    const width = 800;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;
    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    const colorScale = createColorScale(maxGenerations);
    const peopleMap = new Map(people.map((p) => [p.id, p]));
    const ancestors = [];
    for (let i = 0; i < maxGenerations; i++) {
      ancestors[i] = new Array(2 ** i).fill(null);
    }
    ancestors[0][0] = centerPersonId;
    for (let i = 0; i < maxGenerations - 1; i++) {
      const size = 2 ** i;
      for (let j = 0; j < size; j++) {
        const pid = ancestors[i][j];
        if (!pid) continue;
        const person = peopleMap.get(pid);
        if (!person) continue;
        if (person.parents && person.parents.length > 0) {
          ancestors[i + 1][2 * j] = person.parents[0] || null;
        }
        if (person.parents && person.parents.length > 1) {
          ancestors[i + 1][2 * j + 1] = person.parents[1] || null;
        }
      }
    }
    const centerPerson = peopleMap.get(centerPersonId);
    svg.append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", CENTER_RADIUS)
      .attr("fill", colorScale(0))
      .attr("stroke", "#333")
      .on("click", () => { setSelectedPersonId(centerPersonId); });
    svg.append("text")
      .attr("x", centerX)
      .attr("y", centerY + 4)
      .attr("text-anchor", "middle")
      .style("font-size", DEFAULT_FONT_SIZE + "px")
      .style("fill", "#fff")
      .text(centerPerson ? centerPerson.firstName + " " + centerPerson.lastName : "Unknown");
    for (let i = 1; i < maxGenerations; i++) {
      const genArray = ancestors[i];
      const segmentCount = 2 ** i;
      const arcAngle = (2 * Math.PI) / segmentCount - (ARC_PADDING * Math.PI) / 180;
      const innerRadius = (i - 1) * RING_WIDTH + CENTER_RADIUS;
      const outerRadius = i * RING_WIDTH + CENTER_RADIUS;
      const arcFillColor = colorScale(i);
      for (let k = 0; k < segmentCount; k++) {
        const personId = genArray[k];
        const startAngle = k * ((2 * Math.PI) / segmentCount);
        const endAngle = startAngle + arcAngle;
        const arcGenerator = d3.arc()
          .innerRadius(innerRadius)
          .outerRadius(outerRadius)
          .startAngle(startAngle)
          .endAngle(endAngle);
        if (!personId) {
          svg.append("path")
            .attr("transform", \`translate(\${centerX},\${centerY})\`)
            .attr("d", arcGenerator)
            .attr("fill", "#eee")
            .attr("stroke", "#ccc");
          continue;
        }
        svg.append("path")
          .attr("transform", \`translate(\${centerX},\${centerY})\`)
          .attr("d", arcGenerator)
          .attr("fill", arcFillColor)
          .attr("stroke", "#333")
          .on("click", () => { setSelectedPersonId(personId); });
        let label = "Unknown";
        const person = peopleMap.get(personId);
        if (person) {
          label = person.firstName + " " + person.lastName + " (" + person.birthDate + " - " + person.deathDate + ")";
        }
        const midRadius = (innerRadius + outerRadius) / 2;
        const angleDiff = Math.abs(endAngle - startAngle);
        const arcLength = angleDiff * midRadius;
        const lines = wrapTextToWidth(label, arcLength, DEFAULT_FONT_SIZE);
        const numLines = lines.length;
        const totalHeight = (numLines - 1) * LINE_SPACING;
        // Now, line 0 will be the outermost line and subsequent lines are placed inward
        const outermostRadius = midRadius + totalHeight / 2;
        lines.forEach((lineText, idx) => {
          const lineRadius = outermostRadius - idx * LINE_SPACING;
          const lineArcGen = d3.arc()
            .innerRadius(lineRadius)
            .outerRadius(lineRadius)
            .startAngle(startAngle)
            .endAngle(endAngle);
          const textPathId = \`textPath-\${i}-\${k}-line\${idx}\`;
          svg.append("defs")
            .append("path")
            .attr("id", textPathId)
            .attr("transform", \`translate(\${centerX},\${centerY})\`)
            .attr("d", lineArcGen());
          const lineArcLength = angleDiff * lineRadius;
          svg.append("text")
            .style("font-size", DEFAULT_FONT_SIZE + "px")
            .style("fill", "#fff")
            .append("textPath")
            .attr("xlink:href", "#" + textPathId)
            .attr("startOffset", (lineArcLength / 2) + "px")
            .style("text-anchor", "middle")
            .text(lineText);
        });
      }
    }
  }

  const handleEditSave = (updatedPerson) => {
    onUpdatePeople((prev) =>
      prev.map((p) => (p.id === updatedPerson.id ? updatedPerson : p))
    );
    setSelectedPersonId(null);
  };

  const handleEditCancel = () => {
    setSelectedPersonId(null);
  };

  const selectedPerson = people.find((p) => p.id === selectedPersonId);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef}></svg>
      {selectedPerson && (
        <PersonEditForm
          person={selectedPerson}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  );
}
EOF

# 9) Create src/gedcom/importGedcom.js
cat << 'EOF' > src/gedcom/importGedcom.js
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

  lines.forEach((line) => {
    const parts = line.trim().split(" ");
    if (parts.length < 2) return;
    const level = parts[0];
    const tagOrId = parts[1];

    if (level === "0" && tagOrId.startsWith("@") && parts.length >= 3) {
      const recordType = parts[2];
      finishRecord();
      if (recordType === "INDI") {
        currentRecord = { id: tagOrId, firstName: "", lastName: "", birthDate: "", deathDate: "", parents: [] };
        currentType = "INDI";
      } else if (recordType === "FAM") {
        currentRecord = { id: tagOrId, husb: null, wife: null, children: [] };
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
  return Object.values(peopleById);
}
EOF

# 10) Create src/gedcom/exportGedcom.js
cat << 'EOF' > src/gedcom/exportGedcom.js
export function exportGedcom(people) {
  let gedcomText = "0 HEAD\\n1 CHAR UTF-8\\n";
  people.forEach((person, index) => {
    gedcomText += "0 @I" + (index + 1) + "@ INDI\\n";
    gedcomText += "1 NAME " + (person.firstName || "") + " /" + (person.lastName || "") + "/\\n";
    if (person.birthDate) {
      gedcomText += "1 BIRT\\n2 DATE " + person.birthDate + "\\n";
    }
    if (person.deathDate) {
      gedcomText += "1 DEAT\\n2 DATE " + person.deathDate + "\\n";
    }
  });
  gedcomText += "0 TRLR\\n";
  return gedcomText;
}
EOF

# 11) Create src/data/sampleData.json (Five generations: 1 + 2 + 4 + 8 + 16 = 31 individuals)
cat << 'EOF' > src/data/sampleData.json
[
  {
    "id": "g0_1",
    "firstName": "You",
    "lastName": "Center",
    "birthDate": "1990",
    "deathDate": "",
    "parents": ["g1_1", "g1_2"]
  },
  {
    "id": "g1_1",
    "firstName": "Dad",
    "lastName": "Center",
    "birthDate": "1960",
    "deathDate": "",
    "parents": ["g2_1", "g2_2"]
  },
  {
    "id": "g1_2",
    "firstName": "Mom",
    "lastName": "Center",
    "birthDate": "1962",
    "deathDate": "",
    "parents": ["g2_3", "g2_4"]
  },
  {
    "id": "g2_1",
    "firstName": "Grandpa1",
    "lastName": "Center",
    "birthDate": "1930",
    "deathDate": "1990",
    "parents": ["g3_1", "g3_2"]
  },
  {
    "id": "g2_2",
    "firstName": "Grandma1",
    "lastName": "Center",
    "birthDate": "1932",
    "deathDate": "2000",
    "parents": ["g3_3", "g3_4"]
  },
  {
    "id": "g2_3",
    "firstName": "Grandpa2",
    "lastName": "Center",
    "birthDate": "1931",
    "deathDate": "1985",
    "parents": ["g3_5", "g3_6"]
  },
  {
    "id": "g2_4",
    "firstName": "Grandma2",
    "lastName": "Center",
    "birthDate": "1934",
    "deathDate": "1995",
    "parents": ["g3_7", "g3_8"]
  },
  {
    "id": "g3_1",
    "firstName": "GreatGrandpa1",
    "lastName": "Center",
    "birthDate": "1905",
    "deathDate": "1970",
    "parents": ["g4_1", "g4_2"]
  },
  {
    "id": "g3_2",
    "firstName": "GreatGrandma1",
    "lastName": "Center",
    "birthDate": "1907",
    "deathDate": "1972",
    "parents": ["g4_3", "g4_4"]
  },
  {
    "id": "g3_3",
    "firstName": "GreatGrandpa2",
    "lastName": "Center",
    "birthDate": "1906",
    "deathDate": "1971",
    "parents": ["g4_5", "g4_6"]
  },
  {
    "id": "g3_4",
    "firstName": "GreatGrandma2",
    "lastName": "Center",
    "birthDate": "1908",
    "deathDate": "1973",
    "parents": ["g4_7", "g4_8"]
  },
  {
    "id": "g3_5",
    "firstName": "GreatGrandpa3",
    "lastName": "Center",
    "birthDate": "1903",
    "deathDate": "1969",
    "parents": ["g4_9", "g4_10"]
  },
  {
    "id": "g3_6",
    "firstName": "GreatGrandma3",
    "lastName": "Center",
    "birthDate": "1904",
    "deathDate": "1970",
    "parents": ["g4_11", "g4_12"]
  },
  {
    "id": "g3_7",
    "firstName": "GreatGrandpa4",
    "lastName": "Center",
    "birthDate": "1902",
    "deathDate": "1968",
    "parents": ["g4_13", "g4_14"]
  },
  {
    "id": "g3_8",
    "firstName": "GreatGrandma4",
    "lastName": "Center",
    "birthDate": "1909",
    "deathDate": "1974",
    "parents": ["g4_15", "g4_16"]
  },
  {
    "id": "g4_1",
    "firstName": "Ancestor 1",
    "lastName": "Center",
    "birthDate": "1880",
    "deathDate": "1940",
    "parents": []
  },
  {
    "id": "g4_2",
    "firstName": "Ancestor 2",
    "lastName": "Center",
    "birthDate": "1881",
    "deathDate": "1941",
    "parents": []
  },
  {
    "id": "g4_3",
    "firstName": "Ancestor 3",
    "lastName": "Center",
    "birthDate": "1882",
    "deathDate": "1942",
    "parents": []
  },
  {
    "id": "g4_4",
    "firstName": "Ancestor 4",
    "lastName": "Center",
    "birthDate": "1883",
    "deathDate": "1943",
    "parents": []
  },
  {
    "id": "g4_5",
    "firstName": "Ancestor 5",
    "lastName": "Center",
    "birthDate": "1884",
    "deathDate": "1944",
    "parents": []
  },
  {
    "id": "g4_6",
    "firstName": "Ancestor 6",
    "lastName": "Center",
    "birthDate": "1885",
    "deathDate": "1945",
    "parents": []
  },
  {
    "id": "g4_7",
    "firstName": "Ancestor 7",
    "lastName": "Center",
    "birthDate": "1886",
    "deathDate": "1946",
    "parents": []
  },
  {
    "id": "g4_8",
    "firstName": "Ancestor 8",
    "lastName": "Center",
    "birthDate": "1887",
    "deathDate": "1947",
    "parents": []
  },
  {
    "id": "g4_9",
    "firstName": "Ancestor 9",
    "lastName": "Center",
    "birthDate": "1888",
    "deathDate": "1948",
    "parents": []
  },
  {
    "id": "g4_10",
    "firstName": "Ancestor 10",
    "lastName": "Center",
    "birthDate": "1889",
    "deathDate": "1949",
    "parents": []
  },
  {
    "id": "g4_11",
    "firstName": "Ancestor 11",
    "lastName": "Center",
    "birthDate": "1890",
    "deathDate": "1950",
    "parents": []
  },
  {
    "id": "g4_12",
    "firstName": "Ancestor 12",
    "lastName": "Center",
    "birthDate": "1891",
    "deathDate": "1951",
    "parents": []
  },
  {
    "id": "g4_13",
    "firstName": "Ancestor 13",
    "lastName": "Center",
    "birthDate": "1892",
    "deathDate": "1952",
    "parents": []
  },
  {
    "id": "g4_14",
    "firstName": "Ancestor 14",
    "lastName": "Center",
    "birthDate": "1893",
    "deathDate": "1953",
    "parents": []
  },
  {
    "id": "g4_15",
    "firstName": "Ancestor 15",
    "lastName": "Center",
    "birthDate": "1894",
    "deathDate": "1954",
    "parents": []
  },
  {
    "id": "g4_16",
    "firstName": "Ancestor 16",
    "lastName": "Center",
    "birthDate": "1895",
    "deathDate": "1955",
    "parents": []
  }
]
EOF

# 12) Install dependencies
echo "Installing dependencies..."
npm install

# 13) Final message
echo "-------------------------------------------------"
echo "Setup complete. To start the app, run:"
echo "  npm start"
echo "Then open http://localhost:3000 in your browser."
echo "You can import a GEDCOM file to update the display."
echo "-------------------------------------------------"