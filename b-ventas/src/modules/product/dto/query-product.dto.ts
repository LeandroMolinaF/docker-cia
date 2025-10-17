import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryProductDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    const v = String(value).toLowerCase();
    return v === 'true' ? true : v === 'false' ? false : undefined;
  })
  @IsBoolean()
  inStock?: boolean;

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

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return false;
    const v = String(value).toLowerCase();
    return v === 'true' ? true : v === 'false' ? false : undefined;
  })
  @IsBoolean()
  includeInactive?: boolean = false;
}
