import { Injectable } from '@nestjs/common';
import { IDiscountStrategy } from '../discount-strategy.interface';
import { DiscountType } from '../../../domain/entities/promo-code.entity';

@Injectable()
export class PercentDiscountStrategy implements IDiscountStrategy {
  calculate(value: number, subtotal: number): number {
    return subtotal * (value / 100);
  }

  canHandle(type: DiscountType): boolean {
    return type === DiscountType.PERCENT;
  }

  getName(): string {
    return 'PercentDiscountStrategy';
  }
}
