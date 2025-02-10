import React from "react";

export default function Controls({ onImportGedcom, onExportGedcom, onAddGeneration }) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      onImportGedcom(file);
      e.target.value = null; // reset
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
