import React from "react";
import styles from "./role-member.module.scss";
import { PixelModal, PixelButton } from "../../ui";
import { useStore } from "../../store/store";
import { memberService } from "../../services/MemberService";
import { moderationService } from "../../services/ModerationService";
import { IMember, IRole } from "../../store/IStore";
import { Permissions, hasPermission } from "../../constants/permissions";

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  onChanged: () => void | Promise<void>;
}

// Members list with inline role assignment + moderation. Selecting a member
// reveals role checkboxes and the mod actions the caller is allowed to use.
// Every action is authoritatively enforced + audited server-side.
const MembersModal: React.FC<MembersModalProps> = ({
  isOpen,
  onClose,
  communityId,
  onChanged,
}) => {
  const members = useStore((s) => s.members);
  const roles = useStore((s) => s.roles);
  const myPermissions = useStore((s) => s.myPermissions);
  const currentUser = useStore((s) => s.currentUser);

  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedUserId(null);
      setError(null);
    }
  }, [isOpen]);

  const rolesById = React.useMemo(
    () => new Map(roles.map((r) => [r._id, r])),
    [roles]
  );

  const canAssignRole = (role: IRole) =>
    (role.permissions & ~myPermissions) === 0;
  const canKick = hasPermission(myPermissions, Permissions.KICK);
  const canBan = hasPermission(myPermissions, Permissions.BAN);
  const canMute = hasPermission(myPermissions, Permissions.MUTE);

  // Wraps a moderation/role call: sets busy, surfaces errors, refreshes.
  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onChanged();
    } catch (err: any) {
      setError(err?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleRole = (member: IMember, role: IRole) => {
    const next = member.roleIds.includes(role._id)
      ? member.roleIds.filter((id) => id !== role._id)
      : [...member.roleIds, role._id];
    return run(() => memberService.setRoles(communityId, member.userId, next));
  };

  const kick = (m: IMember) => {
    if (!window.confirm(`Kick ${m.name}? They can rejoin with an invite.`)) return;
    run(() => moderationService.kick(communityId, m.userId));
  };

  const ban = (m: IMember) => {
    if (!window.confirm(`Ban ${m.name}? They won't be able to rejoin.`)) return;
    run(() => moderationService.ban(communityId, m.userId));
  };

  const mute = (m: IMember) => {
    const input = window.prompt(`Mute ${m.name} for how many minutes?`, "10");
    const minutes = Number(input);
    if (!minutes || minutes < 1) return;
    run(() => moderationService.mute(communityId, m.userId, minutes));
  };

  const isMuted = (m: IMember) =>
    Boolean(m.mutedUntil && new Date(m.mutedUntil).getTime() > Date.now());

  return (
    <PixelModal isOpen={isOpen} onClose={onClose} title="MEMBERS" width="600px">
      {error && <p className={styles.error}>{error}</p>}
      {members.map((member) => {
        const selected = selectedUserId === member.userId;
        const isSelf = member.userId === currentUser?._id;
        const muted = isMuted(member);
        return (
          <div key={member.userId}>
            <div
              className={styles.memberRow}
              onClick={() =>
                setSelectedUserId(selected ? null : member.userId)
              }
              style={{ cursor: "pointer" }}
            >
              {member.picture ? (
                <img className={styles.avatar} src={member.picture} alt="" />
              ) : null}
              <span className={styles.memberName}>
                {member.nickname || member.name}
                {member.banned ? " (banned)" : muted ? " (muted)" : ""}
              </span>
              <span className={styles.memberRoles}>
                {member.roleIds.map((id) => {
                  const role = rolesById.get(id);
                  if (!role) return null;
                  return (
                    <span
                      key={id}
                      className={styles.tag}
                      style={{ color: role.color }}
                    >
                      {role.name}
                    </span>
                  );
                })}
              </span>
            </div>

            {selected && (
              <>
                <div className={styles.permGrid}>
                  {roles.map((role) => (
                    <label key={role._id} className={styles.permRow}>
                      <input
                        type="checkbox"
                        checked={member.roleIds.includes(role._id)}
                        disabled={!canAssignRole(role) || busy}
                        onChange={() => toggleRole(member, role)}
                      />
                      <span style={{ color: role.color }}>{role.name}</span>
                    </label>
                  ))}
                </div>

                {!isSelf && (canKick || canBan || canMute) && (
                  <div className={styles.actions}>
                    {canMute &&
                      (muted ? (
                        <PixelButton
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              moderationService.unmute(communityId, member.userId)
                            )
                          }
                        >
                          Unmute
                        </PixelButton>
                      ) : (
                        <PixelButton
                          variant="yellow"
                          size="sm"
                          disabled={busy}
                          onClick={() => mute(member)}
                        >
                          Mute
                        </PixelButton>
                      ))}
                    {canKick && (
                      <PixelButton
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => kick(member)}
                      >
                        Kick
                      </PixelButton>
                    )}
                    {canBan &&
                      (member.banned ? (
                        <PixelButton
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              moderationService.unban(communityId, member.userId)
                            )
                          }
                        >
                          Unban
                        </PixelButton>
                      ) : (
                        <PixelButton
                          variant="danger"
                          size="sm"
                          disabled={busy}
                          onClick={() => ban(member)}
                        >
                          Ban
                        </PixelButton>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </PixelModal>
  );
};

export default MembersModal;
