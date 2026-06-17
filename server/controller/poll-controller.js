import Poll from "../model/Poll.js";
import { toPollView } from "../util/pollView.js";
import { applyVoteAs } from "../util/pollVote.js";
import { pollBodySchema, voteBodySchema } from "../util/validation.js";

// POST /api/channels/:channelId/polls  (requireAuth + requireMembership +
// requirePermission(CREATE_POLLS)). Creates a poll in the channel. The socket
// path broadcasts `newPoll` live; this REST route is the fallback and returns
// the created poll for the client to append.
export const createPoll = async (request, response) => {
  try {
    const parsed = pollBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return response
        .status(400)
        .json({ error: "A question and at least two options are required" });
    }
    const { question, options, allowMultiple, expiresAt } = parsed.data;

    const poll = await Poll.create({
      channelId: request.params.channelId,
      authorId: request.userId,
      question: question.trim(),
      options: options.map((text) => ({ text: text.trim(), voters: [] })),
      allowMultiple: Boolean(allowMultiple),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return response.status(201).json(toPollView(poll));
  } catch (error) {
    return response.status(500).json({ error: "Failed to create poll" });
  }
};

// GET /api/channels/:channelId/polls  (requireAuth + requireMembership)
// Returns the channel's polls oldest-first so the client can interleave them
// with messages by createdAt.
export const getPolls = async (request, response) => {
  try {
    const polls = await Poll.find({ channelId: request.params.channelId }).sort({
      createdAt: 1,
    });
    return response.status(200).json(polls.map(toPollView));
  } catch (error) {
    return response.status(500).json({ error: "Failed to load polls" });
  }
};

// POST /api/channels/:channelId/polls/:pollId/vote  (requireAuth +
// requireMembership). Any member may vote; toggling + allowMultiple are enforced
// authoritatively in the shared helper. REST fallback for the socket `votePoll`
// event, which broadcasts `pollUpdated` live.
export const votePoll = async (request, response) => {
  try {
    const parsed = voteBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ error: "optionId is required" });
    }
    const result = await applyVoteAs({
      pollId: request.params.pollId,
      optionId: parsed.data.optionId,
      userId: request.userId,
    });
    if (result.error) {
      const status = result.error.includes("not found") ? 404 : 403;
      return response.status(status).json({ error: result.error });
    }
    return response.status(200).json(toPollView(result.poll));
  } catch (error) {
    return response.status(500).json({ error: "Failed to record vote" });
  }
};
