import { PrismaClient } from '@prisma/client';
import { CONTRACT_TEMPLATES } from '@hushroom/shared-constants';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding contract templates...');

  for (const template of CONTRACT_TEMPLATES) {
    await prisma.contractTemplate.upsert({
      where: { name: template.name },
      update: {
        description: template.description,
        sessionType: template.sessionType as any,
        mode: template.mode as any,
        rules: template.rules,
      },
      create: {
        name: template.name,
        description: template.description,
        sessionType: template.sessionType as any,
        mode: template.mode as any,
        rules: template.rules,
      },
    });
  }

  console.log(`Seeded ${CONTRACT_TEMPLATES.length} contract templates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
