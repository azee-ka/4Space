// /state/services/useNotificationsSocket.js

import { useDispatch } from "react-redux";
import { appendNotification } from "../reducers/notificationsSlice";
import useWebSocket from "../../hooks/useWebSocket";

export const useNotificationsSocket = (isAuthenticated) => {
  const dispatch = useDispatch();

  // Always call useWebSocket at the top level. It will automatically open
  // or close based on the URL and its own cleanup. We use `dependencies:[isAuthenticated]`
  // so the hook re-runs whenever authentication changes.
  useWebSocket("notifications/", {
    // Only dispatch if the user is authenticated. If not, do nothing.
    onMessage: (payload) => {
      if (isAuthenticated) {
        dispatch(appendNotification(payload));
      }
    },
    onError: (err) => {
      console.error("Notification WS error:", err);
    },
    // When `isAuthenticated` flips, React will re-run this hook:
    dependencies: [isAuthenticated],
  });
};
