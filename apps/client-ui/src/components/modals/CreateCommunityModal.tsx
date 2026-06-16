import React from "react";
import { useNavigate } from "react-router-dom";
import { communityService } from "../../services/CommunityService";
import { PixelModal, PixelInput, PixelButton } from "../../ui";

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}

const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const reset = () => {
    setName("");
    setError(null);
    setBusy(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { community, defaultChannel } = await communityService.create(trimmed);
      await onCreated();
      reset();
      onClose();
      navigate(`/c/${community._id}/${defaultChannel._id}`);
    } catch (err: any) {
      setError(err?.message || "Could not create community");
      setBusy(false);
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <PixelModal isOpen={isOpen} onClose={close} title="CREATE COMMUNITY">
      <form onSubmit={submit}>
        <PixelInput
          label="Community name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Skate Crew"
          autoFocus
        />
        {error && <p style={{ color: "var(--color-primary)" }}>{error}</p>}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end" }}>
          <PixelButton type="button" variant="ghost" onClick={close}>
            Cancel
          </PixelButton>
          <PixelButton type="submit" variant="lime" disabled={busy}>
            {busy ? "Creating…" : "Create"}
          </PixelButton>
        </div>
      </form>
    </PixelModal>
  );
};

export default CreateCommunityModal;
