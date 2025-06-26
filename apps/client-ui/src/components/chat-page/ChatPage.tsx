import { IStore } from "../../store/IStore";
import { useStore } from "../../store/store";
import DefaultChatPage from "../default-chat-page/DefaultChatPage";
import SelectedChat from "../select-chat/SelectedChat";
import styles from "./chat-page.module.scss";

const ChatPage = () => {
  const selectedChat = useStore((state: IStore) => state.selectedChat);

  return (
    <>
      <div className={styles.container}>
        {selectedChat ? <SelectedChat /> : <DefaultChatPage />}
      </div>
    </>
  );
};

export default ChatPage;
