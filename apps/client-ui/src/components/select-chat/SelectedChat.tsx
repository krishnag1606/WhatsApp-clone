import { useEffect } from "react";
import ChatInputSection from "../chat-input-section/ChatInputSection";
import Header from "../header/Header";
import Messages from "../messages/Messages";

import { useStore } from "../../store/store";
import { IStore } from "../../store/IStore";
import { conversationService } from "../../services/conversion/ConversationService";
import React from "react";
// import { Thing, Header } from "@common/shared";

const SelectedChat = () => {
  const currentConversation = useStore((state: IStore) => state.conversation);
  const setConversation = useStore((state: IStore) => state.setConversation);

  const setMessages = useStore((state: IStore) => state.setMessages);

  /**
   * LIFECYCLE
   */
  useEffect(() => {
    const getMessages = async () => {
      let messages = await conversationService.getMessages(
        currentConversation!.conversationId!
      );

      setMessages(messages);
    };

    const getConversation = async () => {
      let conversation = await conversationService.getConversation(
        currentConversation!
      );

      let updatedConversation = {
        senderId: currentConversation?.senderId!,
        receiverId: currentConversation?.receiverId!,
        conversationId: conversation?._id,
      };

      setConversation(updatedConversation);
      if (currentConversation?.conversationId) await getMessages();
    };

    setTimeout(() => {
      getConversation();
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversation?.conversationId, setConversation, setMessages]);

  return (
    <div>
      <Header />
      <Messages />
      <ChatInputSection />
    </div>
  );
};

export default SelectedChat;
