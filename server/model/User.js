import mongoose from "mongoose";

// The canonical user id is the Google `sub`, used directly as _id so that
// roles, bans, and moderation can reference a stable, server-verified identity.
const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // Google sub
    name: { type: String, required: true },
    email: { type: String, required: true },
    picture: { type: String },
  },
  { _id: false, timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
