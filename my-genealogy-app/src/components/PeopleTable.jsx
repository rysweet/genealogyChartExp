import React, { useRef, useEffect } from "react";

export default function PeopleTable({ 
  people, 
  onSetCenter, 
  onUpdatePeople,
  selectedId,
  style = {}  // Add style prop
}) {
  if (!people || people.length === 0) {
    return <div>No people loaded.</div>;
  }

  const handleChange = (person, field, value) => {
    const updatedPerson = { ...person, [field]: value };
    onUpdatePeople((prev) => 
      prev.map((p) => p.id === person.id ? updatedPerson : p)
    );
  };

  const tableRef = useRef(null);

  // Add effect to scroll to selected row
  useEffect(() => {
    if (selectedId && tableRef.current) {
      const selectedRow = tableRef.current.querySelector(`[data-person-id="${selectedId}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedId]);

  return (
    <div 
      ref={tableRef}
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        ...style  // Merge passed styles
      }}
    >
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: 'white'  // Ensure table has solid background
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          tableLayout: 'fixed'  // Add this for better column sizing
        }}>
          <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "5px" }}>ID</th>
              <th style={{ border: "1px solid #ccc", padding: "5px" }}>First Name</th>
              <th style={{ border: "1px solid #ccc", padding: "5px" }}>Last Name</th>
              <th style={{ border: "1px solid #ccc", padding: "5px" }}>Birth Date</th>
              <th style={{ border: "1px solid #ccc", padding: "5px" }}>Death Date</th>
              <th style={{ border: "1px solid #ccc", padding: "5px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr 
                key={person.id}
                data-person-id={person.id}
                style={{
                  cursor: 'pointer',
                  backgroundColor: person.id === selectedId ? '#fff3e0' : 'inherit',
                  transition: 'background-color 0.3s'
                }}
                onClick={() => onSetCenter(person.id)}
              >
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>{person.id}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  <input
                    value={person.firstName || ""}
                    onChange={(e) => handleChange(person, "firstName", e.target.value)}
                    style={{ width: "100%", border: "none" }}
                  />
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  <input
                    value={person.lastName || ""}
                    onChange={(e) => handleChange(person, "lastName", e.target.value)}
                    style={{ width: "100%", border: "none" }}
                  />
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  <input
                    value={person.birthDate || ""}
                    onChange={(e) => handleChange(person, "birthDate", e.target.value)}
                    style={{ width: "100%", border: "none" }}
                  />
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  <input
                    value={person.deathDate || ""}
                    onChange={(e) => handleChange(person, "deathDate", e.target.value)}
                    style={{ width: "100%", border: "none" }}
                  />
                </td>
                <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                  <button onClick={() => onSetCenter(person.id)}>Set Center</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
