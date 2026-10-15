import mongoose from 'mongoose';

const TreeCuttingApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    applicant: {
      userId: { type: String, required: true },
      name: { type: String, required: true },
      applicantType: {
        type: String,
        enum: [
          'Individual',
          'Company',
          'Government Department',
          'NGO',
          'Infrastructure Contractor',
          'Urban Municipal Body',
          'Real Estate Developer',
          'Public Utility',
          'Educational / Research Campus',
          'Other',
        ],
        default: 'Individual',
      },
      organization: { type: String, default: '' },
      contactEmail: { type: String, required: true },
      contactPhone: { type: String, default: '' },
      registrationNumber: { type: String, default: '' },
    },
    details: {
      title: { type: String, required: true },
      reason: { type: String, required: true },
      description: { type: String, required: true },
      regionName: { type: String, default: '' },
      state: { type: String, default: 'Maharashtra' },
      district: { type: String, default: 'Nashik' },
      city: { type: String, default: 'Nashik' },
      village: { type: String, default: '' },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      polygonGeometry: { type: mongoose.Schema.Types.Mixed, default: null },
      estimatedTreesAffected: { type: Number, required: true, min: 1 },
      speciesKnown: [{ type: String }],
      estimatedAge: { type: String, default: '' },
      proposedCuttingPeriod: { type: String, default: '' },
      alternativesConsidered: { type: String, default: '' },
      mitigationPlan: { type: String, default: '' },
      compensatoryPlantingPlan: {
        ratio: { type: Number, default: 5 },
        proposedSaplings: { type: Number, default: 0 },
        proposedSpecies: [{ type: String }],
        proposedLocation: { type: String, default: '' },
      },
    },
    gisVerifiedImpact: {
      verifiedTreeCount: { type: Number, default: 0 },
      verifiedTrees: [
        {
          id: String,
          species: String,
          lat: Number,
          lng: Number,
          dbh: Number,
          co2: Number,
        },
      ],
      estimatedBiomassLossKg: { type: Number, default: 0 },
      estimatedCarbonLossKg: { type: Number, default: 0 },
      estimatedOxygenLossKg: { type: Number, default: 0 },
      nearbyProtectedZones: [{ type: String }],
      analysisTimestamp: { type: Date, default: Date.now },
    },
    status: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Initial Review',
        'Documents Under Review',
        'Additional Information Required',
        'Public Review',
        'Voting Open',
        'Voting Closed',
        'Awaiting Administrative Decision',
        'Approved',
        'Rejected',
        'Returned for Revision',
        'Withdrawn',
        'Under Investigation',
      ],
      default: 'Submitted',
      index: true,
    },
    votingConfig: {
      publicVotingEnabled: { type: Boolean, default: true },
      votingStartDate: { type: Date, default: null },
      votingClosingDate: { type: Date, default: null },
      isVotingOpen: { type: Boolean, default: false },
    },
    clarificationRequest: {
      requestedBy: { type: String, default: '' },
      notes: { type: String, default: '' },
      requestedAt: { type: Date, default: null },
      isResolved: { type: Boolean, default: false },
      responseNotes: { type: String, default: '' },
      resolvedAt: { type: Date, default: null },
    },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ApplicationDocument' }],
    decision: { type: mongoose.Schema.Types.ObjectId, ref: 'ApplicationDecision', default: null },
  },
  {
    timestamps: true,
    collection: 'tree_cutting_applications',
  }
);

export const TreeCuttingApplication =
  mongoose.models.TreeCuttingApplication ||
  mongoose.model('TreeCuttingApplication', TreeCuttingApplicationSchema);

export default TreeCuttingApplication;
