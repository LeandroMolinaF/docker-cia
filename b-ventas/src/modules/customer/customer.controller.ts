import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { UpdateMeDto } from './dto/update-me.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customers: CustomerService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@GetUser('sub') userId: string) {
    return this.customers.getMe(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@GetUser('sub') userId: string, @Body() dto: UpdateMeDto) {
    return this.customers.updateMe(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  list(@Query() q: QueryCustomerDto) {
    return this.customers.list(q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.customers.getById(id);
  }
}
