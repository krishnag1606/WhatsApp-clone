import { IStore } from "../../store/IStore";
import { useStore } from "../../store/store";
import styles from "./toolbar.module.scss";
import { BsFillChatLeftTextFill } from "react-icons/bs";
import { MdGroups } from "react-icons/md";
import { LuCircleDashed } from "react-icons/lu";
import React from "react";

const ToolBar = () => {
  const credentials = useStore((state: IStore) => state.credentials);
  const profileView = useStore((state: IStore) => state.profileView);

  const setProfileView = useStore((state: IStore) => state.setProfileView);
  const [index, setIndex] = React.useState(0);

  const handleOptionClick = (idx: number) => {
    setIndex(idx);
  };

  const handleProfileClick = () => {
    setProfileView(!profileView);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.iconContainer}>
        <button
          onClick={() => handleOptionClick(0)}
          className={index === 0 ? styles.icon : ""}
        >
          <BsFillChatLeftTextFill color="#adbac1" size={20} />
        </button>
        <button
          onClick={() => handleOptionClick(1)}
          className={index === 1 ? styles.icon : ""}
        >
          <MdGroups color="#adbac1" size={20} />
        </button>
        <button
          onClick={() => handleOptionClick(2)}
          className={index === 2 ? styles.icon : ""}
        >
          <LuCircleDashed color="#adbac1" size={20} />
        </button>
      </div>

      {credentials?.picture && (
        <img
          onClick={handleProfileClick}
          className={styles.profilePicture}
          src={credentials?.picture}
          alt="Profile picture"
        />
      )}

      {/* <img
        onClick={handleProfileClick}
        className={styles.profilePicture}
        src={`https://lh3.googleusercontent.com/a/ACg8ocI3utg5ppH18592-WF3IYkBATpwsobcQw_roovCE36tIQM7QIg=s96-c`}
        alt="Profile picture"
      /> */}
    </div>
  );
};

export default ToolBar;
