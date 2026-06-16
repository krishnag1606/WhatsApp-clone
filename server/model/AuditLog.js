import mongoose from "mongoose";

// Schema only in Phase 1; entries are written by moderation actions in Phase 5.
const auditLogSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    actorId: { type: String, required: true }, // who performed the action
    targetId: { type: String }, // affected user (if any)
    action: { type: String, required: true }, // e.g. "kick", "ban", "delete_message"
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ communityId: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
