import React from "react";
import styles from "./role-member.module.scss";
import { PixelModal, PixelInput, PixelButton } from "../../ui";
import { useStore } from "../../store/store";
import { roleService } from "../../services/RoleService";
import { IRole } from "../../store/IStore";
import {
  PERMISSION_LABELS,
  ALL_PERMISSIONS,
  hasPermission,
} from "../../constants/permissions";

interface RolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  onChanged: () => void | Promise<void>;
}

const NEW_DRAFT = { name: "", color: "#39ff14", permissions: 0 };

// Role editor: pick a role to edit, or create a new one. Permission checkboxes
// the caller doesn't themselves have are disabled (the server enforces the same
// escalation guard — this just hides what won't work).
const RolesModal: React.FC<RolesModalProps> = ({
  isOpen,
  onClose,
  communityId,
  onChanged,
}) => {
  const roles = useStore((s) => s.roles);
  const myPermissions = useStore((s) => s.myPermissions);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState(NEW_DRAFT);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectRole = (role: IRole) => {
    setSelectedId(role._id);
    setDraft({
      name: role.name,
      color: role.color || "#39ff14",
      permissions: role.permissions,
    });
    setError(null);
  };

  const startNew = () => {
    setSelectedId(null);
    setDraft(NEW_DRAFT);
    setError(null);
  };

  // Reset the editor whenever the modal is (re)opened.
  React.useEffect(() => {
    if (isOpen) startNew();
  }, [isOpen]);

  const isOwnerRole = draft.permissions === ALL_PERMISSIONS && selectedId;

  const togglePerm = (flag: number) => {
    setDraft((d) => ({
      ...d,
      permissions: hasPermission(d.permissions, flag)
        ? d.permissions & ~flag
        : d.permissions | flag,
    }));
  };

  const save = async () => {
    const name = draft.name.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (selectedId) {
        await roleService.update(communityId, selectedId, {
          name,
          color: draft.color,
          permissions: draft.permissions,
        });
      } else {
        await roleService.create(communityId, {
          name,
          color: draft.color,
          permissions: draft.permissions,
        });
      }
      await onChanged();
      startNew();
    } catch (err: any) {
      setError(err?.message || "Could not save role");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selectedId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await roleService.remove(communityId, selectedId);
      await onChanged();
      startNew();
    } catch (err: any) {
      setError(err?.message || "Could not delete role");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PixelModal isOpen={isOpen} onClose={onClose} title="ROLES" width="560px">
      <div className={styles.roleList}>
        {roles.map((role) => (
          <button
            key={role._id}
            type="button"
            className={`${styles.roleChip} ${
              selectedId === role._id ? styles.selected : ""
            }`}
            onClick={() => selectRole(role)}
          >
            <span
              className={styles.swatch}
              style={{ background: role.color }}
            />
            {role.name}
          </button>
        ))}
        <button type="button" className={styles.roleChip} onClick={startNew}>
          ＋ new role
        </button>
      </div>

      <PixelInput
        label="Role name"
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        placeholder="e.g. Helper"
      />

      <div className={styles.colorRow}>
        <span>Color</span>
        <input
          type="color"
          value={draft.color}
          onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
          aria-label="Role color"
        />
      </div>

      <div className={styles.permGrid}>
        {PERMISSION_LABELS.map(({ flag, label }) => {
          const canGrant = hasPermission(myPermissions, flag);
          return (
            <label key={flag} className={styles.permRow}>
              <input
                type="checkbox"
                checked={hasPermission(draft.permissions, flag)}
                disabled={!canGrant}
                onChange={() => togglePerm(flag)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {isOwnerRole && (
        <p className={styles.note}>
          This is the owner role — it always keeps every permission.
        </p>
      )}

      <div className={styles.actions}>
        {selectedId && (
          <PixelButton
            type="button"
            variant="danger"
            onClick={remove}
            disabled={busy || draft.permissions === ALL_PERMISSIONS}
          >
            Delete
          </PixelButton>
        )}
        <PixelButton type="button" variant="lime" onClick={save} disabled={busy}>
          {busy ? "Saving…" : selectedId ? "Save" : "Create"}
        </PixelButton>
      </div>
    </PixelModal>
  );
};

export default RolesModal;
