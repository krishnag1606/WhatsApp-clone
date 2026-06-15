import "./App.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ChatWrapper from "./components/chat-wrapper/ChatWrapper";

function App() {
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID!;
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ChatWrapper />
    </GoogleOAuthProvider>
  );
}

export default App;
