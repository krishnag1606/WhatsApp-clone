import "./App.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ChatWrapper from "./components/chat-wrapper/ChatWrapper";

function App() {
  const GOOGLE_CLIENT_ID =
    "569156970986-a7t6oop82hn5g0b6l6kom72g999bbjt8.apps.googleusercontent.com";
  // "569156970986-0unjbeakh8u7leinuuv08git6ghv2otm.apps.googleusercontent.com";
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ChatWrapper />
    </GoogleOAuthProvider>
  );
}

export default App;
