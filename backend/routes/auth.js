import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/connection.js';
import { settings } from '../config.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

function createToken(payload) {
  return jwt.sign(payload, settings.JWT_SECRET, { expiresIn: '7d' });
}

function sanitizeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    organization: row.organization || '',
    created_at: row.created_at,
    last_login: row.last_login,
  };
}

/**
 * Register a new user with role ('user' or 'admin')
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user', organization = '' } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ detail: 'Name, email, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ detail: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ detail: 'Password must be at least 6 characters long.' });
    }

    const validRole = role === 'admin' ? 'admin' : 'user';

    const existing = await db.get('SELECT id FROM users WHERE email = ? COLLATE NOCASE', [cleanEmail]);
    if (existing) {
      return res.status(409).json({ detail: 'An account with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (name, email, password, role, organization, last_login) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [name.trim(), cleanEmail, hashedPassword, validRole, organization.trim()]
    );

    const newUser = await db.get('SELECT * FROM users WHERE id = ?', [result.id]);
    const safeUser = sanitizeUser(newUser);
    const token = createToken({
      id: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
      organization: safeUser.organization,
    });

    return res.status(201).json({
      message: 'Account successfully registered.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ detail: 'Server error during account registration.' });
  }
});

/**
 * Login user and return JWT token with role information
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE email = ? COLLATE NOCASE', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ detail: 'Invalid email or password.' });
    }

    // Update last_login
    await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);
    const safeUser = sanitizeUser(updatedUser);

    const token = createToken({
      id: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
      organization: safeUser.organization,
    });

    return res.json({
      message: `Welcome back, ${safeUser.name}!`,
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ detail: 'Server error during sign-in.' });
  }
});

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ detail: 'User account not found.' });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to verify session profile.' });
  }
});

/**
 * Admin: list all registered platform users
 * GET /api/auth/users
 */
router.get('/users', verifyToken, requireRole(['admin']), async (_req, res) => {
  try {
    const users = await db.all(
      'SELECT id, name, email, role, organization, created_at, last_login FROM users ORDER BY id ASC'
    );
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to list users.' });
  }
});

/**
 * Admin: update a user's role (admin <-> user)
 * PATCH /api/auth/users/:id/role
 */
router.patch('/users/:id/role', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ detail: 'Role must be either "admin" or "user".' });
    }

    const targetUser = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found.' });
    }

    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    const updated = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);

    return res.json({
      message: `Updated role for ${updated.name} to ${role}.`,
      user: sanitizeUser(updated),
    });
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to update user role.' });
  }
});

/**
 * Admin: delete user account
 * DELETE /api/auth/users/:id
 */
router.delete('/users/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (targetId === Number(req.user.id)) {
      return res.status(400).json({ detail: 'You cannot delete your own active administrator account.' });
    }

    const targetUser = await db.get('SELECT * FROM users WHERE id = ?', [targetId]);
    if (!targetUser) {
      return res.status(404).json({ detail: 'User not found.' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [targetId]);
    return res.json({
      message: `Account for ${targetUser.name} deleted successfully.`,
      deletedId: targetId,
    });
  } catch (err) {
    return res.status(500).json({ detail: 'Failed to delete user.' });
  }
});

/**
 * Public quick accounts info (for demo & 1-click test credentials)
 * GET /api/auth/quick-accounts
 */
router.get('/quick-accounts', (_req, res) => {
  res.json({
    accounts: [
      {
        role: 'admin',
        email: 'admin@vanjeevan.org',
        label: 'Administrator',
        title: 'Dr. Ramesh Kulkarni',
        description: 'Full administrative access, tree record deletion & user management.',
      },
      {
        role: 'user',
        email: 'user@vanjeevan.org',
        label: 'Field Researcher',
        title: 'Pooja Sharma',
        description: 'Tree registration, carbon calculations, satellite GIS maps & logs.',
      },
    ],
  });
});

export default router;
