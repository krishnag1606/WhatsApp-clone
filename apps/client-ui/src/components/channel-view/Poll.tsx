import React from "react";
import styles from "./poll.module.scss";
import { IPoll } from "../../store/IStore";
import { useStore } from "../../store/store";
import {
  votePoll as socketVote,
} from "../../services/socketService";
import { pollService } from "../../services/PollService";
import { PixelIcon } from "../../ui";

interface PollProps {
  poll: IPoll;
}

// Neon palette cycled across option bars (cyan → lime → yellow → pink).
const BAR_COLORS = [
  "var(--color-secondary)",
  "var(--color-success)",
  "var(--color-accent)",
  "var(--color-primary)",
];

// A poll rendered inside the message stream. Clicking an option votes over the
// socket (optimistic update; the authoritative `pollUpdated` broadcast corrects
// it) and falls back to REST when the socket is down. Result bars are revealed
// once the caller has voted or the poll has closed.
const Poll: React.FC<PollProps> = ({ poll }) => {
  const currentUser = useStore((s) => s.currentUser);
  const updatePoll = useStore((s) => s.updatePoll);
  const userId = currentUser?._id;

  const isClosed = Boolean(
    poll.expiresAt && new Date(poll.expiresAt).getTime() <= Date.now()
  );
  const myVotes = React.useMemo(
    () =>
      new Set(
        poll.options.filter((o) => userId && o.voters.includes(userId)).map((o) => o._id)
      ),
    [poll.options, userId]
  );
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voters.length, 0);
  const hasVoted = myVotes.size > 0;
  const showResults = hasVoted || isClosed;

  // Optimistically toggle the caller's vote so the bars react instantly; the
  // server's pollUpdated broadcast (or the REST response) then overwrites with
  // the authoritative tallies.
  const optimisticToggle = (optionId: string): IPoll => {
    const already = myVotes.has(optionId);
    return {
      ...poll,
      options: poll.options.map((o) => {
        let voters = o.voters;
        // Single-choice: clear our vote from every other option first.
        if (!already && !poll.allowMultiple && o._id !== optionId) {
          voters = voters.filter((v) => v !== userId);
        }
        if (o._id === optionId && userId) {
          voters = already
            ? voters.filter((v) => v !== userId)
            : [...voters.filter((v) => v !== userId), userId];
        }
        return { ...o, voters };
      }),
    };
  };

  const vote = async (optionId: string) => {
    if (isClosed || !userId) return;
    updatePoll(optimisticToggle(optionId));
    if (socketVote(poll.channelId, poll._id, optionId)) return;
    // Socket down — vote over REST and apply the authoritative result.
    try {
      updatePoll(await pollService.vote(poll.channelId, poll._id, optionId));
    } catch (error) {
      console.error("Failed to vote", error);
      // Revert the optimistic change by restoring the original poll.
      updatePoll(poll);
    }
  };

  return (
    <div className={styles.poll}>
      <div className={styles.head}>
        <PixelIcon name="chart-bar" size={16} className={styles.headIcon} />
        <span className={styles.question}>{poll.question}</span>
      </div>

      <div className={styles.options}>
        {poll.options.map((opt, i) => {
          const count = opt.voters.length;
          const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
          const mine = myVotes.has(opt._id);
          const color = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <button
              key={opt._id}
              type="button"
              className={`${styles.option} ${mine ? styles.mine : ""} ${
                isClosed ? styles.closed : ""
              }`}
              onClick={() => vote(opt._id)}
              disabled={isClosed}
              style={mine ? { borderColor: color } : undefined}
            >
              {/* Neon fill bar — only revealed once results are shown. */}
              {showResults && (
                <span
                  className={styles.fill}
                  style={{ width: `${pct}%`, background: color, boxShadow: `2px 2px 0 ${color}` }}
                />
              )}
              <span className={styles.label}>
                {mine && <span className={styles.check}>▸</span>}
                {opt.text}
              </span>
              {showResults && (
                <span className={styles.stats}>
                  {pct}% · {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.foot}>
        {poll.allowMultiple && <span>multiple choice</span>}
        <span>
          {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        </span>
        {isClosed ? (
          <span className={styles.closedTag}>closed</span>
        ) : !hasVoted ? (
          <span className={styles.hint}>tap to vote</span>
        ) : null}
      </div>
    </div>
  );
};

export default Poll;
