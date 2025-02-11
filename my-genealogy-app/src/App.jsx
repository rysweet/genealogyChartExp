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
    <div style={{ 
      fontFamily: "Arial, sans-serif",
      minHeight: '100vh',  // Changed from height to minHeight
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      gap: '20px',
      minWidth: '360px',  // Minimum width for mobile
      boxSizing: 'border-box',
      overflow: 'hidden'  // Prevent scrolling on main container
    }}>
      <h1 style={{ flexShrink: 0 }}>Genealogy Chart</h1>
      <Controls
        onImportGedcom={handleImportGedcom}
        onExportGedcom={handleExportGedcom}
        onAddGeneration={addGeneration}
        onSaveData={handleSaveData}
        onLoadData={handleLoadData}
        onResetZoom={() => resetZoom()}
        style={{ flexShrink: 0 }}
      />
      <div style={{
        position: 'relative',  // Create stacking context
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        flex: 1,
        width: '100%',
        maxWidth: '1200px',  // Maximum width for very large screens
        margin: '0 auto',  // Center content
        zIndex: 0  // Base stacking context
      }}>
        <div style={{ 
          height: '600px',  // Fixed height for chart
          position: 'relative',  // Contains the chart
          zIndex: 1  // Chart above container but below PersonEditForm
        }}>
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
        </div>
        <div style={{ 
          height: '300px',  // Fixed height for table
          minHeight: '200px',
          position: 'relative',
          zIndex: 0  // Table below chart
        }}>
          <PeopleTable
            people={people}
            onSetCenter={(personId) => setCenterId(personId)}
            onUpdatePeople={setPeople}
            selectedId={selectedPersonId}  // Add this prop
          />
        </div>
      </div>
    </div>
  );
}

export default App;
