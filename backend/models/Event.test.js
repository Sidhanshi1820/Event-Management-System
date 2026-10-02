const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Event = require('./Event');

let mongoServer;

// Setup: Connect to in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup: Disconnect and stop MongoDB after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear database between tests
afterEach(async () => {
  await Event.deleteMany({});
});

describe('Event Model - Basic Validation', () => {
  const validEventData = {
    title: 'Tech Conference 2024',
    description: 'A comprehensive technology conference covering the latest trends in software development and innovation.',
    category: 'conference',
    tags: ['technology', 'software', 'innovation'],
    organizerId: new mongoose.Types.ObjectId(),
    organizerName: 'John Doe',
    organizerEmail: 'john@example.com',
    dates: {
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000), // 32 days from now
      timezone: 'America/New_York'
    },
    location: {
      locationType: 'physical',
      venue: {
        name: 'Convention Center',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      }
    },
    capacity: 500,
    registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    registrationEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000), // 29 days from now
    status: 'draft',
    visibility: 'public'
  };

  test('should create a valid event with all required fields', async () => {
    const event = new Event(validEventData);
    const savedEvent = await event.save();
    
    expect(savedEvent._id).toBeDefined();
    expect(savedEvent.title).toBe(validEventData.title);
    expect(savedEvent.description).toBe(validEventData.description);
    expect(savedEvent.category).toBe(validEventData.category);
    expect(savedEvent.status).toBe('draft');
    expect(savedEvent.visibility).toBe('public');
    expect(savedEvent.featured).toBe(false);
    expect(savedEvent.createdAt).toBeDefined();
    expect(savedEvent.updatedAt).toBeDefined();
  });

  test('should fail validation when title is missing', async () => {
    const eventData = { ...validEventData };
    delete eventData.title;
    
    const event = new Event(eventData);
    await expect(event.save()).rejects.toThrow();
  });

  test('should fail validation when title is too short', async () => {
    const event = new Event({ ...validEventData, title: 'Test' });
    await expect(event.save()).rejects.toThrow();
  });

  test('should fail validation when title is too long', async () => {
    const event = new Event({ ...validEventData, title: 'A'.repeat(201) });
    await expect(event.save()).rejects.toThrow();
  });

  test('should fail validation when description is missing', async () => {
    const eventData = { ...validEventData };
    delete eventData.description;
    
    const event = new Event(eventData);
    await expect(event.save()).rejects.toThrow();
  });

  test('should fail validation when description is too short', async () => {
    const event = new Event({ ...validEventData, description: 'Short desc' });
    await expect(event.save()).rejects.toThrow();
  });

  test('should fail validation when category is invalid', async () => {
    const event = new Event({ ...validEventData, category: 'invalid-category' });
    await expect(event.save()).rejects.toThrow();
  });

  test('should accept valid categories', async () => {
    const validCategories = [
      'conference', 'workshop', 'seminar', 'webinar', 'meetup',
      'networking', 'training', 'exhibition', 'festival', 'concert',
      'sports', 'charity', 'other'
    ];

    for (const category of validCategories) {
      const event = new Event({ ...validEventData, category });
      const savedEvent = await event.save();
      expect(savedEvent.category).toBe(category);
      await Event.deleteMany({});
    }
  });

  test('should fail validation when more than 10 tags', async () => {
    const event = new Event({
      ...validEventData,
      tags: Array(11).fill('tag')
    });
    await expect(event.save()).rejects.toThrow();
  });

  test('should fail validation when organizer email is invalid', async () => {
    const event = new Event({ ...validEventData, organizerEmail: 'invalid-email' });
    await expect(event.save()).rejects.toThrow();
  });
});

describe('Event Model - Date Validation', () => {
  const baseEventData = {
    title: 'Tech Conference 2024',
    description: 'A comprehensive technology conference covering the latest trends in software development.',
    category: 'conference',
    organizerId: new mongoose.Types.ObjectId(),
    organizerName: 'John Doe',
    organizerEmail: 'john@example.com',
    location: {
      locationType: 'physical',
      venue: {
        name: 'Convention Center',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      }
    },
    capacity: 500,
    status: 'draft',
    visibility: 'public'
  };

  test('should fail when end date is before start date', async () => {
    const event = new Event({
      ...baseEventData,
      dates: {
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        timezone: 'UTC'
      },
      registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
    });
    
    await expect(event.save()).rejects.toThrow();
  });

  test('should fail when registration end date is after event start date', async () => {
    const startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const event = new Event({
      ...baseEventData,
      dates: {
        startDate: startDate,
        endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        timezone: 'UTC'
      },
      registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // 1 day after start
    });
    
    await expect(event.save()).rejects.toThrow();
  });

  test('should accept registration end date equal to event start date', async () => {
    const startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const event = new Event({
      ...baseEventData,
      dates: {
        startDate: startDate,
        endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        timezone: 'UTC'
      },
      registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      registrationEndDate: startDate
    });
    
    const savedEvent = await event.save();
    expect(savedEvent).toBeDefined();
  });
});

describe('Event Model - Location Validation', () => {
  const baseEventData = {
    title: 'Tech Conference 2024',
    description: 'A comprehensive technology conference covering the latest trends in software development.',
    category: 'conference',
    organizerId: new mongoose.Types.ObjectId(),
    organizerName: 'John Doe',
    organizerEmail: 'john@example.com',
    dates: {
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      timezone: 'UTC'
    },
    capacity: 500,
    registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    registrationEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
    status: 'draft',
    visibility: 'public'
  };

  test('should create physical event with complete venue information', async () => {
    const event = new Event({
      ...baseEventData,
      location: {
        locationType: 'physical',
        venue: {
          name: 'Convention Center',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      }
    });
    
    const savedEvent = await event.save();
    expect(savedEvent.location.locationType).toBe('physical');
    expect(savedEvent.location.venue.name).toBe('Convention Center');
  });

  test('should create virtual event with meeting link', async () => {
    const event = new Event({
      ...baseEventData,
      location: {
        locationType: 'virtual',
        virtualLink: 'https://zoom.us/meeting/123456'
      }
    });
    
    const savedEvent = await event.save();
    expect(savedEvent.location.locationType).toBe('virtual');
    expect(savedEvent.location.virtualLink).toBe('https://zoom.us/meeting/123456');
  });

  test('should create hybrid event with both venue and virtual link', async () => {
    const event = new Event({
      ...baseEventData,
      location: {
        locationType: 'hybrid',
        venue: {
          name: 'Convention Center',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        },
        virtualLink: 'https://zoom.us/meeting/123456'
      }
    });
    
    const savedEvent = await event.save();
    expect(savedEvent.location.locationType).toBe('hybrid');
    expect(savedEvent.location.venue.name).toBe('Convention Center');
    expect(savedEvent.location.virtualLink).toBe('https://zoom.us/meeting/123456');
  });

  test('should fail when virtual event missing virtual link', async () => {
    const event = new Event({
      ...baseEventData,
      location: {
        locationType: 'virtual'
      }
    });
    
    await expect(event.save()).rejects.toThrow();
  });

  test('should fail when virtual link is invalid URL', async () => {
    const event = new Event({
      ...baseEventData,
      location: {
        locationType: 'virtual',
        virtualLink: 'not-a-valid-url'
      }
    });
    
    await expect(event.save()).rejects.toThrow();
  });

  test('should validate coordinate ranges', async () => {
    const event = new Event({
      ...baseEventData,
      location: {
        locationType: 'physical',
        venue: {
          name: 'Convention Center',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001',
          coordinates: {
            latitude: 91, // Invalid: > 90
            longitude: -74.0060
          }
        }
      }
    });
    
    await expect(event.save()).rejects.toThrow();
  });
});

describe('Event Model - Capacity and Status', () => {
  const baseEventData = {
    title: 'Tech Conference 2024',
    description: 'A comprehensive technology conference covering the latest trends in software development.',
    category: 'conference',
    organizerId: new mongoose.Types.ObjectId(),
    organizerName: 'John Doe',
    organizerEmail: 'john@example.com',
    dates: {
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      timezone: 'UTC'
    },
    location: {
      locationType: 'virtual',
      virtualLink: 'https://zoom.us/meeting/123456'
    },
    registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    registrationEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
  };

  test('should fail when capacity is zero or negative', async () => {
    const event = new Event({ ...baseEventData, capacity: 0 });
    await expect(event.save()).rejects.toThrow();
  });

  test('should fail when capacity is not an integer', async () => {
    const event = new Event({ ...baseEventData, capacity: 50.5 });
    await expect(event.save()).rejects.toThrow();
  });

  test('should accept valid status values', async () => {
    const validStatuses = [
      { status: 'draft' },
      { status: 'published' },
      { status: 'cancelled', cancellationReason: 'Test cancellation' },
      { status: 'completed' }
    ];
    
    for (const statusData of validStatuses) {
      const event = new Event({ ...baseEventData, capacity: 100, ...statusData });
      const savedEvent = await event.save();
      expect(savedEvent.status).toBe(statusData.status);
      await Event.deleteMany({});
    }
  });

  test('should accept valid visibility values', async () => {
    const validVisibilities = ['public', 'private', 'unlisted'];
    
    for (const visibility of validVisibilities) {
      const event = new Event({ ...baseEventData, capacity: 100, visibility });
      const savedEvent = await event.save();
      expect(savedEvent.visibility).toBe(visibility);
      await Event.deleteMany({});
    }
  });

  test('should default featured to false', async () => {
    const event = new Event({ ...baseEventData, capacity: 100 });
    const savedEvent = await event.save();
    expect(savedEvent.featured).toBe(false);
  });

  test('should allow setting featured to true', async () => {
    const event = new Event({ ...baseEventData, capacity: 100, featured: true });
    const savedEvent = await event.save();
    expect(savedEvent.featured).toBe(true);
  });
});

describe('Event Model - Media Validation', () => {
  const baseEventData = {
    title: 'Tech Conference 2024',
    description: 'A comprehensive technology conference covering the latest trends in software development.',
    category: 'conference',
    organizerId: new mongoose.Types.ObjectId(),
    organizerName: 'John Doe',
    organizerEmail: 'john@example.com',
    dates: {
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      timezone: 'UTC'
    },
    location: {
      locationType: 'virtual',
      virtualLink: 'https://zoom.us/meeting/123456'
    },
    capacity: 100,
    registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    registrationEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
  };

  test('should accept valid cover image URL', async () => {
    const event = new Event({
      ...baseEventData,
      media: {
        coverImage: 'https://example.com/image.jpg'
      }
    });
    
    const savedEvent = await event.save();
    expect(savedEvent.media.coverImage).toBe('https://example.com/image.jpg');
  });

  test('should accept multiple image formats', async () => {
    const validFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    for (const format of validFormats) {
      const event = new Event({
        ...baseEventData,
        media: {
          coverImage: `https://example.com/image${format}`
        }
      });
      const savedEvent = await event.save();
      expect(savedEvent.media.coverImage).toContain(format);
      await Event.deleteMany({});
    }
  });

  test('should fail when cover image is not a valid image URL', async () => {
    const event = new Event({
      ...baseEventData,
      media: {
        coverImage: 'https://example.com/document.pdf'
      }
    });
    
    await expect(event.save()).rejects.toThrow();
  });

  test('should accept multiple images', async () => {
    const event = new Event({
      ...baseEventData,
      media: {
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.png',
          'https://example.com/image3.gif'
        ]
      }
    });
    
    const savedEvent = await event.save();
    expect(savedEvent.media.images).toHaveLength(3);
  });

  test('should fail when more than 10 images', async () => {
    const event = new Event({
      ...baseEventData,
      media: {
        images: Array(11).fill('https://example.com/image.jpg')
      }
    });
    
    await expect(event.save()).rejects.toThrow();
  });
});

describe('Event Model - Lifecycle Methods', () => {
  const baseEventData = {
    title: 'Tech Conference 2024',
    description: 'A comprehensive technology conference covering the latest trends in software development.',
    category: 'conference',
    organizerId: new mongoose.Types.ObjectId(),
    organizerName: 'John Doe',
    organizerEmail: 'john@example.com',
    dates: {
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      timezone: 'UTC'
    },
    location: {
      locationType: 'virtual',
      virtualLink: 'https://zoom.us/meeting/123456'
    },
    capacity: 100,
    registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    registrationEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
    status: 'draft'
  };

  test('should publish a draft event', async () => {
    const event = new Event(baseEventData);
    await event.save();
    
    event.publish();
    await event.save();
    
    expect(event.status).toBe('published');
    expect(event.publishedAt).toBeDefined();
  });

  test('should not publish an already published event', async () => {
    const event = new Event({ ...baseEventData, status: 'published' });
    await event.save();
    
    expect(() => event.publish()).toThrow();
  });

  test('should cancel an event with reason', async () => {
    const event = new Event({ ...baseEventData, status: 'published' });
    await event.save();
    
    event.cancel('Venue unavailable');
    await event.save();
    
    expect(event.status).toBe('cancelled');
    expect(event.cancelledAt).toBeDefined();
    expect(event.cancellationReason).toBe('Venue unavailable');
  });

  test('should not cancel without reason', async () => {
    const event = new Event({ ...baseEventData, status: 'published' });
    await event.save();
    
    expect(() => event.cancel()).toThrow();
  });

  test('should not cancel an already cancelled event', async () => {
    const event = new Event({ ...baseEventData, status: 'cancelled', cancellationReason: 'Test' });
    await event.save();
    
    expect(() => event.cancel('Another reason')).toThrow();
  });

  test('should complete a published event after end date', async () => {
    const event = new Event({
      ...baseEventData,
      status: 'draft', // Start as draft to avoid validation
      dates: {
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        timezone: 'UTC'
      },
      registrationStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });
    await event.save();
    
    // Manually set to published to bypass validation
    event.status = 'published';
    await event.save({ validateBeforeSave: false });
    
    event.complete();
    await event.save({ validateBeforeSave: false });
    
    expect(event.status).toBe('completed');
  });

  test('should not complete event before end date', async () => {
    const event = new Event({ ...baseEventData, status: 'published' });
    await event.save();
    
    expect(() => event.complete()).toThrow();
  });
});

describe('Event Model - Virtual Properties', () => {
  const baseEventData = {
    title: 'Tech Conference 2024',
    description: 'A comprehensive technology conference covering the latest trends in software development.',
    category: 'conference',
    organizerId: new mongoose.Types.ObjectId(),
    organizerName: 'John Doe',
    organizerEmail: 'john@example.com',
    location: {
      locationType: 'virtual',
      virtualLink: 'https://zoom.us/meeting/123456'
    },
    capacity: 100,
    status: 'published'
  };

  test('should correctly identify upcoming event', async () => {
    const event = new Event({
      ...baseEventData,
      dates: {
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        timezone: 'UTC'
      },
      registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
    });
    await event.save();
    
    expect(event.isUpcoming).toBe(true);
    expect(event.isOngoing).toBe(false);
    expect(event.isPast).toBe(false);
  });

  test('should correctly identify ongoing event', async () => {
    const event = new Event({
      ...baseEventData,
      status: 'draft', // Start as draft
      dates: {
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        timezone: 'UTC'
      },
      registrationStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    await event.save();
    
    // Manually set to published
    event.status = 'published';
    await event.save({ validateBeforeSave: false });
    
    expect(event.isUpcoming).toBe(false);
    expect(event.isOngoing).toBe(true);
    expect(event.isPast).toBe(false);
  });

  test('should correctly identify past event', async () => {
    const event = new Event({
      ...baseEventData,
      status: 'draft', // Start as draft
      dates: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        timezone: 'UTC'
      },
      registrationStartDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      registrationEndDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
    });
    await event.save();
    
    // Manually set to published
    event.status = 'published';
    await event.save({ validateBeforeSave: false });
    
    expect(event.isUpcoming).toBe(false);
    expect(event.isOngoing).toBe(false);
    expect(event.isPast).toBe(true);
  });

  test('should correctly identify open registration', async () => {
    const event = new Event({
      ...baseEventData,
      dates: {
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        timezone: 'UTC'
      },
      registrationStartDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Started yesterday
      registrationEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000) // Ends in 29 days
    });
    await event.save();
    
    expect(event.isRegistrationOpen).toBe(true);
  });

  test('should correctly identify closed registration', async () => {
    const event = new Event({
      ...baseEventData,
      dates: {
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
        timezone: 'UTC'
      },
      registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Starts tomorrow
      registrationEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
    });
    await event.save();
    
    expect(event.isRegistrationOpen).toBe(false);
  });
});

describe('Event Model - Timestamps and Hooks', () => {
  const baseEventData = {
    title: 'Tech Conference 2024',
    description: 'A comprehensive technology conference covering the latest trends in software development.',
    category: 'conference',
    organizerId: new mongoose.Types.ObjectId(),
    organizerName: 'John Doe',
    organizerEmail: 'john@example.com',
    dates: {
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      timezone: 'UTC'
    },
    location: {
      locationType: 'virtual',
      virtualLink: 'https://zoom.us/meeting/123456'
    },
    capacity: 100,
    registrationStartDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    registrationEndDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
  };

  test('should automatically set createdAt and updatedAt', async () => {
    const event = new Event(baseEventData);
    const savedEvent = await event.save();
    
    expect(savedEvent.createdAt).toBeDefined();
    expect(savedEvent.updatedAt).toBeDefined();
  });

  test('should update updatedAt on save', async () => {
    const event = new Event(baseEventData);
    const savedEvent = await event.save();
    const originalUpdatedAt = savedEvent.updatedAt;
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    savedEvent.title = 'Updated Title for Conference';
    await savedEvent.save();
    
    expect(savedEvent.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  test('should set publishedAt when status changes to published', async () => {
    const event = new Event(baseEventData);
    await event.save();
    
    expect(event.publishedAt).toBeNull();
    
    event.status = 'published';
    await event.save();
    
    expect(event.publishedAt).toBeDefined();
  });

  test('should set cancelledAt when status changes to cancelled', async () => {
    const event = new Event({ ...baseEventData, status: 'published' });
    await event.save();
    
    expect(event.cancelledAt).toBeNull();
    
    event.status = 'cancelled';
    event.cancellationReason = 'Test cancellation';
    await event.save();
    
    expect(event.cancelledAt).toBeDefined();
  });

  test('should require cancellation reason when status is cancelled', async () => {
    const event = new Event({
      ...baseEventData,
      status: 'cancelled'
      // Missing cancellationReason
    });
    
    await expect(event.save()).rejects.toThrow();
  });
});
