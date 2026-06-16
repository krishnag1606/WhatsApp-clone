import React from "react";
import { PixelModal, PixelButton } from "../../ui";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityName: string;
  inviteCode: string;
}

// Shows the community's shareable invite code with a copy button. Visibility is
// gated by the caller (MANAGE_COMMUNITY / owner); the code itself already comes
// back on the community object from the membership-scoped REST routes.
const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  communityName,
  inviteCode,
}) => {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) setCopied(false);
  }, [isOpen]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
    } catch {
      // Clipboard may be unavailable (insecure context) — leave the code visible
      // for manual copy.
      setCopied(false);
    }
  };

  return (
    <PixelModal isOpen={isOpen} onClose={onClose} title="INVITE">
      <p style={{ fontFamily: "var(--font-body)", marginBottom: 12 }}>
        Share this code so people can join <strong>{communityName}</strong>:
      </p>

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 20,
          letterSpacing: 2,
          color: "var(--color-secondary)",
          background: "var(--color-bg-base)",
          border: "var(--border-thick)",
          padding: "12px 16px",
          textAlign: "center",
          userSelect: "all",
        }}
      >
        {inviteCode}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
          justifyContent: "flex-end",
        }}
      >
        <PixelButton type="button" variant="ghost" onClick={onClose}>
          Close
        </PixelButton>
        <PixelButton type="button" variant="cyan" onClick={copy}>
          {copied ? "Copied!" : "Copy code"}
        </PixelButton>
      </div>
    </PixelModal>
  );
};

export default InviteModal;
