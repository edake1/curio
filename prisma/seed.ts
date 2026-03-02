import { PrismaClient } from '@prisma/client';
import { SEED_DILEMMAS, SEED_DELETE_CHOICES } from '../src/data/seed';
import { SEED_WISDOM } from '../src/data/wisdom';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed dilemmas
  const dilemmaCount = await prisma.dilemma.count();
  if (dilemmaCount === 0) {
    await prisma.dilemma.createMany({
      data: SEED_DILEMMAS.map((d) => ({
        ...d,
        isDaily: false,
      })),
    });
    console.log(`  ✓ Created ${SEED_DILEMMAS.length} dilemmas`);
  } else {
    console.log(`  · Dilemmas already seeded (${dilemmaCount} found)`);
  }

  // Seed delete choices
  const deleteCount = await prisma.deleteChoice.count();
  if (deleteCount === 0) {
    await prisma.deleteChoice.createMany({
      data: SEED_DELETE_CHOICES,
    });
    console.log(`  ✓ Created ${SEED_DELETE_CHOICES.length} delete choices`);
  } else {
    console.log(`  · Delete choices already seeded (${deleteCount} found)`);
  }

  // Ensure SiteStats singleton exists
  await prisma.siteStats.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', totalVisitors: 0 },
  });
  console.log('  ✓ SiteStats singleton ensured');

  // Seed wisdom sayings
  const wisdomCount = await prisma.wisdomSaying.count();
  if (wisdomCount === 0) {
    await prisma.wisdomSaying.createMany({
      data: SEED_WISDOM.map((s) => ({
        text: s.text,
        originalText: s.originalText ?? null,
        attribution: s.attribution,
        origin: s.origin,
        region: s.region,
        category: s.category,
      })),
    });
    console.log(`  ✓ Created ${SEED_WISDOM.length} wisdom sayings`);
  } else {
    console.log(`  · Wisdom sayings already seeded (${wisdomCount} found)`);
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
