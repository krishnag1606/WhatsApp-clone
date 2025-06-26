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
    socket.current = io("ws://localhost:9000");
    setSocket(socket);
  }, []);

  return <>{credentials ? <ChatContainer /> : <LoginPage />}</>;
};

export default ChatWrapper;
