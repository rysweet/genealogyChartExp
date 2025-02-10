import React from "react";

export default function PeopleTable({ people, onSetCenter, onUpdatePeople }) {
  if (!people || people.length === 0) {
    return <div>No people loaded.</div>;
  }

  const handleChange = (person, field, value) => {
    const updatedPerson = { ...person, [field]: value };
    onUpdatePeople((prev) => 
      prev.map((p) => p.id === person.id ? updatedPerson : p)
    );
  };

  return (
    <table style={{ borderCollapse: "collapse", marginTop: 20 }}>
      <thead>
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
        {people.map((p) => (
          <tr key={p.id}>
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>{p.id}</td>
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>
              <input
                value={p.firstName || ""}
                onChange={(e) => handleChange(p, "firstName", e.target.value)}
                style={{ width: "100%", border: "none" }}
              />
            </td>
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>
              <input
                value={p.lastName || ""}
                onChange={(e) => handleChange(p, "lastName", e.target.value)}
                style={{ width: "100%", border: "none" }}
              />
            </td>
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>
              <input
                value={p.birthDate || ""}
                onChange={(e) => handleChange(p, "birthDate", e.target.value)}
                style={{ width: "100%", border: "none" }}
              />
            </td>
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>
              <input
                value={p.deathDate || ""}
                onChange={(e) => handleChange(p, "deathDate", e.target.value)}
                style={{ width: "100%", border: "none" }}
              />
            </td>
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>
              <button onClick={() => onSetCenter(p.id)}>Set Center</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
