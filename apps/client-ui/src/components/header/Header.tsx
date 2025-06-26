import React from "react";
import styles from "./header.module.scss";
import { useStore } from "../../store/store";
import { ICredentials } from "../../store";
import { IoIosSearch } from "react-icons/io";
import { IoEllipsisVertical } from "react-icons/io5";

const Header = () => {
  const selectedChat: ICredentials | null = useStore(
    (state) => state.selectedChat
  );
  const activeUsers = useStore((state) => state.activeUsers);

  return (
    <div className={styles.wrapper}>
      <div className={styles.profileDetails}>
        <img
          className={styles.profile}
          src={selectedChat?.picture}
          alt="chat icon"
        />
        <div className={styles.detailsWrapper}>
          <div className={styles.chatName}>{selectedChat?.given_name}</div>
          <div className={styles.chatStatus}>
            {activeUsers.find((user) => user.sub === selectedChat?.sub)
              ? "Online"
              : "Offline"}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <IoIosSearch color="#adbac1" size={20} />
        <IoEllipsisVertical color="#adbac1" size={20} />
      </div>
    </div>
  );
};

export default Header;
