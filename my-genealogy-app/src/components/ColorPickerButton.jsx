import React, { useState } from "react";
import { ChromePicker } from "react-color";

export default function ColorPickerButton({ color, onChange }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: color,
          cursor: "pointer",
          border: "1px solid #ccc",
          display: "inline-block",
          verticalAlign: "middle"
        }}
        onClick={() => setShowPicker(!showPicker)}
        title="Change background color"
      />
      {showPicker && (
        <div style={{
          position: "absolute",
          zIndex: 2,
          right: 0,
          top: "25px"
        }}>
          <div
            style={{
              position: "fixed",
              top: "0px",
              right: "0px",
              bottom: "0px",
              left: "0px",
            }}
            onClick={() => setShowPicker(false)}
          />
          <ChromePicker
            color={color}
            onChange={(color) => onChange(color.hex)}
            styles={{
              default: {
                picker: {
                  transform: 'scale(0.8)',
                  transformOrigin: 'top right'
                }
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
