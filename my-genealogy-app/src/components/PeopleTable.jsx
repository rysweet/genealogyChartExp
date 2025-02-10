import React from "react";

export default function PeopleTable({ people, onSetCenter }) {
  if (!people || people.length === 0) {
    return <div>No people loaded.</div>;
  }

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
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>{p.firstName}</td>
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>{p.lastName}</td>
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>{p.birthDate}</td>
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>{p.deathDate}</td>
            <td style={{ border: "1px solid #ccc", padding: "5px" }}>
              <button onClick={() => onSetCenter(p.id)}>Set Center</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
