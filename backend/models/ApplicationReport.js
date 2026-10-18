import mongoose from 'mongoose';

const ApplicationReportSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      index: true,
    },
    reporter: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    concernType: {
      type: String,
      enum: [
        'Fabricated Document',
        'False Tree Count',
        'Unauthorized Tree Cutting',
        'Environmental Misrepresentation',
        'Other Violation',
      ],
      required: true,
    },
    details: { type: String, required: true },
    evidenceNotes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Substantiated', 'Dismissed', 'Referred to Legal Authority'],
      default: 'Submitted',
      index: true,
    },
    investigatorNotes: { type: String, default: '' },
    investigatedBy: { type: String, default: null },
    investigatedAt: { type: Date, default: null },
    officialReferralAuthority: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'tree_cutting_reports',
  }
);

export const ApplicationReport =
  mongoose.models.ApplicationReport ||
  mongoose.model('ApplicationReport', ApplicationReportSchema);

export default ApplicationReport;
