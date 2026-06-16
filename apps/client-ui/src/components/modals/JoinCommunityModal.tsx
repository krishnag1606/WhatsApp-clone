import React from "react";
import { useNavigate } from "react-router-dom";
import { communityService } from "../../services/CommunityService";
import { PixelModal, PixelInput, PixelButton } from "../../ui";

interface JoinCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: () => void | Promise<void>;
}

const JoinCommunityModal: React.FC<JoinCommunityModalProps> = ({
  isOpen,
  onClose,
  onJoined,
}) => {
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const reset = () => {
    setCode("");
    setError(null);
    setBusy(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { community } = await communityService.join(trimmed);
      await onJoined();
      reset();
      onClose();
      navigate(`/c/${community._id}`);
    } catch (err: any) {
      setError(err?.message || "Could not join — check the code");
      setBusy(false);
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <PixelModal isOpen={isOpen} onClose={close} title="JOIN COMMUNITY">
      <form onSubmit={submit}>
        <PixelInput
          label="Invite code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. 77NRHWNS"
          autoFocus
        />
        {error && <p style={{ color: "var(--color-primary)" }}>{error}</p>}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end" }}>
          <PixelButton type="button" variant="ghost" onClick={close}>
            Cancel
          </PixelButton>
          <PixelButton type="submit" variant="cyan" disabled={busy}>
            {busy ? "Joining…" : "Join"}
          </PixelButton>
        </div>
      </form>
    </PixelModal>
  );
};

export default JoinCommunityModal;
