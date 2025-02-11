import React, { useRef, useEffect, useState } from "react";
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import '../styles/PeopleTable.css';

export default function PeopleTable({ people = [], onSetCenter, onUpdatePeople, selectedId, style = {}, onEditPerson }) {
  // Declare all hooks at the top level
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const tableRef = useRef(null);

  // Effect for scrolling to selected row
  useEffect(() => {
    if (selectedId && tableRef.current) {
      const selectedRow = tableRef.current.querySelector(`[data-person-id="${selectedId}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedId]);

  // Memoized sorting logic
  const sortedPeople = React.useMemo(() => {
    if (!sortConfig.key) return people;

    return [...people].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      
      if (sortConfig.key === 'birthDate' || sortConfig.key === 'deathDate') {
        const aYear = parseInt(aVal) || 0;
        const bYear = parseInt(bVal) || 0;
        return sortConfig.direction === 'asc' ? aYear - bYear : bYear - aYear;
      }

      return sortConfig.direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [people, sortConfig]);

  const handleChange = (person, field, value) => {
    const updatedPerson = { ...person, [field]: value };
    onUpdatePeople((prev) => 
      prev.map((p) => p.id === person.id ? updatedPerson : p)
    );
  };

  const requestSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort size={12} style={{ marginLeft: 5, opacity: 0.3 }} />;
    }
    return sortConfig.direction === 'asc' 
      ? <FaSortUp size={12} style={{ marginLeft: 5 }} />
      : <FaSortDown size={12} style={{ marginLeft: 5 }} />;
  };

  const HeaderCell = ({ label, sortKey, style = {} }) => (
    <th 
      style={{ 
        cursor: 'pointer',
        userSelect: 'none',
        padding: '8px',
        border: "1px solid #ccc",
        position: 'relative',  // Changed from flex to relative positioning
        whiteSpace: 'nowrap'   // Prevent text wrapping
      }}
      onClick={() => requestSort(sortKey)}
    >
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center',
        gap: '4px'
      }}>
        {label}
        {getSortIcon(sortKey)}
      </span>
    </th>
  );

  // Render empty state after all hooks
  if (!people || people.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        ...style
      }}>
        No people loaded.
      </div>
    );
  }

  // Main render
  return (
    <div 
      ref={tableRef}
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        ...style
      }}
    >
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: 'white'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          tableLayout: 'fixed'
        }}>
          <thead style={{ 
            position: 'sticky', 
            top: 0, 
            background: 'white', 
            zIndex: 1,
            width: '100%'  // Ensure thead uses full width
          }}>
            <tr>
              <HeaderCell label="ID" sortKey="id" style={{ width: '10%' }} />
              <HeaderCell label="First Name" sortKey="firstName" style={{ width: '20%' }} />
              <HeaderCell label="Last Name" sortKey="lastName" style={{ width: '20%' }} />
              <HeaderCell label="Birth Date" sortKey="birthDate" style={{ width: '15%' }} />
              <HeaderCell label="Death Date" sortKey="deathDate" style={{ width: '15%' }} />
              <th style={{ 
                border: "1px solid #ccc", 
                padding: "5px",
                width: '20%'
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPeople.map((person) => (
              <tr 
                key={person.id}
                data-person-id={person.id}
                style={{
                  cursor: 'pointer',
                  backgroundColor: person.id === selectedId ? '#fff3e0' : 'inherit',
                  transition: 'background-color 0.3s'
                }}
                onClick={(e) => {
                  onSetCenter(person.id);
                  onEditPerson(person.id);
                }}
              >
                <td style={{ 
                  border: "1px solid #ccc", 
                  padding: "5px"
                }}>
                  {person.id}
                </td>
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
