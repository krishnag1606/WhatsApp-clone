import React from "react";
import styles from "./chat-input-section.module.scss";
import { FiPlus } from "react-icons/fi";
import { BsEmojiLaughing } from "react-icons/bs";
import { FaMicrophone } from "react-icons/fa";
import { platform } from "os";
import { useStore } from "../../store/store";
import { IMessage, IStore } from "../../store";
import { send } from "process";
import { conversationService } from "../../services/conversion/ConversationService";

const ChatInputSection = () => {
  /**
   * Store
   */

  const currentConversation = useStore((state: IStore) => state.conversation);
  const messages = useStore((state: IStore) => state.messages);
  const setMessages = useStore((state: IStore) => state.setMessages);
  const socket = useStore((state) => state.socket);

  const [text, setText] = React.useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setText(text);
  };

  const sendText = async () => {
    const message: IMessage = {
      senderId: currentConversation?.senderId!,
      receiverId: currentConversation?.receiverId!,
      conversationId: currentConversation?.conversationId!,
      text: text,
      type: "text",
    };

    setMessages([...messages, message]);

    try {
      socket?.current?.emit("sendMessage", message);
      await conversationService.addNewMessage(message);
    } catch (error) {
      throw error;
    }

    // Make the api call

    setText("");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.plus}>
        <FiPlus color="#adbac1" size={28} />
      </div>
      <div className={styles.search}>
        <BsEmojiLaughing color="#adbac1" size={18} />
        <input
          value={text}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendText();
            }
          }}
          type="text"
          placeholder="Search"
        />
      </div>
      <div className={styles.mic}>
        <FaMicrophone color="#adbac1" size={18} />
      </div>
    </div>
  );
};

export default ChatInputSection;
