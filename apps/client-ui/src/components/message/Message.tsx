import React from "react";
import styles from "./message.module.scss";
import { IMessage } from "../../store";

const SentMessage = ({ message }: { message: IMessage }) => {
  return (
    <div className={`${styles.sent} ${styles.message}`}>{message.text}</div>
  );
};

const ReceivedMessage = ({ message }: { message: IMessage }) => {
  return (
    <div className={`${styles.received} ${styles.message}`}>{message.text}</div>
  );
};

const Message = ({
  message,
  type,
}: {
  message: IMessage;
  type: "SENT" | "RECEIVED";
}) => {
  return (
    <div className={styles.wrapper}>
      {type === "SENT" ? (
        <SentMessage message={message} />
      ) : (
        <ReceivedMessage message={message} />
      )}
    </div>
  );
};

export default Message;
