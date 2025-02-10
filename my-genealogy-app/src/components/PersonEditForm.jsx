import React, { useEffect, useRef } from "react";

export default function PersonEditForm({ person, onSave, onClose, onSetCenter }) {
  const formRef = useRef(null);

  useEffect(() => {
    // Handle Escape key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Handle click outside
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleChange = (field, value) => {
    const updatedPerson = { ...person, [field]: value };
    onSave(updatedPerson);
  };

  const handleParentsChange = (value) => {
    const ids = value.split(",").map(s => s.trim()).filter(Boolean);
    const updatedPerson = { ...person, parents: ids };
    onSave(updatedPerson);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000
    }} ref={formRef}>
      <h3>Edit Person</h3>
      <div className="edit-form">
        <div>
          <label>First Name: </label>
          <input
            value={person.firstName || ""}
            onChange={(e) => handleChange("firstName", e.target.value)}
          />
        </div>
        <div>
          <label>Last Name: </label>
          <input
            value={person.lastName || ""}
            onChange={(e) => handleChange("lastName", e.target.value)}
          />
        </div>
        <div>
          <label>Birth Date: </label>
          <input
            value={person.birthDate || ""}
            onChange={(e) => handleChange("birthDate", e.target.value)}
          />
        </div>
        <div>
          <label>Death Date: </label>
          <input
            value={person.deathDate || ""}
            onChange={(e) => handleChange("deathDate", e.target.value)}
          />
        </div>
        <div>
          <label>Parents (IDs, comma-separated): </label>
          <input
            value={person.parents ? person.parents.join(",") : ""}
            onChange={(e) => handleParentsChange(e.target.value)}
          />
        </div>
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => onSetCenter(person.id)}
            style={{ 
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Set as Center
          </button>
        </div>
      </div>
    </div>
  );
}
