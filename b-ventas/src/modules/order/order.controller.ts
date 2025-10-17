import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @UseInterceptors(IdempotencyInterceptor)
  @Post()
  async create(
    @GetUser('sub') userId: string,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idemKey?: string,
  ) {
    if (!idemKey)
      throw new BadRequestException('Idempotency-Key header is required');
    return this.orders.create(userId, dto, idemKey);
  }

  @Get()
  list(@GetUser() user: any, @Query() q: QueryOrderDto) {
    if (user.role === 'ADMIN' || user.role === 'STAFF') {
      return this.orders.listAll(q);
    }
    return this.orders.listMine(user.sub, q);
  }

  @Get(':id')
  getById(@GetUser() user: any, @Param('id') id: string) {
    return this.orders.getByIdAuthz(user, id);
  }

  @Post(':id/cancel')
  cancel(@GetUser() user: any, @Param('id') id: string) {
    return this.orders.cancel(user, id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.orders.confirm(id);
  }
}
