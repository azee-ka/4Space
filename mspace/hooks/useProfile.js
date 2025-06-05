import { useDispatch, useSelector } from 'react-redux';
import { loadMinimalProfileData } from '../state/actions/profileActions';  // Action to fetch profile data
import { selectMinimalProfileData, selectIsProfileLoading, selectProfileError } from '../state/reducers/profileSlice';  // Selectors
import { useEffect } from 'react';
import useApi from './useApi';
import useAuth from './useAuth';

const useProfile = () => {
    const dispatch = useDispatch();
    const { callApi } = useApi();
    const { authState, isAuthenticated } = useAuth();
    const minimalProfileData = useSelector(selectMinimalProfileData);  // Get profile data from Redux state
    const isLoading = useSelector(selectIsProfileLoading);  // Get loading state from Redux
    const error = useSelector(selectProfileError);  // Get error state from Redux

    useEffect(() => {
        if(isAuthenticated) {
            dispatch(loadMinimalProfileData({ callApi })); // Dispatch action to load profile data
          }  
    }, [dispatch, isAuthenticated])


    return { minimalProfileData, isLoading, error };
};

export default useProfile;