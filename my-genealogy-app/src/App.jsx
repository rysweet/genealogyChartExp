import React, { useEffect, useState } from "react";
import sampleData from "./data/sampleData.json";
import Controls from "./components/Controls";
import GenealogyChart from "./components/GenealogyChart";
import { importGedcomFile } from "./gedcom/importGedcom";
import { exportGedcom } from "./gedcom/exportGedcom";
import PeopleTable from "./components/PeopleTable";
import { JsonFilePersistence } from "./persistence/JsonFilePersistence";
import { LocalStoragePersistence } from "./persistence/LocalStoragePersistence";
import { useSelector, useDispatch } from 'react-redux';
import {
  setPeople,
  setMaxGenerations,
  setCenterId,
  setSelectedPerson,
  setColorOverride,
  updatePerson
} from './store/genealogySlice';

function App() {
  const dispatch = useDispatch();
  const [resetZoom, setResetZoom] = useState(() => () => {});  // Add this back
  const [persistence] = useState(() => new JsonFilePersistence());  // Add this back
  
  const {
    people,
    maxGenerations,
    centerId,
    selectedPersonId,
    colorOverrides
  } = useSelector(state => state.genealogy);

  // Load sample data by default
  useEffect(() => {
    dispatch(setPeople(sampleData));
    if (sampleData.length > 0) {
      dispatch(setCenterId(sampleData[0].id));
    }
  }, [dispatch]);

  const handleImportGedcom = async (file) => {
    try {
      const importedPeople = await importGedcomFile(file);
      console.log("Imported people:", importedPeople);
      if (importedPeople.length > 0) {
        const importedCenterId = importedPeople[0].id;
        dispatch(setCenterId(importedCenterId));
      }
      dispatch(setPeople(importedPeople));
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
      dispatch(setPeople(loadedData.people || []));
      dispatch(setColorOverride(loadedData.colors || {}));
      if (loadedData.people?.length > 0) {
        dispatch(setCenterId(loadedData.people[0].id));
      }
    }
  };

  const handleColorChange = (personId, newColor) => {
    dispatch(setColorOverride({ id: personId, color: newColor }));
  };

  const addGeneration = () => {
    dispatch(setMaxGenerations(Math.min(maxGenerations + 1, 8)));  // Limit to 8 generations
  };

  const handlePersonSelect = (personId) => {
    dispatch(setSelectedPerson(personId));
    // Removed the setCenterId dispatch
  };

  const handleUpdatePeople = (updatedPeople) => {
    if (typeof updatedPeople === 'function') {
      // Handle functional updates
      dispatch(setPeople(updatedPeople(people)));
    } else if (Array.isArray(updatedPeople)) {
      dispatch(setPeople(updatedPeople));
    } else {
      dispatch(updatePerson(updatedPeople));
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      minWidth: '360px',
      alignItems: 'center'  // Center everything horizontally
    }}>
      <h1>Genealogy Chart</h1>
      <Controls
        onImportGedcom={handleImportGedcom}
        onExportGedcom={handleExportGedcom}
        onAddGeneration={addGeneration}
        onSaveData={handleSaveData}
        onLoadData={handleLoadData}
        onResetZoom={() => resetZoom()}
      />
      <div style={{
        width: '800px',  // Same as chart's default width
        minWidth: '360px',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <GenealogyChart
          people={people}
          maxGenerations={maxGenerations}
          centerPersonId={centerId}
          onUpdatePeople={handleUpdatePeople}  // Use the new handler
          onSetCenter={(id) => dispatch(setCenterId(id))}
          onResetZoom={setResetZoom}
          colorOverrides={colorOverrides}
          onColorChange={handleColorChange}
          onSelectPerson={handlePersonSelect}  // Use unified handler
          selectedPersonId={selectedPersonId}  // Pass selectedPersonId as prop
          style={{
            height: '600px',
            width: '100%'
          }}
        />
        <PeopleTable
          people={people}
          onSetCenter={(id) => dispatch(setCenterId(id))}
          onUpdatePeople={handleUpdatePeople}  // Use the new handler
          selectedId={selectedPersonId}
          onEditPerson={handlePersonSelect}  // Just select, don't center
          onSetCenter={(id) => dispatch(setCenterId(id))}  // Separate center action
          style={{
            height: '300px',
            width: '100%'
          }}
        />
      </div>
    </div>
  );
}

export default App;
