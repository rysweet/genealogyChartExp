import React, { useState } from "react";

export default function PersonEditForm({ person, onSave, onCancel }) {
  const [formData, setFormData] = useState({ ...person });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{
      position: "absolute",
      top: 100,
      left: 100,
      background: "#fff",
      padding: "10px",
      border: "1px solid #000"
    }}>
      <h3>Edit Person</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name: </label>
          <input name="firstName" value={formData.firstName} onChange={handleChange} />
        </div>
        <div>
          <label>Last Name: </label>
          <input name="lastName" value={formData.lastName} onChange={handleChange} />
        </div>
        <div>
          <label>Birth Date: </label>
          <input name="birthDate" value={formData.birthDate} onChange={handleChange} />
        </div>
        <div>
          <label>Death Date: </label>
          <input name="deathDate" value={formData.deathDate} onChange={handleChange} />
        </div>
        <div>
          <label>Parents (IDs, comma-separated): </label>
          <input
            name="parents"
            value={formData.parents ? formData.parents.join(",") : ""}
            onChange={(e) => {
              const ids = e.target.value.split(",").map((s) => s.trim());
              setFormData((prev) => ({ ...prev, parents: ids }));
            }}
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <button type="submit">Save</button>
          <button type="button" onClick={onCancel} style={{ marginLeft: "10px" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
