import Poll from "../model/Poll.js";

// Shared poll-vote logic used by BOTH the REST controller and the socket server
// so the two paths behave identically. Toggles the caller's vote on a single
// option: voting an option you've already voted for removes the vote; otherwise
// it's added. When the poll is single-choice (`allowMultiple` false), casting a
// new vote first clears the caller from every other option. Expired polls are
// rejected. The server is authoritative — `allowMultiple` is enforced here, not
// trusted from the client.
//
// Returns `{ poll }` (the saved doc) on success or `{ error }` on failure.
export const applyVoteAs = async ({ pollId, optionId, userId }) => {
  const poll = await Poll.findById(pollId);
  if (!poll) return { error: "Poll not found" };
  if (poll.expiresAt && poll.expiresAt.getTime() <= Date.now()) {
    return { error: "This poll has closed" };
  }

  const option = poll.options.id(optionId);
  if (!option) return { error: "Option not found" };

  const alreadyVoted = option.voters.includes(userId);

  if (alreadyVoted) {
    // Toggle off.
    option.voters = option.voters.filter((v) => v !== userId);
  } else {
    // Single-choice polls allow only one selection — drop prior votes first.
    if (!poll.allowMultiple) {
      for (const opt of poll.options) {
        opt.voters = opt.voters.filter((v) => v !== userId);
      }
    }
    option.voters.push(userId);
  }

  await poll.save();
  return { poll };
};
