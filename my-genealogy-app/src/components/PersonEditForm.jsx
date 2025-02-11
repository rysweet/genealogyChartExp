import React, { useEffect, useRef, useState } from "react";
import ColorPickerButton from "./ColorPickerButton";
import { FaChevronRight, FaChevronLeft, FaTimes } from 'react-icons/fa';

export default function PersonEditForm({ 
  person = {}, // Add default empty object
  onSave, 
  onClose, 
  onSetCenter,
  allPeople,  // Add this prop to access all people
  depth = 0,   // Add depth to control nesting
  backgroundColor,
  onColorChange,
  onSelectPerson  // Add to prop list
}) {
  const formRef = useRef(null);
  const [showChildren, setShowChildren] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Add default values for all extended fields
  const [extendedData, setExtendedData] = useState({
    birthPlace: person?.birthPlace || '',
    deathPlace: person?.deathPlace || '',
    occupation: person?.occupation || '',
    spouses: person?.spouses || [],
    siblings: person?.siblings || [],
    notes: person?.notes || '',
    sex: person?.sex || '',
    sources: person?.sources || []
  });

  // Ensure person has all required base fields
  const personWithDefaults = {
    id: person?.id || '',
    firstName: person?.firstName || '',
    lastName: person?.lastName || '',
    birthDate: person?.birthDate || '',
    deathDate: person?.deathDate || '',
    parents: person?.parents || [],
    ...person  // Preserve any other fields
  };

  // Update references to use personWithDefaults instead of person directly
  const children = allPeople?.filter(p => 
    p.parents && p.parents.includes(personWithDefaults.id)
  ) || [];

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
    const updatedPerson = { ...personWithDefaults, [field]: value };
    onSave(updatedPerson);
  };

  const handleParentsChange = (value) => {
    const ids = value.split(",").map(s => s.trim()).filter(Boolean);
    const updatedPerson = { ...personWithDefaults, parents: ids };
    onSave(updatedPerson);
  };

  const handleAddChild = () => {
    const newChild = {
      id: `child_${Date.now()}`,
      firstName: "New",
      lastName: personWithDefaults.lastName,
      birthDate: "",
      deathDate: "",
      parents: [personWithDefaults.id]
    };
    onSave(newChild, true); // true flag indicates this is a new person
    setShowChildren(true);
  };

  const handleSetCenter = () => {
    onSetCenter(personWithDefaults.id);
    onClose(); // Add this to close all forms when setting center
  };

  const [formData, setFormData] = useState({
    firstName: personWithDefaults.firstName || '',
    lastName: personWithDefaults.lastName || '',
    birthDate: personWithDefaults.birthDate || '',
    deathDate: personWithDefaults.deathDate || '',
    parents: personWithDefaults.parents || []
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
    onSave({ ...personWithDefaults, ...extendedData, [field]: value });
  };

  const getParentNames = () => {
    if (!personWithDefaults.parents || !allPeople) return [];
    
    return personWithDefaults.parents.map(parentId => {
      const parent = allPeople.find(p => p.id === parentId);
      return {
        id: parentId,
        name: parent 
          ? `${parent.firstName || ''} ${parent.lastName || ''}`.trim() 
          : 'Unknown'
      };
    });
  };

  const handleParentClick = (parentId, e) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(personWithDefaults); // Save current changes
    onClose(); // Close current form
    if (onSelectPerson) {  // Add safety check
      onSelectPerson(parentId);
    }
  };

  const handleMouseDown = (e) => {
    // Only start drag if clicking the header or form title
    if (e.target.closest('.draggable-area')) {
      setIsDragging(true);
      const rect = formRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      e.preventDefault(); // Prevent text selection while dragging
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div 
      ref={formRef}
      onClick={handleFormClick}
      style={{
        position: depth === 0 ? 'fixed' : 'relative',
        top: depth === 0 ? position.y || '50%' : 'auto',
        left: depth === 0 ? position.x || '50%' : 'auto',
        transform: depth === 0 && !position.x ? 'translate(-50%, -50%)' : 'none',
        userSelect: isDragging ? 'none' : 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        backgroundColor: 'white',
        padding: '20px 40px 20px 20px',  // Increased right padding to accommodate close button
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
    >
      {/* Draggable header with integrated color picker */}
      <div 
        className="draggable-area form-header"
        onMouseDown={handleMouseDown}
        style={{
          padding: '10px',
          marginBottom: '10px',
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          borderRadius: '8px 8px 0 0',
          position: 'relative', // Add this for absolute positioning of color picker
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h3 
          className="draggable-area"
          style={{ 
            margin: 0,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {personWithDefaults.firstName} {personWithDefaults.lastName}
          {depth > 0 ? ` (Child)` : ''}
        </h3>
        
        <ColorPickerButton 
          color={color || '#ffffff'} 
          onChange={handleColorChange}
        />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          right: '10px',
          top: '10px',
          background: 'none',
          border: 'none',
          padding: '8px',
          cursor: 'pointer',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3
        }}
        title="Close"
      >
        <FaTimes size={16} />
      </button>

      {/* Main content area */}
      <div style={{ 
        display: 'flex',
        position: 'relative',
        paddingRight: '20px',
        alignItems: 'stretch',
        gap: '20px'
      }}>
        <div className="basic-form" style={{ 
          flex: 1
        }}>
          <div>
            <label>First Name: </label>
            <input
              value={personWithDefaults.firstName || ""}
              onChange={(e) => handleChange("firstName", e.target.value)}
            />
          </div>
          <div>
            <label>Last Name: </label>
            <input
              value={personWithDefaults.lastName || ""}
              onChange={(e) => handleChange("lastName", e.target.value)}
            />
          </div>
          <div>
            <label>Birth Date: </label>
            <input
              value={personWithDefaults.birthDate || ""}
              onChange={(e) => handleChange("birthDate", e.target.value)}
            />
          </div>
          <div>
            <label>Death Date: </label>
            <input
              value={personWithDefaults.deathDate || ""}
              onChange={(e) => handleChange("deathDate", e.target.value)}
            />
          </div>
          <div>
            <label>Parents: </label>
            <div style={{ 
              marginTop: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {getParentNames().map(parent => (
                <a
                  key={parent.id}
                  href="#"
                  onClick={(e) => handleParentClick(parent.id, e)}
                  style={{
                    color: '#0066cc',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {parent.name}
                </a>
              ))}
              {getParentNames().length === 0 && (
                <span style={{ color: '#666', fontStyle: 'italic' }}>
                  No parents specified
                </span>
              )}
            </div>
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
                  onSelectPerson={onSelectPerson}  // Add this prop
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
