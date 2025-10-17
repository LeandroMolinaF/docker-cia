import { IsString } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  orderId: string;

  @IsString()
  method: string;
}
