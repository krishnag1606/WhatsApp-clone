import "./App.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ChatWrapper from "./components/chat-wrapper/ChatWrapper";

function App() {
  // TODO: Replace with your actual Google OAuth Client ID
  // Get this from: https://console.developers.google.com/
  // 1. Create a new project or select existing
  // 2. Enable Google+ API
  // 3. Create credentials (OAuth 2.0 Client ID)
  // 4. Add your domain to authorized origins
  const GOOGLE_CLIENT_ID =
    process.env.REACT_APP_GOOGLE_CLIENT_ID || 
    "569156970986-a7t6oop82hn5g0b6l6kom72g999bbjt8.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ChatWrapper />
    </GoogleOAuthProvider>
  );
}

export default App;
