import { Injectable } from '@nestjs/common';
import { IDiscountStrategy } from './discount-strategy.interface';
import { CalculationResult } from '../../domain/value-objects/calculation-result';
import { PromoCode } from '../../domain/entities/promo-code';
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
    if (subtotal < 0) {
      throw new Error(`Subtotal negativo inválido: ${subtotal}`);
    }

    const discountAmount = strategy.calculate(promoCode, order);

    if (discountAmount < 0) {
      throw new Error(`Descuento negativo inválido: ${discountAmount}`);
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

export { CalculationResult };
