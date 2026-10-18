import mongoose from 'mongoose';

const ApplicationNotificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: String,
      required: true,
      index: true,
    },
    applicationId: {
      type: String,
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'SUBMISSION',
        'DOCUMENT_UPDATE',
        'CLARIFICATION_REQUEST',
        'VOTING_OPEN',
        'VOTING_CLOSED',
        'DECISION_ISSUED',
        'INVESTIGATION_ALERT',
      ],
      default: 'SUBMISSION',
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    collection: 'tree_cutting_notifications',
  }
);

export const ApplicationNotification =
  mongoose.models.ApplicationNotification ||
  mongoose.model('ApplicationNotification', ApplicationNotificationSchema);

export default ApplicationNotification;
