import React, { useEffect, useRef, useState } from "react";

export default function PersonEditForm({ 
  person, 
  onSave, 
  onClose, 
  onSetCenter,
  allPeople,  // Add this prop to access all people
  depth = 0   // Add depth to control nesting
}) {
  const formRef = useRef(null);
  const [showChildren, setShowChildren] = useState(false);
  
  // Find children of this person
  const children = allPeople.filter(p => 
    p.parents && p.parents.includes(person.id)
  );

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

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

  const handleAddChild = () => {
    const newChild = {
      id: `child_${Date.now()}`,
      firstName: "New",
      lastName: person.lastName,
      birthDate: "",
      deathDate: "",
      parents: [person.id]
    };
    onSave(newChild, true); // true flag indicates this is a new person
    setShowChildren(true);
  };

  return (
    <div 
      style={{
        position: depth === 0 ? 'absolute' : 'relative',
        top: depth === 0 ? '50%' : 'auto',
        left: depth === 0 ? '50%' : 'auto',
        transform: depth === 0 ? 'translate(-50%, -50%)' : 'none',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000 - depth,
        marginLeft: depth > 0 ? '20px' : '0',
        marginTop: depth > 0 ? '10px' : '0',
        border: depth > 0 ? '1px solid #ccc' : 'none'
      }} 
      ref={formRef}
    >
      <h3>Edit Person {depth > 0 ? `(${person.firstName})` : ''}</h3>
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
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
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

          {children.length > 0 && (
            <button
              onClick={() => setShowChildren(!showChildren)}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showChildren ? 'Hide' : 'Show'} Children ({children.length})
            </button>
          )}

          <button
            onClick={handleAddChild}
            style={{
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Child
          </button>
        </div>

        {showChildren && children.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4>Children:</h4>
            {children.map(child => (
              <PersonEditForm
                key={child.id}
                person={child}
                onSave={onSave}
                onClose={onClose}
                onSetCenter={onSetCenter}
                allPeople={allPeople}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
