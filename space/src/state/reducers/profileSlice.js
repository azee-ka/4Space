// profileSlice.js
import { createSlice } from '@reduxjs/toolkit';

const profileSlice = createSlice({
    name: 'profile',
    initialState: {
        minimalProfileData: null, // To store minimal profile data
        isLoading: false,         // To track the loading state
        error: null               // To handle any errors
    },
    reducers: {
        setMinimalProfileData(state, action) {
            state.minimalProfileData = action.payload;
            state.isLoading = false;
            state.error = null;
        },
        setProfileLoading(state) {
            state.isLoading = true;
            state.error = null;
        },
        setProfileError(state, action) {
            state.isLoading = false;
            state.error = action.payload;
        },
        clearProfile(state) {
            state.minimalProfileData = null;
            state.isLoading = false;
            state.error = null;
        }
    }
});

// Export the actions
export const { setMinimalProfileData, setProfileLoading, setProfileError, clearProfile } = profileSlice.actions;

// Selectors to access profile data
export const selectMinimalProfileData = (state) => state.profile.minimalProfileData;
export const selectIsProfileLoading = (state) => state.profile.isLoading;
export const selectProfileError = (state) => state.profile.error;

// Export the reducer
export default profileSlice.reducer;
