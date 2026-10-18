import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { ensureMongo, isMongoReady } from '../database/mongo.js';
import { TreeCuttingApplication } from '../models/TreeCuttingApplication.js';
import { ApplicationDocument } from '../models/ApplicationDocument.js';
import { ApplicationVote } from '../models/ApplicationVote.js';
import { ApplicationDecision } from '../models/ApplicationDecision.js';
import { ApplicationAuditLog } from '../models/ApplicationAuditLog.js';
import { ApplicationReport } from '../models/ApplicationReport.js';
import { ApplicationNotification } from '../models/ApplicationNotification.js';
import { calculateCuttingImpact } from '../services/cuttingImpactService.js';
import { verifyToken, requireRole, optionalToken } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.resolve(__dirname, '../uploads/applications');

fs.mkdirSync(uploadsRoot, { recursive: true });

// Multer storage for application documents
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${Math.floor(Math.random() * 10000)}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Supported file formats: PDF, JPG, PNG, WEBP, DOCX, TXT.'));
    }
    cb(null, true);
  },
});

async function requireMongo(res) {
  const ok = await ensureMongo();
  if (!ok || !isMongoReady()) {
    res.status(503).json({
      detail: 'MongoDB connection is required for tree-cutting permits. Check database connectivity.',
    });
    return false;
  }
  return true;
}

// Safely match either applicationId string or MongoDB _id without CastError
function findAppQuery(id) {
  if (!id) return { _id: null };
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ applicationId: id }, { _id: id }] };
  }
  return { applicationId: id };
}

// Generate unique sequential or random ID: TCA-2025-XXXX
async function generateUniqueAppId() {
  const year = new Date().getFullYear();
  let uniqueId = '';
  let exists = true;
  while (exists) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    uniqueId = `TCA-${year}-${rand}`;
    const found = await TreeCuttingApplication.findOne({ applicationId: uniqueId });
    if (!found) exists = false;
  }
  return uniqueId;
}

// Helper: Append-only audit logger
async function logAuditEvent({ applicationId, actor, action, description, previousState, newState, req }) {
  try {
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || '';
    await ApplicationAuditLog.create({
      applicationId,
      actor: {
        userId: String(actor.id || actor.userId),
        name: actor.name,
        role: actor.role,
      },
      action,
      description,
      previousState,
      newState,
      ipAddress: String(ip),
    });
  } catch (err) {
    console.warn('Audit log write error:', err.message);
  }
}

// Helper: In-app notification dispatcher
async function sendNotification({ recipientUserId, applicationId, title, message, type }) {
  try {
    await ApplicationNotification.create({
      recipientUserId: String(recipientUserId),
      applicationId,
      title,
      message,
      type,
    });
  } catch (err) {
    console.warn('Notification create error:', err.message);
  }
}

// ==========================================
// 1. PUBLIC KPI / TRANSPARENCY DASHBOARD
// ==========================================
router.get('/kpi', async (_req, res) => {
  try {
    if (!(await requireMongo(res))) return;

    const [totalApps, votingOpen, approved, rejected, underReview, totalVotes] = await Promise.all([
      TreeCuttingApplication.countDocuments(),
      TreeCuttingApplication.countDocuments({ status: 'Voting Open' }),
      TreeCuttingApplication.countDocuments({ status: 'Approved' }),
      TreeCuttingApplication.countDocuments({ status: 'Rejected' }),
      TreeCuttingApplication.countDocuments({
        status: { $in: ['Submitted', 'Initial Review', 'Documents Under Review', 'Public Review'] },
      }),
      ApplicationVote.countDocuments(),
    ]);

    // Aggregate total trees affected vs compensatory planting proposed
    const totals = await TreeCuttingApplication.aggregate([
      {
        $group: {
          _id: null,
          totalTreesAffected: { $sum: '$details.estimatedTreesAffected' },
          totalCompensatoryProposed: { $sum: '$details.compensatoryPlantingPlan.proposedSaplings' },
        },
      },
    ]);

    res.json({
      totalApplications: totalApps,
      votingOpenApplications: votingOpen,
      approvedApplications: approved,
      rejectedApplications: rejected,
      underReviewApplications: underReview,
      totalVotesCast: totalVotes,
      totalTreesAffected: totals[0]?.totalTreesAffected || 0,
      totalCompensatoryMandated: (totals[0]?.totalTreesAffected || 0) * 5,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Failed to load KPI metrics.' });
  }
});

// ==========================================
// 2. LIST APPLICATIONS WITH MULTI-FILTER
// ==========================================
router.get('/applications', optionalToken, async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;

    const { status, district, applicantType, search, mine } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (district && district !== 'all') {
      filter['details.district'] = new RegExp(district, 'i');
    }
    if (applicantType && applicantType !== 'all') {
      filter['applicant.applicantType'] = applicantType;
    }
    if (mine === 'true' && req.user) {
      filter['applicant.userId'] = String(req.user.id);
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { applicationId: new RegExp(q, 'i') },
        { 'details.title': new RegExp(q, 'i') },
        { 'details.reason': new RegExp(q, 'i') },
        { 'details.city': new RegExp(q, 'i') },
        { 'details.district': new RegExp(q, 'i') },
        { 'applicant.name': new RegExp(q, 'i') },
      ];
    }

    const apps = await TreeCuttingApplication.find(filter)
      .sort({ createdAt: -1 })
      .populate('documents')
      .populate('decision')
      .lean();

    // Map public response ensuring confidential fields are masked for general public
    const results = apps.map((app) => {
      const isOwner = req.user && String(req.user.id) === String(app.applicant.userId);
      const isAdmin = req.user && req.user.role === 'admin';

      return {
        ...app,
        id: app._id,
        applicant: {
          name: app.applicant.name,
          applicantType: app.applicant.applicantType,
          organization: app.applicant.organization,
          // Mask direct contact for non-admin/non-owner for privacy
          contactEmail: isAdmin || isOwner ? app.applicant.contactEmail : undefined,
          contactPhone: isAdmin || isOwner ? app.applicant.contactPhone : undefined,
        },
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Failed to list applications.' });
  }
});

// ==========================================
// 3. SUBMIT NEW APPLICATION
// ==========================================
router.post(
  '/applications',
  verifyToken,
  upload.array('documents', 10),
  async (req, res) => {
    try {
      if (!(await requireMongo(res))) return;

      const body = req.body || {};
      const {
        title,
        reason,
        description,
        regionName,
        state = 'Maharashtra',
        district = 'Nashik',
        city = 'Nashik',
        village,
        latitude,
        longitude,
        polygonGeometry,
        estimatedTreesAffected,
        speciesKnown,
        estimatedAge,
        proposedCuttingPeriod,
        alternativesConsidered,
        mitigationPlan,
        applicantType = 'Individual',
        organization = '',
        contactPhone = '',
        registrationNumber = '',
        compensatoryPlantingPlan,
      } = body;

      if (!title || !reason || !description || latitude == null || longitude == null || !estimatedTreesAffected) {
        return res.status(400).json({
          detail: 'Title, reason, description, coordinates, and estimated trees affected are mandatory.',
        });
      }

      const lat = Number(latitude);
      const lng = Number(longitude);
      const treesCount = Math.max(1, Number(estimatedTreesAffected));

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ detail: 'Valid geographical coordinates are required.' });
      }

      let parsedPolygon = null;
      if (polygonGeometry) {
        try {
          parsedPolygon = typeof polygonGeometry === 'string' ? JSON.parse(polygonGeometry) : polygonGeometry;
        } catch {
          parsedPolygon = null;
        }
      }

      let parsedSpecies = [];
      if (speciesKnown) {
        try {
          parsedSpecies = typeof speciesKnown === 'string' ? JSON.parse(speciesKnown) : speciesKnown;
        } catch {
          parsedSpecies = String(speciesKnown).split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      let parsedCompensatory = {
        ratio: 5,
        proposedSaplings: treesCount * 5,
        proposedSpecies: ['Neem', 'Ashoka', 'Badam', 'Peepal'],
        proposedLocation: 'Designated Municipal Urban Forest Reserve',
      };
      if (compensatoryPlantingPlan) {
        try {
          const cp = typeof compensatoryPlantingPlan === 'string' ? JSON.parse(compensatoryPlantingPlan) : compensatoryPlantingPlan;
          parsedCompensatory = { ...parsedCompensatory, ...cp };
        } catch {
          // Keep defaults
        }
      }

      // Calculate GIS impact against real tree inventory
      const gisImpact = await calculateCuttingImpact({
        latitude: lat,
        longitude: lng,
        polygonGeometry: parsedPolygon,
        estimatedTreesAffected: treesCount,
      });

      const uniqueAppId = await generateUniqueAppId();

      // Process uploaded files
      const createdDocs = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const doc = await ApplicationDocument.create({
            applicationId: uniqueAppId,
            category: file.fieldname === 'sitePhoto' ? 'Site Photographs' : 'Project Approval',
            title: file.originalname,
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            storagePath: file.path,
            isConfidential: false,
            verificationStatus: 'Pending Review',
            uploadedBy: req.user.name,
          });
          createdDocs.push(doc._id);
        }
      }

      // Create main application document
      const app = await TreeCuttingApplication.create({
        applicationId: uniqueAppId,
        applicant: {
          userId: String(req.user.id),
          name: req.user.name,
          applicantType,
          organization: organization || req.user.organization || '',
          contactEmail: req.user.email,
          contactPhone,
          registrationNumber,
        },
        details: {
          title: title.trim(),
          reason: reason.trim(),
          description: description.trim(),
          regionName: regionName || `${city}, ${district}`,
          state,
          district,
          city,
          village: village || '',
          latitude: lat,
          longitude: lng,
          polygonGeometry: parsedPolygon,
          estimatedTreesAffected: treesCount,
          speciesKnown: parsedSpecies,
          estimatedAge: estimatedAge ? Number(estimatedAge) : null,
          proposedCuttingPeriod: proposedCuttingPeriod || '',
          alternativesConsidered: alternativesConsidered || '',
          mitigationPlan: mitigationPlan || '',
          compensatoryPlantingPlan: parsedCompensatory,
        },
        gisVerifiedImpact: gisImpact,
        status: 'Submitted',
        votingConfig: {
          publicVotingEnabled: true,
          votingStartDate: null,
          votingClosingDate: null,
          isVotingOpen: false,
        },
        documents: createdDocs,
      });

      // Append-only audit logging
      await logAuditEvent({
        applicationId: uniqueAppId,
        actor: req.user,
        action: 'APPLICATION_SUBMITTED',
        description: `New tree-cutting permit application submitted for ${treesCount} trees at [${lat}, ${lng}].`,
        newState: { status: 'Submitted', applicationId: uniqueAppId },
        req,
      });

      // In-app notifications
      await sendNotification({
        recipientUserId: String(req.user.id),
        applicationId: uniqueAppId,
        title: 'Application Submitted Successfully',
        message: `Your tree-cutting application #${uniqueAppId} has been lodged and is queued for administrative review.`,
        type: 'SUBMISSION',
      });

      await sendNotification({
        recipientUserId: 'ALL_ADMINS',
        applicationId: uniqueAppId,
        title: 'New Tree-Cutting Permit Lodged',
        message: `${req.user.name} submitted application #${uniqueAppId} requesting cutting of ${treesCount} trees in ${district}.`,
        type: 'SUBMISSION',
      });

      const populated = await TreeCuttingApplication.findById(app._id).populate('documents');
      res.status(201).json(populated);
    } catch (err) {
      console.error('Submit tree-cutting application error:', err);
      res.status(500).json({ detail: err.message || 'Failed to submit application.' });
    }
  }
);

// ==========================================
// 4. GET APPLICATION DETAILS
// ==========================================
router.get('/applications/:id', optionalToken, async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;

    const app = await TreeCuttingApplication.findOne(findAppQuery(req.params.id))
      .populate('documents')
      .populate('decision')
      .lean();

    if (!app) {
      return res.status(404).json({ detail: 'Tree cutting application not found.' });
    }

    const isOwner = req.user && String(req.user.id) === String(app.applicant.userId);
    const isAdmin = req.user && req.user.role === 'admin';

    // Filter documents based on confidentiality
    const visibleDocs = (app.documents || []).filter((doc) => {
      if (!doc.isConfidential) return true;
      return isOwner || isAdmin;
    });

    res.json({
      ...app,
      id: app._id,
      documents: visibleDocs,
      applicant: {
        ...app.applicant,
        contactEmail: isAdmin || isOwner ? app.applicant.contactEmail : undefined,
        contactPhone: isAdmin || isOwner ? app.applicant.contactPhone : undefined,
      },
    });
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Failed to fetch application.' });
  }
});

// ==========================================
// 5. UPLOAD ADDITIONAL DOCUMENT
// ==========================================
router.post(
  '/applications/:id/documents',
  verifyToken,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!(await requireMongo(res))) return;
      if (!req.file) {
        return res.status(400).json({ detail: 'No file uploaded.' });
      }

      const app = await TreeCuttingApplication.findOne(findAppQuery(req.params.id));
      if (!app) return res.status(404).json({ detail: 'Application not found.' });

      const isOwner = String(req.user.id) === String(app.applicant.userId);
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ detail: 'Only the applicant or administrator can upload documents.' });
      }

      const { category = 'Other', title, isConfidential = false } = req.body || {};

      const doc = await ApplicationDocument.create({
        applicationId: app.applicationId,
        category,
        title: title || req.file.originalname,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        storagePath: req.file.path,
        isConfidential: isConfidential === 'true' || isConfidential === true,
        verificationStatus: 'Pending Review',
        uploadedBy: req.user.name,
      });

      app.documents.push(doc._id);
      await app.save();

      await logAuditEvent({
        applicationId: app.applicationId,
        actor: req.user,
        action: 'DOCUMENT_UPLOADED',
        description: `Uploaded document "${doc.title}" under category "${doc.category}".`,
        newState: { docId: doc._id, filename: doc.filename },
        req,
      });

      res.status(201).json(doc);
    } catch (err) {
      res.status(500).json({ detail: err.message || 'Failed to upload document.' });
    }
  }
);

// ==========================================
// 6. ADMIN VERIFY / REJECT DOCUMENT
// ==========================================
router.patch(
  '/applications/:id/documents/:docId/verify',
  verifyToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      if (!(await requireMongo(res))) return;
      const { status, notes = '' } = req.body || {};

      if (!['Pending Review', 'Verified', 'Rejected', 'Additional Information Required'].includes(status)) {
        return res.status(400).json({ detail: 'Invalid document verification status.' });
      }

      const doc = await ApplicationDocument.findById(req.params.docId);
      if (!doc) return res.status(404).json({ detail: 'Document not found.' });

      const prevStatus = doc.verificationStatus;
      doc.verificationStatus = status;
      doc.verifiedBy = req.user.name;
      doc.verifiedAt = new Date();
      doc.verificationNotes = notes;
      await doc.save();

      const app = await TreeCuttingApplication.findOne({ applicationId: doc.applicationId });

      await logAuditEvent({
        applicationId: doc.applicationId,
        actor: req.user,
        action: 'DOCUMENT_VERIFIED',
        description: `Document "${doc.title}" marked as ${status} by Administrator ${req.user.name}.`,
        previousState: { status: prevStatus },
        newState: { status, notes },
        req,
      });

      if (app) {
        await sendNotification({
          recipientUserId: app.applicant.userId,
          applicationId: app.applicationId,
          title: `Document ${status}: ${doc.title}`,
          message: `Your supporting document "${doc.title}" has been reviewed: ${status}. ${notes ? `Notes: ${notes}` : ''}`,
          type: 'DOCUMENT_UPDATE',
        });
      }

      res.json(doc);
    } catch (err) {
      res.status(500).json({ detail: err.message || 'Failed to verify document.' });
    }
  }
);

// ==========================================
// 7. SECURE DOCUMENT DOWNLOAD / PREVIEW
// ==========================================
router.get(
  '/applications/:id/documents/:docId/download',
  optionalToken,
  async (req, res) => {
    try {
      if (!(await requireMongo(res))) return;

      const doc = await ApplicationDocument.findById(req.params.docId);
      if (!doc) return res.status(404).json({ detail: 'Document not found.' });

      if (doc.isConfidential) {
        const app = await TreeCuttingApplication.findOne({ applicationId: doc.applicationId });
        const isOwner = req.user && app && String(req.user.id) === String(app.applicant.userId);
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
          return res.status(403).json({ detail: 'This document is confidential and restricted to authorized officials.' });
        }
      }

      const filePath = path.resolve(uploadsRoot, path.basename(doc.filename));
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ detail: 'File not found on storage disk.' });
      }

      res.download(filePath, doc.originalName);
    } catch (err) {
      res.status(500).json({ detail: err.message || 'File download failed.' });
    }
  }
);

// ==========================================
// 8. CAST OR UPDATE VOTE (PUBLIC & ADMIN SEPARATED)
// ==========================================
router.post('/applications/:id/vote', verifyToken, async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;

    const { voteType, justification = '' } = req.body || {};
    if (!['approve', 'reject', 'abstain'].includes(voteType)) {
      return res.status(400).json({ detail: 'Vote must be one of: approve, reject, abstain.' });
    }

    const app = await TreeCuttingApplication.findOne(findAppQuery(req.params.id));
    if (!app) return res.status(404).json({ detail: 'Application not found.' });

    // Validate that voting is open
    if (app.status !== 'Voting Open' && app.status !== 'Public Review') {
      return res.status(400).json({
        detail: `Voting is currently closed for this application (Status: ${app.status}).`,
      });
    }

    // Voter category is strictly determined by user role in token
    const voterRole = req.user.role === 'admin' ? 'admin' : 'public';
    const userId = String(req.user.id);

    // Look for existing vote (enforcing 1 active vote per user)
    const existing = await ApplicationVote.findOne({
      applicationId: app.applicationId,
      userId,
    });

    let savedVote;
    if (existing) {
      const prevType = existing.voteType;
      existing.voteType = voteType;
      existing.justification = justification;
      existing.voteModified = true;
      existing.previousVoteType = prevType;
      existing.voterRole = voterRole;
      savedVote = await existing.save();

      await logAuditEvent({
        applicationId: app.applicationId,
        actor: req.user,
        action: 'VOTE_MODIFIED',
        description: `${req.user.name} (${voterRole}) changed vote from ${prevType} to ${voteType}.`,
        previousState: { vote: prevType },
        newState: { vote: voteType, justification },
        req,
      });
    } else {
      savedVote = await ApplicationVote.create({
        applicationId: app.applicationId,
        userId,
        userName: req.user.name,
        userEmail: req.user.email,
        voterRole,
        voteType,
        justification,
        ipAddress: req.ip || '',
      });

      await logAuditEvent({
        applicationId: app.applicationId,
        actor: req.user,
        action: 'VOTE_CAST',
        description: `${req.user.name} (${voterRole}) cast vote: ${voteType.toUpperCase()}.`,
        newState: { vote: voteType, voterRole },
        req,
      });
    }

    res.json({
      message: `Your ${voterRole} vote of "${voteType}" has been securely recorded.`,
      vote: savedVote,
    });
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ detail: err.message || 'Voting operation failed.' });
  }
});

// ==========================================
// 9. GET APPLICATION VOTES & STATISTICS
// ==========================================
router.get('/applications/:id/votes', optionalToken, async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;

    const app = await TreeCuttingApplication.findOne(findAppQuery(req.params.id));
    if (!app) return res.status(404).json({ detail: 'Application not found.' });

    const votes = await ApplicationVote.find({ applicationId: app.applicationId }).lean();

    // Strictly separate public vs admin tallies
    const publicVotes = votes.filter((v) => v.voterRole === 'public');
    const adminVotes = votes.filter((v) => v.voterRole === 'admin');

    const publicStats = {
      total: publicVotes.length,
      approve: publicVotes.filter((v) => v.voteType === 'approve').length,
      reject: publicVotes.filter((v) => v.voteType === 'reject').length,
      abstain: publicVotes.filter((v) => v.voteType === 'abstain').length,
    };
    publicStats.approvePercent = publicStats.total > 0 ? Math.round((publicStats.approve / publicStats.total) * 100) : 0;
    publicStats.rejectPercent = publicStats.total > 0 ? Math.round((publicStats.reject / publicStats.total) * 100) : 0;
    publicStats.abstainPercent = publicStats.total > 0 ? Math.round((publicStats.abstain / publicStats.total) * 100) : 0;

    const adminStats = {
      total: adminVotes.length,
      approve: adminVotes.filter((v) => v.voteType === 'approve').length,
      reject: adminVotes.filter((v) => v.voteType === 'reject').length,
      abstain: adminVotes.filter((v) => v.voteType === 'abstain').length,
    };
    adminStats.approvePercent = adminStats.total > 0 ? Math.round((adminStats.approve / adminStats.total) * 100) : 0;
    adminStats.rejectPercent = adminStats.total > 0 ? Math.round((adminStats.reject / adminStats.total) * 100) : 0;
    adminStats.abstainPercent = adminStats.total > 0 ? Math.round((adminStats.abstain / adminStats.total) * 100) : 0;

    // Return non-confidential rationale list
    const rationaleList = votes
      .filter((v) => v.justification && v.justification.trim())
      .map((v) => ({
        id: v._id,
        role: v.voterRole,
        voteType: v.voteType,
        justification: v.justification,
        userName: v.userName,
        createdAt: v.createdAt,
      }));

    // Find current authenticated user's active vote if any
    let userVote = null;
    if (req.user) {
      userVote = votes.find((v) => String(v.userId) === String(req.user.id)) || null;
    }

    res.json({
      applicationId: app.applicationId,
      publicStats,
      adminStats,
      recentRationales: rationaleList.slice(-20),
      userVote,
      votingStatus: app.status === 'Voting Open' ? 'Active' : 'Closed',
    });
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Failed to fetch vote tallies.' });
  }
});

// ==========================================
// 10. ADMIN UPDATE APPLICATION STATUS
// ==========================================
router.patch(
  '/applications/:id/status',
  verifyToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      if (!(await requireMongo(res))) return;

      const { status, votingDays = 14 } = req.body || {};
      const validStatuses = [
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
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ detail: 'Invalid status transition.' });
      }

      const app = await TreeCuttingApplication.findOne(findAppQuery(req.params.id));
      if (!app) return res.status(404).json({ detail: 'Application not found.' });

      const prevStatus = app.status;
      app.status = status;

      // When opening voting, set start and closing dates
      if (status === 'Voting Open') {
        const start = new Date();
        const close = new Date(Date.now() + Number(votingDays) * 24 * 60 * 60 * 1000);
        app.votingConfig.isVotingOpen = true;
        app.votingConfig.votingStartDate = start;
        app.votingConfig.votingClosingDate = close;
      } else if (status === 'Voting Closed') {
        app.votingConfig.isVotingOpen = false;
        app.votingConfig.votingClosingDate = new Date();
      }

      await app.save();

      await logAuditEvent({
        applicationId: app.applicationId,
        actor: req.user,
        action: 'STATUS_CHANGED',
        description: `Lifecycle stage transitioned from "${prevStatus}" to "${status}" by Administrator ${req.user.name}.`,
        previousState: { status: prevStatus },
        newState: { status },
        req,
      });

      await sendNotification({
        recipientUserId: app.applicant.userId,
        applicationId: app.applicationId,
        title: `Status Updated: ${status}`,
        message: `Application #${app.applicationId} transitioned to ${status}.`,
        type: status === 'Voting Open' ? 'VOTING_OPEN' : 'DOCUMENT_UPDATE',
      });

      res.json(app);
    } catch (err) {
      res.status(500).json({ detail: err.message || 'Status transition failed.' });
    }
  }
);

// ==========================================
// 11. RECORD OFFICIAL ADMINISTRATIVE DECISION
// ==========================================
router.post(
  '/applications/:id/decision',
  verifyToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      if (!(await requireMongo(res))) return;

      const {
        decision,
        officialReasoning,
        evidenceConsidered = [],
        divergenceJustification = '',
        conditionsImposed = [],
        compensatoryRatio = 5,
        requiredSaplings,
        speciesRequirement = [],
        monitoringOfficer = 'Municipal Tree Officer',
      } = req.body || {};

      if (!['Approved', 'Rejected', 'Returned for Revision'].includes(decision)) {
        return res.status(400).json({ detail: 'Decision must be Approved, Rejected, or Returned for Revision.' });
      }

      if (!officialReasoning || officialReasoning.trim().length < 20) {
        return res.status(400).json({
          detail: 'A comprehensive legal reasoning (minimum 20 characters) is required for the administrative order.',
        });
      }

      const app = await TreeCuttingApplication.findOne(findAppQuery(req.params.id));
      if (!app) return res.status(404).json({ detail: 'Application not found.' });

      // Calculate vote snapshots
      const votes = await ApplicationVote.find({ applicationId: app.applicationId }).lean();
      const pubVotes = votes.filter((v) => v.voterRole === 'public');
      const admVotes = votes.filter((v) => v.voterRole === 'admin');

      const publicSnapshot = {
        total: pubVotes.length,
        approve: pubVotes.filter((v) => v.voteType === 'approve').length,
        reject: pubVotes.filter((v) => v.voteType === 'reject').length,
        abstain: pubVotes.filter((v) => v.voteType === 'abstain').length,
      };

      const adminSnapshot = {
        total: admVotes.length,
        approve: admVotes.filter((v) => v.voteType === 'approve').length,
        reject: admVotes.filter((v) => v.voteType === 'reject').length,
        abstain: admVotes.filter((v) => v.voteType === 'abstain').length,
      };

      // Check if administrative decision diverges from majority public vote
      const publicMajorityIsApprove = publicSnapshot.approve > publicSnapshot.reject;
      const publicMajorityIsReject = publicSnapshot.reject > publicSnapshot.approve;
      const isDivergent =
        (decision === 'Approved' && publicMajorityIsReject) ||
        (decision === 'Rejected' && publicMajorityIsApprove);

      if (isDivergent && (!divergenceJustification || divergenceJustification.trim().length < 15)) {
        return res.status(400).json({
          detail:
            'The official ruling diverges from the majority public vote. Under civic transparency rules, a detailed divergence justification is mandatory.',
        });
      }

      const calculatedSaplings =
        requiredSaplings ||
        (app.details.estimatedTreesAffected || 1) * (Number(compensatoryRatio) || 5);

      const decisionDoc = await ApplicationDecision.create({
        applicationId: app.applicationId,
        decision,
        officialReasoning: officialReasoning.trim(),
        evidenceConsidered,
        publicVoteSnapshot: publicSnapshot,
        adminVoteSnapshot: adminSnapshot,
        divergenceJustification: divergenceJustification.trim(),
        conditionsImposed,
        compensatoryPlantingMandate: {
          ratio: Number(compensatoryRatio) || 5,
          requiredSaplings: calculatedSaplings,
          speciesRequirement: speciesRequirement.length ? speciesRequirement : ['Neem', 'Peepal', 'Badam', 'Banyan'],
          maintenanceTermYears: 3,
          monitoringOfficer,
        },
        decidedBy: {
          userId: String(req.user.id),
          name: req.user.name,
          title: 'Tree Authority Officer',
        },
      });

      // Update application
      app.status = decision;
      app.decision = decisionDoc._id;
      app.votingConfig.isVotingOpen = false;
      await app.save();

      await logAuditEvent({
        applicationId: app.applicationId,
        actor: req.user,
        action: 'DECISION_ISSUED',
        description: `Official Regulatory Decision rendered: ${decision}. Compensatory replanting mandate: ${calculatedSaplings} saplings.`,
        newState: { decision, decidedBy: req.user.name },
        req,
      });

      await sendNotification({
        recipientUserId: app.applicant.userId,
        applicationId: app.applicationId,
        title: `Official Decision Issued: ${decision}`,
        message: `The Municipal Tree Authority has rendered a decision: ${decision}. Review the complete ruling and compensatory conditions.`,
        type: 'DECISION_ISSUED',
      });

      res.status(201).json(decisionDoc);
    } catch (err) {
      console.error('Decision error:', err);
      res.status(500).json({ detail: err.message || 'Failed to record decision.' });
    }
  }
);

// ==========================================
// 12. CIVIC FRAUD & VIOLATION REPORTING
// ==========================================
router.post('/applications/:id/report', verifyToken, async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;

    const { concernType, details, evidenceNotes = '' } = req.body || {};
    if (!concernType || !details) {
      return res.status(400).json({ detail: 'Concern type and factual details are required.' });
    }

    const app = await TreeCuttingApplication.findOne(findAppQuery(req.params.id));
    if (!app) return res.status(404).json({ detail: 'Application not found.' });

    const report = await ApplicationReport.create({
      applicationId: app.applicationId,
      reporter: {
        userId: String(req.user.id),
        name: req.user.name,
        email: req.user.email,
      },
      concernType,
      details,
      evidenceNotes,
      status: 'Submitted',
    });

    await logAuditEvent({
      applicationId: app.applicationId,
      actor: req.user,
      action: 'FRAUD_REPORTED',
      description: `Report submitted for suspected violation: "${concernType}".`,
      newState: { reportId: report._id },
      req,
    });

    await sendNotification({
      recipientUserId: 'ALL_ADMINS',
      applicationId: app.applicationId,
      title: `Violation Concern Lodged: ${concernType}`,
      message: `Civic report lodged on application #${app.applicationId} by ${req.user.name}.`,
      type: 'INVESTIGATION_ALERT',
    });

    res.status(201).json({
      message: 'Your report has been securely registered and flagged for administrative inquiry.',
      reportId: report._id,
    });
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Failed to file report.' });
  }
});

// ==========================================
// 13. ADMIN INVESTIGATION FINDINGS
// ==========================================
router.post(
  '/applications/:id/investigate',
  verifyToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      if (!(await requireMongo(res))) return;

      const { reportId, status, findings, officialReferralAuthority = '' } = req.body || {};
      if (!findings) {
        return res.status(400).json({ detail: 'Investigation findings are required.' });
      }

      const report = await ApplicationReport.findById(reportId);
      if (!report) return res.status(404).json({ detail: 'Report not found.' });

      report.status = status || 'Under Review';
      report.investigatorNotes = findings;
      report.investigatedBy = req.user.name;
      report.investigatedAt = new Date();
      report.officialReferralAuthority = officialReferralAuthority;
      await report.save();

      const app = await TreeCuttingApplication.findOne({ applicationId: report.applicationId });
      if (status === 'Substantiated' && app) {
        app.status = 'Under Investigation';
        await app.save();
      }

      await logAuditEvent({
        applicationId: report.applicationId,
        actor: req.user,
        action: 'INVESTIGATION_UPDATED',
        description: `Investigation inquiry findings updated by ${req.user.name}: Status ${status}.`,
        newState: { status, findings },
        req,
      });

      res.json(report);
    } catch (err) {
      res.status(500).json({ detail: err.message || 'Investigation update failed.' });
    }
  }
);

// ==========================================
// 14. GET AUDIT TRAIL
// ==========================================
router.get('/applications/:id/audit-trail', async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;

    const app = await TreeCuttingApplication.findOne(findAppQuery(req.params.id));
    if (!app) return res.status(404).json({ detail: 'Application not found.' });

    const logs = await ApplicationAuditLog.find({ applicationId: app.applicationId })
      .sort({ timestamp: -1 })
      .lean();

    res.json(logs);
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Failed to fetch audit trail.' });
  }
});

// ==========================================
// 15. GET IN-APP NOTIFICATIONS
// ==========================================
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;

    const userId = String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    const query = isAdmin
      ? { $or: [{ recipientUserId: userId }, { recipientUserId: 'ALL_ADMINS' }] }
      : { recipientUserId: userId };

    const notes = await ApplicationNotification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json(notes);
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Failed to fetch notifications.' });
  }
});

router.patch('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    if (!(await requireMongo(res))) return;

    await ApplicationNotification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ detail: err.message || 'Failed to mark as read.' });
  }
});

export default router;
