import React, { useState } from "react";
import { 
  FaSave, 
  FaUpload, 
  FaDownload, 
  FaFileImport, 
  FaFileExport,
  FaPlus,
  FaCompress,
  FaSearch,
  FaMinus
} from 'react-icons/fa';
import SearchDropdown from './SearchDropdown';

export default function Controls({ 
  onImportGedcom, 
  onExportGedcom, 
  onAddGeneration, 
  onSaveData, 
  onLoadData,
  people,
  onSelectPerson,
  onRemoveGeneration
}) {
  // Hidden file input for GEDCOM import
  const fileInputRef = React.useRef();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchResults = searchTerm ? people.filter(person => 
    person.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.birthDate?.includes(searchTerm) ||
    person.deathDate?.includes(searchTerm)
  ) : [];

  const handleSearchSelect = (person) => {
    onSelectPerson(person.id);
    setSearchTerm('');
    setShowSearch(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImportGedcom(file);
    }
  };

  const handleResetZoom = () => {
    console.log("Reset zoom button clicked => reloading page");
    window.location.reload();
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
        onClick={onRemoveGeneration}
        title="Remove Generation"
        style={{ padding: '8px' }}
      >
        <FaMinus size={20} />
      </button>

      <button
        onClick={handleResetZoom}
        title="Reset Zoom"
        style={{ padding: '8px' }}
      >
        <FaCompress size={20} />
      </button>

      <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 5px' }} />

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowSearch(!showSearch)}
          title="Search"
          className="controls-button"
        >
          <FaSearch size={20} />
        </button>

        {showSearch && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '5px',
            zIndex: 1000,
            minWidth: '250px'
          }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search people..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginBottom: searchResults.length ? '5px' : 0
              }}
              autoFocus
            />
            {searchResults.length > 0 && (
              <SearchDropdown 
                results={searchResults}
                onSelect={handleSearchSelect}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
