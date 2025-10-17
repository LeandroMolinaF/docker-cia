import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { InventoryReason } from '@prisma/client';

export class AdjustInventoryDto {
  @IsString()
  productId: string;

  @IsInt()
  delta: number;

  @IsEnum(InventoryReason)
  reason: InventoryReason;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  allowNegative?: boolean = false;
}
