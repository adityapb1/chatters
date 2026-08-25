const jwt = require('jsonwebtoken');

module.exports = (io, prisma) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

  io.use((socket, next) => {
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) return next(new Error('Authentication error'));
    
    const tokenCookie = cookieHeader.split('; ').find(row => row.startsWith('token='));
    if (!tokenCookie) return next(new Error('Authentication error'));
    
    const token = tokenCookie.split('=')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.userId = decoded.userId;
      socket.sessionId = decoded.sessionId;
      next();
    });
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    socket.join(userId);

    // Fetch user privacy settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { online_status_visible: true, typing_indicator_enabled: true }
    });

    if (user && user.online_status_visible) {
      socket.broadcast.emit('user_status', { userId, status: 'online' });
    }

    socket.on('join_conversation', async ({ conversation_id }) => {
      const isMember = await prisma.conversationMember.findUnique({
        where: { conversation_id_user_id: { conversation_id, user_id: userId } }
      });
      if (isMember) {
        socket.join(conversation_id);
      }
    });

    socket.on('send_message', async (data) => {
      const { conversation_id, content, type } = data;

      try {
        const isMember = await prisma.conversationMember.findUnique({
          where: { conversation_id_user_id: { conversation_id, user_id: userId } }
        });
        if (!isMember) return;

        // Ensure the conversation is un-hidden for the sender and recipient
        await prisma.conversationMember.updateMany({
          where: { conversation_id: conversation_id },
          data: { hidden_at: null }
        });

        const messageData = {
          conversation_id,
          sender_id: userId,
          content,
          type: type || 'TEXT',
          status: 'SENT'
        };

        const message = await prisma.message.create({
          data: messageData
        });

        io.to(conversation_id).emit('receive_message', message);
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    socket.on('typing_start', async ({ conversation_id }) => {
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { typing_indicator_enabled: true } });
      if (currentUser?.typing_indicator_enabled) {
        socket.to(conversation_id).emit('typing_start', { conversation_id, sender_id: userId });
      }
    });
    
    socket.on('typing_stop', async ({ conversation_id }) => {
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { typing_indicator_enabled: true } });
      if (currentUser?.typing_indicator_enabled) {
        socket.to(conversation_id).emit('typing_stop', { conversation_id, sender_id: userId });
      }
    });

    socket.on('disconnect', async () => {
      if (user && user.online_status_visible) {
        socket.broadcast.emit('user_status', { userId, status: 'offline' });
      }
    });
  });
};
