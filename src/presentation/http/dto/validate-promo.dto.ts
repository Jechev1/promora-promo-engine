import { IsNotEmpty, IsString } from 'class-validator';

export class ValidatePromoRequestDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
  @IsString()
  @IsNotEmpty()
  orderId!: string;
}

export interface ValidatePromoResponseDto {
  valid: boolean;
  errorCode?: string;
  discount?: {
    originalSubtotal: number;
    discountAmount: number;
    finalSubtotal: number;
  };
}
