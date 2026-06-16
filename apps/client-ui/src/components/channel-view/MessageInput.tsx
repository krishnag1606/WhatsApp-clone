import React from "react";
import styles from "./channel-view.module.scss";
import { useStore } from "../../store/store";
import { messageService } from "../../services/MessageService";
import { sendMessage as socketSend } from "../../services/socketService";
import { ChannelType } from "../../store/IStore";
import { Permissions, hasPermission } from "../../constants/permissions";
import { PixelButton, PixelIcon } from "../../ui";
import CreatePollModal from "../modals/CreatePollModal";

interface MessageInputProps {
  channelId: string;
  channelName?: string;
  channelType?: ChannelType;
}

// Sends live over the socket; the server persists + broadcasts back (handled in
// ChannelView), so there's nothing to append here. Falls back to REST if the
// socket isn't connected, appending the returned message directly. The input is
// disabled when the caller lacks the channel's posting permission (the server
// enforces the same gate authoritatively).
const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  channelName,
  channelType,
}) => {
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [pollOpen, setPollOpen] = React.useState(false);
  const addMessage = useStore((s) => s.addMessage);
  const myPermissions = useStore((s) => s.myPermissions);

  const requiredFlag =
    channelType === "announcement"
      ? Permissions.POST_ANNOUNCEMENTS
      : Permissions.SEND_MESSAGES;
  const canSend = hasPermission(myPermissions, requiredFlag);
  const canCreatePolls = hasPermission(myPermissions, Permissions.CREATE_POLLS);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || !canSend) return;

    if (socketSend(channelId, trimmed)) {
      setText("");
      return;
    }

    // Socket unavailable — persist over REST and append the result locally.
    setSending(true);
    try {
      const message = await messageService.send(channelId, trimmed);
      addMessage(message);
      setText("");
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <form className={styles.inputBar} onSubmit={submit}>
        <input
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            canSend
              ? `Message #${channelName ?? "channel"}`
              : channelType === "announcement"
              ? "You do not have permission to post in this announcement channel"
              : "You don't have permission to send messages here"
          }
          aria-label="Message"
          disabled={!canSend}
        />
        {canCreatePolls && (
          <PixelButton
            type="button"
            variant="cyan"
            size="md"
            onClick={() => setPollOpen(true)}
            title="Create a poll"
            aria-label="Create a poll"
          >
            <PixelIcon name="chart-bar" size={16} />
          </PixelButton>
        )}
        <PixelButton
          type="submit"
          variant="primary"
          size="md"
          disabled={sending || !canSend}
        >
          {sending ? "…" : "Send"}
        </PixelButton>
      </form>
      <CreatePollModal
        isOpen={pollOpen}
        onClose={() => setPollOpen(false)}
        channelId={channelId}
      />
    </>
  );
};

export default MessageInput;
