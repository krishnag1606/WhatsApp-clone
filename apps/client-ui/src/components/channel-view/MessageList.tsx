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
  const members = useStore((s) => s.members);
  const roles = useStore((s) => s.roles);
  const endRef = React.useRef<HTMLDivElement>(null);

  const rolesById = React.useMemo(
    () => new Map(roles.map((r) => [r._id, r])),
    [roles]
  );

  // Resolve an author id to a display name + their highest-position role color.
  const authorInfo = React.useMemo(() => {
    const byId = new Map(members.map((m) => [m.userId, m]));
    return (authorId: string) => {
      const member = byId.get(authorId);
      if (!member) return { name: authorId, color: undefined as string | undefined };
      const top = member.roleIds
        .map((id) => rolesById.get(id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r))
        .sort((a, b) => b.position - a.position)[0];
      return {
        name: member.nickname || member.name,
        color: top?.color,
      };
    };
  }, [members, rolesById]);

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
        const info = authorInfo(m.authorId);
        return (
          <div
            key={m._id}
            className={`${styles.message} ${mine ? styles.mine : ""}`}
          >
            <div className={styles.meta}>
              <span className={styles.author} style={{ color: info.color }}>
                {mine ? "you" : info.name}
              </span>
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
