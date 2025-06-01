import { fetchMinimalProfileData } from '../services/profileService';
import { setMinimalProfileData, setProfileLoading, setProfileError } from '../reducers/profileSlice';

export const loadMinimalProfileData = ({ callApi }) => async (dispatch, getState) => {
    dispatch(setProfileLoading());
    try {
        const data = await fetchMinimalProfileData(callApi);
        dispatch(setMinimalProfileData(data));
    } catch (error) {
        dispatch(setProfileError(error.message));
    }
};
