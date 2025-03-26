// authReducer.js
const initialAuthState = {
  isAuthenticated: false,
  user: {
    id: null,
    role: '',
    username: '',
    first_name: '',
    last_name: '',
    email: '',
  },
  token: null,
};

export const authActionTypes = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
};

export const authReducer = (state = initialAuthState, action) => {
  switch (action.type) {
    case authActionTypes.LOGIN:
      const { user, token } = action.payload;
      return { ...state, isAuthenticated: true, user, token };
    case authActionTypes.LOGOUT:
      return { ...initialAuthState };  // Reset state to initial state on logout
    default:
      return state;
  }
};
