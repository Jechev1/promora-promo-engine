import { MinPurchaseAmountRule } from './min-purchase-amount.rule';
import { PromoCodeFactory } from '../../../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../../../testing/factories/rule.factory';
import { OrderFactory } from '../../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../../testing/factories/buyer.factory';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../../domain/errors/error-codes';

describe('MinPurchaseAmountRule', () => {
  const rule = new MinPurchaseAmountRule();

  it('bloquea si el subtotal es menor al minimo requerido', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.minPurchase(100)],
    });
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ subtotal: 50 }),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.MIN_AMOUNT_REQUIRED);
  });

  it('permite si el subtotal cumple el minimo', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.minPurchase(100)],
    });
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ subtotal: 150 }),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });

  it('permite si la regla no esta configurada en el codigo', async () => {
    const promo = PromoCodeFactory.percent(10);
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ subtotal: 1 }),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });
});
