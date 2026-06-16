import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    icon: { type: String },
    ownerId: { type: String, required: true }, // User._id (Google sub)
    inviteCode: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const Community = mongoose.model("Community", communitySchema);

export default Community;
