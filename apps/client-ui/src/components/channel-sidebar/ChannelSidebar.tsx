import React from "react";
import { useNavigate, useMatch } from "react-router-dom";
import styles from "./channel-sidebar.module.scss";
import { useStore } from "../../store/store";
import { channelService } from "../../services/ChannelService";
import { roleService } from "../../services/RoleService";
import { memberService } from "../../services/MemberService";
import { clearToken } from "../../services/apiClient";
import { IChannel } from "../../store/IStore";
import { Permissions, hasPermission } from "../../constants/permissions";
import { PixelButton } from "../../ui";
import RolesModal from "../modals/RolesModal";
import MembersModal from "../modals/MembersModal";

// Lists the active community's channels. Reads the community/channel from the
// URL via useMatch (it renders outside <Routes>). Also loads the caller's
// roles/members/permissions for the active community and gates controls behind
// those permissions.
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
  const setRoles = useStore((s) => s.setRoles);
  const setMembers = useStore((s) => s.setMembers);
  const setMyPermissions = useStore((s) => s.setMyPermissions);
  const myPermissions = useStore((s) => s.myPermissions);
  const currentUser = useStore((s) => s.currentUser);
  const reset = useStore((s) => s.reset);

  const [rolesOpen, setRolesOpen] = React.useState(false);
  const [membersOpen, setMembersOpen] = React.useState(false);

  const community = communities.find((c) => c._id === communityId);
  const canManageChannels = hasPermission(myPermissions, Permissions.MANAGE_CHANNELS);
  const canManageRoles = hasPermission(myPermissions, Permissions.MANAGE_ROLES);

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

  // Roles + the caller's effective permissions for the active community.
  const loadRoles = React.useCallback(async () => {
    if (!communityId) {
      setRoles([]);
      return;
    }
    try {
      const [roles, me] = await Promise.all([
        roleService.list(communityId),
        memberService.me(communityId),
      ]);
      setRoles(roles);
      setMyPermissions(me.permissions);
    } catch (error) {
      console.error("Failed to load roles", error);
    }
  }, [communityId, setRoles, setMyPermissions]);

  const loadMembers = React.useCallback(async () => {
    if (!communityId) {
      setMembers([]);
      return;
    }
    try {
      setMembers(await memberService.list(communityId));
    } catch (error) {
      console.error("Failed to load members", error);
    }
  }, [communityId, setMembers]);

  React.useEffect(() => {
    loadChannels();
    loadRoles();
    loadMembers();
  }, [loadChannels, loadRoles, loadMembers]);

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

      {communityId && canManageRoles && (
        <div className={styles.manageBar}>
          <PixelButton variant="ghost" size="sm" onClick={() => setRolesOpen(true)}>
            Roles
          </PixelButton>
          <PixelButton variant="ghost" size="sm" onClick={() => setMembersOpen(true)}>
            Members
          </PixelButton>
        </div>
      )}

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
        {communityId && canManageChannels && (
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

      {communityId && (
        <>
          <RolesModal
            isOpen={rolesOpen}
            onClose={() => setRolesOpen(false)}
            communityId={communityId}
            onChanged={loadRoles}
          />
          <MembersModal
            isOpen={membersOpen}
            onClose={() => setMembersOpen(false)}
            communityId={communityId}
            onChanged={loadMembers}
          />
        </>
      )}
    </aside>
  );
};

export default ChannelSidebar;
