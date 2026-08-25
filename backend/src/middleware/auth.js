const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

module.exports = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if session exists (for revocation)
    if (decoded.sessionId) {
      const session = await prisma.session.findUnique({ where: { id: decoded.sessionId } });
      if (!session) {
        return res.status(401).json({ error: 'Session expired or revoked' });
      }
      
      // Update last active
      await prisma.session.update({
        where: { id: decoded.sessionId },
        data: { last_active: new Date() }
      }).catch(() => {}); // Ignore errors on update
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        display_name: true,
        email: true,
        profile_picture: true,
        online_status_visible: true,
        read_receipts_enabled: true,
        typing_indicator_enabled: true
      }
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
