import { Injectable } from '@nestjs/common';
import { IDiscountStrategy } from '../discount-strategy.interface';
import { DiscountType } from '../../../domain/entities/promo-code.types';
import { PromoCode } from '../../../domain/entities/promo-code';
import { OrderableInterface } from '../../../domain/interfaces/orderable.interface';

@Injectable()
export class PercentDiscountStrategy implements IDiscountStrategy {
  calculate(promo: PromoCode, order: OrderableInterface): number {
    if (promo.value < 0 || promo.value > 100) {
      throw new Error(`Porcentaje invÃ¡lido: ${promo.value}. Debe estar entre 0 y 100`);
    }
    const subtotal = order.getSubtotal();
    return subtotal * (promo.value / 100);
  }

  canHandle(type: DiscountType): boolean {
    return type === DiscountType.PERCENT;
  }
}
