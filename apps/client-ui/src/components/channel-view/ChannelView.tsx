import React from "react";
import { useParams } from "react-router-dom";
import styles from "./channel-view.module.scss";
import { useStore } from "../../store/store";
import { messageService } from "../../services/MessageService";
import {
  joinChannel,
  leaveChannel,
  onNewMessage,
} from "../../services/socketService";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

// Main pane for a single channel: header + message list + input.
// History loads over REST; live messages arrive over the socket room.
const ChannelView: React.FC = () => {
  const { channelId } = useParams();
  const channels = useStore((s) => s.channels);
  const messages = useStore((s) => s.messages);
  const setMessages = useStore((s) => s.setMessages);
  const addMessage = useStore((s) => s.addMessage);
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

  // Join the channel's socket room while it's open and append live messages
  // (the server broadcasts to the sender too; addMessage dedups by _id).
  React.useEffect(() => {
    if (!channelId) return;
    joinChannel(channelId);
    const off = onNewMessage((msg) => {
      if (msg.channelId === channelId) addMessage(msg);
    });
    return () => {
      off();
      leaveChannel(channelId);
    };
  }, [channelId, addMessage]);

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
