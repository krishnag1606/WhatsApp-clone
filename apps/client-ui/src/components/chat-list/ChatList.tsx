import styles from "./chat-list.module.scss";
import { IoEllipsisVertical } from "react-icons/io5";
import React from "react";
import { ICredentials, useStore } from "../../store";
import { GetUserService } from "../../services/get-user/GetUserService";
import {
  conversationService,
  IConversationResponse,
} from "../../services/conversion/ConversationService";
import { PixelButton, PixelInput } from "../../ui";
import { ReactComponent as SearchIcon } from "pixelarticons/svg/search.svg";
import { ReactComponent as MessagePlusIcon } from "pixelarticons/svg/message-plus.svg";
import { ReactComponent as CloseIcon } from "pixelarticons/svg/close.svg";

const ChatList = () => {
  const [showDialog, setShowDialog] = React.useState(false);
  const [filteredUsers, setFilteredUsers] = React.useState<
    ICredentials[] | null
  >(null);
  const [allConversations, setAllConversations] = React.useState<
    IConversationResponse[]
  >([]);

  const isProfileView = useStore((state) => state.profileView);
  const setProfileView = useStore((state) => state.setProfileView);
  const credentials = useStore((state) => state.credentials);
  const users = useStore((state) => state.users);
  const setUsers = useStore((state) => state.setUsers);
  const selectedChat = useStore((state) => state.selectedChat);
  const setSelectedChat = useStore((state) => state.setSelectedChat);
  const setConversation = useStore((state) => state.setConversation);
  const messages = useStore((state) => state.messages);
  const socket = useStore((state) => state.socket);
  const setActiveUsers = useStore((state) => state.setActiveUsers);

  const optionRef = React.useRef<HTMLDivElement>(null);
  const optionButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleOptionClick = () => setShowDialog(!showDialog);
  const handleBackClick = () => setProfileView(false);

  const handleChatClick = async (
    user: ICredentials | null,
    e?: React.MouseEvent<HTMLButtonElement | HTMLDivElement>
  ) => {
    e?.stopPropagation();
    setSelectedChat(user);
    if (user) {
      const conversation = {
        senderId: credentials?.sub!,
        receiverId: user?.sub!,
        conversationId: null,
      };
      setConversation(conversation);
      await conversationService.createConversation(conversation);
    } else {
      setConversation(null);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFilteredUsers(
      v === ""
        ? users
        : users?.filter((u) =>
            u.given_name.toLowerCase().includes(v.toLowerCase())
          ) ?? null
    );
  };

  async function getUsers() {
    try {
      setUsers(await new GetUserService().getUsers());
    } catch (error) {
      throw error;
    }
  }

  async function getAllConversations() {
    try {
      const convs = await conversationService.getAllConversations({
        senderId: credentials?.sub!,
        receiverId: credentials?.sub!,
      });
      setAllConversations([...convs]);
    } catch (error) {
      throw error;
    }
  }

  React.useEffect(() => {
    getUsers();
    getAllConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setTimeout(() => getAllConversations(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  React.useEffect(() => { setFilteredUsers(users); }, [users]);

  React.useEffect(() => {
    if (showDialog) {
      const rect = optionButtonRef.current?.getBoundingClientRect()!;
      const dialog = optionRef.current;
      if (dialog) {
        dialog.style.left = rect.left + "px";
        dialog.style.top = rect.bottom + "px";
      }
    }
  }, [showDialog]);

  React.useEffect(() => {
    socket?.current?.emit("addUsers", credentials);
    socket?.current?.on("getUsers", (users: ICredentials[]) => {
      setActiveUsers(users);
    });
  }, [credentials, setActiveUsers, socket]);

  return (
    <div onClick={(e) => handleChatClick(null, e)} className={styles.wrapper}>
      {!isProfileView ? (
        <>
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.panelTitle}>Chats</h2>
            <div className={styles.tools}>
              <PixelButton variant="icon" title="New chat">
                <MessagePlusIcon
                  width={20}
                  height={20}
                  style={{ color: "var(--color-text-secondary)" }}
                />
              </PixelButton>
              <PixelButton
                variant="icon"
                ref={optionButtonRef}
                onClick={handleOptionClick}
                title="Menu"
              >
                <IoEllipsisVertical
                  size={20}
                  color="var(--color-text-secondary)"
                />
              </PixelButton>
              {showDialog && <OptionDialog ref={optionRef} />}
            </div>
          </div>

          {/* Search */}
          <div className={styles.searchWrapper}>
            <PixelInput
              icon={
                <SearchIcon
                  width={16}
                  height={16}
                  style={{ color: "var(--color-text-muted)" }}
                />
              }
              type="search"
              placeholder="Search"
              onChange={handleSearchChange}
            />
          </div>

          {/* Chat list */}
          <div className={styles.chatList}>
            {Array.isArray(filteredUsers) &&
              filteredUsers.map(
                (user, index) =>
                  user.sub !== credentials?.sub && (
                    <div
                      key={index}
                      className={`${styles.chatItem} ${
                        user.sub === selectedChat?.sub ? styles.selected : ""
                      }`}
                    >
                      <button
                        onClick={(e) => handleChatClick(user, e)}
                        className={styles.chat}
                      >
                        {user.picture && (
                          <img
                            className={styles.profilePictureIcon}
                            src={user.picture}
                            alt="profile"
                          />
                        )}
                        <div className={styles.chatDetails}>
                          <h4>{user.given_name}</h4>
                          <p>
                            {allConversations.find(
                              (conv) =>
                                conv?.members.includes(user.sub) &&
                                conv?.members.includes(credentials!.sub)
                            )?.message}
                          </p>
                        </div>
                      </button>
                    </div>
                  )
              )}
          </div>
        </>
      ) : (
        <ProfileView
          handleBackClick={handleBackClick}
          credentials={credentials}
        />
      )}
    </div>
  );
};

const ProfileView = ({
  handleBackClick,
  credentials,
}: {
  handleBackClick: () => void;
  credentials: ICredentials | null;
}) => (
  <div className={styles.profileView}>
    <div className={styles.headerWrapper}>
      <h2 className={styles.profile}>Profile</h2>
      <PixelButton variant="icon" onClick={handleBackClick}>
        <CloseIcon
          width={22}
          height={22}
          style={{ color: "var(--color-text-secondary)" }}
        />
      </PixelButton>
    </div>
    <div className={styles.profilePicture}>
      {credentials?.picture && (
        <img src={credentials.picture} alt="profile" />
      )}
    </div>
    <div className={styles.profileDetails}>
      <caption>Your name</caption>
      <h3>{credentials?.given_name}</h3>
      <p>{credentials?.email}</p>
      <p>
        This is not your username or PIN. This name will be visible to your Flux
        contacts.
      </p>
    </div>
  </div>
);

const OptionDialog = React.forwardRef<HTMLDivElement, {}>((_, ref) => (
  <div ref={ref} className={styles.optionDialog}>
    <PixelButton variant="ghost" size="sm" className={styles.optionButton}>
      Settings
    </PixelButton>
    <PixelButton variant="ghost" size="sm" className={styles.optionButton}>
      New Group
    </PixelButton>
    <PixelButton variant="ghost" size="sm" className={styles.optionButton}>
      Log Out
    </PixelButton>
  </div>
));

export default ChatList;
