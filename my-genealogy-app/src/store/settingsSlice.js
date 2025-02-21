import { createSlice } from '@reduxjs/toolkit';

const defaultSettings = {
  theme: 'light',
  colorScheme: 'default',
  maxGenerations: 8,
  fontSize: 8,
  showDates: true,
  showPlaces: false,
  animationSpeed: 750,
  showTooltips: true,
  showYearsLived: true,
};

// Try to load settings from localStorage
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('genealogySettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: loadSettings(),
  reducers: {
    updateSettings: (state, action) => {
      const newState = { ...state, ...action.payload };
      localStorage.setItem('genealogySettings', JSON.stringify(newState));
      return newState;
    },
    resetSettings: () => {
      localStorage.removeItem('genealogySettings');
      return defaultSettings;
    }
  }
});

export const { updateSettings, resetSettings } = settingsSlice.actions;
export const defaultSettingsValues = defaultSettings;
export default settingsSlice.reducer;
