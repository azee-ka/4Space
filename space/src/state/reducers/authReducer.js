const initialAuthState = {
  current: null,
  accounts: [], // all logged-in accounts
};

export const authActionTypes = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SWITCH: 'SWITCH_ACCOUNT',
  ADD: 'ADD_ACCOUNT',
};

export const authReducer = (state = initialAuthState, action) => {
  switch (action.type) {
    case authActionTypes.LOGIN:
      return {
        ...state,
        current: { user: action.payload.user, token: action.payload.token },
        accounts: [action.payload, ...state.accounts.filter(a => a.username !== action.payload.user.username)],
      };

    case authActionTypes.ADD:
      // Prevent duplicates by filtering first
      const exists = state.accounts.find(a => a.user.username === action.payload.user.username);
      if (exists) return state;

      return {
        ...state,
        accounts: [...state.accounts, action.payload],
      };

    case authActionTypes.SWITCH:
      return {
        ...state,
        current: action.payload, // must contain { user, token }
      };

    case authActionTypes.LOGOUT:
      return initialAuthState;

    default:
      return state;
  }
};
