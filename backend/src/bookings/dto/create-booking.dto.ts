import {
  IsString,
  IsInt,
  IsEmail,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  requestId: string;

  @IsInt()
  @Min(1)
  eventId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @IsInt()
  @Min(1)
  seats: number;
}
