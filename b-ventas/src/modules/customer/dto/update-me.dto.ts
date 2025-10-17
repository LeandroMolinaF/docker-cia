import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString() @MinLength(2) line1: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() @MinLength(2) city: string;
  @IsString() @MinLength(2) region: string;
  @IsString() @MinLength(2) country: string;
  @IsString() @MinLength(2) zip: string;
  [key: string]: any;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('CL', { message: 'phone must be a valid Chile number' })
  phone?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto | null;
}
