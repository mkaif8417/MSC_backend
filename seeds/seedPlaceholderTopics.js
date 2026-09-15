const { connectDB, disconnectDB } = require('../src/config/db');
const topicDao = require('../src/daos/topic.dao');

/**
 * PLACEHOLDER topic seeder — chapter names are real (NCERT), but page ranges
 * are arbitrary guesses, NOT from your actual textbooks. Replace via the
 * same idempotent pattern once you have the real book indexes (as done for
 * English/8th in seedEnglishTopics8th.js, which this file does NOT touch).
 */

// [startPage, endPage, topicName]
const TOPIC_DATA = {
  Maths: {
    '8th': [
      [1, 8, 'Rational Numbers'],
      [9, 16, 'Linear Equations in One Variable'],
      [17, 24, 'Understanding Quadrilaterals'],
      [25, 32, 'Practical Geometry'],
      [33, 40, 'Data Handling'],
      [41, 48, 'Squares and Square Roots'],
      [49, 56, 'Cubes and Cube Roots'],
      [57, 64, 'Comparing Quantities'],
      [65, 72, 'Algebraic Expressions and Identities'],
      [73, 80, 'Visualising Solid Shapes'],
      [81, 88, 'Mensuration'],
      [89, 96, 'Exponents and Powers'],
      [97, 104, 'Direct and Inverse Proportions'],
      [105, 112, 'Factorisation'],
      [113, 120, 'Introduction to Graphs'],
      [121, 128, 'Playing with Numbers']
    ],
    '9th': [
      [1, 10, 'Number Systems'],
      [11, 20, 'Polynomials'],
      [21, 30, 'Coordinate Geometry'],
      [31, 40, 'Linear Equations in Two Variables'],
      [41, 50, "Introduction to Euclid's Geometry"],
      [51, 60, 'Lines and Angles'],
      [61, 70, 'Triangles'],
      [71, 80, 'Quadrilaterals'],
      [81, 90, 'Areas of Parallelograms and Triangles'],
      [91, 100, 'Circles'],
      [101, 110, 'Constructions'],
      [111, 120, "Heron's Formula"],
      [121, 130, 'Surface Areas and Volumes'],
      [131, 140, 'Statistics'],
      [141, 150, 'Probability']
    ],
    '10th': [
      [1, 10, 'Real Numbers'],
      [11, 20, 'Polynomials'],
      [21, 30, 'Pair of Linear Equations in Two Variables'],
      [31, 40, 'Quadratic Equations'],
      [41, 50, 'Arithmetic Progressions'],
      [51, 60, 'Triangles'],
      [61, 70, 'Coordinate Geometry'],
      [71, 80, 'Introduction to Trigonometry'],
      [81, 90, 'Some Applications of Trigonometry'],
      [91, 100, 'Circles'],
      [101, 110, 'Areas Related to Circles'],
      [111, 120, 'Surface Areas and Volumes'],
      [121, 130, 'Statistics'],
      [131, 140, 'Probability']
    ]
  },
  English: {
    // NOTE: English/8th is intentionally NOT included here — already seeded
    // for real in seedEnglishTopics8th.js and must not be touched.
    '9th': [
      [1, 8, 'The Fun They Had'],
      [9, 16, 'The Sound of Music'],
      [17, 24, 'The Little Girl'],
      [25, 32, 'A Truly Beautiful Mind'],
      [33, 40, 'The Snake and the Mirror'],
      [41, 48, 'My Childhood'],
      [49, 56, 'Packing'],
      [57, 64, 'Reach for the Top'],
      [65, 72, 'The Bond of Love'],
      [73, 80, 'Kathmandu'],
      [81, 88, 'If I Were You']
    ],
    '10th': [
      [1, 8, 'A Letter to God'],
      [9, 16, 'Nelson Mandela: Long Walk to Freedom'],
      [17, 24, 'Two Stories about Flying'],
      [25, 32, 'From the Diary of Anne Frank'],
      [33, 40, 'The Hundred Dresses'],
      [41, 48, 'Glimpses of India'],
      [49, 56, 'Mijbil the Otter'],
      [57, 64, 'Madam Rides the Bus'],
      [65, 72, 'The Sermon at Benares'],
      [73, 80, 'The Proposal']
    ]
  }
};

async function seedPlaceholderTopics(shouldDisconnect = (require.main === module)) {
  console.log('[Seeder] Starting Placeholder Topic Seeding (Maths 8/9/10th, English 9/10th)...');

  try {
    await connectDB();

    let createdCount = 0;
    let skippedCount = 0;

    for (const [subject, classMap] of Object.entries(TOPIC_DATA)) {
      for (const [studentClass, ranges] of Object.entries(classMap)) {
        for (const [start, end, topic] of ranges) {
          for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
            const existing = await topicDao.findOneLookup({ subject, class: studentClass, pageNumber });

            if (existing) {
              skippedCount += 1;
              continue;
            }

            await topicDao.create({ subject, class: studentClass, pageNumber, topic, isActive: true });
            createdCount += 1;
          }
        }
      }
    }

    console.log(`[Seeder] Placeholder Topic Seeding complete! Created: ${createdCount}, Skipped (already existed): ${skippedCount}`);
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

if (require.main === module) {
  seedPlaceholderTopics(true);
}

module.exports = seedPlaceholderTopics;