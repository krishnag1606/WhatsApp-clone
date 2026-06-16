import React from "react";
import { createPoll as socketCreatePoll } from "../../services/socketService";
import { pollService } from "../../services/PollService";
import { useStore } from "../../store/store";
import { PixelModal, PixelInput, PixelButton, PixelIcon } from "../../ui";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
}

const MAX_OPTIONS = 10;

// Y2K poll composer: a question, 2–10 options (add/remove), and a single-vs-
// multiple toggle. Sends socket-first (the server broadcasts `newPoll` to the
// room, including us, so there's nothing to append here) and falls back to REST
// when the socket is down, appending the returned poll locally.
const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  channelId,
}) => {
  const [question, setQuestion] = React.useState("");
  const [options, setOptions] = React.useState<string[]>(["", ""]);
  const [allowMultiple, setAllowMultiple] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const addPoll = useStore((s) => s.addPoll);

  const reset = () => {
    setQuestion("");
    setOptions(["", ""]);
    setAllowMultiple(false);
    setError(null);
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const setOption = (index: number, value: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));

  const addOption = () =>
    setOptions((prev) =>
      prev.length >= MAX_OPTIONS ? prev : [...prev, ""]
    );

  const removeOption = (index: number) =>
    setOptions((prev) =>
      prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q) {
      setError("A question is required");
      return;
    }
    if (opts.length < 2) {
      setError("At least two non-empty options are required");
      return;
    }
    if (busy) return;

    const payload = { question: q, options: opts, allowMultiple };

    // Socket-first: the broadcast appends the poll for everyone (us included).
    if (socketCreatePoll(channelId, payload)) {
      reset();
      onClose();
      return;
    }

    // Socket down — create over REST and append the result locally.
    setBusy(true);
    setError(null);
    try {
      const poll = await pollService.create(channelId, payload);
      addPoll(poll);
      reset();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not create poll");
      setBusy(false);
    }
  };

  return (
    <PixelModal isOpen={isOpen} onClose={close} title="CREATE POLL">
      <form onSubmit={submit}>
        <PixelInput
          label="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What should we play tonight?"
          autoFocus
        />

        <div style={{ marginTop: 16 }}>
          {options.map((opt, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}
            >
              <div style={{ flex: 1 }}>
                <PixelInput
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                />
              </div>
              <PixelButton
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removeOption(i)}
                disabled={options.length <= 2}
                title="Remove option"
              >
                <PixelIcon name="close" size={14} />
              </PixelButton>
            </div>
          ))}

          {options.length < MAX_OPTIONS && (
            <PixelButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={addOption}
            >
              <PixelIcon name="plus" size={14} /> Add option
            </PixelButton>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <PixelButton
            type="button"
            variant={allowMultiple ? "cyan" : "ghost"}
            size="sm"
            onClick={() => setAllowMultiple((v) => !v)}
          >
            {allowMultiple ? "☑" : "☐"} Allow multiple choices
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
            {busy ? "Creating…" : "Create poll"}
          </PixelButton>
        </div>
      </form>
    </PixelModal>
  );
};

export default CreatePollModal;
