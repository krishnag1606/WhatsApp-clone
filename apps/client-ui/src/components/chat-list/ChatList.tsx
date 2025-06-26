import styles from "./chat-list.module.scss";
import { RiChatNewFill } from "react-icons/ri";
import { IoEllipsisVertical } from "react-icons/io5";
import { IoSearchOutline } from "react-icons/io5";
import React from "react";
import { ICredentials, useStore } from "../../store";
import { IoMdClose } from "react-icons/io";
import { GetUserService } from "../../services/get-user/GetUserService";
import {
  conversationService,
  IConversationResponse,
} from "../../services/conversion/ConversationService";

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

  const conversation = useStore((state) => state.conversation);
  const setConversation = useStore((state) => state.setConversation);

  const messages = useStore((state) => state.messages);

  const socket = useStore((state) => state.socket);

  //  Active users
  const setActiveUsers = useStore((state) => state.setActiveUsers);
  // const activeUsers = useStore((state) => state.socket);

  const handleOptionClick = () => {
    setShowDialog(!showDialog);
  };

  const handleBackClick = () => {
    setProfileView(false);
  };

  const handleChatClick = async (
    user: ICredentials | null,
    e?: React.MouseEvent<HTMLButtonElement | HTMLDivElement>
  ) => {
    // prevent event from bubbling
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
    const searchValue = e.target.value;
    const filteredUsers = users?.filter((user) =>
      user.given_name.toLowerCase().includes(searchValue.toLowerCase())
    );

    if (searchValue === "") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(filteredUsers);
    }
  };

  // Set the position of the option dialog based on the button position using ref
  const optionRef = React.useRef<HTMLDivElement>(null);
  const optionButtonRef = React.useRef<HTMLButtonElement>(null);

  async function getUsers(): Promise<void> {
    const getUsersService = new GetUserService();
    try {
      const users = await getUsersService.getUsers();
      setUsers(users);
    } catch (error) {
      throw error;
    }
  }

  async function getAllConversations(): Promise<void> {
    try {
      const conversations = await conversationService.getAllConversations({
        senderId: credentials?.sub!,
        receiverId: credentials?.sub!,
      });
      setAllConversations([...conversations]);
    } catch (error) {
      throw error;
    }
  }

  React.useEffect(() => {
    getUsers();
    getAllConversations();
  }, []);

  React.useEffect(() => {
    setTimeout(() => {
      getAllConversations();
    }, 100);
  }, [messages]);

  React.useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  React.useEffect(() => {
    if (showDialog) {
      const optionDialog = optionRef.current;
      const optionButton = optionButtonRef.current;

      const rect = optionButton?.getBoundingClientRect()!;
      if (optionDialog) {
        optionDialog.style.left = rect.left + "px";
        optionDialog.style.top = rect.bottom + "px";
      }
    }
  }, [showDialog]);

  React.useEffect(() => {
    socket?.current?.emit("addUsers", credentials);
    socket?.current?.on("getUsers", (users: ICredentials[]) => {
      setActiveUsers(users);
    });
  }, [credentials]);

  return (
    <div onClick={(e) => handleChatClick(null, e)} className={styles.wrapper}>
      {!isProfileView ? (
        <>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.chats}>
              <h2>Chats</h2>
            </div>
            <div className={styles.tools}>
              <button className={styles.button}>
                <RiChatNewFill color="#adbac1" size={20} />
              </button>
              <button
                ref={optionButtonRef}
                onClick={handleOptionClick}
                className={styles.button}
              >
                <IoEllipsisVertical color="#adbac1" size={20} />
              </button>
              {showDialog && <OptionDialog ref={optionRef} />}
            </div>
          </div>
          {/* Search and filters */}
          <div className={styles.search}>
            <IoSearchOutline color="#adbac1" size={18} />
            <input
              onChange={handleSearchChange}
              type="text"
              placeholder="Search"
            />
          </div>
          {/* Chat list */}
          <div className={styles.chatList}>
            {Array.isArray(filteredUsers) &&
              filteredUsers?.map(
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
                            alt="profile picture"
                          />
                        )}
                        <div className={styles.chatDetails}>
                          <h4>{user.given_name}</h4>
                          <p>
                            {
                              allConversations.find((conv) => {
                                return (
                                  conv?.members.includes(user.sub) &&
                                  conv?.members.includes(credentials!.sub)
                                );
                              })?.message
                            }
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

const ProfileView = (props: {
  handleBackClick: () => void;
  credentials: ICredentials | null;
}) => {
  return (
    <div className={styles.profileView}>
      <div className={styles.headerWrapper}>
        <h2 className={styles.profile}>Profile</h2>
        <button className={styles.backButton} onClick={props.handleBackClick}>
          <IoMdClose color="#adbac1" size={22} />
        </button>
      </div>
      <div className={styles.profilePicture}>
        {props.credentials?.picture && (
          <img
            src={props?.credentials?.picture}
            // src={`https://lh3.googleusercontent.com/a/ACg8ocI3utg5ppH18592-WF3IYkBATpwsobcQw_roovCE36tIQM7QIg=s96-c`}
            alt="profile picture"
          />
        )}
      </div>
      <div className={styles.profileDetails}>
        <caption>Your name</caption>
        <h3>{props.credentials?.given_name}</h3>
        <p>{props.credentials?.email}</p>
        <p>
          This is not your username or PIN. This name will be visible to your
          WhatsApp contacts.
        </p>
      </div>
    </div>
  );
};

const OptionDialog = React.forwardRef<HTMLDivElement, {}>((props, ref) => {
  return (
    <div ref={ref} className={styles.optionDialog}>
      <button className={styles.optionButton}>Option 1</button>
      <button className={styles.optionButton}>Option 2</button>
      <button className={styles.optionButton}>Option 3</button>
    </div>
  );
});

export default ChatList;
