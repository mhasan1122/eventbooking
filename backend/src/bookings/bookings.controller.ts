import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() dto: CreateBookingDto, @Res() res: Response) {
    const result = await this.bookingsService.create(dto);

    return res.status(result.statusCode).json({
      bookingRef: result.bookingRef,
      status: result.status,
      message:
        result.statusCode === HttpStatus.ACCEPTED
          ? 'Booking accepted and is being processed'
          : 'Booking already exists',
    });
  }

  @Get()
  async findAll(@Query() query: QueryBookingsDto) {
    return this.bookingsService.findAll(query);
  }
}
