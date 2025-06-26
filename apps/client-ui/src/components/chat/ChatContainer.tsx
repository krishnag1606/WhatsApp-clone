import React from "react";
import styles from "./chat-container.module.scss";
import { useStore } from "../../store/store";
import { IStore } from "../../store/IStore";
import ToolBar from "../toolbar/ToolBar";
import ChatList from "../chat-list/ChatList";
import ChatPage from "../chat-page/ChatPage";

const ChatContainer = () => {
  const setCredentials = useStore((state: IStore) => state.setCredentials);

  function clearStore() {
    setCredentials(null);
  }
  return (
    <div className={styles.background}>
      <div className={styles.box}>
        <ToolBar />
        <ChatList />
        <ChatPage />
      </div>
    </div>
  );
};

export default ChatContainer;
