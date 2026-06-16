import React from "react";
import { IStore } from "../../store/IStore";
import { useStore } from "../../store/store";
import styles from "./toolbar.module.scss";
import { PixelButton } from "../../ui";
import { ReactComponent as ChatIcon } from "pixelarticons/svg/chat.svg";
import { ReactComponent as UsersIcon } from "pixelarticons/svg/users.svg";
import { ReactComponent as SunIcon } from "pixelarticons/svg/sun.svg";

const TABS = [
  { Icon: ChatIcon, title: "Chats" },
  { Icon: UsersIcon, title: "Contacts" },
  { Icon: SunIcon, title: "Status" },
];

const ToolBar = () => {
  const credentials = useStore((state: IStore) => state.credentials);
  const profileView = useStore((state: IStore) => state.profileView);
  const setProfileView = useStore((state: IStore) => state.setProfileView);
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.iconContainer}>
        {TABS.map(({ Icon, title }, i) => (
          <PixelButton
            key={title}
            variant="icon"
            onClick={() => setActiveIndex(i)}
            className={activeIndex === i ? styles.active : ""}
            title={title}
          >
            <Icon
              width={22}
              height={22}
              style={{ color: activeIndex === i ? "#ff006e" : "#6b5b9e" }}
            />
          </PixelButton>
        ))}
      </div>

      {credentials?.picture && (
        <img
          onClick={() => setProfileView(!profileView)}
          className={styles.profilePicture}
          src={credentials.picture}
          alt="Profile"
        />
      )}
    </div>
  );
};

export default ToolBar;
