/**
 * Bulk wisdom expansion script.
 * Systematically generates sayings for every region × category combination
 * using the /api/wisdom/generate endpoint.
 *
 * Usage: bun scripts/expand-wisdom.ts
 * Requires the dev server running on localhost:3000
 */

const BASE = 'http://localhost:3000/api/wisdom/generate';

const REGIONS = [
  'africa', 'east-asia', 'south-asia', 'southeast-asia',
  'middle-east', 'europe', 'americas', 'oceania',
];

const CATEGORIES = [
  'resilience', 'wisdom', 'love', 'community', 'action',
  'patience', 'truth', 'courage', 'character', 'knowledge',
  'nature', 'time', 'change', 'death', 'justice',
  'humility', 'unity', 'gratitude',
];

const BATCH_SIZE = 15; // sayings per request (max 20)
const DELAY_MS = 1500; // delay between requests to avoid rate limiting

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generate(region: string, category: string, count: number): Promise<number> {
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ region, category, count }),
    });
    const data = await res.json();
    return data.added ?? 0;
  } catch (err) {
    console.error(`  ✗ Error for ${region}/${category}:`, err);
    return 0;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Hikmah — Wisdom Expansion');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Regions: ${REGIONS.length}`);
  console.log(`  Categories: ${CATEGORIES.length}`);
  console.log(`  Combinations: ${REGIONS.length * CATEGORIES.length}`);
  console.log(`  Target: ~${REGIONS.length * CATEGORIES.length * BATCH_SIZE} new sayings`);
  console.log('═══════════════════════════════════════════════════\n');

  let totalAdded = 0;
  let totalRequests = 0;
  const startTime = Date.now();

  for (const region of REGIONS) {
    console.log(`\n🌍 ${region.toUpperCase()}`);
    let regionAdded = 0;

    for (const category of CATEGORIES) {
      const added = await generate(region, category, BATCH_SIZE);
      regionAdded += added;
      totalAdded += added;
      totalRequests++;

      const symbol = added > 0 ? '✓' : '·';
      console.log(`  ${symbol} ${category.padEnd(12)} +${added}`);

      await sleep(DELAY_MS);
    }

    console.log(`  ── ${region}: +${regionAdded} sayings`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Done in ${elapsed}s`);
  console.log(`  Requests: ${totalRequests}`);
  console.log(`  New sayings added: ${totalAdded}`);
  console.log('═══════════════════════════════════════════════════');
}

main();
