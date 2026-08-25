const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticate = require('../middleware/auth');

// Middleware to check if user is in conversation
const verifyConversationMember = async (req, res, next) => {
  const conversationId = req.params.conversationId || req.body.conversationId;
  if (!conversationId) return res.status(400).json({ error: 'Conversation ID missing' });

  const isMember = await prisma.conversationMember.findUnique({
    where: {
      conversation_id_user_id: {
        conversation_id: conversationId,
        user_id: req.user.id
      }
    }
  });

  if (!isMember) {
    return res.status(403).json({ error: 'Forbidden: You are not part of this conversation' });
  }
  next();
};

// Get paginated messages
router.get('/:conversationId', authenticate, verifyConversationMember, async (req, res) => {
  const { conversationId } = req.params;
  const cursor = req.query.cursor; 
  const limit = 20;

  try {
    const messages = await prisma.message.findMany({
      where: { conversation_id: conversationId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { created_at: 'desc' },
    });

    // Reverse to send oldest to newest for UI
    const reversedMessages = messages.reverse();
    
    // Mark messages as read
    const unreadIds = reversedMessages
      .filter(m => m.sender_id !== req.user.id && m.status !== 'READ')
      .map(m => m.id);

    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { status: 'READ' }
      });
      // socket event will be emitted via separate mechanism if needed
    }

    res.json({
      messages: reversedMessages,
      nextCursor: messages.length === limit ? messages[0].id : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit message
router.patch('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  try {
    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.sender_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (msg.deleted_at) return res.status(400).json({ error: 'Cannot edit deleted message' });
    if (msg.type !== 'TEXT') return res.status(400).json({ error: 'Only text messages can be edited' });

    const updated = await prisma.message.update({
      where: { id },
      data: { content, edited_at: new Date() },

    });
    
    // Broadcast via socket
    const io = req.app.get('io');
    io.to(updated.conversation_id).emit('message_edited', updated);
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Soft-Delete message
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.sender_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const deleted = await prisma.message.update({
      where: { id },
      data: { 
        content: 'This message was deleted.', 
        deleted_at: new Date()
      }
    });

    // Broadcast via socket
    const io = req.app.get('io');
    io.to(deleted.conversation_id).emit('message_deleted', deleted);

    res.json(deleted);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
