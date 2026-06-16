import mongoose from "mongoose";

// Schema only in Phase 1; voting endpoints + live updates land in Phase 7.
const pollOptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    voters: [{ type: String }], // User._id (Google sub)
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
    authorId: { type: String, required: true },
    question: { type: String, required: true },
    options: [pollOptionSchema],
    allowMultiple: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;
