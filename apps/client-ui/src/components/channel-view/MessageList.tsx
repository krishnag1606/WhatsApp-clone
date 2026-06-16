import React from "react";
import styles from "./channel-view.module.scss";
import { useStore } from "../../store/store";
import { IMessage, IPoll } from "../../store/IStore";
import { messageService } from "../../services/MessageService";
import {
  deleteMessage as socketDelete,
  pinMessage as socketPin,
} from "../../services/socketService";
import { Permissions, hasPermission } from "../../constants/permissions";
import { PixelIcon } from "../../ui";
import Poll from "./Poll";

interface MessageListProps {
  messages: IMessage[];
  polls: IPoll[];
  loading: boolean;
  channelId: string;
  // Announcement channels render their messages with extra Y2K flair.
  isAnnouncement?: boolean;
}

// Discriminated stream item so messages and polls can be interleaved by time.
type StreamItem =
  | { kind: "message"; createdAt: string; data: IMessage }
  | { kind: "poll"; createdAt: string; data: IPoll };

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

const MessageList: React.FC<MessageListProps> = ({
  messages,
  polls,
  loading,
  channelId,
  isAnnouncement = false,
}) => {
  const currentUser = useStore((s) => s.currentUser);
  const members = useStore((s) => s.members);
  const roles = useStore((s) => s.roles);
  const myPermissions = useStore((s) => s.myPermissions);
  const updateMessage = useStore((s) => s.updateMessage);
  const removeMessage = useStore((s) => s.removeMessage);
  const endRef = React.useRef<HTMLDivElement>(null);

  const canManageMessages = hasPermission(
    myPermissions,
    Permissions.MANAGE_MESSAGES
  );

  // Delete over the socket (broadcasts to the room); fall back to REST when the
  // socket is down, applying the change locally.
  const handleDelete = async (messageId: string) => {
    if (!window.confirm("Delete this message?")) return;
    if (socketDelete(channelId, messageId)) return;
    try {
      await messageService.remove(channelId, messageId);
      removeMessage(messageId);
    } catch (error) {
      console.error("Failed to delete message", error);
    }
  };

  const handlePin = async (messageId: string) => {
    if (socketPin(channelId, messageId)) return;
    try {
      updateMessage(await messageService.pin(channelId, messageId));
    } catch (error) {
      console.error("Failed to pin message", error);
    }
  };

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

  // Interleave messages + polls into a single time-ordered stream.
  const stream = React.useMemo<StreamItem[]>(() => {
    const items: StreamItem[] = [
      ...messages.map((m) => ({
        kind: "message" as const,
        createdAt: m.createdAt,
        data: m,
      })),
      ...polls.map((p) => ({
        kind: "poll" as const,
        createdAt: p.createdAt,
        data: p,
      })),
    ];
    return items.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages, polls]);

  // Keep the latest item in view as the stream grows.
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stream.length]);

  if (loading && !stream.length) {
    return <div className={styles.listEmpty}>Loading messages…</div>;
  }

  if (!stream.length) {
    return <div className={styles.listEmpty}>No messages yet. Say hi! ✦</div>;
  }

  return (
    <div className={styles.list}>
      {stream.map((item) => {
        if (item.kind === "poll") {
          return <Poll key={`poll-${item.data._id}`} poll={item.data} />;
        }
        const m = item.data;
        const mine = m.authorId === currentUser?._id;
        const info = authorInfo(m.authorId);
        const canDelete = mine || canManageMessages;
        return (
          <div
            key={m._id}
            className={`${styles.message} ${mine ? styles.mine : ""} ${
              isAnnouncement ? styles.announcement : ""
            }`}
          >
            <div className={styles.meta}>
              <span className={styles.author} style={{ color: info.color }}>
                {mine ? "you" : info.name}
              </span>
              <span className={styles.time}>{formatTime(m.createdAt)}</span>
              {isAnnouncement && (
                <span className={styles.announceBadge} title="Announcement">
                  <PixelIcon name="speaker" size={12} />
                </span>
              )}
              {m.pinned && (
                <span className={styles.pin} title="Pinned">
                  📌
                </span>
              )}
              {(canDelete || canManageMessages) && (
                <span className={styles.actions}>
                  {canManageMessages && (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      title={m.pinned ? "Unpin" : "Pin"}
                      onClick={() => handlePin(m._id)}
                    >
                      {m.pinned ? "unpin" : "pin"}
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      title="Delete"
                      onClick={() => handleDelete(m._id)}
                    >
                      ✕
                    </button>
                  )}
                </span>
              )}
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
