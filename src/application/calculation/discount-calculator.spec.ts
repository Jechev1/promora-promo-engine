import { DiscountCalculator } from './discount-calculator';
import { PromoCodeFactory } from '../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../testing/factories/rule.factory';
import { OrderFactory } from '../../testing/factories/order.factory';
import { BuyerFactory } from '../../testing/factories/buyer.factory';
import { TierConfiguration } from '../../domain/entities/tier-configuration';
import { FixedDiscountStrategy } from './strategies/fixed-discount.strategy';
import { PercentDiscountStrategy } from './strategies/percentage-discount.strategy';
import { TieredDiscountStrategy } from './strategies/tiered-discount.strategy';

describe('DiscountCalculator', () => {
  const calculator = new DiscountCalculator([
    new FixedDiscountStrategy(),
    new PercentDiscountStrategy(),
    new TieredDiscountStrategy(),
  ]);

  it('calcula descuento fixed correctamente', () => {
    const promo = PromoCodeFactory.fixed(10);
    const order = OrderFactory.create({ subtotal: 100 });

    const result = calculator.calculate(promo, order);
    expect(result.originalSubtotal).toBe(100);
    expect(result.discountAmount).toBe(10);
    expect(result.finalSubtotal).toBe(90);
  });

  it('calcula descuento percent correctamente', () => {
    const promo = PromoCodeFactory.percent(20);
    const order = OrderFactory.create({ subtotal: 250 });

    const result = calculator.calculate(promo, order);
    expect(result.discountAmount).toBe(50);
    expect(result.finalSubtotal).toBe(200);
  });

  it('calcula descuento tiered eligiendo el tramo correcto', () => {
    const promo = PromoCodeFactory.tiered([
      new TierConfiguration(0, 5),
      new TierConfiguration(3, 10),
    ]);
    const order = OrderFactory.create({
      subtotal: 100,
      buyer: BuyerFactory.withHistory(5),
    });

    const result = calculator.calculate(promo, order);
    expect(result.discountAmount).toBe(10);
    expect(result.finalSubtotal).toBe(90);
  });

  it('aplica el tope max_discount_amount cuando la regla esta configurada', () => {
    const promo = PromoCodeFactory.percent(50, {
      postCalcRules: [RuleFactory.maxDiscount(20)],
    });
    const order = OrderFactory.create({ subtotal: 200 });

    const result = calculator.calculate(promo, order);
    expect(result.discountAmount).toBe(20);
    expect(result.finalSubtotal).toBe(180);
  });
});
