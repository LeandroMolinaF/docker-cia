import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { QueryAdjustmentsDto } from './dto/query-adjustments.dto';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get(':productId')
  getInventory(@Param('productId') productId: string) {
    return this.inventory.getInventory(productId);
  }

  @UseInterceptors(IdempotencyInterceptor)
  @Post('adjust')
  adjust(
    @GetUser('sub') userId: string,
    @Body() dto: AdjustInventoryDto,
    @Headers('idempotency-key') idemKey?: string,
  ) {
    if (!idemKey)
      throw new BadRequestException('Idempotency-Key header is required');
    return this.inventory.adjust(userId, dto, idemKey);
  }

  @Get('adjustments/list')
  list(@Query() q: QueryAdjustmentsDto) {
    return this.inventory.listAdjustments(q);
  }
}
