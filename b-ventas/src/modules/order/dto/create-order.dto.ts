import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  Min,
  IsString,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  qty: number;
}

class AddressDto {
  @IsString() line1: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() city: string;
  @IsString() region: string;
  @IsString() country: string;
  @IsString() zip: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @IsOptional()
  @IsString()
  notes?: string;
}
