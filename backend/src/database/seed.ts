import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { Repository } from 'typeorm';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const eventRepo = app.get<Repository<Event>>(getRepositoryToken(Event));

  const count = await eventRepo.count();
  if (count > 0) {
    console.log(`✅ Database already has ${count} events. Skipping seed.`);
    await app.close();
    return;
  }

  const events = [
    {
      name: 'Taylor Swift: The Eras Tour',
      date: new Date('2025-09-15T19:00:00Z'),
      totalSeats: 100,
      remainingSeats: 100,
      price: 250.0,
    },
    {
      name: 'NBA Finals Game 7',
      date: new Date('2025-06-22T20:30:00Z'),
      totalSeats: 500,
      remainingSeats: 500,
      price: 180.0,
    },
    {
      name: 'Tech Summit 2025',
      date: new Date('2025-10-05T09:00:00Z'),
      totalSeats: 50,
      remainingSeats: 50,
      price: 75.0,
    },
  ];

  for (const eventData of events) {
    const event = eventRepo.create(eventData);
    await eventRepo.save(event);
    console.log(`✅ Seeded event: "${event.name}"`);
  }

  console.log('🌱 Seed complete!');
  await app.close();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
