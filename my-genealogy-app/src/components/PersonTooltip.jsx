import React from 'react';

export default function PersonTooltip({ person, position }) {
  if (!person) return null;

  // Offset the tooltip above and to the right of the cursor
  const tooltipOffset = {
    x: 10,  // pixels to the right
    y: -5  // pixels up
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x + tooltipOffset.x,
        top: position.y + tooltipOffset.y,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '8px 12px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        border: '1px solid #ccc',
        maxWidth: '300px',
        zIndex: 1000,
        fontSize: '14px',
        pointerEvents: 'none',
        transform: 'translate(0, -100%)'  // Move up by its full height
      }}
    >
      <div style={{ fontWeight: 'bold' }}>
        {person.firstName} {person.lastName}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        Birth: {person.birthDate || 'Unknown'}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        Death: {person.deathDate || 'Unknown'}
      </div>
    </div>
  );
}
