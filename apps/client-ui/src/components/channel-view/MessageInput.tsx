import React from "react";
import styles from "./channel-view.module.scss";
import { useStore } from "../../store/store";
import { messageService } from "../../services/MessageService";
import { sendMessage as socketSend } from "../../services/socketService";
import { PixelButton } from "../../ui";

interface MessageInputProps {
  channelId: string;
  channelName?: string;
}

// Sends live over the socket; the server persists + broadcasts back (handled in
// ChannelView), so there's nothing to append here. Falls back to REST if the
// socket isn't connected, appending the returned message directly.
const MessageInput: React.FC<MessageInputProps> = ({ channelId, channelName }) => {
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const addMessage = useStore((s) => s.addMessage);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

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
    <form className={styles.inputBar} onSubmit={submit}>
      <input
        className={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Message #${channelName ?? "channel"}`}
        aria-label="Message"
      />
      <PixelButton type="submit" variant="primary" size="md" disabled={sending}>
        {sending ? "…" : "Send"}
      </PixelButton>
    </form>
  );
};

export default MessageInput;
