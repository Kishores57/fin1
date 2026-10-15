import mongoose from 'mongoose';

const ApplicationDecisionSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    decision: {
      type: String,
      enum: ['Approved', 'Rejected', 'Returned for Revision'],
      required: true,
      index: true,
    },
    officialReasoning: { type: String, required: true },
    evidenceConsidered: [{ type: String }],
    publicVoteSnapshot: {
      total: { type: Number, default: 0 },
      approve: { type: Number, default: 0 },
      reject: { type: Number, default: 0 },
      abstain: { type: Number, default: 0 },
    },
    adminVoteSnapshot: {
      total: { type: Number, default: 0 },
      approve: { type: Number, default: 0 },
      reject: { type: Number, default: 0 },
      abstain: { type: Number, default: 0 },
    },
    divergenceJustification: {
      type: String,
      default: '',
      // Mandatory if administrative ruling diverges from the public vote
    },
    conditionsImposed: [{ type: String }],
    compensatoryPlantingMandate: {
      ratio: { type: Number, default: 5 }, // 1:5 statutory ratio
      requiredSaplings: { type: Number, default: 0 },
      speciesRequirement: [{ type: String }],
      maintenanceTermYears: { type: Number, default: 3 },
      monitoringOfficer: { type: String, default: 'Municipal Tree Officer' },
    },
    appealInstructions: {
      type: String,
      default:
        'Appeals may be submitted within 30 days of this order to the Urban Tree Authority under Section 8 of the Maharashtra Protection and Preservation of Trees Act, 1975.',
    },
    decidedBy: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      title: { type: String, default: 'Tree Authority Officer' },
    },
    decidedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'tree_cutting_decisions',
  }
);

export const ApplicationDecision =
  mongoose.models.ApplicationDecision ||
  mongoose.model('ApplicationDecision', ApplicationDecisionSchema);

export default ApplicationDecision;
