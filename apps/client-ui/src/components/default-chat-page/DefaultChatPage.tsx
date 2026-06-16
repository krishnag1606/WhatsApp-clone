import React from "react";
import styles from "./default-chat-page.module.scss";
import defaultImage from "../../assets/defaultimage.png";
const DefaultChatPage = () => {
  return (
    <div className={styles.wrapper}>
      <img
        className={styles.defaultImage}
        src={defaultImage}
        alt="Default"
      />
      <h1>Welcome to Flux</h1>
      <p>Select a chat to start messaging in retro style</p>
    </div>
  );
};

export default DefaultChatPage;
