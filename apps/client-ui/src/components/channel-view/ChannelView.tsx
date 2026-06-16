import React from "react";
import { useParams } from "react-router-dom";
import styles from "./channel-view.module.scss";
import { useStore } from "../../store/store";
import { messageService } from "../../services/MessageService";
import { pollService } from "../../services/PollService";
import {
  joinChannel,
  leaveChannel,
  onNewMessage,
  onMessageDeleted,
  onMessagePinned,
  onNewPoll,
  onPollUpdated,
  onConnect,
} from "../../services/socketService";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { Permissions, hasPermission } from "../../constants/permissions";
import { PixelButton, PixelIcon } from "../../ui";
import { IChannel } from "../../store/IStore";
import SlowmodeModal from "../modals/SlowmodeModal";

// Main pane for a single channel: header + message list + input.
// History loads over REST; live messages arrive over the socket room.
const ChannelView: React.FC = () => {
  const { channelId } = useParams();
  const channels = useStore((s) => s.channels);
  const setChannels = useStore((s) => s.setChannels);
  const messages = useStore((s) => s.messages);
  const setMessages = useStore((s) => s.setMessages);
  const addMessage = useStore((s) => s.addMessage);
  const updateMessage = useStore((s) => s.updateMessage);
  const removeMessage = useStore((s) => s.removeMessage);
  const polls = useStore((s) => s.polls);
  const setPolls = useStore((s) => s.setPolls);
  const addPoll = useStore((s) => s.addPoll);
  const updatePoll = useStore((s) => s.updatePoll);
  const setActiveChannelId = useStore((s) => s.setActiveChannelId);
  const myPermissions = useStore((s) => s.myPermissions);
  // The live socket (opened by AppShell). We depend on it so this effect re-runs
  // once the connection exists — child effects run before the parent's, so on
  // first mount the socket is still null here.
  const socket = useStore((s) => s.socket);
  const [loading, setLoading] = React.useState(false);
  const [slowmodeOpen, setSlowmodeOpen] = React.useState(false);

  const channel = channels.find((c) => c._id === channelId);
  const isAnnouncement = channel?.type === "announcement";
  const canManageChannels = hasPermission(
    myPermissions,
    Permissions.MANAGE_CHANNELS
  );

  // Reflect a slowmode change in the store so the indicator + send cooldown
  // update immediately.
  const handleSlowmodeUpdated = (updated: IChannel) => {
    setChannels(channels.map((c) => (c._id === updated._id ? updated : c)));
  };

  const loadMessages = React.useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    try {
      // Load history + polls together; both interleave in the list by time.
      const [history, channelPolls] = await Promise.all([
        messageService.list(channelId),
        pollService.list(channelId).catch(() => []),
      ]);
      setMessages(history);
      setPolls(channelPolls);
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setLoading(false);
    }
  }, [channelId, setMessages, setPolls]);

  React.useEffect(() => {
    setActiveChannelId(channelId ?? null);
    loadMessages();
  }, [channelId, loadMessages, setActiveChannelId]);

  // Join the channel's socket room while it's open and append live messages
  // (the server broadcasts to the sender too; addMessage dedups by _id). Gated
  // on `socket` so it only runs once the connection actually exists, and re-runs
  // if the socket is (re)created (e.g. account switch).
  React.useEffect(() => {
    if (!channelId || !socket) return;
    joinChannel(channelId);
    const offNew = onNewMessage((msg) => {
      if (msg.channelId === channelId) addMessage(msg);
    });
    const offDeleted = onMessageDeleted((payload) => {
      if (payload.channelId === channelId) removeMessage(payload.messageId);
    });
    const offPinned = onMessagePinned((msg) => {
      if (msg.channelId === channelId) updateMessage(msg);
    });
    const offNewPoll = onNewPoll((poll) => {
      if (poll.channelId === channelId) addPoll(poll);
    });
    const offPollUpdated = onPollUpdated((poll) => {
      if (poll.channelId === channelId) updatePoll(poll);
    });
    // Re-join after any reconnect — room membership is per-connection.
    const offConnect = onConnect(() => joinChannel(channelId));
    return () => {
      offNew();
      offDeleted();
      offPinned();
      offNewPoll();
      offPollUpdated();
      offConnect();
      leaveChannel(channelId);
    };
  }, [
    channelId,
    socket,
    addMessage,
    updateMessage,
    removeMessage,
    addPoll,
    updatePoll,
  ]);

  if (!channelId) return null;

  return (
    <div className={styles.view}>
      <header className={styles.header}>
        {isAnnouncement ? (
          <PixelIcon name="speaker" size={18} className={styles.announceIcon} />
        ) : (
          <span className={styles.hash}>#</span>
        )}
        <span className={styles.name}>{channel?.name ?? "channel"}</span>
        {channel && channel.slowmodeSeconds ? (
          <span className={styles.hash} title="Slowmode">
            🐌 {channel.slowmodeSeconds}s
          </span>
        ) : null}
        {canManageChannels && (
          <span style={{ marginLeft: "auto" }}>
            <PixelButton
              variant="ghost"
              size="sm"
              onClick={() => setSlowmodeOpen(true)}
            >
              Slowmode
            </PixelButton>
          </span>
        )}
      </header>

      <MessageList
        messages={messages}
        polls={polls}
        loading={loading}
        channelId={channelId}
        isAnnouncement={isAnnouncement}
      />
      <MessageInput
        channelId={channelId}
        channelName={channel?.name}
        channelType={channel?.type}
      />

      {channel && (
        <SlowmodeModal
          isOpen={slowmodeOpen}
          onClose={() => setSlowmodeOpen(false)}
          channel={channel}
          onUpdated={handleSlowmodeUpdated}
        />
      )}
    </div>
  );
};

export default ChannelView;
