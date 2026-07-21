import { Injectable } from '@nestjs/common';
import { IDiscountStrategy } from '../discount-strategy.interface';
import { DiscountType } from '../../../domain/entities/promo-code.types';
import { PromoCode } from '../../../domain/entities/promo-code';
import { OrderableInterface } from '../../../domain/interfaces/orderable.interface';

@Injectable()
export class FixedDiscountStrategy implements IDiscountStrategy {
  calculate(promo: PromoCode, order: OrderableInterface): number {
    if (promo.value < 0) {
      throw new Error(`Descuento negativo invÃ¡lido: ${promo.value}`);
    }
    const subtotal = order.getSubtotal();
    return Math.min(promo.value, subtotal);
  }

  canHandle(type: DiscountType): boolean {
    return type === DiscountType.FIXED;
  }
}
