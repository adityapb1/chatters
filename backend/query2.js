const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = "9dfa80d8-956e-47c8-9d93-902ad5105c0d"; // pihu
  const memberships = await prisma.conversationMember.findMany({
    where: { user_id: userId },
    include: {
      conversation: {
        include: {
          members: {
            where: { user_id: { not: userId } },
            include: { user: { select: { id: true, username: true, display_name: true, profile_picture: true } } }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(memberships, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
