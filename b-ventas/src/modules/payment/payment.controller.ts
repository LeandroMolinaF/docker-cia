import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @UseInterceptors(IdempotencyInterceptor)
  @Post('intent')
  createIntent(
    @GetUser() user: any,
    @Body() dto: CreatePaymentIntentDto,
    @Headers('idempotency-key') idemKey?: string,
  ) {
    if (!idemKey)
      throw new BadRequestException('Idempotency-Key header is required');
    return this.payments.createIntent(user, dto, idemKey);
  }

  @UseInterceptors(IdempotencyInterceptor)
  @Post(':id/confirm')
  confirm(
    @GetUser() user: any,
    @Param('id') paymentId: string,
    @Body() dto: ConfirmPaymentDto,
    @Headers('idempotency-key') idemKey?: string,
  ) {
    if (!idemKey)
      throw new BadRequestException('Idempotency-Key header is required');
    return this.payments.confirm(user, paymentId, dto, idemKey);
  }

  @Get(':id')
  getById(@GetUser() user: any, @Param('id') id: string) {
    return this.payments.getByIdAuthz(user, id);
  }

  @UseGuards()
  @Post('webhook')
  webhook(@Headers('x-simulator-signature') sig?: string) {
    return this.payments.webhook(sig);
  }
}
