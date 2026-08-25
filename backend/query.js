const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const nicknames = await prisma.nickname.findMany();
  console.log(JSON.stringify(nicknames, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
