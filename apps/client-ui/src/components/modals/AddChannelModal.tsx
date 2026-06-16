import React from "react";
import { useNavigate } from "react-router-dom";
import { channelService } from "../../services/ChannelService";
import { ChannelType } from "../../store/IStore";
import { PixelModal, PixelInput, PixelButton } from "../../ui";

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  onCreated: () => void | Promise<void>;
}

// Y2K replacement for the old window.prompt channel-create flow. Accepts a name
// and a channel type, dispatches the creation, then navigates to the new channel.
const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  onClose,
  communityId,
  onCreated,
}) => {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<ChannelType>("text");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const reset = () => {
    setName("");
    setType("text");
    setError(null);
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const channel = await channelService.create(communityId, {
        name: trimmed,
        type,
      });
      await onCreated();
      reset();
      onClose();
      navigate(`/c/${communityId}/${channel._id}`);
    } catch (err: any) {
      setError(err?.message || "Could not create channel");
      setBusy(false);
    }
  };

  return (
    <PixelModal isOpen={isOpen} onClose={close} title="ADD CHANNEL">
      <form onSubmit={submit}>
        <PixelInput
          label="Channel name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. general"
          autoFocus
        />

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <PixelButton
            type="button"
            variant={type === "text" ? "cyan" : "ghost"}
            size="sm"
            onClick={() => setType("text")}
          >
            # text
          </PixelButton>
          <PixelButton
            type="button"
            variant={type === "announcement" ? "cyan" : "ghost"}
            size="sm"
            onClick={() => setType("announcement")}
          >
            📣 announcement
          </PixelButton>
        </div>

        {error && (
          <p style={{ color: "var(--color-primary)", marginTop: 12 }}>{error}</p>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
            justifyContent: "flex-end",
          }}
        >
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

export default AddChannelModal;
