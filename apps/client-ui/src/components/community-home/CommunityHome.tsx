import React from "react";
import styles from "./community-home.module.scss";
import { useStore } from "../../store/store";
import { PixelCard } from "../../ui";

// Landing pane shown at "/" — a Y2K welcome / empty state.
const CommunityHome: React.FC = () => {
  const currentUser = useStore((s) => s.currentUser);
  const communities = useStore((s) => s.communities);

  return (
    <div className={styles.container}>
      <PixelCard title="FLUX // HOME" variant="cyan">
        <div className={styles.inner}>
          <h1 className={styles.title}>
            Hey {currentUser?.name?.split(" ")[0] || "there"} ✦
          </h1>
          <p className={styles.subtitle}>
            {communities.length
              ? "Pick a community on the left to jump into a channel."
              : "You're not in any communities yet. Create one or join with an invite code using the buttons on the left rail."}
          </p>
        </div>
      </PixelCard>
    </div>
  );
};

export default CommunityHome;
