import { Injectable } from '@nestjs/common';
import { IDiscountStrategy } from './discount-strategy.interface';
import { CalculationResult } from '../../domain/value-objects/calculation-result';
import { PromoCode } from '../../domain/entities/promo-code.entity';
import { OrderableInterface } from '../../domain/interfaces/orderable.interface';

@Injectable()
export class DiscountCalculator {
  private strategies: IDiscountStrategy[] = [];

  constructor(strategies: IDiscountStrategy[]) {
    this.strategies = strategies;
  }

  calculate(promoCode: PromoCode, order: OrderableInterface): CalculationResult {
    const strategy = this.selectStrategy(promoCode.type);

    if (!strategy) {
      throw new Error(`No strategy found for type: ${promoCode.type}`);
    }

    const subtotal = order.getSubtotal();
    let discountAmount: number;

    if (promoCode.type.toString() === 'tiered') {
      const orderCount = order.getBuyer().totalOrders;
      discountAmount = (strategy as any).calculate(
        promoCode.value,
        subtotal,
        promoCode.tiers,
        orderCount,
      );
    } else {
      discountAmount = strategy.calculate(promoCode.value, subtotal);
    }

    return new CalculationResult(
      discountAmount,
      promoCode.type,
      subtotal,
    );
  }

  private selectStrategy(type: any): IDiscountStrategy | undefined {
    return this.strategies.find((s) => s.canHandle(type));
  }
}
