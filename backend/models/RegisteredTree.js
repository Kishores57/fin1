import mongoose from 'mongoose';

const RegisteredTreeSchema = new mongoose.Schema(
  {
    treeId: { type: String, required: true, unique: true, index: true },
    treeName: { type: String, default: '' },
    species: { type: String, required: true },
    scientificName: { type: String, default: '' },
    family: { type: String, default: '' },
    commonName: { type: String, default: '' },
    age: { type: Number, default: null },
    height: { type: Number, required: true },
    dbh: { type: Number, default: null },
    gbh: { type: Number, default: null },
    crownDiameter: { type: Number, default: null },
    healthStatus: { type: String, default: 'Healthy' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: '' },
    ward: { type: String, default: '' },
    zone: { type: String, default: '' },
    measurements: { type: mongoose.Schema.Types.Mixed, default: {} },
    calculations: { type: mongoose.Schema.Types.Mixed, required: true },
    climaticAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    biodiversity: { type: mongoose.Schema.Types.Mixed, default: {} },
    medicinalValue: { type: mongoose.Schema.Types.Mixed, default: {} },
    canopyAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    culturalImportance: { type: mongoose.Schema.Types.Mixed, default: {} },
    pollutionControl: { type: mongoose.Schema.Types.Mixed, default: {} },
    climateResilience: { type: mongoose.Schema.Types.Mixed, default: {} },
    conservationStatus: { type: mongoose.Schema.Types.Mixed, default: {} },
    maintenance: { type: mongoose.Schema.Types.Mixed, default: {} },
    images: {
      tree: { type: String, default: null },
      bark: { type: String, default: null },
      leaf: { type: String, default: null },
    },
    analysisGeneratedAt: { type: Date, default: Date.now },
    analysisSource: { type: String, default: 'local-rag' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'tree', // Atlas DB tree_analysis → collection "tree"
  }
);

export const RegisteredTree =
  mongoose.models.RegisteredTree || mongoose.model('RegisteredTree', RegisteredTreeSchema);

export default RegisteredTree;
