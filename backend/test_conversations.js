const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

async function main() {
  const user = await prisma.user.findFirst({ where: { username: 'pihu' } });
  const session = await prisma.session.findFirst({ where: { user_id: user.id } });
  
  const token = jwt.sign({ userId: user.id, sessionId: session ? session.id : 'fake' }, JWT_SECRET, { expiresIn: '7d' });
  
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: 5005,
    path: '/api/conversations',
    method: 'GET',
    headers: {
      'Cookie': `token=${token}`
    }
  };

  const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
    });
  });

  req.on('error', e => console.error(e));
  req.end();
}

main().catch(console.error);
