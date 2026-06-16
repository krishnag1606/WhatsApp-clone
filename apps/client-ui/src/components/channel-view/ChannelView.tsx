import React from "react";
import { useParams } from "react-router-dom";
import styles from "./channel-view.module.scss";
import { useStore } from "../../store/store";
import { messageService } from "../../services/MessageService";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

// Main pane for a single channel: header + message list + input.
// Loads history over REST (live updates arrive in Phase 3).
const ChannelView: React.FC = () => {
  const { channelId } = useParams();
  const channels = useStore((s) => s.channels);
  const messages = useStore((s) => s.messages);
  const setMessages = useStore((s) => s.setMessages);
  const setActiveChannelId = useStore((s) => s.setActiveChannelId);
  const [loading, setLoading] = React.useState(false);

  const channel = channels.find((c) => c._id === channelId);

  const loadMessages = React.useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    try {
      setMessages(await messageService.list(channelId));
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setLoading(false);
    }
  }, [channelId, setMessages]);

  React.useEffect(() => {
    setActiveChannelId(channelId ?? null);
    loadMessages();
  }, [channelId, loadMessages, setActiveChannelId]);

  if (!channelId) return null;

  return (
    <div className={styles.view}>
      <header className={styles.header}>
        <span className={styles.hash}>
          {channel?.type === "announcement" ? "📣" : "#"}
        </span>
        <span className={styles.name}>{channel?.name ?? "channel"}</span>
      </header>

      <MessageList messages={messages} loading={loading} />
      <MessageInput channelId={channelId} channelName={channel?.name} />
    </div>
  );
};

export default ChannelView;
