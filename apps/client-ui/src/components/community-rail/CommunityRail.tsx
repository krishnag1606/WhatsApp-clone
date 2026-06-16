import React from "react";
import { useNavigate, useMatch } from "react-router-dom";
import styles from "./community-rail.module.scss";
import { useStore } from "../../store/store";
import { ICommunity } from "../../store/IStore";
import { PixelButton } from "../../ui";

interface CommunityRailProps {
  onCreate: () => void;
  onJoin: () => void;
}

// Initials shown on each community tile (no icon upload yet).
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const CommunityRail: React.FC<CommunityRailProps> = ({ onCreate, onJoin }) => {
  const communities = useStore((s) => s.communities);
  const navigate = useNavigate();
  const match = useMatch("/c/:communityId/*");
  const activeId = match?.params.communityId ?? null;

  return (
    <nav className={styles.rail} aria-label="Communities">
      <div className={styles.list}>
        {communities.map((c: ICommunity) => (
          <button
            key={c._id}
            className={`${styles.tile} ${activeId === c._id ? styles.active : ""}`}
            title={c.name}
            onClick={() => navigate(`/c/${c._id}`)}
          >
            {initials(c.name)}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <PixelButton variant="lime" size="sm" title="Create community" onClick={onCreate}>
          ＋
        </PixelButton>
        <PixelButton variant="cyan" size="sm" title="Join with invite code" onClick={onJoin}>
          ⇲
        </PixelButton>
      </div>
    </nav>
  );
};

export default CommunityRail;
