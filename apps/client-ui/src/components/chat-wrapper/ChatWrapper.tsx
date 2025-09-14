import React, { useRef } from "react";
import { useStore } from "../../store/store";
import { IStore } from "../../store/IStore";
import LoginPage from "../login/Login";
import ChatContainer from "../chat/ChatContainer";
import { io } from "socket.io-client";

const ChatWrapper = () => {
  const credentials = useStore((state: IStore) => state.credentials);
  const setSocket = useStore((state: IStore) => state.setSocket);

  const socket = useRef<ReturnType<typeof io>>();

  React.useEffect(() => {
    // TODO: Update this URL to match your socket server
    // You can also use environment variables: process.env.REACT_APP_SOCKET_URL
    const socketUrl = process.env.REACT_APP_SOCKET_URL || "ws://localhost:9000";
    socket.current = io(socketUrl);
    setSocket(socket);
  }, []);

  return <>{credentials ? <ChatContainer /> : <LoginPage />}</>;
};

export default ChatWrapper;
