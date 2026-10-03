// Seed script: upserts the 12 event types shown on events.html into the database.
// Same-slug events are UPDATED, not duplicated.
// Usage: node scripts/seed-events.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const EventType = require('../models/EventType');

const MONGO_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/event_management';

// Descriptions copied verbatim from the event cards in events.html.
const eventTypes = [
  {
    title: 'Conferences',
    slug: 'conference',
    category: 'conference',
    icon: '🎤',
    rating: 4.9,
    reviews: 214,
    startingPrice: 200000,
    description:
      'Multi-day corporate conferences with keynotes, breakout sessions, panels, and sponsor zones.'
  },
  {
    title: 'Seminars',
    slug: 'seminar',
    category: 'seminar',
    icon: '📚',
    rating: 4.8,
    reviews: 126,
    startingPrice: 75000,
    description:
      'Expert-led educational sessions designed to share knowledge across your teams and industry.'
  },
  {
    title: 'Workshops & Training',
    slug: 'workshop',
    category: 'workshop',
    icon: '🛠️',
    rating: 4.8,
    reviews: 98,
    startingPrice: 60000,
    description:
      'Hands-on skill-building workshops and corporate training programs for every department.'
  },
  {
    title: 'Webinars',
    slug: 'webinar',
    category: 'webinar',
    icon: '💻',
    rating: 4.9,
    reviews: 87,
    startingPrice: 35000,
    description:
      'Live online sessions and virtual classrooms with Q&A, polls, and on-demand replays.'
  },
  {
    title: 'Product Launches',
    slug: 'launch',
    category: 'launch',
    icon: '🚀',
    rating: 5.0,
    reviews: 72,
    startingPrice: 350000,
    description:
      'High-impact launch events to unveil new products to the press, partners, and customers.'
  },
  {
    title: 'Trade Shows & Exhibitions',
    slug: 'exhibition',
    category: 'exhibition',
    icon: '🎪',
    rating: 4.7,
    reviews: 54,
    startingPrice: 250000,
    description:
      'Exhibition booths, live demos, and expo floor management that put your brand in the spotlight.'
  },
  {
    title: 'Networking Events',
    slug: 'networking',
    category: 'networking',
    icon: '🤝',
    rating: 4.8,
    reviews: 66,
    startingPrice: 50000,
    description:
      'Business mixers and networking sessions that turn contacts into lasting partnerships.'
  },
  {
    title: 'Team Meetups',
    slug: 'meetup',
    category: 'meetup',
    icon: '☕',
    rating: 4.9,
    reviews: 45,
    startingPrice: 40000,
    description:
      'Casual team gatherings and community meetups to keep people connected and engaged.'
  },
  {
    title: 'Galas & Award Nights',
    slug: 'gala',
    category: 'gala',
    icon: '🏆',
    rating: 5.0,
    reviews: 58,
    startingPrice: 300000,
    description:
      'Formal dinners, award ceremonies, and milestone celebrations your teams will remember.'
  },
  {
    title: 'Board Meetings & Retreats',
    slug: 'retreat',
    category: 'retreat',
    icon: '📊',
    rating: 4.9,
    reviews: 39,
    startingPrice: 125000,
    description:
      'Confidential board meetings and executive strategy retreats at premium venues.'
  },
  {
    title: 'Charity & CSR Events',
    slug: 'charity',
    category: 'charity',
    icon: '❤️',
    rating: 4.8,
    reviews: 31,
    startingPrice: 100000,
    description:
      'Fundraisers, volunteer days, and community programs that showcase your company\'s values.'
  },
  {
    title: 'Sports & Team Building',
    slug: 'sports',
    category: 'sports',
    icon: '🏅',
    rating: 4.9,
    reviews: 49,
    startingPrice: 80000,
    description:
      'Corporate sports days and team-building activities that strengthen collaboration.'
  }
];

async function seedEvents() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected');

  let created = 0;
  let updated = 0;

  for (let i = 0; i < eventTypes.length; i++) {
    const data = {
      ...eventTypes[i],
      sortOrder: i + 1, // sortOrder = 1..12
      active: true
    };

    try {
      const existing = await EventType.findOne({ slug: data.slug });

      const doc = await EventType.findOneAndUpdate(
        { slug: data.slug },
        data,
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      if (existing) {
        updated++;
        console.log(
          `  [${i + 1}/${eventTypes.length}] updated  ${doc.title} (slug: ${doc.slug})`
        );
      } else {
        created++;
        console.log(
          `  [${i + 1}/${eventTypes.length}] created  ${doc.title} (slug: ${doc.slug})`
        );
      }
    } catch (err) {
      console.error(`  [${i + 1}/${eventTypes.length}] FAILED for slug "${data.slug}":`, err.message);
      throw err;
    }
  }

  const total = await EventType.countDocuments();
  console.log(
    `\n✓ Seed complete: ${created} created, ${updated} updated, ${total} total event type(s) in database.`
  );
}

seedEvents()
  .then(async () => {
    await mongoose.disconnect();
    console.log('✓ Disconnected. Done.');
  })
  .catch(async (err) => {
    console.error('✗ Seeding failed:', err.message);
    try {
      await mongoose.disconnect();
    } catch (disconnectErr) {
      // ignore disconnect errors on failure path
    }
    process.exit(1);
  });
