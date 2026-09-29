import express from 'express';
import crypto from 'crypto';
import db from '../services/local-db-service.js';
import { hashPassword, verifyPassword, signAccessToken } from '../utils/auth-token.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email e password obrigatórios' });
    }

    const result = await db.query('SELECT * FROM app_users WHERE email = $1 AND is_active = 1', [email]);
    const user = result.rows?.[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    const token = signAccessToken(user);
    return res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, role: user.role, displayName: user.display_name },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const countRes = await db.query('SELECT COUNT(*) AS c FROM app_users');
    const count = parseInt(countRes.rows?.[0]?.c || countRes.rows?.[0]?.count || '0', 10);
    const isBootstrap = count === 0;

    if (!isBootstrap) {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Apenas admin pode criar utilizadores' });
      }
    }

    const email = String(req.body.email || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = req.body.password || process.env.ADMIN_PASSWORD || '';
    const role = isBootstrap ? 'admin' : (req.body.role || 'commercial');
    const displayName = req.body.displayName || email;

    if (!email || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Email e password (min 8) obrigatórios' });
    }

    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO app_users (id, email, password_hash, role, display_name) VALUES ($1, $2, $3, $4, $5)`,
      [id, email, hashPassword(password), role, displayName]
    );
    return res.json({ success: true, id, email, role });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
