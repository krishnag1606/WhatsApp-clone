import mongoose from "mongoose";

// Join table between users and communities, carrying per-community state
// (roles, nickname, mute/ban).
const membershipSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    userId: { type: String, required: true }, // User._id (Google sub)
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    nickname: { type: String },
    mutedUntil: { type: Date },
    banned: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "joinedAt", updatedAt: true } }
);

// A user has at most one membership per community.
membershipSchema.index({ communityId: 1, userId: 1 }, { unique: true });

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;
