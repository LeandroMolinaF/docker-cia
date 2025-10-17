import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Role } from '@prisma/client';

export class QueryCustomerDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'role must be one of ADMIN|STAFF|CUSTOMER' })
  role?: Role;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value ? Math.min(Number(value), 100) : 20))
  @IsInt()
  @Min(1)
  size: number = 20;

  @IsOptional()
  @IsString()
  sort?: string;
}
