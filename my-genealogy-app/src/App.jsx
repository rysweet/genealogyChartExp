import React, { useState, useEffect } from "react";
import sampleData from "./data/sampleData.json";
import Controls from "./components/Controls";
import GenealogyChart from "./components/GenealogyChart";
import { importGedcomFile } from "./gedcom/importGedcom";
import { exportGedcom } from "./gedcom/exportGedcom";
import PeopleTable from "./components/PeopleTable";
import { JsonFilePersistence } from "./persistence/JsonFilePersistence";
import { LocalStoragePersistence } from "./persistence/LocalStoragePersistence";

function App() {
  const [maxGenerations, setMaxGenerations] = useState(8);  // Changed default to 8
  const [people, setPeople] = useState([]);
  const [centerId, setCenterId] = useState("g0_1");
  const [persistence] = useState(() => new JsonFilePersistence());
  const [resetZoom, setResetZoom] = useState(() => () => {});
  const [colorOverrides, setColorOverrides] = useState({});
  const [selectedPersonId, setSelectedPersonId] = useState(null);

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
      console.log("Imported people:", importedPeople);
      if (importedPeople.length > 0) {
        const importedCenterId = importedPeople[0].id;
        setCenterId(importedCenterId);
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

  const handleSaveData = async () => {
    const dataToSave = {
      people,
      colors: colorOverrides
    };
    const success = await persistence.save(dataToSave);
    if (success) {
      alert('Data saved successfully!');
    } else {
      alert('Error saving data');
    }
  };

  const handleLoadData = async () => {
    const loadedData = await persistence.load();
    if (loadedData) {
      setPeople(loadedData.people || []);
      setColorOverrides(loadedData.colors || {});
      if (loadedData.people?.length > 0) {
        setCenterId(loadedData.people[0].id);
      }
    }
  };

  const handleColorChange = (personId, newColor) => {
    setColorOverrides(prev => ({
      ...prev,
      [personId]: newColor
    }));
  };

  const addGeneration = () => {
    setMaxGenerations((prev) => Math.min(prev + 1, 8));  // Limit to 8 generations
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <h1>Genealogy Chart</h1>
      <Controls
        onImportGedcom={handleImportGedcom}
        onExportGedcom={handleExportGedcom}
        onAddGeneration={addGeneration}
        onSaveData={handleSaveData}
        onLoadData={handleLoadData}
        onResetZoom={() => resetZoom()}
      />
      <GenealogyChart
        people={people}
        maxGenerations={maxGenerations}
        centerPersonId={centerId}
        onUpdatePeople={setPeople}
        onSetCenter={setCenterId}
        onResetZoom={setResetZoom}
        colorOverrides={colorOverrides}
        onColorChange={handleColorChange}
        onSelectPerson={setSelectedPersonId}  // Add this prop
      />
      <PeopleTable
        people={people}
        onSetCenter={(personId) => setCenterId(personId)}
        onUpdatePeople={setPeople}
        selectedId={selectedPersonId}  // Add this prop
      />
    </div>
  );
}

export default App;
