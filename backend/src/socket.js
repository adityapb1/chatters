const jwt = require('jsonwebtoken');

module.exports = (io, prisma) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

  io.use((socket, next) => {
    // Parse cookies from headers
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) return next(new Error('Authentication error'));
    
    // Simple cookie parser for "token=..."
    const tokenCookie = cookieHeader.split('; ').find(row => row.startsWith('token='));
    if (!tokenCookie) return next(new Error('Authentication error'));
    
    const token = tokenCookie.split('=')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.userId = decoded.userId;
      next();
    });
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    socket.join(userId);

    socket.broadcast.emit('user_status', { userId, status: 'online' });

    // Client explicitly joins conversations
    socket.on('join_conversation', async ({ conversation_id }) => {
      const isMember = await prisma.conversationMember.findUnique({
        where: { conversation_id_user_id: { conversation_id, user_id: userId } }
      });
      if (isMember) {
        socket.join(conversation_id);
      }
    });

    socket.on('send_message', async (data) => {
      const { conversation_id, content, type, file_data } = data;

      try {
        // Verify membership
        const isMember = await prisma.conversationMember.findUnique({
          where: { conversation_id_user_id: { conversation_id, user_id: userId } }
        });
        if (!isMember) return;

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
        
        // Find other members to update their status (Delivery)
        // Simplified: assuming they receive it if connected
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    socket.on('typing_start', ({ conversation_id }) => {
      socket.to(conversation_id).emit('typing_start', { conversation_id, sender_id: userId });
    });
    
    socket.on('typing_stop', ({ conversation_id }) => {
      socket.to(conversation_id).emit('typing_stop', { conversation_id, sender_id: userId });
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('user_status', { userId, status: 'offline' });
    });
  });
};
