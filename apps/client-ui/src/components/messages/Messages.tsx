import React from "react";
import styles from "./messages.module.scss";
import { useStore } from "../../store/store";
import Message from "../message/Message";
import { IMessage } from "../../store";

const Messages = () => {
  const messages = useStore((state) => state.messages);

  const [newMessage, setNewMessage] = React.useState<IMessage>();
  const setMessages = useStore((state) => state.setMessages);
  const credentials = useStore((state) => state.credentials);
  const conversation = useStore((state) => state.conversation);
  const socket = useStore((state) => state.socket);

  React.useEffect(() => {
    socket?.current?.on("getMessage", (data: IMessage) => {
      setNewMessage(data);
    });
  }, []);

  React.useEffect(() => {
    const el = document.querySelector(`.${styles.wrapper}`);
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  React.useEffect(() => {
    if (newMessage) {
      if (
        newMessage.receiverId === credentials?.sub &&
        conversation?.conversationId === newMessage.conversationId
      ) {
        setMessages([...messages, newMessage]);
        setNewMessage(undefined);
      }
    }
  }, [newMessage]);

  return (
    <div className={styles.wrapper}>
      {messages.map((message, index) => (
        <>
          {message.senderId === credentials?.sub ? (
            <div className={styles.sent} key={index}>
              <Message type="SENT" message={message} />
            </div>
          ) : (
            <div className={styles.received} key={index}>
              <Message type="RECEIVED" message={message} />
            </div>
          )}
        </>
      ))}
    </div>
  );
};

export default Messages;
