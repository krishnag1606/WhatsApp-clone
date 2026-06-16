import "./App.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
import AuthGate from "./components/auth-gate/AuthGate";

function App() {
  // Enable Google+ API
  const GOOGLE_CLIENT_ID =
    process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    "569156970986-a7t6oop82hn5g0b6l6kom72g999bbjt8.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthGate />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
