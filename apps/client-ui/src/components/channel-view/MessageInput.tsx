import React from "react";
import styles from "./channel-view.module.scss";
import { useStore } from "../../store/store";
import { messageService } from "../../services/MessageService";
import { PixelButton } from "../../ui";

interface MessageInputProps {
  channelId: string;
  channelName?: string;
}

// Sends over REST and appends the returned (decrypted) message to the store.
// Phase 3 will replace the append with a socket broadcast.
const MessageInput: React.FC<MessageInputProps> = ({ channelId, channelName }) => {
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const addMessage = useStore((s) => s.addMessage);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
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
