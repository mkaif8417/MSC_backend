const { connectDB, disconnectDB } = require('../src/config/db');
const topicDao = require('../src/daos/topic.dao');

const SUBJECT = 'English';
const CLASS = '8th';

// [startPage, endPage, topicName] — from the Shaheen Institutions English book index
const INDEX_RANGES = [
  [1, 1, 'Letters'],
  [2, 5, 'Reading Skill (1): Auxiliary, Preposition, Conjunction'],
  [6, 12, 'Reading Skill (2): Small Stories'],
  [13, 21, 'Noun Numbers'],
  [22, 24, 'Genders'],
  [25, 52, 'Parts of Speech'],
  [53, 55, 'Sentence'],
  [56, 57, 'Article'],
  [58, 66, 'Auxiliaries'],
  [67, 81, 'Tenses'],
  [82, 83, 'Question Tag'],
  [84, 88, 'Degrees of Comparison'],
  [89, 91, 'W/H & Yes/No Type Questions'],
  [92, 103, 'Vocabulary'],
  [104, 109, 'Active Voice & Passive Voice'],
  [110, 111, 'One Word Substitute'],
  [112, 117, 'Punctuation']
];

/**
 * English Topic Seeder (8th class)
 * - Expands each index row's page range into individual Topic documents
 * - Idempotent: skips any {subject, class, pageNumber} that already exists
 * @param {Boolean} shouldDisconnect Whether to close database connection upon completion
 */
async function seedEnglishTopics8th(shouldDisconnect = (require.main === module)) {
  console.log('[Seeder] Starting English 8th Topic Seeding...');

  try {
    await connectDB();

    let createdCount = 0;
    let skippedCount = 0;

    for (const [start, end, topic] of INDEX_RANGES) {
      for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
        const existing = await topicDao.findOneLookup({
          subject: SUBJECT,
          class: CLASS,
          pageNumber
        });

        if (existing) {
          skippedCount += 1;
          continue;
        }

        await topicDao.create({ subject: SUBJECT, class: CLASS, pageNumber, topic, isActive: true });
        createdCount += 1;
      }
    }

    console.log(`[Seeder] English 8th Topic Seeding complete! Created: ${createdCount}, Skipped (already existed): ${skippedCount}`);
  } catch (error) {
    console.error('[Seeder] Error during seeding execution:', error.message);
    if (shouldDisconnect) process.exitCode = 1;
    throw error;
  } finally {
    if (shouldDisconnect) {
      await disconnectDB();
    }
  }
}

// Execute if run directly via CLI (node seeds/seedEnglishTopics8th.js)
if (require.main === module) {
  seedEnglishTopics8th(true);
}

module.exports = seedEnglishTopics8th;