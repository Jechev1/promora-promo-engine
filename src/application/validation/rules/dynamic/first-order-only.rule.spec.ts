import { FirstOrderOnlyRule } from './first-order-only.rule';
import { PromoCodeFactory } from '../../../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../../../testing/factories/rule.factory';
import { OrderFactory } from '../../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../../testing/factories/buyer.factory';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../../domain/errors/error-codes';

describe('FirstOrderOnlyRule', () => {
  const rule = new FirstOrderOnlyRule();

  it('bloquea con CODE_ALREADY_USED si el comprador ya tiene historial', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.firstOrderOnly()],
    });
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create(),
      BuyerFactory.withHistory(5),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.CODE_ALREADY_USED);
  });

  it('permite si el comprador es primerizo', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.firstOrderOnly()],
    });
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create(),
      BuyerFactory.firstBuyer(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });

  it('permite si la regla no esta configurada', async () => {
    const promo = PromoCodeFactory.percent(10);
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create(),
      BuyerFactory.withHistory(10),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });
});
