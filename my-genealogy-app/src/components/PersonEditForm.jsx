import React, { useEffect, useRef, useState } from "react";
import ColorPickerButton from "./ColorPickerButton";
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';

export default function PersonEditForm({ 
  person, 
  onSave, 
  onClose, 
  onSetCenter,
  allPeople,  // Add this prop to access all people
  depth = 0,   // Add depth to control nesting
  backgroundColor,
  onColorChange
}) {
  const formRef = useRef(null);
  const [showChildren, setShowChildren] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [extendedData, setExtendedData] = useState({
    birthPlace: person.birthPlace || '',
    deathPlace: person.deathPlace || '',
    occupation: person.occupation || '',
    spouses: person.spouses || [],
    siblings: person.siblings || [],
    notes: person.notes || '',
    sex: person.sex || '',
    sources: person.sources || []
  });

  // Find children of this person
  const children = allPeople.filter(p => 
    p.parents && p.parents.includes(person.id)
  );

  // Prevent events from bubbling up to parent forms and background
  const handleFormClick = (e) => {
    e.stopPropagation();
  };

  const handleChildrenToggle = (e) => {
    e.stopPropagation();  // Stop event from bubbling
    setShowChildren(prev => !prev);  // Use functional update
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
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

  const handleSetCenter = () => {
    onSetCenter(person.id);
    onClose(); // Add this to close all forms when setting center
  };

  const [formData, setFormData] = useState({
    firstName: person.firstName || '',
    lastName: person.lastName || '',
    birthDate: person.birthDate || '',
    deathDate: person.deathDate || '',
    parents: person.parents || []
  });

  // Initialize color state with the background color from the segment
  const [color, setColor] = useState(backgroundColor);

  // Update color when backgroundColor prop changes
  useEffect(() => {
    setColor(backgroundColor);
  }, [backgroundColor]);

  const handleColorChange = (newColor) => {
    setColor(newColor);
    onColorChange(newColor);
  };

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleExtendedChange = (field, value) => {
    setExtendedData(prev => ({
      ...prev,
      [field]: value
    }));
    onSave({ ...person, ...extendedData, [field]: value });
  };

  return (
    <div 
      onClick={handleFormClick}
      style={{
        position: depth === 0 ? 'fixed' : 'relative',
        top: depth === 0 ? '50%' : 'auto',
        left: depth === 0 ? '50%' : 'auto',
        transform: depth === 0 ? 'translate(-50%, -50%)' : 'none',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 2000,
        marginLeft: depth > 0 ? '20px' : '0',
        marginTop: depth > 0 ? '10px' : '0',
        border: depth > 0 ? '1px solid #ccc' : 'none',
        maxHeight: depth === 0 ? '80vh' : 'none',
        overflowY: 'auto',
        maxWidth: '90vw',
        minWidth: '400px'
      }} 
      ref={formRef}
    >
      {/* Header area */}
      <div style={{ 
        position: 'relative',
        marginBottom: '20px',
        paddingRight: '40px'  // Make room for color picker
      }}>
        <h3 style={{ 
          margin: 0,
          paddingRight: '30px'  // Make room for color picker
        }}>
          {person.firstName} {person.lastName}
          {depth > 0 ? ` (Child)` : ''}
        </h3>
        
        <div style={{
          position: 'absolute',
          right: '0',
          top: '0'
        }}>
          <ColorPickerButton 
            color={color || '#ffffff'} 
            onChange={handleColorChange}
          />
        </div>
      </div>

      {/* Main content area */}
      <div style={{ 
        display: 'flex',
        position: 'relative',
        paddingRight: '20px',
        alignItems: 'stretch',  // Changed from flex-start to stretch
        gap: '20px'
      }}>
        <div className="basic-form" style={{ 
          flex: 1
        }}>
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
              onClick={handleSetCenter}  // Changed from onSetCenter to handleSetCenter
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
                onClick={handleChildrenToggle}  // Use new handler
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
            <div 
              onClick={(e) => e.stopPropagation()}  // Stop clicks in children area
              style={{ 
                marginTop: '20px',
                paddingLeft: '10px',
                borderLeft: '2px solid #eee'
              }}
            >
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

        {isExpanded && (
          <div className="extended-form" style={{
            width: '300px',
            borderLeft: '1px solid #eee',
            padding: '0 0 0 20px',
            animation: 'slideIn 0.3s ease'
          }}>
            <div>
              <label>Birth Place:</label>
              <input
                value={extendedData.birthPlace}
                onChange={e => handleExtendedChange('birthPlace', e.target.value)}
              />
            </div>

            <div>
              <label>Death Place:</label>
              <input
                value={extendedData.deathPlace}
                onChange={e => handleExtendedChange('deathPlace', e.target.value)}
              />
            </div>

            <div>
              <label>Sex:</label>
              <select
                value={extendedData.sex}
                onChange={e => handleExtendedChange('sex', e.target.value)}
              >
                <option value="">Unknown</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="X">Other</option>
              </select>
            </div>

            <div>
              <label>Occupation:</label>
              <input
                value={extendedData.occupation}
                onChange={e => handleExtendedChange('occupation', e.target.value)}
              />
            </div>

            <div>
              <label>Spouses:</label>
              {extendedData.spouses.map((spouse, index) => (
                <div key={index} style={{ marginLeft: '10px', marginBottom: '10px' }}>
                  <input
                    placeholder="Spouse ID"
                    value={spouse.spouseId || ''}
                    onChange={e => {
                      const newSpouses = [...extendedData.spouses];
                      newSpouses[index] = { ...spouse, spouseId: e.target.value };
                      handleExtendedChange('spouses', newSpouses);
                    }}
                  />
                  <input
                    placeholder="Marriage Date"
                    value={spouse.marriageDate || ''}
                    onChange={e => {
                      const newSpouses = [...extendedData.spouses];
                      newSpouses[index] = { ...spouse, marriageDate: e.target.value };
                      handleExtendedChange('spouses', newSpouses);
                    }}
                  />
                </div>
              ))}
              <button onClick={() => {
                handleExtendedChange('spouses', [...extendedData.spouses, {}]);
              }}>Add Spouse</button>
            </div>

            <div>
              <label>Notes:</label>
              <textarea
                value={extendedData.notes}
                onChange={e => handleExtendedChange('notes', e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <label>Sources:</label>
              {extendedData.sources.map((source, index) => (
                <input
                  key={index}
                  value={source}
                  onChange={e => {
                    const newSources = [...extendedData.sources];
                    newSources[index] = e.target.value;
                    handleExtendedChange('sources', newSources);
                  }}
                />
              ))}
              <button onClick={() => {
                handleExtendedChange('sources', [...extendedData.sources, '']);
              }}>Add Source</button>
            </div>
          </div>
        )}

        {/* Expand/collapse toggle */}
        <div 
          className="expand-toggle"
          onClick={handleExpandToggle}
          style={{
            position: 'absolute',
            right: '-20px',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#f0f0f0',
            padding: '10px 5px',
            borderRadius: '0 4px 4px 0',
            cursor: 'pointer',
            boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
            zIndex: 1
          }}
        >
          {isExpanded ? <FaChevronLeft /> : <FaChevronRight />}
        </div>
      </div>
    </div>
  );
}
