const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users);
  
  const msgs = await prisma.message.findMany();
  console.log("Messages:", msgs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
