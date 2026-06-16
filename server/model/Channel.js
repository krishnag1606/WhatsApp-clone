import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    name: { type: String, required: true },
    type: { type: String, enum: ["text", "announcement"], default: "text" },
    position: { type: Number, default: 0 },
    // Slowmode: minimum seconds between messages per member (0 = off). Members
    // with MANAGE_MESSAGES bypass it. Enforced in the REST + socket send paths.
    slowmodeSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

channelSchema.index({ communityId: 1, position: 1 });

const Channel = mongoose.model("Channel", channelSchema);

export default Channel;
