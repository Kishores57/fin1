import mongoose from 'mongoose';

const ApplicationDocumentSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'Project Approval',
        'Land Ownership Title',
        'Environmental Impact Assessment',
        'Tree Survey Report',
        'Site Photographs',
        'Compensatory Afforestation Plan',
        'Other',
      ],
      default: 'Other',
    },
    title: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storagePath: { type: String, required: true },
    isConfidential: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['Pending Review', 'Verified', 'Rejected', 'Additional Information Required'],
      default: 'Pending Review',
      index: true,
    },
    verifiedBy: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
    verificationNotes: { type: String, default: '' },
    uploadedBy: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'tree_cutting_documents',
  }
);

export const ApplicationDocument =
  mongoose.models.ApplicationDocument ||
  mongoose.model('ApplicationDocument', ApplicationDocumentSchema);

export default ApplicationDocument;
