import { EligibleCategoriesRule } from './eligible-categories.rule';
import { PromoCodeFactory } from '../../../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../../../testing/factories/rule.factory';
import { OrderFactory } from '../../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../../testing/factories/buyer.factory';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../../domain/errors/error-codes';

describe('EligibleCategoriesRule', () => {
  const rule = new EligibleCategoriesRule();

  it('bloquea si la categoria de la orden no esta en la lista permitida', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.eligibleCategories(['cat-A', 'cat-B'])],
    });
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ categoryId: 'cat-C' }),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.INVALID_CODE);
  });

  it('permite si la categoria de la orden esta en la lista', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.eligibleCategories(['cat-A', 'cat-B'])],
    });
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ categoryId: 'cat-A' }),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });

  it('permite si la regla no esta configurada', async () => {
    const promo = PromoCodeFactory.percent(10);
    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ categoryId: 'cualquiera' }),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });
});
