import React from 'react';

export default function SearchDropdown({ results, onSelect }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      maxHeight: '300px',
      overflowY: 'auto',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {results.map(person => (
        <div
          key={person.id}
          onClick={() => onSelect(person)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: '1px solid #eee',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          <div style={{ fontWeight: 'bold' }}>
            {person.firstName} {person.lastName}
          </div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            {person.birthDate} - {person.deathDate}
          </div>
        </div>
      ))}
    </div>
  );
}
