import React from "react";
import styles from "./chat-container.module.scss";
import ToolBar from "../toolbar/ToolBar";
import ChatList from "../chat-list/ChatList";
import ChatPage from "../chat-page/ChatPage";

const ChatContainer = () => {
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
