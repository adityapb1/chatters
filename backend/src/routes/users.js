const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticate = require('../middleware/auth');

router.get('/search', authenticate, async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { display_name: { contains: query } }
        ],
        NOT: { id: req.user.id }
      },
      select: { id: true, username: true, display_name: true, profile_picture: true },
      take: 10
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Set Nickname
router.post('/nickname', authenticate, async (req, res) => {
  const { contact_user_id, nickname } = req.body;
  if (!contact_user_id) return res.status(400).json({ error: 'Missing contact_user_id' });

  try {
    if (!nickname) {
      await prisma.nickname.deleteMany({
        where: { owner_user_id: req.user.id, contact_user_id }
      });
    } else {
      await prisma.nickname.upsert({
        where: { owner_user_id_contact_user_id: { owner_user_id: req.user.id, contact_user_id } },
        update: { nickname },
        create: { owner_user_id: req.user.id, contact_user_id, nickname }
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Profile
router.put('/profile', authenticate, async (req, res) => {
  const { display_name, email, profile_picture } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        display_name: display_name !== undefined ? display_name : undefined,
        email: email !== undefined ? email : undefined,
        profile_picture: profile_picture !== undefined ? profile_picture : undefined
      },
      select: {
        id: true, username: true, display_name: true, email: true, profile_picture: true,
        online_status_visible: true, read_receipts_enabled: true, typing_indicator_enabled: true
      }
    });
    res.json(updatedUser);
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Privacy
router.put('/privacy', authenticate, async (req, res) => {
  const { online_status_visible, read_receipts_enabled, typing_indicator_enabled } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        online_status_visible: online_status_visible !== undefined ? online_status_visible : undefined,
        read_receipts_enabled: read_receipts_enabled !== undefined ? read_receipts_enabled : undefined,
        typing_indicator_enabled: typing_indicator_enabled !== undefined ? typing_indicator_enabled : undefined
      },
      select: {
        id: true, username: true, display_name: true, email: true, profile_picture: true,
        online_status_visible: true, read_receipts_enabled: true, typing_indicator_enabled: true
      }
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Active Sessions
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { user_id: req.user.id },
      orderBy: { last_active: 'desc' }
    });
    res.json(sessions.map(s => ({ ...s, is_current: s.id === req.sessionId })));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Revoke Other Sessions
router.delete('/sessions', authenticate, async (req, res) => {
  try {
    await prisma.session.deleteMany({
      where: { 
        user_id: req.user.id,
        id: { not: req.sessionId }
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete Account
router.delete('/account', authenticate, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    res.clearCookie('token');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
