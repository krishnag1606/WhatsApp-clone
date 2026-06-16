import React from "react";
import { useNavigate, useMatch } from "react-router-dom";
import styles from "./channel-sidebar.module.scss";
import { useStore } from "../../store/store";
import { channelService } from "../../services/ChannelService";
import { clearToken } from "../../services/apiClient";
import { IChannel } from "../../store/IStore";
import { PixelButton } from "../../ui";

// Lists the active community's channels. Reads the community/channel from the
// URL via useMatch (it renders outside <Routes>).
const ChannelSidebar: React.FC = () => {
  const navigate = useNavigate();
  const matchChannel = useMatch("/c/:communityId/:channelId");
  const matchCommunity = useMatch("/c/:communityId");
  const communityId =
    matchChannel?.params.communityId ?? matchCommunity?.params.communityId ?? null;
  const activeChannelId = matchChannel?.params.channelId ?? null;

  const communities = useStore((s) => s.communities);
  const channels = useStore((s) => s.channels);
  const setChannels = useStore((s) => s.setChannels);
  const currentUser = useStore((s) => s.currentUser);
  const reset = useStore((s) => s.reset);

  const community = communities.find((c) => c._id === communityId);

  const loadChannels = React.useCallback(async () => {
    if (!communityId) {
      setChannels([]);
      return;
    }
    try {
      setChannels(await channelService.list(communityId));
    } catch (error) {
      console.error("Failed to load channels", error);
    }
  }, [communityId, setChannels]);

  React.useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const createChannel = async () => {
    if (!communityId) return;
    const name = window.prompt("New channel name:");
    if (!name?.trim()) return;
    try {
      const channel = await channelService.create(communityId, { name: name.trim() });
      await loadChannels();
      navigate(`/c/${communityId}/${channel._id}`);
    } catch (error) {
      console.error("Failed to create channel", error);
    }
  };

  const logout = () => {
    clearToken();
    reset();
    navigate("/");
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header} title={community?.name}>
        {community ? community.name : "Flux"}
      </div>

      <div className={styles.channels}>
        {communityId &&
          channels.map((ch: IChannel) => (
            <button
              key={ch._id}
              className={`${styles.channel} ${
                activeChannelId === ch._id ? styles.active : ""
              }`}
              onClick={() => navigate(`/c/${communityId}/${ch._id}`)}
            >
              <span className={styles.hash}>
                {ch.type === "announcement" ? "📣" : "#"}
              </span>
              {ch.name}
            </button>
          ))}
        {communityId && (
          <button className={styles.addChannel} onClick={createChannel}>
            ＋ add channel
          </button>
        )}
        {!communityId && (
          <p className={styles.empty}>Select a community on the left.</p>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.userName} title={currentUser?.email}>
          {currentUser?.name}
        </span>
        <PixelButton variant="ghost" size="sm" onClick={logout} title="Log out">
          ⏻
        </PixelButton>
      </div>
    </aside>
  );
};

export default ChannelSidebar;
