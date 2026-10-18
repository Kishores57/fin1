import mongoose from 'mongoose';

const ApplicationAuditLogSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    action: {
      type: String,
      required: true,
      index: true,
      // e.g., 'APPLICATION_SUBMITTED', 'DOCUMENT_VERIFIED', 'STATUS_CHANGED', 'VOTE_CAST', 'DECISION_ISSUED', 'FRAUD_REPORTED', 'INVESTIGATION_UPDATED'
    },
    description: { type: String, required: true },
    previousState: { type: mongoose.Schema.Types.Mixed, default: null },
    newState: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    collection: 'tree_cutting_audit_logs',
  }
);

export const ApplicationAuditLog =
  mongoose.models.ApplicationAuditLog ||
  mongoose.model('ApplicationAuditLog', ApplicationAuditLogSchema);

export default ApplicationAuditLog;
