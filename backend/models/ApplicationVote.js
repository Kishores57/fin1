import mongoose from 'mongoose';

const ApplicationVoteSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    voterRole: {
      type: String,
      enum: ['public', 'admin'],
      required: true,
      index: true,
    },
    voteType: {
      type: String,
      enum: ['approve', 'reject', 'abstain'],
      required: true,
      index: true,
    },
    justification: { type: String, default: '' },
    voteModified: { type: Boolean, default: false },
    previousVoteType: { type: String, default: null },
    ipAddress: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'tree_cutting_votes',
  }
);

// Enforce 1 active vote per user per application on database level
ApplicationVoteSchema.index({ applicationId: 1, userId: 1 }, { unique: true });

export const ApplicationVote =
  mongoose.models.ApplicationVote ||
  mongoose.model('ApplicationVote', ApplicationVoteSchema);

export default ApplicationVote;
