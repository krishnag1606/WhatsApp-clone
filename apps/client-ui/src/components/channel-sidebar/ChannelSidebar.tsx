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
import { PixelButton, PixelIcon } from "../../ui";
import RolesModal from "../modals/RolesModal";
import MembersModal from "../modals/MembersModal";
import AuditLogModal from "../modals/AuditLogModal";
import AddChannelModal from "../modals/AddChannelModal";
import InviteModal from "../modals/InviteModal";

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
  const [auditOpen, setAuditOpen] = React.useState(false);
  const [addChannelOpen, setAddChannelOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const community = communities.find((c) => c._id === communityId);
  const canManageChannels = hasPermission(myPermissions, Permissions.MANAGE_CHANNELS);
  const canManageRoles = hasPermission(myPermissions, Permissions.MANAGE_ROLES);
  // The owner is the source of truth: even if the /me permission bitfield hasn't
  // resolved yet (or a role edit briefly drops MANAGE_COMMUNITY), the owner is
  // always allowed to view/share the invite code.
  const isOwner = !!community && community.ownerId === currentUser?._id;
  const canManageCommunity =
    isOwner || hasPermission(myPermissions, Permissions.MANAGE_COMMUNITY);
  // Anyone with a moderation-ish permission may view the audit log.
  const canViewAudit = [
    Permissions.KICK,
    Permissions.BAN,
    Permissions.MUTE,
    Permissions.MANAGE_MESSAGES,
    Permissions.MANAGE_CHANNELS,
    Permissions.MANAGE_COMMUNITY,
  ].some((flag) => hasPermission(myPermissions, flag));
  // Manage bar holds Roles / Members / Audit. Invite has its own row below.
  const showManageBar = canManageRoles || canViewAudit;

  // TEMP debug: verify the owner's permission bitfield resolves from /me.
  console.log("My Permissions:", myPermissions, "| isOwner:", isOwner);

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

      {/* Prominent, full-width invite action right under the community name. */}
      {communityId && community && canManageCommunity && (
        <div className={styles.inviteBar}>
          <PixelButton
            variant="cyan"
            size="sm"
            className={styles.inviteButton}
            onClick={() => setInviteOpen(true)}
          >
            🔗 Invite people
          </PixelButton>
        </div>
      )}

      {communityId && showManageBar && (
        <div className={styles.manageBar}>
          {canManageRoles && (
            <PixelButton variant="ghost" size="sm" onClick={() => setRolesOpen(true)}>
              Roles
            </PixelButton>
          )}
          {(canManageRoles || canViewAudit) && (
            <PixelButton variant="ghost" size="sm" onClick={() => setMembersOpen(true)}>
              Members
            </PixelButton>
          )}
          {canViewAudit && (
            <PixelButton variant="ghost" size="sm" onClick={() => setAuditOpen(true)}>
              Audit
            </PixelButton>
          )}
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
              {ch.type === "announcement" ? (
                <PixelIcon
                  name="speaker"
                  size={16}
                  className={styles.announceIcon}
                />
              ) : (
                <span className={styles.hash}>#</span>
              )}
              {ch.name}
            </button>
          ))}
        {communityId && canManageChannels && (
          <button
            className={styles.addChannel}
            onClick={() => setAddChannelOpen(true)}
          >
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
          <AuditLogModal
            isOpen={auditOpen}
            onClose={() => setAuditOpen(false)}
            communityId={communityId}
          />
          <AddChannelModal
            isOpen={addChannelOpen}
            onClose={() => setAddChannelOpen(false)}
            communityId={communityId}
            onCreated={loadChannels}
          />
          {community && (
            <InviteModal
              isOpen={inviteOpen}
              onClose={() => setInviteOpen(false)}
              communityName={community.name}
              inviteCode={community.inviteCode}
            />
          )}
        </>
      )}
    </aside>
  );
};

export default ChannelSidebar;
