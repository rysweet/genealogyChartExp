import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateSettings, resetSettings } from '../store/settingsSlice';
import { FaTimes } from 'react-icons/fa';

export default function Settings({ onClose }) {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.settings);

  const handleChange = (key, value) => {
    dispatch(updateSettings({ [key]: value }));
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      dispatch(resetSettings());
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Settings</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <FaTimes size={20} />
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', // Changed from gap to space-between
        alignItems: 'center', 
        marginBottom: '20px',
        minWidth: '200px' // Added minimum width to give some space
      }}>
        <label htmlFor="showYearsLived">Show years lived</label>
        <input
          type="checkbox"
          id="showYearsLived"
          checked={settings.showYearsLived}
          onChange={(e) => handleChange('showYearsLived', e.target.checked)}
        />
      </div>

      <button 
        onClick={handleReset}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reset to Defaults
      </button>
    </div>
  );
}
