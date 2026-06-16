import React from "react";
import styles from "./role-member.module.scss";
import { PixelModal } from "../../ui";
import { useStore } from "../../store/store";
import { memberService } from "../../services/MemberService";
import { IMember, IRole } from "../../store/IStore";

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  onChanged: () => void | Promise<void>;
}

// Members list with inline role assignment. Selecting a member reveals role
// checkboxes; toggling one persists immediately. Roles carrying permissions the
// caller lacks are disabled (the server enforces the same escalation guard).
const MembersModal: React.FC<MembersModalProps> = ({
  isOpen,
  onClose,
  communityId,
  onChanged,
}) => {
  const members = useStore((s) => s.members);
  const roles = useStore((s) => s.roles);
  const myPermissions = useStore((s) => s.myPermissions);

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

  const toggleRole = async (member: IMember, role: IRole) => {
    if (busy) return;
    const next = member.roleIds.includes(role._id)
      ? member.roleIds.filter((id) => id !== role._id)
      : [...member.roleIds, role._id];
    setBusy(true);
    setError(null);
    try {
      await memberService.setRoles(communityId, member.userId, next);
      await onChanged();
    } catch (err: any) {
      setError(err?.message || "Could not update roles");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PixelModal isOpen={isOpen} onClose={onClose} title="MEMBERS" width="560px">
      {error && <p className={styles.error}>{error}</p>}
      {members.map((member) => {
        const selected = selectedUserId === member.userId;
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
                <img
                  className={styles.avatar}
                  src={member.picture}
                  alt=""
                />
              ) : null}
              <span className={styles.memberName}>
                {member.nickname || member.name}
                {member.banned ? " (banned)" : ""}
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
              <div className={styles.permGrid}>
                {roles.map((role) => {
                  const assignable = canAssignRole(role);
                  return (
                    <label key={role._id} className={styles.permRow}>
                      <input
                        type="checkbox"
                        checked={member.roleIds.includes(role._id)}
                        disabled={!assignable || busy}
                        onChange={() => toggleRole(member, role)}
                      />
                      <span style={{ color: role.color }}>{role.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </PixelModal>
  );
};

export default MembersModal;
