import React from "react";
import styles from "./role-member.module.scss";
import { PixelModal } from "../../ui";
import {
  moderationService,
  IAuditEntry,
} from "../../services/ModerationService";

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
}

const formatWhen = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
};

// Human-readable phrasing for the audit action verbs.
const describe = (e: IAuditEntry) => {
  const target = e.targetName ? ` ${e.targetName}` : "";
  switch (e.action) {
    case "kick":
      return `kicked${target}`;
    case "ban":
      return `banned${target}`;
    case "unban":
      return `unbanned${target}`;
    case "mute":
      return `muted${target}`;
    case "unmute":
      return `unmuted${target}`;
    case "delete_message":
      return `deleted a message${target ? ` from${target}` : ""}`;
    case "pin_message":
      return `pinned a message${target ? ` from${target}` : ""}`;
    case "unpin_message":
      return `unpinned a message${target ? ` from${target}` : ""}`;
    default:
      return `${e.action}${target}`;
  }
};

const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  communityId,
}) => {
  const [entries, setEntries] = React.useState<IAuditEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    moderationService
      .auditLog(communityId)
      .then(setEntries)
      .catch((err) => setError(err?.message || "Failed to load audit log"))
      .finally(() => setLoading(false));
  }, [isOpen, communityId]);

  return (
    <PixelModal isOpen={isOpen} onClose={onClose} title="AUDIT LOG" width="560px">
      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.note}>Loading…</p>}
      {!loading && !entries.length && (
        <p className={styles.note}>No moderation actions yet.</p>
      )}
      {entries.map((e) => (
        <div key={e._id} className={styles.memberRow}>
          <span className={styles.memberName}>
            <strong>{e.actorName}</strong> {describe(e)}
            {e.reason ? ` — "${e.reason}"` : ""}
          </span>
          <span className={styles.when}>{formatWhen(e.createdAt)}</span>
        </div>
      ))}
    </PixelModal>
  );
};

export default AuditLogModal;
