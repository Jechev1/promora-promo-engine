import { UserUsageLimitRule } from './user-usage-limit.rule';
import { InMemoryPromoCodeUsageRepository } from '../../../../infrastructure/repositories/in-memory/in-memory-usage.repository';
import { PromoCodeFactory } from '../../../../testing/factories/promo-code.factory';
import { RuleFactory } from '../../../../testing/factories/rule.factory';
import { OrderFactory } from '../../../../testing/factories/order.factory';
import { BuyerFactory } from '../../../../testing/factories/buyer.factory';
import { UsageFactory } from '../../../../testing/factories/usage.factory';
import { ValidationContext } from '../../../../domain/value-objects/validation-context';
import { ErrorCode } from '../../../../domain/errors/error-codes';

describe('UserUsageLimitRule', () => {
  let usageRepo: InMemoryPromoCodeUsageRepository;
  let rule: UserUsageLimitRule;

  beforeEach(() => {
    usageRepo = new InMemoryPromoCodeUsageRepository();
    rule = new UserUsageLimitRule(usageRepo);
  });

  it('bloquea si el usuario alcanzo el limite de usos pagados', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.userUsageLimit(2)],
    });
    const buyer = BuyerFactory.create();
    await usageRepo.save(
      UsageFactory.create({ promoCodeId: promo.id, buyerId: buyer.buyerId }),
    );
    await usageRepo.save(
      UsageFactory.create({ promoCodeId: promo.id, buyerId: buyer.buyerId }),
    );

    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ buyer }),
      buyer,
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(false);
    expect(result.firstError).toBe(ErrorCode.USAGE_LIMIT_REACHED);
  });

  it('permite si el usuario aun no alcanzo el limite', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.userUsageLimit(3)],
    });
    const buyer = BuyerFactory.create();
    await usageRepo.save(
      UsageFactory.create({ promoCodeId: promo.id, buyerId: buyer.buyerId }),
    );

    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ buyer }),
      buyer,
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });

  it('los usos NO pagados no cuentan para el limite', async () => {
    const promo = PromoCodeFactory.percent(10, {
      rules: [RuleFactory.userUsageLimit(1)],
    });
    const buyer = BuyerFactory.create();
    await usageRepo.save(
      UsageFactory.unpaid({ promoCodeId: promo.id, buyerId: buyer.buyerId }),
    );

    const ctx = new ValidationContext(
      promo.code,
      OrderFactory.create({ buyer }),
      buyer,
    );
    ctx.promo = promo;

    const result = await rule.handle(ctx);
    expect(result.isValid).toBe(true);
  });
});
