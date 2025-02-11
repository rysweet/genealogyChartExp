import { createSlice } from '@reduxjs/toolkit';
import sampleData from '../data/sampleData.json';  // Import sample data

const initialState = {
  people: sampleData,  // Initialize with sample data
  maxGenerations: 8,
  centerId: sampleData.length > 0 ? sampleData[0].id : null,  // Set initial center
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
    }
  }
});

export const {
  setPeople,
  updatePerson,
  setMaxGenerations,
  setCenterId,
  setSelectedPerson,
  setColorOverride
} = genealogySlice.actions;

export default genealogySlice.reducer;
