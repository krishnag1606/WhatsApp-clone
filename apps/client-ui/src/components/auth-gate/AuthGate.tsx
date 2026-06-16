import React from "react";
import { useStore } from "../../store/store";
import { authService } from "../../services/AuthService";
import { getToken, clearToken } from "../../services/apiClient";
import LoginPage from "../login/Login";
import AppShell from "../app-shell/AppShell";

// Verifies the stored Flux session on mount. While checking, renders nothing;
// shows the login page when logged out, otherwise the app shell.
const AuthGate: React.FC = () => {
  const currentUser = useStore((s) => s.currentUser);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const setToken = useStore((s) => s.setToken);
  const [checking, setChecking] = React.useState<boolean>(!!getToken());

  React.useEffect(() => {
    if (!getToken()) return;
    let active = true;
    (async () => {
      try {
        const user = await authService.getMe();
        if (active) setCurrentUser(user);
      } catch {
        // Invalid/expired token — drop it and fall back to login.
        clearToken();
        if (active) setToken(null);
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [setCurrentUser, setToken]);

  if (checking) return null;
  // Key the shell by user id so switching accounts (logout → login as someone
  // else) forces a clean remount: communities/socket are refetched for the new
  // identity instead of reusing the previous session's mounted instance.
  return currentUser ? (
    <AppShell key={currentUser._id} />
  ) : (
    <LoginPage />
  );
};

export default AuthGate;
