const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticate = require('../middleware/auth');

// Search users
router.get('/search', authenticate, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const users = await prisma.user.findMany({
      where: {
        username: { contains: q },
        id: { not: req.user.id }
      },
      select: { id: true, username: true, profile_picture: true }
    });

    const nicknames = await prisma.nickname.findMany({
      where: { owner_user_id: req.user.id }
    });

    const nicknameMap = {};
    nicknames.forEach(n => nicknameMap[n.contact_user_id] = n.nickname);

    const result = users.map(u => ({
      ...u,
      display_name: nicknameMap[u.id] || u.username,
      actual_username: u.username
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Contacts logic moved to /conversations

// Set Nickname
router.post('/nickname', authenticate, async (req, res) => {
  const { contact_user_id, nickname } = req.body;
  if (!contact_user_id) return res.status(400).json({ error: 'contact_user_id required' });

  try {
    if (!nickname) {
      // Delete nickname
      await prisma.nickname.deleteMany({
        where: { owner_user_id: req.user.id, contact_user_id }
      });
      return res.json({ success: true, message: 'Nickname reset' });
    }

    const upserted = await prisma.nickname.upsert({
      where: {
        owner_user_id_contact_user_id: {
          owner_user_id: req.user.id,
          contact_user_id: contact_user_id
        }
      },
      update: { nickname },
      create: {
        owner_user_id: req.user.id,
        contact_user_id: contact_user_id,
        nickname
      }
    });

    res.json(upserted);
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
        id: true,
        username: true,
        display_name: true,
        email: true,
        profile_picture: true
      }
    });
    res.json(updatedUser);
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
