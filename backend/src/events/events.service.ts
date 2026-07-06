import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async findAll(): Promise<Event[]> {
    return this.eventRepository.find({
      select: {
        id: true,
        name: true,
        date: true,
        totalSeats: true,
        remainingSeats: true,
        price: true,
      },
      order: { date: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Event | null> {
    return this.eventRepository.findOne({ where: { id } });
  }
}
