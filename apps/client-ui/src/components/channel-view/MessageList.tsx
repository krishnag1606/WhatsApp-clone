import React from "react";
import styles from "./channel-view.module.scss";
import { useStore } from "../../store/store";
import { IMessage } from "../../store/IStore";

interface MessageListProps {
  messages: IMessage[];
  loading: boolean;
}

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const currentUser = useStore((s) => s.currentUser);
  const endRef = React.useRef<HTMLDivElement>(null);

  // Keep the latest message in view as the list grows.
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (loading && !messages.length) {
    return <div className={styles.listEmpty}>Loading messages…</div>;
  }

  if (!messages.length) {
    return <div className={styles.listEmpty}>No messages yet. Say hi! ✦</div>;
  }

  return (
    <div className={styles.list}>
      {messages.map((m) => {
        const mine = m.authorId === currentUser?._id;
        return (
          <div
            key={m._id}
            className={`${styles.message} ${mine ? styles.mine : ""}`}
          >
            <div className={styles.meta}>
              <span className={styles.author}>{mine ? "you" : m.authorId}</span>
              <span className={styles.time}>{formatTime(m.createdAt)}</span>
            </div>
            <div className={styles.text}>
              {m.text ?? <em className={styles.corrupt}>[unable to decrypt]</em>}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
