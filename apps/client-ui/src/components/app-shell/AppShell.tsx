import React from "react";
import { Routes, Route } from "react-router-dom";
import styles from "./app-shell.module.scss";
import { useStore } from "../../store/store";
import { communityService } from "../../services/CommunityService";
import CommunityRail from "../community-rail/CommunityRail";
import ChannelSidebar from "../channel-sidebar/ChannelSidebar";
import ChannelView from "../channel-view/ChannelView";
import CommunityHome from "../community-home/CommunityHome";
import CommunityRedirect from "../community-home/CommunityRedirect";
import CreateCommunityModal from "../modals/CreateCommunityModal";
import JoinCommunityModal from "../modals/JoinCommunityModal";

// The logged-in layout: community rail | channel sidebar | routed main pane.
const AppShell: React.FC = () => {
  const setCommunities = useStore((s) => s.setCommunities);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [joinOpen, setJoinOpen] = React.useState(false);

  const loadCommunities = React.useCallback(async () => {
    try {
      setCommunities(await communityService.list());
    } catch (error) {
      console.error("Failed to load communities", error);
    }
  }, [setCommunities]);

  React.useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  return (
    <div className={styles.shell}>
      <CommunityRail
        onCreate={() => setCreateOpen(true)}
        onJoin={() => setJoinOpen(true)}
      />
      <ChannelSidebar />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<CommunityHome />} />
          <Route path="/c/:communityId" element={<CommunityRedirect />} />
          <Route path="/c/:communityId/:channelId" element={<ChannelView />} />
        </Routes>
      </main>

      <CreateCommunityModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadCommunities}
      />
      <JoinCommunityModal
        isOpen={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoined={loadCommunities}
      />
    </div>
  );
};

export default AppShell;
