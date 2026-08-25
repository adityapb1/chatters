const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticate = require('../middleware/auth');

// Get all conversations for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all conversations the user is a part of
    const memberships = await prisma.conversationMember.findMany({
      where: { user_id: userId },
      include: {
        conversation: {
          include: {
            members: {
              where: { user_id: { not: userId } },
              include: { user: { select: { id: true, username: true, display_name: true, profile_picture: true } } }
            },
            messages: {
              orderBy: { created_at: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const nicknames = await prisma.nickname.findMany({
      where: { owner_user_id: userId }
    });
    const nicknameMap = {};
    nicknames.forEach(n => nicknameMap[n.contact_user_id] = n.nickname);

    const conversations = memberships.map(m => {
      const conv = m.conversation;
      const otherMember = conv.members[0]?.user;
      
      let display_name = otherMember?.display_name || otherMember?.username;
      if (otherMember && nicknameMap[otherMember.id]) {
        display_name = nicknameMap[otherMember.id];
      }

      return {
        id: conv.id,
        updated_at: conv.updated_at,
        contact: otherMember ? {
          ...otherMember,
          display_name,
          actual_username: otherMember.username
        } : null,
        lastMessage: conv.messages[0] || null,
        unreadCount: 0 // Can be computed via unread logic
      };
    }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or get a conversation with a specific user
router.post('/', authenticate, async (req, res) => {
  const { contact_id } = req.body;
  const userId = req.user.id;

  if (!contact_id) return res.status(400).json({ error: 'contact_id is required' });
  if (contact_id === userId) return res.status(400).json({ error: 'Cannot chat with yourself' });

  try {
    // Check if conversation already exists (where both are members)
    const existingMemberships = await prisma.conversationMember.findMany({
      where: { user_id: userId },
      select: { conversation_id: true }
    });

    const conversationIds = existingMemberships.map(m => m.conversation_id);

    const commonConversation = await prisma.conversationMember.findFirst({
      where: {
        user_id: contact_id,
        conversation_id: { in: conversationIds }
      }
    });

    if (commonConversation) {
      return res.json({ id: commonConversation.conversation_id });
    }

    // Create new conversation
    const newConv = await prisma.conversation.create({
      data: {
        members: {
          create: [
            { user_id: userId },
            { user_id: contact_id }
          ]
        }
      }
    });

    res.json({ id: newConv.id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
