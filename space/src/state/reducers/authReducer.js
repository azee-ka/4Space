const initialAuthState = {
  current: null,
  accounts: [], // all logged-in accounts
};

export const authActionTypes = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  SWITCH: 'SWITCH_ACCOUNT',
  ADD: 'ADD_ACCOUNT',
  SWITCH_HANDLE: 'SWITCH_HANDLE',
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

    case authActionTypes.SWITCH_HANDLE: {
      const { username: newUsername, handle_id } = action.payload;

      // 1) Update current
      const newCurrent = {
        ...state.current,
        user: {
          ...state.current.user,
          username: newUsername,
          handle_id
        }
      };

      // 2) Update the matching entry in accounts[]
      const newAccounts = state.accounts.map(acc => {
        if (acc.token === state.current.token) {
          return {
            ...acc,
            // nested user
            user: {
              ...acc.user,
              username: newUsername,
              handle_id
            },
            // top‐level `username` field (if you use it)
            username: newUsername
          };
        }
        return acc;
      });

      return {
        ...state,
        current: newCurrent,
        accounts: newAccounts
      };
    }

    default:
      return state;
  }
};
