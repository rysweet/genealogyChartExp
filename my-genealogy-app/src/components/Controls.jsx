import React from "react";
import { 
  FaSave, 
  FaUpload, 
  FaDownload, 
  FaFileImport, 
  FaFileExport,
  FaPlus,
  FaCompress
} from 'react-icons/fa';

export default function Controls({ 
  onImportGedcom, 
  onExportGedcom, 
  onAddGeneration, 
  onSaveData, 
  onLoadData,
  onResetZoom 
}) {
  // Hidden file input for GEDCOM import
  const fileInputRef = React.useRef();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImportGedcom(file);
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".ged,.gedcom"
      />

      <button
        onClick={() => fileInputRef.current.click()}
        title="Import GEDCOM"
        style={{ padding: '8px' }}
      >
        <FaFileImport size={20} />
      </button>

      <button
        onClick={onExportGedcom}
        title="Export GEDCOM"
        style={{ padding: '8px' }}
      >
        <FaFileExport size={20} />
      </button>

      <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 5px' }} />

      <button
        onClick={onSaveData}
        title="Save Project"
        style={{ padding: '8px' }}
      >
        <FaSave size={20} />
      </button>

      <button
        onClick={onLoadData}
        title="Load Project"
        style={{ padding: '8px' }}
      >
        <FaUpload size={20} />
      </button>

      <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 5px' }} />

      <button
        onClick={onAddGeneration}
        title="Add Generation"
        style={{ padding: '8px' }}
      >
        <FaPlus size={20} />
      </button>

      <button
        onClick={onResetZoom}
        title="Reset Zoom"
        style={{ padding: '8px' }}
      >
        <FaCompress size={20} />
      </button>
    </div>
  );
}
