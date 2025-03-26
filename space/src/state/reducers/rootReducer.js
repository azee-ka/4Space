// rootReducer.js
import { combineReducers } from 'redux';
import { authReducer } from './authReducer';
import notificationsReducer from './notificationsSlice';
import profileReducer from './profileSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  notifications: notificationsReducer,
  profile: profileReducer,
});

export default rootReducer;