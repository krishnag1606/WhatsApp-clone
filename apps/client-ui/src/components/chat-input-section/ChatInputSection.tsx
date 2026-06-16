import React from "react";
import styles from "./chat-input-section.module.scss";
import { BsEmojiLaughing } from "react-icons/bs";
import { FaMicrophone } from "react-icons/fa";
import { useStore } from "../../store/store";
import { IMessage, IStore } from "../../store";
import { conversationService } from "../../services/conversion/ConversationService";
import { PixelButton, PixelInput } from "../../ui";
import { ReactComponent as PlusIcon } from "pixelarticons/svg/plus.svg";
import { ReactComponent as SendIcon } from "pixelarticons/svg/message-arrow-right.svg";

const ChatInputSection = () => {
  const currentConversation = useStore((state: IStore) => state.conversation);
  const messages = useStore((state: IStore) => state.messages);
  const setMessages = useStore((state: IStore) => state.setMessages);
  const socket = useStore((state) => state.socket);

  const [text, setText] = React.useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const sendText = async () => {
    if (!text.trim()) return;

    const message: IMessage = {
      senderId: currentConversation?.senderId!,
      receiverId: currentConversation?.receiverId!,
      conversationId: currentConversation?.conversationId!,
      text: text,
      type: "text",
    };

    setMessages([...messages, message]);
    setText("");

    try {
      socket?.current?.emit("sendMessage", message);
      await conversationService.addNewMessage(message);
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className={styles.wrapper}>
      <PixelButton variant="icon" type="button" className={styles.action}>
        <PlusIcon
          width={22}
          height={22}
          style={{ color: "var(--color-text-muted)" }}
        />
      </PixelButton>

      <PixelInput
        wrapperClassName={styles.inputWrapper}
        icon={<BsEmojiLaughing size={18} color="var(--color-text-muted)" />}
        value={text}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendText();
        }}
        type="text"
        placeholder="Type a message..."
      />

      {text.trim() ? (
        <PixelButton
          variant="primary"
          size="sm"
          type="button"
          className={styles.sendBtn}
          onClick={sendText}
        >
          <SendIcon width={14} height={14} style={{ color: "#fff" }} />
          <span>SEND</span>
        </PixelButton>
      ) : (
        <PixelButton variant="icon" type="button" className={styles.action}>
          <FaMicrophone size={20} color="var(--color-text-muted)" />
        </PixelButton>
      )}
    </div>
  );
};

export default ChatInputSection;
