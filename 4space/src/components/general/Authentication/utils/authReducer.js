// authReducer.js
export const initialState = {
    isAuthenticated: false,
    user: null,
    token: null,
  };
  
  export const actionTypes = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGOUT: 'LOGOUT',
  };
  
  const authReducer = (state, action) => {
    switch (action.type) {
      case actionTypes.LOGIN_SUCCESS:
        return {
          ...state,
          isAuthenticated: true,
          user: action.payload.user,
          token: action.payload.token,
        };
      case actionTypes.LOGOUT:
        return {
          ...state,
          isAuthenticated: false,
          user: null,
          token: null,
        };
      default:
        return state;
    }
  };
  
  export default authReducer;
  