import { GlobalAmountLimitRule } from './global-amount-limit.rule';
import { InMemoryPromoCodeUsageRepository } from '../../../../infrastructure/repositories/in-memory/in-memory-usage.repository';
import { PromoCodeFactory } from '../../../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../../../testing/factories/rule.factory';
import { OrderFactory } from '../../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../../testing/factories/buyer.factory';
import { UsageFactory } from '../../../../testing/factories/usage.factory';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../../domain/errors/error-codes';

describe('GlobalAmountLimitRule', () => {
  let usageRepo: InMemoryPromoCodeUsageRepository;
  let rule: GlobalAmountLimitRule;

  beforeEach(() => {
    usageRepo = new InMemoryPromoCodeUsageRepository();
    rule = new GlobalAmountLimitRule(usageRepo);
  });

  it('bloquea con MAXIMUM_DISCOUNT_REACHED si el monto acumulado supera el limite', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.globalAmountLimit(100)],
    });
    await usageRepo.save(
      UsageFactory.create({ promoCodeId: promo.id, discountAmount: 60 }),
    );
    await usageRepo.save(
      UsageFactory.create({ promoCodeId: promo.id, discountAmount: 50 }),
    );

    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.MAXIMUM_DISCOUNT_REACHED);
  });

  it('permite si el monto acumulado no alcanza el limite', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.globalAmountLimit(100)],
    });
    await usageRepo.save(
      UsageFactory.create({ promoCodeId: promo.id, discountAmount: 30 }),
    );

    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create(),
      BuyerFactory.create(),
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });
});
