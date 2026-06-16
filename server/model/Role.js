import mongoose from "mongoose";

// A community role. `permissions` is the bitfield from constants/permissions.js.
const roleSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    name: { type: String, required: true },
    color: { type: String, default: "#39ff14" },
    permissions: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

roleSchema.index({ communityId: 1 });

const Role = mongoose.model("Role", roleSchema);

export default Role;
