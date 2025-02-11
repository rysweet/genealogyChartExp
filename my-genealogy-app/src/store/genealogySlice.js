import { createSlice } from '@reduxjs/toolkit';
import sampleData from '../data/sampleData.json';

const initialState = {
  people: [],  // Start with empty array, not sampleData
  maxGenerations: 8,
  centerId: null,
  selectedPersonId: null,
  colorOverrides: {}
};

const genealogySlice = createSlice({
  name: 'genealogy',
  initialState,
  reducers: {
    setPeople: (state, action) => {
      state.people = action.payload;
    },
    updatePerson: (state, action) => {
      const index = state.people.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.people[index] = action.payload;
      }
    },
    setMaxGenerations: (state, action) => {
      state.maxGenerations = action.payload;
    },
    setCenterId: (state, action) => {
      state.centerId = action.payload;
    },
    setSelectedPerson: (state, action) => {
      state.selectedPersonId = action.payload;
    },
    setColorOverride: (state, action) => {
      state.colorOverrides[action.payload.id] = action.payload.color;
    },
    replaceAllPeople: (state, action) => {
      if (!Array.isArray(action.payload)) {
        console.error('replaceAllPeople received invalid data:', action.payload);
        return;
      }
      state.people = action.payload;
      state.centerId = action.payload[0]?.id || null;
      state.selectedPersonId = null;
      state.colorOverrides = {};
      state.maxGenerations = 4; // Reset to default view
      
      // Force a re-render by updating a timestamp
      state.lastUpdate = Date.now();
    }
  }
});

export const {
  setPeople,
  updatePerson,
  setMaxGenerations,
  setCenterId,
  setSelectedPerson,
  setColorOverride,
  replaceAllPeople  // Add this export
} = genealogySlice.actions;

export default genealogySlice.reducer;
