import React from "react";
import styles from "./default-chat-page.module.scss";
import defaultImage from "../../assets/defaultimage.png";
const DefaultChatPage = () => {
  return (
    <div className={styles.wrapper}>
      <img
        className={styles.defaultImage}
        src={defaultImage}
        alt="Default image"
      />
      <h1>Download WhatsApp for your Device</h1>
      <p>Make calls and get a faster experience with our desktop App</p>
    </div>
  );
};

export default DefaultChatPage;
