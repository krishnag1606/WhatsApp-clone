import React from "react";
import { channelService } from "../../services/ChannelService";
import { IChannel } from "../../store/IStore";
import { PixelModal, PixelInput, PixelButton } from "../../ui";

interface SlowmodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: IChannel;
  onUpdated: (channel: IChannel) => void;
}

// Y2K replacement for the old window.prompt slowmode flow. Sets the channel's
// slowmodeSeconds (0 disables). Requires MANAGE_CHANNELS (gated by the caller).
const SlowmodeModal: React.FC<SlowmodeModalProps> = ({
  isOpen,
  onClose,
  channel,
  onUpdated,
}) => {
  const [seconds, setSeconds] = React.useState("0");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Seed the field from the channel each time the modal opens.
  React.useEffect(() => {
    if (isOpen) {
      setSeconds(String(channel.slowmodeSeconds ?? 0));
      setError(null);
      setBusy(false);
    }
  }, [isOpen, channel.slowmodeSeconds]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    setBusy(true);
    setError(null);
    try {
      const updated = await channelService.update(channel._id, {
        slowmodeSeconds: value,
      });
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not update slowmode");
      setBusy(false);
    }
  };

  return (
    <PixelModal isOpen={isOpen} onClose={onClose} title="SLOWMODE">
      <form onSubmit={submit}>
        <PixelInput
          label={`Seconds between messages in #${channel.name}`}
          type="number"
          min={0}
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
          placeholder="0"
          autoFocus
        />
        <p style={{ color: "var(--color-text-muted)", marginTop: 8, fontSize: 14 }}>
          Set to 0 to disable. Members with Manage Messages bypass slowmode.
        </p>

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
          <PixelButton type="button" variant="ghost" onClick={onClose}>
            Cancel
          </PixelButton>
          <PixelButton type="submit" variant="lime" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </PixelButton>
        </div>
      </form>
    </PixelModal>
  );
};

export default SlowmodeModal;
